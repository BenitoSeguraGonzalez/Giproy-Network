import hashlib
import json
from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_as_built_acceptance import BimAsBuiltAcceptance
from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_commissioning import BimCommissioningAsset, BimCommissioningSystem
from app.models.bim_handover_dossier import BimHandoverDossier
from app.models.bim_punch_closure import BimPunchClosure


def _serialize(value):
    return {
        "id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id,
        "as_built_acceptance_id": value.as_built_acceptance_id, "punch_closure_id": value.punch_closure_id,
        "revision": value.revision, "manifest": value.manifest_json,
        "manifest_checksum_sha256": value.manifest_checksum_sha256,
        "system_ids": value.system_ids_json, "asset_ids": value.asset_ids_json,
        "cde_revision_ids": value.cde_revision_ids_json, "total_systems": value.total_systems,
        "total_assets": value.total_assets, "total_documents": value.total_documents,
        "assembly_notes": value.assembly_notes, "status": value.status,
        "decision_reason": value.decision_reason, "lock_version": value.lock_version,
        "submitted_by": value.submitted_by, "decided_by": value.decided_by,
        "submitted_at": value.submitted_at, "decided_at": value.decided_at,
    }


def _governed_sources(db, *, project_id, company_id, lock=False):
    as_built_query = db.query(BimAsBuiltAcceptance).filter(
        BimAsBuiltAcceptance.proyecto_id == project_id,
        BimAsBuiltAcceptance.empresa_id == company_id,
        BimAsBuiltAcceptance.status == "accepted",
    )
    as_built = (as_built_query.with_for_update() if lock else as_built_query).first()
    punch_query = db.query(BimPunchClosure).filter(
        BimPunchClosure.proyecto_id == project_id,
        BimPunchClosure.empresa_id == company_id,
        BimPunchClosure.status == "accepted",
    )
    punch = (punch_query.with_for_update() if lock else punch_query).first()
    if not as_built or not punch or punch.as_built_acceptance_id != as_built.id:
        raise HTTPException(status_code=409, detail="El dossier exige as-built y cierre punch aceptados y coherentes.")

    systems_query = db.query(BimCommissioningSystem).filter(
        BimCommissioningSystem.proyecto_id == project_id,
        BimCommissioningSystem.empresa_id == company_id,
    ).order_by(BimCommissioningSystem.id)
    systems = (systems_query.with_for_update() if lock else systems_query).all()
    assets_query = db.query(BimCommissioningAsset).filter(
        BimCommissioningAsset.proyecto_id == project_id,
        BimCommissioningAsset.empresa_id == company_id,
    ).order_by(BimCommissioningAsset.id)
    assets = (assets_query.with_for_update() if lock else assets_query).all()
    if not systems or not assets or any(item.status != "accepted" for item in [*systems, *assets]):
        raise HTTPException(status_code=409, detail="El dossier exige sistemas y activos de commissioning aceptados.")

    documents_query = db.query(BimCdeDocument, BimCdeDocumentRevision).join(
        BimCdeDocumentRevision, BimCdeDocumentRevision.document_id == BimCdeDocument.id,
    ).filter(
        BimCdeDocument.proyecto_id == project_id,
        BimCdeDocument.empresa_id == company_id,
        BimCdeDocument.status == "active",
        BimCdeDocumentRevision.status == "current",
    ).order_by(BimCdeDocument.document_code, BimCdeDocumentRevision.id)
    documents = (documents_query.with_for_update() if lock else documents_query).all()
    if not documents:
        raise HTTPException(status_code=409, detail="El dossier exige al menos un documento CDE vigente.")
    return as_built, punch, systems, assets, documents


def _manifest(*, project_id, as_built, punch, systems, assets, documents):
    return {
        "schema": "giproy_bim_handover_manifest_v1",
        "project_id": project_id,
        "as_built": {"acceptance_id": as_built.id, "version_id": as_built.bim_model_version_id, "checksum_sha256": as_built.source_checksum_sha256},
        "punch_closure": {"closure_id": punch.id, "snapshot_sha256": punch.punch_snapshot_sha256},
        "commissioning_systems": [{"id": item.id, "code": item.system_code, "lock_version": item.lock_version} for item in systems],
        "commissioning_assets": [{"id": item.id, "tag": item.asset_tag, "global_id": item.global_id, "lock_version": item.lock_version} for item in assets],
        "cde_documents": [{"document_id": document.id, "document_code": document.document_code, "revision_id": revision.id, "revision": revision.revision, "checksum_sha256": revision.checksum_sha256} for document, revision in documents],
    }


def list_handover_dossiers(db, *, project_id, company_id):
    rows = db.query(BimHandoverDossier).filter(
        BimHandoverDossier.proyecto_id == project_id,
        BimHandoverDossier.empresa_id == company_id,
    ).order_by(BimHandoverDossier.submitted_at.desc(), BimHandoverDossier.id.desc()).all()
    return [_serialize(value) for value in rows]


def create_handover_dossier(db, *, project_id, company_id, user_id, payload):
    revision = payload.revision.strip()
    if db.query(BimHandoverDossier.id).filter(
        BimHandoverDossier.proyecto_id == project_id,
        BimHandoverDossier.empresa_id == company_id,
        BimHandoverDossier.revision == revision,
    ).first():
        raise HTTPException(status_code=409, detail="La revision del dossier digital ya existe.")
    as_built, punch, systems, assets, documents = _governed_sources(db, project_id=project_id, company_id=company_id)
    manifest = _manifest(project_id=project_id, as_built=as_built, punch=punch, systems=systems, assets=assets, documents=documents)
    checksum = hashlib.sha256(json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    value = BimHandoverDossier(
        empresa_id=company_id, proyecto_id=project_id, as_built_acceptance_id=as_built.id,
        punch_closure_id=punch.id, revision=revision, manifest_json=manifest,
        manifest_checksum_sha256=checksum, system_ids_json=[item.id for item in systems],
        asset_ids_json=[item.id for item in assets], cde_revision_ids_json=[revision.id for _, revision in documents],
        total_systems=len(systems), total_assets=len(assets), total_documents=len(documents),
        assembly_notes=payload.assembly_notes.strip(), submitted_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value)


def decide_handover_dossier(db, *, dossier_id, project_id, company_id, user_id, payload):
    value = db.query(BimHandoverDossier).filter(
        BimHandoverDossier.id == dossier_id,
        BimHandoverDossier.proyecto_id == project_id,
        BimHandoverDossier.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Dossier digital fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El dossier digital cambio o ya fue decidido.")
    as_built, punch, systems, assets, documents = _governed_sources(db, project_id=project_id, company_id=company_id, lock=True)
    manifest = _manifest(project_id=project_id, as_built=as_built, punch=punch, systems=systems, assets=assets, documents=documents)
    checksum = hashlib.sha256(json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    if manifest != value.manifest_json or checksum != value.manifest_checksum_sha256:
        raise HTTPException(status_code=409, detail="Las fuentes del dossier cambiaron; ensambla una nueva revision.")
    if payload.decision == "accepted":
        previous = db.query(BimHandoverDossier).filter(
            BimHandoverDossier.proyecto_id == project_id,
            BimHandoverDossier.empresa_id == company_id,
            BimHandoverDossier.status == "accepted",
            BimHandoverDossier.id != value.id,
        ).with_for_update().all()
        for item in previous:
            item.status = "superseded"; item.lock_version += 1
    value.status = payload.decision
    value.decision_reason = payload.reason.strip()
    value.decided_by = user_id
    value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value)
