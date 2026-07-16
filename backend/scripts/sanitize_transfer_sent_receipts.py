from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.transferencia import TransferAuditEvent, TransferShipment


ACTIVE_SENT_STATUSES = {
    "enviado",
    "bloqueado_marketplace",
    "listo_para_importar",
    "fallo_importacion",
}


def _iso(value):
    return value.isoformat() if value else None


def _backup_payload(shipment: TransferShipment) -> dict:
    return {
        "id": shipment.id,
        "sender_empresa_id": shipment.sender_empresa_id,
        "receiver_empresa_id": shipment.receiver_empresa_id,
        "status": shipment.status,
        "asset_type": shipment.asset_type,
        "asset_id": shipment.asset_id,
        "sent_at": _iso(shipment.sent_at),
        "received_at": _iso(shipment.received_at),
        "created_at": _iso(shipment.created_at),
        "updated_at": _iso(shipment.updated_at),
        "metadata_json": shipment.metadata_json,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Sanea envios activos ya enviados sin marca received_at.")
    parser.add_argument("--apply", action="store_true", help="Aplica cambios. Sin este flag solo informa.")
    args = parser.parse_args()

    now = datetime.now(timezone.utc)
    backup_dir = Path(__file__).resolve().parents[2] / "tmp"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / f"transfer_sent_receipts_backup_{now.strftime('%Y%m%d_%H%M%S')}.json"

    db = SessionLocal()
    try:
        shipments = (
            db.query(TransferShipment)
            .filter(
                TransferShipment.status.in_(ACTIVE_SENT_STATUSES),
                TransferShipment.sent_at.isnot(None),
                TransferShipment.received_at.is_(None),
                TransferShipment.receiver_empresa_id.isnot(None),
            )
            .order_by(TransferShipment.id.asc())
            .all()
        )
        backup = {
            "generated_at": now.isoformat(),
            "apply": bool(args.apply),
            "count": len(shipments),
            "items": [_backup_payload(shipment) for shipment in shipments],
        }
        backup_path.write_text(json.dumps(backup, ensure_ascii=False, indent=2), encoding="utf-8")

        updated_ids: list[int] = []
        if args.apply:
            for shipment in shipments:
                receipt_at = shipment.sent_at or shipment.created_at or now
                metadata = dict(shipment.metadata_json or {})
                metadata["receipt_sanitized"] = {
                    "task": "TASK-1940",
                    "sanitized_at": now.isoformat(),
                    "previous_received_at": _iso(shipment.received_at),
                    "new_received_at": _iso(receipt_at),
                    "reason": "sent_shipment_missing_receiver_timestamp",
                }
                shipment.received_at = receipt_at
                shipment.updated_at = now
                shipment.metadata_json = metadata
                db.add(shipment)
                db.add(
                    TransferAuditEvent(
                        shipment_id=shipment.id,
                        empresa_id=shipment.receiver_empresa_id,
                        user_id=None,
                        event_type="transfer_shipment_receipt_sanitized",
                        actor_scope="system",
                        message="Marca de recepcion saneada para envio ya realizado.",
                        payload_json={
                            "shipment_id": shipment.id,
                            "receiver_empresa_id": shipment.receiver_empresa_id,
                            "received_at": _iso(receipt_at),
                            "task": "TASK-1940",
                        },
                    )
                )
                updated_ids.append(int(shipment.id))
            db.commit()

        print(
            json.dumps(
                {
                    "apply": bool(args.apply),
                    "backup_path": str(backup_path),
                    "matched": len(shipments),
                    "updated_ids": updated_ids,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
