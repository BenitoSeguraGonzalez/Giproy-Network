import argparse
import json
import os
import sys
from datetime import date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.services.license_notifications import license_notification_service


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _event_summary(event) -> dict:
    return {
        "id": event.id,
        "empresa_id": event.empresa_id,
        "notification_type": event.notification_type,
        "channel": event.channel,
        "recipient_usuario_id": event.recipient_usuario_id,
        "recipient_email": event.recipient_email,
        "status": event.status,
        "dedupe_key": event.dedupe_key,
    }


def run_license_notification_housekeeping(
    *,
    empresa_id: int | None = None,
    today: date | None = None,
    dispatch_email: bool = False,
    dispatch_limit: int = 50,
    notification_type: str | None = None,
    retry_failed: bool = False,
    dry_run: bool = False,
) -> dict:
    db = SessionLocal()
    try:
        lifecycle_result = license_notification_service.run_notification_housekeeping(
            db,
            today=today,
            empresa_id=empresa_id,
            dispatch_email=dispatch_email,
            dispatch_limit=dispatch_limit,
            notification_type=notification_type,
            retry_failed=retry_failed,
        )
        purchase_events = lifecycle_result["queued_purchase_events"]
        license_events = lifecycle_result["queued_license_events"]
        dispatched_events = lifecycle_result["dispatched_events"]

        result = {
            "dry_run": dry_run,
            "empresa_id": empresa_id,
            "today": today.isoformat() if today else None,
            "queued_purchase_lifecycle_count": len(purchase_events),
            "queued_license_lifecycle_count": len(license_events),
            "dispatched_email_count": len(dispatched_events),
            "retry_failed": retry_failed,
            "queued_purchase_lifecycle_events": [
                _event_summary(event) for event in purchase_events
            ],
            "queued_license_lifecycle_events": [
                _event_summary(event) for event in license_events
            ],
            "dispatched_email_events": [_event_summary(event) for event in dispatched_events],
        }

        if dry_run:
            db.rollback()
        else:
            db.commit()
        return result
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Housekeeping clasico de avisos de compra, licencia y fin de vigencia."
    )
    parser.add_argument("--empresa-id", type=int, default=None)
    parser.add_argument("--today", type=_parse_date, default=None, help="Fecha YYYY-MM-DD para pruebas controladas.")
    parser.add_argument("--dispatch-email", action="store_true", help="Despacha emails pendientes en modo configurado.")
    parser.add_argument("--dispatch-limit", type=int, default=50)
    parser.add_argument("--notification-type", default=None, help="Filtra despacho por tipo de notificacion.")
    parser.add_argument("--retry-failed", action="store_true", help="Incluye eventos de email fallidos en el despacho.")
    parser.add_argument("--dry-run", action="store_true", help="Ejecuta y revierte la transaccion.")
    args = parser.parse_args()

    result = run_license_notification_housekeeping(
        empresa_id=args.empresa_id,
        today=args.today,
        dispatch_email=args.dispatch_email,
        dispatch_limit=args.dispatch_limit,
        notification_type=args.notification_type,
        retry_failed=args.retry_failed,
        dry_run=args.dry_run,
    )
    print(json.dumps(result, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
