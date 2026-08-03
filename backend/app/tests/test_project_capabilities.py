import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.usuario import Usuario
from app.services.project_capability import (
    PROFILE_CAPABILITIES,
    PROJECT_ACTION_CAPABILITIES,
    PROJECT_CAPABILITIES,
    resolve_project_capabilities,
    save_project_capability_grant,
)
from app.api.endpoints.presupuestos import _verify_module_access as verify_budget_access
from app.api.endpoints.cronogramas_trabajo import _verify_module_access as verify_schedule_access


def test_action_inventory_is_complete_and_uses_only_canonical_capabilities():
    action_capabilities = {item["capability"] for item in PROJECT_ACTION_CAPABILITIES.values()}
    assert action_capabilities == PROJECT_CAPABILITIES
    assert all(item["domain"] and item["risk"] for item in PROJECT_ACTION_CAPABILITIES.values())
    assert all(item["owner"] and item["status"] == "active" for item in PROJECT_ACTION_CAPABILITIES.values())
    assert all(item["enforcement"] == "backend" for item in PROJECT_ACTION_CAPABILITIES.values())
    assert all(item["responsible_profiles"] for item in PROJECT_ACTION_CAPABILITIES.values())
    assert all(set(profile) <= PROJECT_CAPABILITIES for profile in PROFILE_CAPABILITIES.values())
    assert PROFILE_CAPABILITIES["consultor_integral"] == PROJECT_CAPABILITIES


def _project(db, company, code="CAP-001"):
    item = Proyecto(codigo=code, codigo_root=code, revision=0, nombre="Proyecto capacidades", empresa_id=company.id)
    db.add(item); db.commit(); db.refresh(item)
    return item


def test_project_capabilities_combine_assignment_profile_and_edt_scope(db, sample_empresa):
    project = _project(db, sample_empresa)
    user = Usuario(email="planner-scope@example.com", hashed_password="x", nombre_completo="Planner", empresa_id=sample_empresa.id, rol="usuario")
    db.add(user); db.commit(); db.refresh(user)
    db.add(ProyectoAsignacion(proyecto_id=project.id, usuario_id=user.id, modulo="cronogramas"))
    db.commit()

    base = resolve_project_capabilities(db, project_id=project.id, user_id=user.id, company_id=sample_empresa.id, role=user.rol)
    assert "schedule.view" in base.capabilities
    assert "budget.approve" not in base.capabilities

    save_project_capability_grant(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        capabilities=["schedule.baseline.propose", "coordination.propose"],
        granted_by=user.id, profile_code="planificador",
    )
    granted = resolve_project_capabilities(db, project_id=project.id, user_id=user.id, company_id=sample_empresa.id, role=user.rol)
    assert "coordination.propose" in granted.capabilities
    assert "coordination.approve" not in granted.capabilities


def test_project_technical_operator_does_not_inherit_economic_approval(db, sample_empresa):
    project = _project(db, sample_empresa, "CAP-002")
    user = Usuario(email="operator-scope@example.com", hashed_password="x", nombre_completo="Operator", empresa_id=sample_empresa.id, rol="administrador")
    db.add(user); db.commit(); db.refresh(user)
    resolved = resolve_project_capabilities(db, project_id=project.id, user_id=user.id, company_id=sample_empresa.id, role=user.rol)
    assert "bim.admin" in resolved.capabilities
    assert "budget.approve" not in resolved.capabilities
    assert "schedule.baseline.approve" not in resolved.capabilities


def test_project_capability_grant_rejects_cross_tenant_and_unknown_capability(db, sample_empresa):
    project = _project(db, sample_empresa, "CAP-003")
    user = Usuario(email="cross-scope@example.com", hashed_password="x", nombre_completo="Cross", empresa_id=sample_empresa.id, rol="usuario")
    db.add(user); db.commit(); db.refresh(user)
    with pytest.raises(HTTPException):
        save_project_capability_grant(db, project_id=project.id, company_id=sample_empresa.id + 1, user_id=user.id, capabilities=[], granted_by=user.id)
    with pytest.raises(HTTPException):
        save_project_capability_grant(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, capabilities=["unknown.power"], granted_by=user.id)


def test_classic_budget_and_schedule_bridges_fail_closed_for_unassigned_user(db, sample_empresa):
    project = _project(db, sample_empresa, "CAP-004")
    user = Usuario(email="classic-unassigned@example.com", hashed_password="x", nombre_completo="Unassigned", empresa_id=sample_empresa.id, rol="usuario")
    db.add(user); db.commit(); db.refresh(user)

    with pytest.raises(HTTPException) as budget_denied:
        verify_budget_access(db, project.id, user.id)
    with pytest.raises(HTTPException) as schedule_denied:
        verify_schedule_access(db, project.id, user.id)

    assert budget_denied.value.status_code == 403
    assert schedule_denied.value.status_code == 403
