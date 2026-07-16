from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_commissioning import BimCommissioningAssetCreate, BimCommissioningDecision, BimCommissioningSystemAcceptance, BimCommissioningSystemCreate, BimCommissioningTestCreate
from app.services.bim.commissioning_registry_service import accept_commissioning_system, create_commissioning_asset, create_commissioning_system, create_commissioning_test, decide_commissioning_asset, decide_commissioning_test, get_commissioning_registry


def _registry(db, empresa):
    user = Usuario(email="commissioning-accept@example.com", hashed_password="x", nombre_completo="Acceptance", empresa_id=empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Acceptance", empresa_id=empresa.id); db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=empresa.id, nombre="MEP"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="AB-1", status="ready", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-AHU-01", ifc_class="IFCAIRHANDLINGUNIT", nombre="UTA 01"); db.add(element); db.commit()
    system = create_commissioning_system(db, project_id=project.id, company_id=empresa.id, user_id=user.id, payload=BimCommissioningSystemCreate(system_code="HVAC", name="Climatizacion"))
    asset = create_commissioning_asset(db, project_id=project.id, company_id=empresa.id, user_id=user.id, payload=BimCommissioningAssetCreate(system_id=system["id"], version_id=version.id, element_id=element.id, asset_tag="AHU-01", name="UTA 01", asset_type="UTA"))
    return user, project, system, asset


def test_commissioning_acceptance_requires_passed_approved_protocols(db, sample_empresa):
    user, project, system, asset = _registry(db, sample_empresa)
    test = create_commissioning_test(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningTestCreate(asset_id=asset["id"], protocol_code="SAT-01", protocol_name="Prueba funcional", checklist=["Arranque", "Parada"], results={"airflow": 1250}, outcome="passed"))
    test = decide_commissioning_test(db, test_id=test["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="accepted", reason="Resultado funcional conforme", expected_lock_version=test["lock_version"]))
    registry = get_commissioning_registry(db, project_id=project.id, company_id=sample_empresa.id)
    asset = decide_commissioning_asset(db, asset_id=asset["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="accepted", reason="Protocolos completos y conformes", expected_lock_version=registry["assets"][0]["lock_version"]))
    registry = get_commissioning_registry(db, project_id=project.id, company_id=sample_empresa.id)
    accepted = accept_commissioning_system(db, system_id=system["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningSystemAcceptance(reason="Todos los activos estan aceptados", expected_lock_version=registry["systems"][0]["lock_version"]))
    assert test["status"] == "accepted" and asset["status"] == "accepted" and accepted["status"] == "accepted"


def test_commissioning_preserves_rejected_attempt_and_accepts_conforming_retry(db, sample_empresa):
    user, project, _system, asset = _registry(db, sample_empresa)
    test = create_commissioning_test(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningTestCreate(asset_id=asset["id"], protocol_code="FAIL-01", protocol_name="Prueba fallida", checklist=["Medicion"], results={"ok": False}, outcome="failed"))
    with pytest.raises(HTTPException, match="resultado fallido"):
        decide_commissioning_test(db, test_id=test["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="accepted", reason="No debe aceptarse", expected_lock_version=1))
    decide_commissioning_test(db, test_id=test["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="rejected", reason="Resultado fuera de tolerancia", expected_lock_version=1))
    retry = create_commissioning_test(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningTestCreate(asset_id=asset["id"], protocol_code="FAIL-01", protocol_name="Repeticion conforme", checklist=["Medicion"], results={"ok": True}, outcome="passed"))
    retry = decide_commissioning_test(db, test_id=retry["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="accepted", reason="Repeticion dentro de tolerancia", expected_lock_version=1))
    registry = get_commissioning_registry(db, project_id=project.id, company_id=sample_empresa.id)
    accepted = decide_commissioning_asset(db, asset_id=asset["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCommissioningDecision(decision="accepted", reason="Ultimo intento conforme", expected_lock_version=registry["assets"][0]["lock_version"]))
    assert retry["attempt"] == 2 and accepted["status"] == "accepted"


def test_commissioning_acceptance_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2047a1b2c3_bim_commissioning_acceptance.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2046a1b2c3"' in source and 'ondelete="RESTRICT"' in source and "drop_table(\"bim_commissioning_tests\")" in source
