import hashlib
import json

from fastapi import HTTPException

from app.models.bim_handover_dossier import BimHandoverDossier
from app.models.bim_operations_transition import BimOperationsTransition


def _serialize(value):
    return {"id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id, "handover_dossier_id": value.handover_dossier_id, "revision": value.revision, "operating_organization": value.operating_organization, "responsible_role": value.responsible_role, "effective_date": value.effective_date, "readiness_criteria": value.readiness_criteria_json, "asset_baseline": value.asset_baseline_json, "baseline_checksum_sha256": value.baseline_checksum_sha256, "total_systems": value.total_systems, "total_assets": value.total_assets, "transition_notes": value.transition_notes, "status": value.status, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "submitted_by": value.submitted_by, "decided_by": value.decided_by, "submitted_at": value.submitted_at, "decided_at": value.decided_at}


def _accepted_dossier(db, *, project_id, company_id):
    value = db.query(BimHandoverDossier).filter(BimHandoverDossier.proyecto_id == project_id, BimHandoverDossier.empresa_id == company_id, BimHandoverDossier.status == "accepted").first()
    if not value:
        raise HTTPException(status_code=409, detail="La transición a Operaciones exige un dossier digital aceptado.")
    return value


def list_operations_transitions(db, *, project_id, company_id):
    rows = db.query(BimOperationsTransition).filter(BimOperationsTransition.proyecto_id == project_id, BimOperationsTransition.empresa_id == company_id).order_by(BimOperationsTransition.submitted_at.desc(), BimOperationsTransition.id.desc()).all()
    return [_serialize(value) for value in rows]


def create_operations_transition(db, *, project_id, company_id, user_id, payload):
    dossier = _accepted_dossier(db, project_id=project_id, company_id=company_id)
    revision = payload.revision.strip()
    if db.query(BimOperationsTransition.id).filter(BimOperationsTransition.proyecto_id == project_id, BimOperationsTransition.empresa_id == company_id, BimOperationsTransition.revision == revision).first():
        raise HTTPException(status_code=409, detail="La revisión de transición a Operaciones ya existe.")
    criteria = [item.strip() for item in payload.readiness_criteria if item.strip()]
    if not criteria:
        raise HTTPException(status_code=422, detail="La transición requiere criterios verificables.")
    manifest = dossier.manifest_json
    baseline = {"schema": "giproy_bim_operations_baseline_v1", "handover_dossier_id": dossier.id, "handover_checksum_sha256": dossier.manifest_checksum_sha256, "systems": manifest.get("commissioning_systems", []), "assets": manifest.get("commissioning_assets", [])}
    checksum = hashlib.sha256(json.dumps(baseline, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    value = BimOperationsTransition(empresa_id=company_id, proyecto_id=project_id, handover_dossier_id=dossier.id, revision=revision, operating_organization=payload.operating_organization.strip(), responsible_role=payload.responsible_role.strip(), effective_date=payload.effective_date, readiness_criteria_json=criteria, asset_baseline_json=baseline, baseline_checksum_sha256=checksum, total_systems=len(baseline["systems"]), total_assets=len(baseline["assets"]), transition_notes=payload.transition_notes.strip(), submitted_by=user_id)
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value)
