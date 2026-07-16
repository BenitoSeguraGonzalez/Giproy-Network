import hashlib
import json
from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_4d_safety import Bim4dSafetyPunchItem
from app.models.bim_as_built_acceptance import BimAsBuiltAcceptance
from app.models.bim_punch_closure import BimPunchClosure


def _serialize(value):
    return {"id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id, "as_built_acceptance_id": value.as_built_acceptance_id, "revision": value.revision, "punch_item_ids": value.punch_item_ids_json, "punch_snapshot_sha256": value.punch_snapshot_sha256, "total_items": value.total_items, "critical_items": value.critical_items, "closure_criteria": value.closure_criteria_json, "verification_notes": value.verification_notes, "status": value.status, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "submitted_by": value.submitted_by, "decided_by": value.decided_by, "submitted_at": value.submitted_at, "decided_at": value.decided_at}


def _accepted_as_built(db, *, project_id, company_id, lock=False):
    query = db.query(BimAsBuiltAcceptance).filter(BimAsBuiltAcceptance.proyecto_id == project_id, BimAsBuiltAcceptance.empresa_id == company_id, BimAsBuiltAcceptance.status == "accepted")
    value = (query.with_for_update() if lock else query).first()
    if not value:
        raise HTTPException(status_code=409, detail="El cierre punch exige una entrega as-built aceptada.")
    return value


def _punch_snapshot(db, *, project_id, company_id, lock=False):
    query = db.query(Bim4dSafetyPunchItem).filter(Bim4dSafetyPunchItem.proyecto_id == project_id, Bim4dSafetyPunchItem.empresa_id == company_id).order_by(Bim4dSafetyPunchItem.id)
    rows = (query.with_for_update() if lock else query).all()
    open_items = [item for item in rows if item.status != "closed"]
    if open_items:
        raise HTTPException(status_code=409, detail=f"El cierre punch tiene {len(open_items)} hallazgos pendientes.")
    payload = [{"id": item.id, "priority": item.priority, "closed_at": item.closed_at.isoformat() if item.closed_at else None, "closed_by": item.closed_by} for item in rows]
    checksum = hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    return rows, checksum


def list_punch_closures(db, *, project_id, company_id):
    rows = db.query(BimPunchClosure).filter(BimPunchClosure.proyecto_id == project_id, BimPunchClosure.empresa_id == company_id).order_by(BimPunchClosure.submitted_at.desc(), BimPunchClosure.id.desc()).all()
    return [_serialize(value) for value in rows]


def create_punch_closure(db, *, project_id, company_id, user_id, payload):
    as_built = _accepted_as_built(db, project_id=project_id, company_id=company_id)
    revision = payload.revision.strip()
    if db.query(BimPunchClosure.id).filter(BimPunchClosure.proyecto_id == project_id, BimPunchClosure.empresa_id == company_id, BimPunchClosure.revision == revision).first():
        raise HTTPException(status_code=409, detail="La revision de cierre punch ya existe.")
    criteria = [item.strip() for item in payload.closure_criteria if item.strip()]
    if not criteria:
        raise HTTPException(status_code=422, detail="El cierre punch requiere criterios verificables.")
    rows, checksum = _punch_snapshot(db, project_id=project_id, company_id=company_id)
    value = BimPunchClosure(empresa_id=company_id, proyecto_id=project_id, as_built_acceptance_id=as_built.id, revision=revision, punch_item_ids_json=[item.id for item in rows], punch_snapshot_sha256=checksum, total_items=len(rows), critical_items=sum(item.priority == "critical" for item in rows), closure_criteria_json=criteria, verification_notes=payload.verification_notes.strip(), submitted_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value)


def decide_punch_closure(db, *, closure_id, project_id, company_id, user_id, payload):
    value = db.query(BimPunchClosure).filter(BimPunchClosure.id == closure_id, BimPunchClosure.proyecto_id == project_id, BimPunchClosure.empresa_id == company_id).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Cierre punch fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El cierre punch cambio o ya fue decidido.")
    as_built = _accepted_as_built(db, project_id=project_id, company_id=company_id, lock=True)
    rows, checksum = _punch_snapshot(db, project_id=project_id, company_id=company_id, lock=True)
    if as_built.id != value.as_built_acceptance_id or checksum != value.punch_snapshot_sha256 or [item.id for item in rows] != value.punch_item_ids_json:
        raise HTTPException(status_code=409, detail="La entrega as-built o la punch list cambio; presenta un nuevo cierre.")
    if payload.decision == "accepted":
        previous = db.query(BimPunchClosure).filter(BimPunchClosure.proyecto_id == project_id, BimPunchClosure.empresa_id == company_id, BimPunchClosure.status == "accepted", BimPunchClosure.id != value.id).with_for_update().all()
        for item in previous: item.status = "superseded"; item.lock_version += 1
    value.status = payload.decision; value.decision_reason = payload.reason.strip(); value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc); value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value)
