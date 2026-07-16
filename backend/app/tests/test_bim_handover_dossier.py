from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_as_built_acceptance import BimAsBuiltAcceptance
from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_commissioning import BimCommissioningAsset, BimCommissioningSystem
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_punch_closure import BimPunchClosure
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_handover_dossier import BimHandoverDossierCreate
from app.services.bim.handover_dossier_service import create_handover_dossier, list_handover_dossiers


def _context(db, empresa, *, accepted_asset=True, with_document=True):
    now = datetime(2026, 7, 16, tzinfo=timezone.utc)
    user = Usuario(email="handover@example.com", hashed_password="x", nombre_completo="Handover", empresa_id=empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Digital handover", empresa_id=empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=empresa.id, nombre="As built"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="AB-1", status="ready", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-ASSET-1", ifc_class="IfcPump", nombre="Pump"); db.add(element); db.flush()
    as_built = BimAsBuiltAcceptance(empresa_id=empresa.id, proyecto_id=project.id, bim_model_version_id=version.id, revision="AB-1", version_label="AB-1", source_checksum_sha256="a" * 64, quality_status="passed", acceptance_criteria_json=["Conforme"], declaration_notes="Aceptado", status="accepted", submitted_by=user.id, decided_by=user.id, decided_at=now); db.add(as_built); db.flush()
    punch = BimPunchClosure(empresa_id=empresa.id, proyecto_id=project.id, as_built_acceptance_id=as_built.id, revision="PC-1", punch_item_ids_json=[], punch_snapshot_sha256="b" * 64, total_items=0, critical_items=0, closure_criteria_json=["Sin pendientes"], verification_notes="Cerrado", status="accepted", submitted_by=user.id, decided_by=user.id, decided_at=now); db.add(punch); db.flush()
    system = BimCommissioningSystem(empresa_id=empresa.id, proyecto_id=project.id, system_code="HVAC-01", name="HVAC", status="accepted", accepted_by=user.id, accepted_at=now, created_by=user.id); db.add(system); db.flush()
    asset = BimCommissioningAsset(empresa_id=empresa.id, proyecto_id=project.id, system_id=system.id, bim_model_version_id=version.id, bim_element_id=element.id, asset_tag="P-001", name="Pump", asset_type="pump", global_id=element.global_id, status="accepted" if accepted_asset else "testing", created_by=user.id); db.add(asset)
    if with_document:
        document = BimCdeDocument(empresa_id=empresa.id, proyecto_id=project.id, document_code="O&M-001", title="Manual O&M", category="manual", status="active", current_revision=1, created_by=user.id); db.add(document); db.flush()
        db.add(BimCdeDocumentRevision(document_id=document.id, empresa_id=empresa.id, proyecto_id=project.id, revision=1, version_label="A", source_filename="manual.pdf", stored_path="bim/manual.pdf", media_type="application/pdf", file_size_bytes=100, checksum_sha256="c" * 64, status="current", created_by=user.id))
    db.commit()
    return user, project


def test_handover_dossier_freezes_governed_manifest(db, sample_empresa):
    user, project = _context(db, sample_empresa)
    dossier = create_handover_dossier(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimHandoverDossierCreate(revision="HD-1", assembly_notes="Entrega digital verificada"))
    assert dossier["status"] == "submitted"
    assert dossier["total_systems"] == dossier["total_assets"] == dossier["total_documents"] == 1
    assert dossier["manifest"]["schema"] == "giproy_bim_handover_manifest_v1"
    assert len(dossier["manifest_checksum_sha256"]) == 64
    assert list_handover_dossiers(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == dossier["id"]


@pytest.mark.parametrize("accepted_asset,with_document,expected", [(False, True, "commissioning"), (True, False, "documento CDE")])
def test_handover_dossier_blocks_incomplete_sources(db, sample_empresa, accepted_asset, with_document, expected):
    user, project = _context(db, sample_empresa, accepted_asset=accepted_asset, with_document=with_document)
    with pytest.raises(HTTPException, match=expected):
        create_handover_dossier(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimHandoverDossierCreate(revision="HD-X", assembly_notes="No debe ensamblarse"))


def test_handover_dossier_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2049a1b2c3_bim_handover_dossier.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2048a1b2c3"' in source and source.count('ondelete="RESTRICT"') == 2 and "alter_column" not in source
