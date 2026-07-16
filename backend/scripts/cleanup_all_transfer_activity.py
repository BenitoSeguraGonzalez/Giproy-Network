from __future__ import annotations

import argparse
import json
import sys
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path

from sqlalchemy import inspect

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.transferencia import (
    TransferAllowedCompanyRecipient,
    TransferAuditEvent,
    TransferCodeAttemptGuard,
    TransferExtraRecipientPack,
    TransferImportReference,
    TransferImportResult,
    TransferMarketplaceRequirement,
    TransferShipment,
    TransferShipmentItem,
)


TABLE_MODELS = {
    "transfer_shipments": TransferShipment,
    "transfer_shipment_items": TransferShipmentItem,
    "transfer_marketplace_requirements": TransferMarketplaceRequirement,
    "transfer_import_results": TransferImportResult,
    "transfer_import_references": TransferImportReference,
    "transfer_audit_events": TransferAuditEvent,
    "transfer_allowed_company_recipients": TransferAllowedCompanyRecipient,
    "transfer_code_attempt_guards": TransferCodeAttemptGuard,
    "transfer_extra_recipient_packs": TransferExtraRecipientPack,
}


def _json_safe(value):
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {str(key): _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def _serialize_model(row) -> dict:
    return {
        column.key: _json_safe(getattr(row, column.key))
        for column in inspect(row.__class__).mapper.column_attrs
    }


def _rows(db, model):
    return db.query(model).order_by(model.id.asc()).all()


def _collect(db) -> dict:
    return {
        table_name: [_serialize_model(item) for item in _rows(db, model)]
        for table_name, model in TABLE_MODELS.items()
    }


def _write_backup(payload: dict) -> Path:
    backup_dir = Path(__file__).resolve().parents[2] / "tmp"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / (
        "transfer_all_activity_cleanup_"
        f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    )
    backup_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return backup_path


def _delete_all(db, model) -> int:
    return db.query(model).delete(synchronize_session=False)


def _apply_cleanup(db) -> dict[str, int]:
    deleted: dict[str, int] = {}

    deleted["transfer_import_references"] = _delete_all(db, TransferImportReference)
    deleted["transfer_import_results"] = _delete_all(db, TransferImportResult)
    deleted["transfer_marketplace_requirements"] = _delete_all(db, TransferMarketplaceRequirement)
    deleted["transfer_shipment_items"] = _delete_all(db, TransferShipmentItem)
    deleted["transfer_audit_events"] = _delete_all(db, TransferAuditEvent)
    deleted["transfer_shipments"] = _delete_all(db, TransferShipment)
    deleted["transfer_allowed_company_recipients"] = _delete_all(db, TransferAllowedCompanyRecipient)
    deleted["transfer_code_attempt_guards"] = _delete_all(db, TransferCodeAttemptGuard)

    packs = db.query(TransferExtraRecipientPack).all()
    adjusted_packs = 0
    for pack in packs:
        if int(pack.slots_used or 0) != 0:
            pack.slots_used = 0
            db.add(pack)
            adjusted_packs += 1
    deleted["transfer_extra_recipient_packs_slots_reset"] = adjusted_packs
    return deleted


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Limpia toda la actividad operativa de Envios y Transferencias. "
            "Conserva empresas, usuarios, codigos publicos, packs comprados, "
            "licencias y activos ya importados."
        )
    )
    parser.add_argument("--apply", action="store_true", help="Aplica el borrado. Sin este flag solo inventaria.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        before = _collect(db)
        backup_payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "apply": bool(args.apply),
            "operation": "cleanup_all_transfer_activity",
            "scope": {
                "domain": "Envios y Transferencias",
                "all_users": True,
                "preserved": [
                    "empresas",
                    "usuarios",
                    "transfer_admin_public_codes",
                    "transfer_company_public_codes",
                    "marketplace_orders",
                    "licenses",
                    "projects",
                    "bases_trabajo",
                    "apus",
                    "edt",
                    "presupuestos",
                    "cronogramas",
                    "transfer_extra_recipient_packs",
                ],
            },
            "tables": before,
        }
        backup_path = _write_backup(backup_payload)

        deleted = {}
        if args.apply:
            deleted = _apply_cleanup(db)
            db.commit()
        else:
            db.rollback()

        after = _collect(db) if args.apply else before
        summary = {
            "apply": bool(args.apply),
            "backup_path": str(backup_path),
            "matched": {table: len(rows) for table, rows in before.items()},
            "deleted_or_adjusted": deleted,
            "remaining": {table: len(rows) for table, rows in after.items()},
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
