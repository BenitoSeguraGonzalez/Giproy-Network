from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import deps
from app.api.endpoints import proyectos as proyectos_endpoint
from app.models.empresa import Empresa
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.usuario import Usuario


def _client(db, user):
    app = FastAPI()
    app.include_router(proyectos_endpoint.router, prefix="/proyectos")
    app.dependency_overrides[deps.get_db] = lambda: db
    app.dependency_overrides[deps.get_current_active_user] = lambda: user
    return TestClient(app)


def _company(db, name, ruc):
    company = Empresa(
        nombre=name,
        ruc=ruc,
        proy_prefijo=name[:3].upper(),
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(company)
    db.flush()
    return company


def _user(db, company_id, email, role):
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email,
        empresa_id=company_id,
        rol=role,
    )
    db.add(user)
    db.flush()
    return user


def test_capabilities_me_is_project_scoped_and_denies_unassigned_user(db, sample_empresa):
    user = _user(db, sample_empresa.id, "unassigned-capabilities@example.com", "usuario")
    project = Proyecto(nombre="Project capability scope", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()

    response = _client(db, user).get(f"/proyectos/{project.id}/capabilities/me")

    assert response.status_code == 200
    assert response.json() == {"capabilities": [], "edt_ids": [], "modules": [], "source": "unassigned"}


def test_capability_grant_profile_is_visible_through_http_contract(db, sample_empresa):
    admin = _user(db, sample_empresa.id, "capability-admin@example.com", "administrador")
    planner = _user(db, sample_empresa.id, "capability-planner@example.com", "usuario")
    project = Proyecto(nombre="Profile capability project", empresa_id=sample_empresa.id)
    db.add(project)
    db.flush()
    db.add(ProyectoAsignacion(proyecto_id=project.id, usuario_id=planner.id, modulo="cronogramas"))
    db.commit()
    client = _client(db, admin)

    granted = client.put(
        f"/proyectos/{project.id}/capability-grants/{planner.id}",
        json={"capabilities": [], "profile_code": "planificador"},
    )
    assert granted.status_code == 200, granted.text
    assert "bim.schedule.link" in granted.json()["capabilities"]
    assert "budget.approve" not in granted.json()["capabilities"]

    app_user = _client(db, planner).get(f"/proyectos/{project.id}/capabilities/me")
    assert app_user.status_code == 200
    assert "schedule.edit" in app_user.json()["capabilities"]
    assert app_user.json()["source"] == "assignment_and_grants"


def test_capability_catalog_exposes_role_neutral_action_contract(db, sample_empresa):
    admin = _user(db, sample_empresa.id, "catalog-admin@example.com", "administrador")
    project = Proyecto(nombre="Action catalog project", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()

    response = _client(db, admin).get(f"/proyectos/{project.id}/capabilities/catalog")

    assert response.status_code == 200, response.text
    payload = response.json()
    budget_edit = payload["actions"]["budget.edit"]
    assert {key: budget_edit[key] for key in ("domain", "capability", "bim_required", "risk")} == {
        "domain": "budget", "capability": "budget.edit", "bim_required": False, "risk": "write"
    }
    assert budget_edit["enforcement"] == "backend"
    assert budget_edit["status"] == "active"
    assert "costes" in budget_edit["responsible_profiles"]
    assert payload["actions"]["bim.schedule.link"]["bim_required"] is True
    assert set(payload["profiles"]["consultor_integral"]) == set(payload["capabilities"])


def test_superadmin_resolves_explicit_working_company(db, sample_empresa):
    target = _company(db, "Tenant Target", "9999999990001")
    superadmin = _user(db, sample_empresa.id, "global-capabilities@example.com", "superadministrador")
    project = Proyecto(nombre="Tenant target project", empresa_id=target.id)
    db.add(project)
    db.commit()

    response = _client(db, superadmin).get(
        f"/proyectos/{project.id}/capabilities/me",
        params={"empresa_id": target.id},
    )

    assert response.status_code == 200, response.text
    assert "bim.admin" in response.json()["capabilities"]
    assert response.json()["source"] == "technical_operator"

    outside_scope = _client(db, superadmin).get(f"/proyectos/{project.id}/capabilities/me")
    assert outside_scope.status_code == 404
