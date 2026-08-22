"""Prueba local de regresión para la carga concurrente del contexto de empresa."""

from __future__ import annotations

import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from sqlalchemy import text


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = REPOSITORY_ROOT / "backend"
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal  # noqa: E402
from app.core.security import create_access_token  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402


TECHNICAL_EMAIL = "manual.capture@giproy.invalid"
BASE_URL = "http://127.0.0.1:3101/api/v1"


def _request(path: str, token: str) -> tuple[str, int, float]:
    started = time.perf_counter()
    response = requests.get(
        f"{BASE_URL}{path}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=20,
    )
    elapsed = time.perf_counter() - started
    return path, response.status_code, elapsed


def main() -> None:
    session_id = f"manual-concurrency-{uuid.uuid4()}"
    db = SessionLocal()
    try:
        user = (
            db.query(Usuario)
            .filter(
                Usuario.empresa_id == 3,
                Usuario.email == TECHNICAL_EMAIL,
                Usuario.activo.is_(True),
            )
            .with_for_update()
            .first()
        )
        assert user is not None, "No existe la cuenta técnica del manual."
        assert not user.current_session_id, "La cuenta técnica ya tiene una sesión."
        user.current_session_id = session_id
        db.commit()
        token = create_access_token(user.id, session_id=session_id)
    finally:
        db.close()

    paths = [
        "/admin-licenses/me",
        "/admin-licenses/me",
        "/system-announcements/active?empresa_id=3",
        "/system-announcements/active?empresa_id=3",
    ]
    results: list[tuple[str, int, float]] = []
    try:
        with ThreadPoolExecutor(max_workers=len(paths)) as executor:
            futures = [executor.submit(_request, path, token) for path in paths]
            for future in as_completed(futures):
                results.append(future.result())
    finally:
        cleanup_db = SessionLocal()
        try:
            user = (
                cleanup_db.query(Usuario)
                .filter(Usuario.empresa_id == 3, Usuario.email == TECHNICAL_EMAIL)
                .with_for_update()
                .first()
            )
            if user and user.current_session_id == session_id:
                user.current_session_id = None
            cleanup_db.commit()
        finally:
            cleanup_db.close()

    assert len(results) == len(paths)
    assert all(status == 200 for _, status, _ in results), results
    assert max(elapsed for _, _, elapsed in results) < 20, results

    time.sleep(0.5)
    audit_db = SessionLocal()
    try:
        lingering = audit_db.execute(
            text(
                """
                SELECT pid, state, wait_event_type, wait_event,
                       EXTRACT(EPOCH FROM (now() - xact_start)) AS age_seconds,
                       pg_blocking_pids(pid) AS blockers
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
                  AND state = 'idle in transaction'
                  AND xact_start < now() - interval '2 seconds'
                """
            )
        ).mappings().all()
    finally:
        audit_db.close()

    assert not lingering, [dict(row) for row in lingering]
    print(
        {
            "requests": len(results),
            "statuses": sorted(status for _, status, _ in results),
            "max_seconds": round(max(elapsed for _, _, elapsed in results), 3),
            "idle_transactions_over_2s": 0,
        }
    )


if __name__ == "__main__":
    main()
