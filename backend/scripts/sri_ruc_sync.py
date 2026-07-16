"""Sincronización programable del catálogo RUC oficial del SRI."""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.sri_ruc import SRI_RUC_SOURCES, cleanup_failed_files, sync_province
from app.utils.email_utils import send_transactional_email
from app.models.sri_ruc import RucManualVerification, SriRucLookupAttempt


RETRY_SECONDS = (300, 1800, 7200)


def _state_path() -> Path:
    directory = Path(settings.SRI_RUC_PRIVATE_DIR).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    return directory / "sync-state.json"


def _load_state() -> dict:
    path = _state_path()
    if not path.exists():
        return {"consecutive_failures": 0}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"consecutive_failures": 0}


def _save_state(state: dict) -> None:
    _state_path().write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _notify(subject: str, body: str) -> None:
    if settings.SRI_RUC_ALERT_EMAIL:
        send_transactional_email(to_email=settings.SRI_RUC_ALERT_EMAIL, subject=subject, body=body)


def sync_one(code: str, *, force: bool, retry: bool) -> dict:
    waits = RETRY_SECONDS if retry else ()
    for attempt in range(len(waits) + 1):
        db = SessionLocal()
        try:
            return sync_province(db, code, force=force)
        except Exception:
            if attempt >= len(waits):
                raise
            time.sleep(waits[attempt])
        finally:
            db.close()
    raise RuntimeError("Sincronización no ejecutada.")


def housekeeping() -> None:
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        pending = db.query(RucManualVerification).filter(
            RucManualVerification.status == "pending",
            RucManualVerification.expires_at <= now,
        ).all()
        approved = db.query(RucManualVerification).filter(
            RucManualVerification.status == "approved",
            RucManualVerification.approval_expires_at <= now,
        ).all()
        for item in pending + approved:
            item.status = "expired"
            item.encrypted_certificate_code = None
            item.registration_token_hash = None
        db.query(SriRucLookupAttempt).filter(
            SriRucLookupAttempt.created_at < now - timedelta(days=1)
        ).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("province", nargs="*", help="Códigos 01..24; sin valores sincroniza las 24 provincias")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--scheduled", action="store_true", help="Fuerza checksum completo el primer día del mes")
    parser.add_argument("--no-retry", action="store_true")
    args = parser.parse_args()
    provinces = args.province or sorted(SRI_RUC_SOURCES)
    invalid = [code for code in provinces if code not in SRI_RUC_SOURCES]
    if invalid:
        parser.error(f"Provincias inválidas: {', '.join(invalid)}")
    force = args.force or (args.scheduled and datetime.now().day == 1)
    results = []
    errors = []
    for code in provinces:
        try:
            result = sync_one(code, force=force, retry=not args.no_retry)
            results.append(result)
            print(json.dumps(result, ensure_ascii=False, default=str), flush=True)
        except Exception as exc:
            errors.append({"province_code": code, "error": str(exc)[:500]})
            print(json.dumps(errors[-1], ensure_ascii=False), file=sys.stderr, flush=True)
    cleanup_failed_files(older_than_days=7)
    housekeeping()
    state = _load_state()
    state["last_run_at"] = datetime.now().astimezone().isoformat()
    state["last_errors"] = errors
    state["consecutive_failures"] = int(state.get("consecutive_failures", 0)) + 1 if errors else 0
    _save_state(state)
    if errors and state["consecutive_failures"] >= 3:
        _notify("Alerta catálogo RUC SRI", f"Tres o más ejecuciones consecutivas con fallos: {errors}")
    elif errors:
        _notify("Resumen diario catálogo RUC SRI", f"La sincronización terminó con incidencias: {errors}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
