from __future__ import annotations

import argparse
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4


class CdeClient(Protocol):
    def heartbeat(self, project_id: int, session_key: str, workspace: str, context: dict) -> dict: ...
    def presences(self, project_id: int) -> list[dict]: ...
    def events(self, project_id: int, after_id: int) -> dict: ...
    def metrics(self, project_id: int) -> dict: ...
    def leave(self, project_id: int, session_key: str) -> None: ...


@dataclass(frozen=True)
class ProbeReport:
    initial_sessions: int
    expired_sessions: int
    reconnected_sessions: int
    delta_events: int
    latest_cursor: int
    metrics_active: int


class RejectRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


class HttpCdeClient:
    def __init__(self, *, base_url: str, token: str, company_id: int, timeout: float) -> None:
        parsed_url = urlsplit(base_url)
        if parsed_url.scheme != "https" or not parsed_url.hostname:
            raise ValueError("El probe remoto requiere una URL HTTPS valida.")
        if parsed_url.username is not None or parsed_url.password is not None:
            raise ValueError("La URL del probe no puede incluir credenciales.")
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.company_id = company_id
        self.timeout = timeout
        self.opener = build_opener(RejectRedirects())

    def _request(self, method: str, path: str, *, payload: dict | None = None, params: dict | None = None):
        query = {"empresa_id": self.company_id, **(params or {})}
        url = f"{self.base_url}/api/v1/bim{path}?{urlencode(query)}"
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(
            url,
            data=body,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Accept": "application/json",
                "User-Agent": "GiProy-BIM-CDE-Certification/1.0",
                **({"Content-Type": "application/json"} if body is not None else {}),
            },
        )
        try:
            with self.opener.open(request, timeout=self.timeout) as response:
                content = response.read()
                return json.loads(content.decode("utf-8")) if content else None
        except HTTPError as exc:
            detail = f"HTTP {exc.code}"
            try:
                parsed = json.loads(exc.read().decode("utf-8"))
                if isinstance(parsed.get("detail"), str):
                    detail = f"{detail}: {parsed['detail'][:180]}"
            except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
                pass
            raise RuntimeError(f"Fallo remoto CDE en {method} {path}: {detail}") from exc
        except URLError as exc:
            raise RuntimeError(f"No se pudo conectar al endpoint remoto CDE: {exc.reason}") from exc

    def heartbeat(self, project_id: int, session_key: str, workspace: str, context: dict) -> dict:
        return self._request(
            "POST",
            f"/projects/{project_id}/cde/collaboration/presence/heartbeat",
            payload={"session_key": session_key, "workspace": workspace, "context": context},
        )

    def presences(self, project_id: int) -> list[dict]:
        return self._request("GET", f"/projects/{project_id}/cde/collaboration/presences")

    def events(self, project_id: int, after_id: int) -> dict:
        return self._request(
            "GET",
            f"/projects/{project_id}/cde/collaboration/events",
            params={"after_id": after_id, "limit": 100},
        )

    def metrics(self, project_id: int) -> dict:
        return self._request("GET", f"/projects/{project_id}/operational-metrics")

    def leave(self, project_id: int, session_key: str) -> None:
        self._request(
            "POST",
            f"/projects/{project_id}/cde/collaboration/presence/leave",
            payload={"session_key": session_key},
        )


def run_probe(
    client_a: CdeClient,
    client_b: CdeClient,
    *,
    project_id: int,
    expiry_wait_seconds: float,
    sleep_fn=time.sleep,
    session_prefix: str | None = None,
) -> ProbeReport:
    prefix = session_prefix or uuid4().hex
    session_a = f"remote-a-{prefix}"
    session_b = f"remote-b-{prefix}"
    try:
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = [
                executor.submit(client_a.heartbeat, project_id, session_a, "coordination", {"tool": "remote_probe"}),
                executor.submit(client_b.heartbeat, project_id, session_b, "viewer", {"tool": "remote_probe"}),
            ]
            for future in futures:
                future.result()

        initial = client_a.presences(project_id)
        initial_keys = {item.get("session_key") for item in initial}
        if not {session_a, session_b}.issubset(initial_keys):
            raise RuntimeError("Las dos sesiones remotas no quedaron activas.")
        feed = client_a.events(project_id, 0)
        cursor = int(feed.get("cursor") or 0)

        client_b.heartbeat(
            project_id,
            session_b,
            "viewer",
            {"tool": "remote_probe", "global_id": "REMOTE-PROBE-GUID"},
        )
        delta = client_a.events(project_id, cursor)
        if not any(item.get("event_type") == "presence.context_changed" for item in delta.get("events", [])):
            raise RuntimeError("El cursor remoto no recupero el cambio de contexto.")

        sleep_fn(expiry_wait_seconds)
        client_a.heartbeat(project_id, session_a, "coordination", {"tool": "remote_probe"})
        expired = client_a.presences(project_id)
        expired_keys = {item.get("session_key") for item in expired}
        if session_a not in expired_keys or session_b in expired_keys:
            raise RuntimeError("La expiracion remota no distinguio la sesion desconectada.")

        client_b.heartbeat(project_id, session_b, "viewer", {"tool": "remote_probe"})
        reconnected = client_a.presences(project_id)
        reconnected_keys = {item.get("session_key") for item in reconnected}
        if not {session_a, session_b}.issubset(reconnected_keys):
            raise RuntimeError("La sesion remota expirada no se reconecto.")

        metrics = client_a.metrics(project_id).get("collaboration", {})
        if int(metrics.get("presence_active") or 0) < 2:
            raise RuntimeError("La telemetria remota no refleja las dos sesiones activas.")
        return ProbeReport(
            initial_sessions=len(initial),
            expired_sessions=len(expired),
            reconnected_sessions=len(reconnected),
            delta_events=len(delta.get("events", [])),
            latest_cursor=int(metrics.get("latest_cursor") or 0),
            metrics_active=int(metrics.get("presence_active") or 0),
        )
    finally:
        for client, session_key in ((client_a, session_a), (client_b, session_b)):
            try:
                client.leave(project_id, session_key)
            except RuntimeError:
                pass


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Certifica colaboracion CDE remota; el token A requiere permiso bim.admin.",
    )
    parser.add_argument("--base-url", default="https://giproy.excomconsultores.com")
    parser.add_argument("--project-id", type=int, required=True)
    parser.add_argument("--company-id", type=int, choices=(1, 3), required=True)
    parser.add_argument("--timeout", type=float, default=20)
    parser.add_argument("--expiry-wait-seconds", type=float, default=50)
    args = parser.parse_args()
    if args.project_id <= 0 or args.expiry_wait_seconds < 46:
        raise SystemExit("project-id debe ser positivo y expiry-wait-seconds al menos 46.")

    token_a = os.getenv("BIM_CDE_TOKEN_A", "").strip()
    token_b = os.getenv("BIM_CDE_TOKEN_B", "").strip()
    if not token_a or not token_b or token_a == token_b:
        raise SystemExit("Defina BIM_CDE_TOKEN_A y BIM_CDE_TOKEN_B con dos sesiones autorizadas distintas.")

    report = run_probe(
        HttpCdeClient(base_url=args.base_url, token=token_a, company_id=args.company_id, timeout=args.timeout),
        HttpCdeClient(base_url=args.base_url, token=token_b, company_id=args.company_id, timeout=args.timeout),
        project_id=args.project_id,
        expiry_wait_seconds=args.expiry_wait_seconds,
    )
    print(
        "BIM_CDE_REMOTE_OK "
        f"company={args.company_id} project={args.project_id} "
        f"initial_sessions={report.initial_sessions} expired_sessions={report.expired_sessions} "
        f"reconnected_sessions={report.reconnected_sessions} delta_events={report.delta_events} "
        f"latest_cursor={report.latest_cursor} metrics_active={report.metrics_active}"
    )


if __name__ == "__main__":
    main()
