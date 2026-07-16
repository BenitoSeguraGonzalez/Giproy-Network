from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_as_built_acceptance import BimAsBuiltAcceptance
from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion


def _serialize(value):
    return {
        "id": value.id,
        "project_id": value.proyecto_id,
        "company_id": value.empresa_id,
        "version_id": value.bim_model_version_id,
        "revision": value.revision,
        "version_label": value.version_label,
        "source_filename": value.source_filename,
        "source_checksum_sha256": value.source_checksum_sha256,
        "quality_status": value.quality_status,
        "acceptance_criteria": value.acceptance_criteria_json,
        "declaration_notes": value.declaration_notes,
        "status": value.status,
        "decision_reason": value.decision_reason,
        "lock_version": value.lock_version,
        "submitted_by": value.submitted_by,
        "decided_by": value.decided_by,
        "submitted_at": value.submitted_at,
        "decided_at": value.decided_at,
    }


def _version_and_quality(db, *, version_id, project_id, company_id, lock=False):
    query = (
        db.query(BimModelVersion)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(
            BimModelVersion.id == version_id,
            BimModel.proyecto_id == project_id,
            BimModel.empresa_id == company_id,
        )
    )
    version = (query.with_for_update() if lock else query).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version BIM fuera del proyecto activo.")
    if version.status != "ready":
        raise HTTPException(status_code=409, detail="La entrega as-built exige una version BIM lista.")
    quality = db.query(BimIfcQualityReport).filter(
        BimIfcQualityReport.bim_model_version_id == version.id,
        BimIfcQualityReport.proyecto_id == project_id,
        BimIfcQualityReport.empresa_id == company_id,
    ).first()
    if not quality or quality.overall_status == "failed":
        raise HTTPException(status_code=409, detail="La entrega as-built exige un reporte IFC vigente y no fallido.")
    return version, quality


def create_as_built_acceptance(db, *, project_id, company_id, user_id, payload):
    version, quality = _version_and_quality(
        db, version_id=payload.version_id, project_id=project_id, company_id=company_id
    )
    revision = payload.revision.strip()
    if db.query(BimAsBuiltAcceptance.id).filter(
        BimAsBuiltAcceptance.proyecto_id == project_id,
        BimAsBuiltAcceptance.empresa_id == company_id,
        BimAsBuiltAcceptance.revision == revision,
    ).first():
        raise HTTPException(status_code=409, detail="La revision de entrega as-built ya existe.")
    criteria = [item.strip() for item in payload.acceptance_criteria if item.strip()]
    if not criteria:
        raise HTTPException(status_code=422, detail="La entrega as-built requiere criterios verificables.")
    value = BimAsBuiltAcceptance(
        empresa_id=company_id,
        proyecto_id=project_id,
        bim_model_version_id=version.id,
        revision=revision,
        version_label=version.version_label,
        source_filename=version.source_filename,
        source_checksum_sha256=quality.source_checksum_sha256,
        quality_status=quality.overall_status,
        acceptance_criteria_json=criteria,
        declaration_notes=payload.declaration_notes.strip(),
        submitted_by=user_id,
    )
    db.add(value)
    db.commit()
    db.refresh(value)
    return _serialize(value)


def list_as_built_acceptances(db, *, project_id, company_id):
    rows = db.query(BimAsBuiltAcceptance).filter(
        BimAsBuiltAcceptance.proyecto_id == project_id,
        BimAsBuiltAcceptance.empresa_id == company_id,
    ).order_by(BimAsBuiltAcceptance.submitted_at.desc(), BimAsBuiltAcceptance.id.desc()).all()
    return [_serialize(value) for value in rows]


def decide_as_built_acceptance(db, *, acceptance_id, project_id, company_id, user_id, payload):
    value = db.query(BimAsBuiltAcceptance).filter(
        BimAsBuiltAcceptance.id == acceptance_id,
        BimAsBuiltAcceptance.proyecto_id == project_id,
        BimAsBuiltAcceptance.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Entrega as-built fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La entrega as-built cambio o ya fue decidida.")
    _, quality = _version_and_quality(
        db,
        version_id=value.bim_model_version_id,
        project_id=project_id,
        company_id=company_id,
        lock=True,
    )
    if quality.source_checksum_sha256 != value.source_checksum_sha256:
        raise HTTPException(status_code=409, detail="El checksum IFC cambio; crea una nueva entrega as-built.")
    if payload.decision == "accepted":
        previous = db.query(BimAsBuiltAcceptance).filter(
            BimAsBuiltAcceptance.proyecto_id == project_id,
            BimAsBuiltAcceptance.empresa_id == company_id,
            BimAsBuiltAcceptance.status == "accepted",
            BimAsBuiltAcceptance.id != value.id,
        ).with_for_update().all()
        for item in previous:
            item.status = "superseded"
            item.lock_version += 1
    value.status = payload.decision
    value.decision_reason = payload.reason.strip()
    value.decided_by = user_id
    value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit()
    db.refresh(value)
    return _serialize(value)
