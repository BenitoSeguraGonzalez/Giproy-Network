from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_ids import BimIdsProfileImportRequest
from app.services.bim.ids_service import exempt_ids_finding, export_ids_validation_csv, import_ids_profile, run_ids_validation


FIXTURE = Path(__file__).parent / "fixtures" / "bim" / "ids" / "wall-fire-rating.ids"


def _scope(db, company):
    project = Proyecto(nombre="IDS pilot", empresa_id=company.id)
    user = Usuario(email="ids@example.com", hashed_password="test", nombre_completo="IDS Coordinator", empresa_id=company.id)
    db.add_all([project, user])
    db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company.id, nombre="Architecture", disciplina="Arquitectura")
    db.add(model)
    db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01", status="ready_for_review")
    db.add(version)
    db.flush()
    return project, user, version


def test_ids_profile_runs_per_requirement_and_guid_with_audited_exception_and_csv(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    db.add_all([
        BimElement(bim_model_version_id=version.id, global_id="WALL-PASS", ifc_class="IFCWALL", nombre="Wall pass", properties={"Pset_WallCommon": {"FireRating": "60"}}, metadata_json={}),
        BimElement(bim_model_version_id=version.id, global_id="WALL-FAIL", ifc_class="IFCWALL", nombre="Wall fail", properties={"Pset_WallCommon": {"FireRating": "30"}}, metadata_json={}),
        BimElement(bim_model_version_id=version.id, global_id="SLAB-SKIP", ifc_class="IFCSLAB", nombre="Slab", properties={}, metadata_json={}),
    ])
    db.commit()
    xml = FIXTURE.read_text(encoding="utf-8")
    profile, specification_count = import_ids_profile(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIdsProfileImportRequest(name="Wall rules", source_filename=FIXTURE.name, xml_content=xml))
    assert specification_count == 1

    result = run_ids_validation(db, profile_id=profile.id, version_id=version.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    assert result.summary == {"passed": 1, "failed": 1, "exempted": 0, "requirements": 1, "elements": 3}
    failed = next(item for item in result.findings if item.status == "failed")
    assert failed.requirement_id == "wall-fire-rating"
    assert failed.global_id == "WALL-FAIL"

    exempted = exempt_ids_finding(db, finding_id=failed.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, reason="Approved existing wall during pilot review.")
    assert exempted.summary["failed"] == 0
    assert exempted.summary["exempted"] == 1
    assert next(item for item in exempted.findings if item.id == failed.id).exception_by == user.id
    csv_content = export_ids_validation_csv(exempted)
    assert "wall-fire-rating" in csv_content
    assert "WALL-FAIL" in csv_content
    assert "exempted" in csv_content


def test_ids_validation_rejects_profile_outside_tenant_scope(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    profile, _ = import_ids_profile(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIdsProfileImportRequest(name="Wall rules", source_filename=FIXTURE.name, xml_content=FIXTURE.read_text(encoding="utf-8")))
    db.commit()
    with pytest.raises(HTTPException) as exc_info:
        run_ids_validation(db, profile_id=profile.id, version_id=version.id, project_id=project.id, company_id=sample_empresa.id + 99, user_id=user.id)
    assert exc_info.value.status_code == 404
