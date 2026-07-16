from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path

from sqlalchemy import and_, func, inspect, or_, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.empresa import Empresa
from app.models.transferencia import (
    TransferAdminPublicCode,
    TransferAllowedCompanyRecipient,
    TransferAuditEvent,
    TransferCodeAttemptGuard,
    TransferCompanyPublicCode,
    TransferExtraRecipientPack,
    TransferImportReference,
    TransferImportResult,
    TransferMarketplaceRequirement,
    TransferShipment,
    TransferShipmentItem,
)


DETACHED_COMMUNICATION_EVENTS = {
    "transfer_recipient_added",
    "transfer_code_validation_failed",
    "transfer_code_validation_paused",
    "transfer_code_validation_banned",
    "transfer_code_validation_resolved",
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


def _normalize(value: str | None) -> str:
    return str(value or "").strip().casefold()


def _table_exists(db, table_name: str) -> bool:
    return bool(db.execute(
        text("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = current_schema()
              AND table_name = :table_name
        )
        """),
        {"table_name": table_name},
    ).scalar())


def _resolve_company(db, label: str) -> Empresa:
    target = _normalize(label)
    companies = (
        db.query(Empresa)
        .filter(or_(func.lower(Empresa.nombre) == target, func.lower(Empresa.alias) == target))
        .order_by(Empresa.id.asc())
        .all()
    )
    if not companies:
        raise SystemExit(f"No se encontro empresa exacta por nombre o alias: {label!r}")
    if len(companies) > 1:
        details = ", ".join(f"{item.id}:{item.nombre}" for item in companies)
        raise SystemExit(f"Nombre ambiguo para {label!r}: {details}")
    return companies[0]


def _shipment_filter(company_a_id: int, company_b_id: int):
    return or_(
        and_(
            TransferShipment.sender_empresa_id == company_a_id,
            TransferShipment.receiver_empresa_id == company_b_id,
        ),
        and_(
            TransferShipment.sender_empresa_id == company_b_id,
            TransferShipment.receiver_empresa_id == company_a_id,
        ),
    )


def _recipient_filter(company_a_id: int, company_b_id: int):
    return or_(
        and_(
            TransferAllowedCompanyRecipient.empresa_id == company_a_id,
            TransferAllowedCompanyRecipient.recipient_empresa_id == company_b_id,
        ),
        and_(
            TransferAllowedCompanyRecipient.empresa_id == company_b_id,
            TransferAllowedCompanyRecipient.recipient_empresa_id == company_a_id,
        ),
    )


def _codes_by_company(db, company_ids: list[int]) -> dict[int, set[str]]:
    codes: dict[int, set[str]] = {company_id: set() for company_id in company_ids}
    company_codes = []
    if _table_exists(db, TransferCompanyPublicCode.__tablename__):
        company_codes = (
            db.query(TransferCompanyPublicCode)
            .filter(TransferCompanyPublicCode.empresa_id.in_(company_ids))
            .all()
        )
    legacy_codes = (
        db.query(TransferAdminPublicCode)
        .filter(TransferAdminPublicCode.empresa_id.in_(company_ids))
        .all()
    )
    for row in [*company_codes, *legacy_codes]:
        if row.public_code:
            codes.setdefault(int(row.empresa_id), set()).add(str(row.public_code))
    return codes


def _matching_guard_ids(db, company_a_id: int, company_b_id: int) -> list[int]:
    codes = _codes_by_company(db, [company_a_id, company_b_id])
    guards = (
        db.query(TransferCodeAttemptGuard)
        .filter(TransferCodeAttemptGuard.empresa_id.in_([company_a_id, company_b_id]))
        .all()
    )
    matches: list[int] = []
    for guard in guards:
        other_id = company_b_id if int(guard.empresa_id) == company_a_id else company_a_id
        if guard.attempted_code in codes.get(other_id, set()):
            matches.append(int(guard.id))
    return matches


def _matching_detached_event_ids(db, company_a_id: int, company_b_id: int) -> list[int]:
    codes = _codes_by_company(db, [company_a_id, company_b_id])
    events = (
        db.query(TransferAuditEvent)
        .filter(
            TransferAuditEvent.shipment_id.is_(None),
            TransferAuditEvent.empresa_id.in_([company_a_id, company_b_id]),
            TransferAuditEvent.event_type.in_(DETACHED_COMMUNICATION_EVENTS),
        )
        .all()
    )
    matches: list[int] = []
    for event in events:
        payload = event.payload_json or {}
        other_id = company_b_id if int(event.empresa_id or 0) == company_a_id else company_a_id
        recipient_empresa_id = payload.get("recipient_empresa_id")
        attempted_code = payload.get("attempted_code")
        if recipient_empresa_id is not None and int(recipient_empresa_id) == other_id:
            matches.append(int(event.id))
            continue
        if attempted_code in codes.get(other_id, set()):
            matches.append(int(event.id))
    return matches


def _collect(db, company_a: Empresa, company_b: Empresa) -> dict:
    company_a_id = int(company_a.id)
    company_b_id = int(company_b.id)
    shipments = (
        db.query(TransferShipment)
        .filter(_shipment_filter(company_a_id, company_b_id))
        .order_by(TransferShipment.id.asc())
        .all()
    )
    shipment_ids = [int(item.id) for item in shipments]
    recipients = (
        db.query(TransferAllowedCompanyRecipient)
        .filter(_recipient_filter(company_a_id, company_b_id))
        .order_by(TransferAllowedCompanyRecipient.id.asc())
        .all()
    )
    guard_ids = _matching_guard_ids(db, company_a_id, company_b_id)
    detached_event_ids = _matching_detached_event_ids(db, company_a_id, company_b_id)
    pack_ids = sorted({int(item.source_pack_id) for item in recipients if item.source_pack_id})

    def rows(model, *criteria):
        query = db.query(model)
        for criterion in criteria:
            query = query.filter(criterion)
        return query.order_by(model.id.asc()).all()

    if shipment_ids:
        items = rows(TransferShipmentItem, TransferShipmentItem.shipment_id.in_(shipment_ids))
        requirements = rows(
            TransferMarketplaceRequirement,
            TransferMarketplaceRequirement.shipment_id.in_(shipment_ids),
        )
        import_results = rows(TransferImportResult, TransferImportResult.shipment_id.in_(shipment_ids))
        import_references = rows(
            TransferImportReference,
            TransferImportReference.shipment_id.in_(shipment_ids),
        )
        shipment_events = rows(TransferAuditEvent, TransferAuditEvent.shipment_id.in_(shipment_ids))
    else:
        items = []
        requirements = []
        import_results = []
        import_references = []
        shipment_events = []

    guards = (
        db.query(TransferCodeAttemptGuard)
        .filter(TransferCodeAttemptGuard.id.in_(guard_ids))
        .order_by(TransferCodeAttemptGuard.id.asc())
        .all()
        if guard_ids
        else []
    )
    detached_events = (
        db.query(TransferAuditEvent)
        .filter(TransferAuditEvent.id.in_(detached_event_ids))
        .order_by(TransferAuditEvent.id.asc())
        .all()
        if detached_event_ids
        else []
    )
    packs = (
        db.query(TransferExtraRecipientPack)
        .filter(TransferExtraRecipientPack.id.in_(pack_ids))
        .order_by(TransferExtraRecipientPack.id.asc())
        .all()
        if pack_ids
        else []
    )

    return {
        "companies": {
            "company_a": _serialize_model(company_a),
            "company_b": _serialize_model(company_b),
        },
        "ids": {
            "shipment_ids": shipment_ids,
            "recipient_ids": [int(item.id) for item in recipients],
            "guard_ids": guard_ids,
            "detached_event_ids": detached_event_ids,
            "pack_ids": pack_ids,
        },
        "tables": {
            "transfer_shipments": [_serialize_model(item) for item in shipments],
            "transfer_shipment_items": [_serialize_model(item) for item in items],
            "transfer_marketplace_requirements": [_serialize_model(item) for item in requirements],
            "transfer_import_results": [_serialize_model(item) for item in import_results],
            "transfer_import_references": [_serialize_model(item) for item in import_references],
            "transfer_audit_events": [
                _serialize_model(item) for item in [*shipment_events, *detached_events]
            ],
            "transfer_allowed_company_recipients": [_serialize_model(item) for item in recipients],
            "transfer_code_attempt_guards": [_serialize_model(item) for item in guards],
            "transfer_extra_recipient_packs_before": [_serialize_model(item) for item in packs],
        },
    }


def _write_backup(payload: dict) -> Path:
    backup_dir = Path(__file__).resolve().parents[2] / "tmp"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup_path = backup_dir / (
        "transfer_company_communications_cleanup_"
        f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    )
    backup_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return backup_path


def _delete_by_ids(db, model, ids: list[int]) -> int:
    if not ids:
        return 0
    return db.query(model).filter(model.id.in_(ids)).delete(synchronize_session=False)


def _apply_cleanup(db, collected: dict) -> dict[str, int]:
    ids = collected["ids"]
    shipment_ids = ids["shipment_ids"]
    recipient_rows = collected["tables"]["transfer_allowed_company_recipients"]
    pack_releases = Counter(
        int(row["source_pack_id"]) for row in recipient_rows if row.get("source_pack_id")
    )

    deleted: dict[str, int] = {}
    if shipment_ids:
        deleted["transfer_import_references"] = db.query(TransferImportReference).filter(
            TransferImportReference.shipment_id.in_(shipment_ids)
        ).delete(synchronize_session=False)
        deleted["transfer_import_results"] = db.query(TransferImportResult).filter(
            TransferImportResult.shipment_id.in_(shipment_ids)
        ).delete(synchronize_session=False)
        deleted["transfer_marketplace_requirements"] = db.query(TransferMarketplaceRequirement).filter(
            TransferMarketplaceRequirement.shipment_id.in_(shipment_ids)
        ).delete(synchronize_session=False)
        deleted["transfer_shipment_items"] = db.query(TransferShipmentItem).filter(
            TransferShipmentItem.shipment_id.in_(shipment_ids)
        ).delete(synchronize_session=False)
        deleted["transfer_audit_events_by_shipment"] = db.query(TransferAuditEvent).filter(
            TransferAuditEvent.shipment_id.in_(shipment_ids)
        ).delete(synchronize_session=False)
        deleted["transfer_shipments"] = db.query(TransferShipment).filter(
            TransferShipment.id.in_(shipment_ids)
        ).delete(synchronize_session=False)
    else:
        deleted.update(
            {
                "transfer_import_references": 0,
                "transfer_import_results": 0,
                "transfer_marketplace_requirements": 0,
                "transfer_shipment_items": 0,
                "transfer_audit_events_by_shipment": 0,
                "transfer_shipments": 0,
            }
        )

    deleted["transfer_allowed_company_recipients"] = _delete_by_ids(
        db,
        TransferAllowedCompanyRecipient,
        ids["recipient_ids"],
    )
    deleted["transfer_code_attempt_guards"] = _delete_by_ids(
        db,
        TransferCodeAttemptGuard,
        ids["guard_ids"],
    )
    deleted["transfer_audit_events_detached"] = _delete_by_ids(
        db,
        TransferAuditEvent,
        ids["detached_event_ids"],
    )

    adjusted_packs = 0
    for pack_id, release_count in pack_releases.items():
        pack = db.query(TransferExtraRecipientPack).filter(TransferExtraRecipientPack.id == pack_id).first()
        if not pack:
            continue
        pack.slots_used = max(0, int(pack.slots_used or 0) - int(release_count))
        db.add(pack)
        adjusted_packs += 1
    deleted["transfer_extra_recipient_packs_adjusted"] = adjusted_packs
    return deleted


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Limpia comunicaciones de Envios y Transferencias entre dos empresas."
    )
    parser.add_argument("--company-a", required=True, help="Nombre o alias exacto de la primera empresa.")
    parser.add_argument("--company-b", required=True, help="Nombre o alias exacto de la segunda empresa.")
    parser.add_argument("--apply", action="store_true", help="Aplica el borrado. Sin este flag solo inventaria.")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        company_a = _resolve_company(db, args.company_a)
        company_b = _resolve_company(db, args.company_b)
        collected = _collect(db, company_a, company_b)
        backup_payload = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "apply": bool(args.apply),
            "operation": "cleanup_transfer_company_communications",
            "scope": {
                "company_a": {"id": company_a.id, "nombre": company_a.nombre, "alias": company_a.alias},
                "company_b": {"id": company_b.id, "nombre": company_b.nombre, "alias": company_b.alias},
            },
            **collected,
        }
        backup_path = _write_backup(backup_payload)

        deleted = {}
        if args.apply:
            deleted = _apply_cleanup(db, collected)
            db.commit()
        else:
            db.rollback()

        post = _collect(db, company_a, company_b) if args.apply else collected
        summary = {
            "apply": bool(args.apply),
            "backup_path": str(backup_path),
            "scope": backup_payload["scope"],
            "matched": {
                table: len(rows)
                for table, rows in collected["tables"].items()
                if not table.endswith("_before")
            },
            "deleted_or_adjusted": deleted,
            "remaining": {
                table: len(rows)
                for table, rows in post["tables"].items()
                if not table.endswith("_before")
            },
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
