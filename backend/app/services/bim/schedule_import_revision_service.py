from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from sqlalchemy import func

from app.models.bim_schedule_interop import BimScheduleImportRevision
from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument
from app.services.bim.schedule_interop_service import preflight_schedule_interchange


def _serialize(revision: BimScheduleImportRevision) -> dict:
    return {
        "id": revision.id,
        "project_id": revision.proyecto_id,
        "company_id": revision.empresa_id,
        "revision": revision.revision,
        "version": revision.version,
        "source_format": revision.source_format,
        "source_filename": revision.source_filename,
        "source_checksum_sha256": revision.source_checksum_sha256,
        "normalized_checksum_sha256": revision.normalized_checksum_sha256,
        "status": revision.status,
        "counts": dict((revision.preflight_json or {}).get("counts") or {}),
        "previous_approved_revision_id": revision.previous_approved_revision_id,
        "decision_reason": revision.decision_reason,
        "rollback_reason": revision.rollback_reason,
        "created_by": revision.created_by,
        "decided_by": revision.decided_by,
        "rolled_back_by": revision.rolled_back_by,
        "created_at": revision.created_at,
        "decided_at": revision.decided_at,
        "rolled_back_at": revision.rolled_back_at,
    }


def create_import_revision(db, *, project_id: int, company_id: int, user_id: int, document: BimScheduleInterchangeDocument) -> dict:
    preflight = preflight_schedule_interchange(document)
    if not preflight["valid"]:
        raise ValueError("El cronograma importado no supera el preflight canonico.")
    duplicate = db.query(BimScheduleImportRevision).filter(
        BimScheduleImportRevision.empresa_id == company_id,
        BimScheduleImportRevision.proyecto_id == project_id,
        BimScheduleImportRevision.normalized_checksum_sha256 == preflight["normalized_checksum_sha256"],
        BimScheduleImportRevision.status.in_(["pending", "approved"]),
    ).first()
    if duplicate:
        raise ValueError("Ya existe una revision BIM vigente con el mismo contenido normalizado.")
    next_revision = (
        db.query(func.max(BimScheduleImportRevision.revision)).filter(
            BimScheduleImportRevision.empresa_id == company_id,
            BimScheduleImportRevision.proyecto_id == project_id,
        ).scalar()
        or 0
    ) + 1
    revision = BimScheduleImportRevision(
        empresa_id=company_id,
        proyecto_id=project_id,
        revision=next_revision,
        version=1,
        source_format=document.source_format,
        source_filename=document.source_filename,
        source_checksum_sha256=document.source_checksum_sha256,
        normalized_checksum_sha256=preflight["normalized_checksum_sha256"],
        status="pending",
        document_json=document.model_dump(mode="json"),
        preflight_json=preflight,
        created_by=user_id,
    )
    db.add(revision)
    db.commit()
    db.refresh(revision)
    return _serialize(revision)


def list_import_revisions(db, *, project_id: int, company_id: int) -> list[dict]:
    revisions = db.query(BimScheduleImportRevision).filter(
        BimScheduleImportRevision.empresa_id == company_id,
        BimScheduleImportRevision.proyecto_id == project_id,
    ).order_by(BimScheduleImportRevision.revision.desc()).all()
    return [_serialize(item) for item in revisions]


def decide_import_revision(
    db,
    *,
    revision_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
    decision: str,
    reason: str,
    expected_version: int,
) -> dict:
    revision = db.query(BimScheduleImportRevision).filter(
        BimScheduleImportRevision.id == revision_id,
        BimScheduleImportRevision.empresa_id == company_id,
        BimScheduleImportRevision.proyecto_id == project_id,
    ).with_for_update().first()
    if not revision:
        raise ValueError("Revision de importacion BIM no encontrada.")
    if revision.status != "pending":
        raise ValueError("Solo una revision pendiente puede decidirse.")
    if revision.version != expected_version:
        raise ValueError("La revision BIM fue actualizada por otra operacion.")
    now = datetime.now(timezone.utc)
    if decision == "approved":
        previous = db.query(BimScheduleImportRevision).filter(
            BimScheduleImportRevision.empresa_id == company_id,
            BimScheduleImportRevision.proyecto_id == project_id,
            BimScheduleImportRevision.status == "approved",
        ).order_by(BimScheduleImportRevision.revision.desc()).first()
        if previous:
            previous.status = "superseded"
            previous.version += 1
            revision.previous_approved_revision_id = previous.id
            db.flush()
    revision.status = decision
    revision.version += 1
    revision.decision_reason = reason
    revision.decided_by = user_id
    revision.decided_at = now
    db.commit()
    db.refresh(revision)
    return _serialize(revision)


def rollback_import_revision(
    db,
    *,
    revision_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
    reason: str,
    expected_version: int,
) -> dict:
    revision = db.query(BimScheduleImportRevision).filter(
        BimScheduleImportRevision.id == revision_id,
        BimScheduleImportRevision.empresa_id == company_id,
        BimScheduleImportRevision.proyecto_id == project_id,
    ).with_for_update().first()
    if not revision:
        raise ValueError("Revision de importacion BIM no encontrada.")
    if revision.status != "approved":
        raise ValueError("Solo la revision BIM aprobada puede revertirse.")
    if revision.version != expected_version:
        raise ValueError("La revision BIM fue actualizada por otra operacion.")
    revision.status = "rolled_back"
    revision.version += 1
    revision.rollback_reason = reason
    revision.rolled_back_by = user_id
    revision.rolled_back_at = datetime.now(timezone.utc)
    db.flush()
    if revision.previous_approved_revision_id:
        previous = db.query(BimScheduleImportRevision).filter(
            BimScheduleImportRevision.id == revision.previous_approved_revision_id,
            BimScheduleImportRevision.empresa_id == company_id,
            BimScheduleImportRevision.proyecto_id == project_id,
            BimScheduleImportRevision.status == "superseded",
        ).first()
        if previous:
            previous.status = "approved"
            previous.version += 1
    db.commit()
    db.refresh(revision)
    return _serialize(revision)


def _checksum(value) -> str:
    payload = json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _semantic_sections(document: BimScheduleInterchangeDocument) -> dict:
    calendar_name = {item.id: item.name for item in document.calendars}
    wbs_code = {item.id: item.code for item in document.wbs}
    activity_code = {item.id: item.code for item in document.activities}
    resource_code = {item.id: item.code for item in document.resources}
    return {
        "project": {
            "name": document.project_name,
            "timezone": document.timezone,
            "currency": document.currency,
            "data_date": document.data_date.isoformat(),
        },
        "calendars": sorted(
            [
                {
                    "name": item.name,
                    "timezone": item.timezone,
                    "working_weekdays": item.working_weekdays,
                    "working_hours_per_day": item.working_hours_per_day,
                    "exceptions": [value.model_dump(mode="json") for value in item.exceptions],
                }
                for item in document.calendars
            ],
            key=lambda value: value["name"],
        ),
        "wbs": sorted(
            [{"code": item.code, "name": item.name, "parent_code": wbs_code.get(item.parent_id)} for item in document.wbs],
            key=lambda value: value["code"],
        ),
        "activities": sorted(
            [
                {
                    **item.model_dump(mode="json", exclude={"id", "wbs_id", "calendar_id", "custom_fields"}),
                    "wbs_code": wbs_code.get(item.wbs_id),
                    "calendar_name": calendar_name.get(item.calendar_id),
                }
                for item in document.activities
            ],
            key=lambda value: value["code"],
        ),
        "dependencies": sorted(
            [
                {
                    "predecessor_code": activity_code.get(item.predecessor_id),
                    "successor_code": activity_code.get(item.successor_id),
                    "dependency_type": item.dependency_type,
                    "lag_hours": item.lag_hours,
                }
                for item in document.dependencies
            ],
            key=lambda value: (value["predecessor_code"] or "", value["successor_code"] or "", value["dependency_type"]),
        ),
        "resources": sorted(
            [item.model_dump(mode="json", exclude={"id"}) for item in document.resources],
            key=lambda value: value["code"],
        ),
        "assignments": sorted(
            [
                {
                    **item.model_dump(mode="json", exclude={"activity_id", "resource_id"}),
                    "activity_code": activity_code.get(item.activity_id),
                    "resource_code": resource_code.get(item.resource_id),
                }
                for item in document.assignments
            ],
            key=lambda value: (value["activity_code"] or "", value["resource_code"] or ""),
        ),
        "baselines": sorted(
            [
                {
                    "name": item.name,
                    "captured_at": item.captured_at.isoformat(),
                    "activity_codes": sorted(activity_code.get(value, value) for value in item.activity_ids),
                }
                for item in document.baselines
            ],
            key=lambda value: value["name"],
        ),
    }


def compare_schedule_interchange(left: BimScheduleInterchangeDocument, right: BimScheduleInterchangeDocument) -> dict:
    left_sections = _semantic_sections(left)
    right_sections = _semantic_sections(right)
    differences = []
    for section in left_sections:
        left_checksum = _checksum(left_sections[section])
        right_checksum = _checksum(right_sections[section])
        if left_checksum != right_checksum:
            differences.append(
                {
                    "section": section,
                    "left_checksum_sha256": left_checksum,
                    "right_checksum_sha256": right_checksum,
                }
            )
    return {
        "equivalent": not differences,
        "left_checksum_sha256": _checksum(left_sections),
        "right_checksum_sha256": _checksum(right_sections),
        "differences": differences,
    }
