import pytest
import json
from datetime import date, timedelta
from fastapi import HTTPException
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.endpoints.bim_models import _resolve_project
from app.api.endpoints import bim as bim_endpoint
from app.api.endpoints import bim_models as bim_models_endpoint
from app.api.endpoints import bim_view_states as bim_view_states_endpoint
from app.core.config import settings
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_view_state import BimViewState
from app.models.edt import EdtNode
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.system_bim_setting import SystemBimSetting
from app.models.usuario import Usuario
from app.schemas.bim_link import BimLinkCreateRequest
from app.schemas.bim_model import BimImportElementPayload, BimImportStoreyPayload, BimJsonImportRequest
from app.services.bim.ifc_parser import parse_ifc_text_to_bim_package
from app.services.bim.feature_flags import resolve_bim_feature_access
from app.services.bim import import_service
from app.services.bim.import_service import import_json_bim_batch, import_json_bim_package, validate_json_bim_package
from app.services.bim.link_registry import create_link_for_project, list_links_for_project
from app.services.bim.model_registry import bim_tables_ready, ensure_bim_domain_tables
from app.services.bim.model_registry import get_workspace_summary
from app.services.bim.view_state_service import bim_view_state_table_ready, ensure_bim_view_state_table
from app.services.system_bim_setting import (
    ensure_system_bim_settings_table,
    get_or_create_system_bim_setting,
    system_bim_settings_table_ready,
)


def _bim_test_client(db, user):
    app = FastAPI()
    app.include_router(bim_endpoint.router, prefix="/bim")
    app.include_router(bim_models_endpoint.router, prefix="/bim")
    app.include_router(bim_view_states_endpoint.router, prefix="/bim")

    def override_db():
        return db

    def override_user():
        return user

    app.dependency_overrides[bim_endpoint.get_db] = override_db
    app.dependency_overrides[bim_endpoint.get_current_active_user] = override_user
    app.dependency_overrides[bim_models_endpoint.get_db] = override_db
    app.dependency_overrides[bim_models_endpoint.get_current_active_user] = override_user
    app.dependency_overrides[bim_view_states_endpoint.get_db] = override_db
    app.dependency_overrides[bim_view_states_endpoint.get_current_active_user] = override_user
    return TestClient(app)


def _empty_sqlite_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine, SessionLocal()


def _table_names(engine) -> set[str]:
    return set(inspect(engine).get_table_names())


def test_bim_feature_flags_keep_bim_disabled_by_default(monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    access = resolve_bim_feature_access(db=None, user_id=10, company_id=20, role="usuario")

    assert access.enabled is False
    assert access.environment_enabled is False
    assert access.scoped is False
    assert access.resolved_company_id == 20
    assert access.resolved_user_id == 10


def test_bim_feature_flags_honor_environment_allowlists(monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "2, invalid, 4")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "9")

    company_access = resolve_bim_feature_access(db=None, user_id=7, company_id=2, role="usuario")
    user_access = resolve_bim_feature_access(db=None, user_id=9, company_id=99, role="usuario")
    denied_access = resolve_bim_feature_access(db=None, user_id=7, company_id=99, role="usuario")

    assert company_access.enabled is True
    assert company_access.company_match is True
    assert company_access.allowed_company_ids == [2, 4]

    assert user_access.enabled is True
    assert user_access.user_match is True
    assert user_access.allowed_user_ids == [9]

    assert denied_access.enabled is False
    assert denied_access.scoped is True


def test_bim_domain_readiness_does_not_create_tables_runtime():
    engine, db = _empty_sqlite_session()
    try:
        assert bim_tables_ready(db) is False
        assert "bim_models" not in _table_names(engine)

        with pytest.raises(RuntimeError) as exc_info:
            ensure_bim_domain_tables(db)

        assert "migracion Alembic de BIM" in str(exc_info.value)
        assert "bim_models" not in _table_names(engine)
    finally:
        db.close()
        engine.dispose()


def test_bim_view_state_readiness_does_not_create_table_runtime():
    engine, db = _empty_sqlite_session()
    try:
        assert bim_view_state_table_ready(db) is False
        assert "bim_view_states" not in _table_names(engine)

        with pytest.raises(RuntimeError) as exc_info:
            ensure_bim_view_state_table(db)

        assert "bim_view_states" in str(exc_info.value)
        assert "bim_view_states" not in _table_names(engine)
    finally:
        db.close()
        engine.dispose()


def test_system_bim_settings_readiness_does_not_create_table_runtime():
    engine, db = _empty_sqlite_session()
    try:
        assert system_bim_settings_table_ready(db) is False
        assert "system_bim_settings" not in _table_names(engine)

        with pytest.raises(RuntimeError) as exc_info:
            ensure_system_bim_settings_table(db)

        assert "system_bim_settings" in str(exc_info.value)
        assert "system_bim_settings" not in _table_names(engine)

        with pytest.raises(RuntimeError):
            get_or_create_system_bim_setting(db)
    finally:
        db.close()
        engine.dispose()


def test_bim_feature_flags_database_config_overrides_environment(db, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "99")

    db.add(
        SystemBimSetting(
            titulo="BIM controlado",
            descripcion="Configuracion de prueba",
            is_enabled=True,
            superadmin_only=False,
            allowed_company_ids="3, invalid",
        )
    )
    db.commit()

    allowed_company = resolve_bim_feature_access(db=db, user_id=10, company_id=3, role="usuario")
    denied_company = resolve_bim_feature_access(db=db, user_id=99, company_id=4, role="usuario")

    assert allowed_company.enabled is True
    assert allowed_company.environment_enabled is True
    assert allowed_company.allowed_company_ids == [3]
    assert allowed_company.allowed_user_ids == []

    assert denied_company.enabled is False
    assert denied_company.user_match is False


def test_bim_pilot_allowlist_enables_only_authorized_companies(db, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    db.add(
        SystemBimSetting(
            titulo="Piloto BIM controlado",
            descripcion="Santiago Bermeo y Administradores Generales",
            is_enabled=True,
            superadmin_only=False,
            allowed_company_ids="1,3",
        )
    )
    db.commit()

    admin_company_access = resolve_bim_feature_access(
        db=db,
        user_id=10,
        company_id=1,
        role="usuario",
    )
    santiago_company_access = resolve_bim_feature_access(
        db=db,
        user_id=11,
        company_id=3,
        role="administrador",
    )
    other_company_access = resolve_bim_feature_access(
        db=db,
        user_id=12,
        company_id=2,
        role="superadministrador",
    )

    assert admin_company_access.enabled is True
    assert admin_company_access.allowed_company_ids == [1, 3]
    assert santiago_company_access.enabled is True
    assert other_company_access.enabled is False
    assert other_company_access.scoped is True


def test_bim_feature_access_combines_rollout_and_commercial_entitlement(
    db,
    sample_empresa,
    monkeypatch,
):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    standard_company = Empresa(
        nombre="Empresa Estándar sin BIM",
        ruc="1799999999001",
        proy_prefijo="STD",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    enterprise = Licencia(
        nombre="Empresarial BIM",
        codigo="ENTERPRISE-BIM",
        plan_kind="empresarial",
        limites={"usuarios": 100, "modulos_permitidos": ["*"]},
        activo=True,
    )
    standard = Licencia(
        nombre="Estándar sin módulo BIM",
        codigo="STANDARD-BIM",
        plan_kind="estandar",
        limites={"usuarios": 5, "modulos_permitidos": ["apus", "presupuestos"]},
        activo=True,
    )
    db.add_all([standard_company, enterprise, standard])
    db.flush()
    db.add_all(
        [
            EmpresaLicencia(
                empresa_id=sample_empresa.id,
                licencia_id=enterprise.id,
                starts_at=date.today() - timedelta(days=1),
                ends_at=date.today() + timedelta(days=30),
                status="active",
                activa=True,
            ),
            EmpresaLicencia(
                empresa_id=standard_company.id,
                licencia_id=standard.id,
                starts_at=date.today() - timedelta(days=1),
                ends_at=date.today() + timedelta(days=30),
                status="active",
                activa=True,
            ),
            SystemBimSetting(
                titulo="BIM comercial",
                descripcion="Rollout y licencia",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=f"{sample_empresa.id},{standard_company.id}",
            ),
        ]
    )
    db.commit()

    enterprise_access = resolve_bim_feature_access(
        db=db,
        user_id=10,
        company_id=sample_empresa.id,
        role="usuario",
    )
    standard_access = resolve_bim_feature_access(
        db=db,
        user_id=11,
        company_id=standard_company.id,
        role="administrador",
    )

    assert enterprise_access.enabled is True
    assert enterprise_access.commercial_entitled is True
    assert enterprise_access.commercial_entitlement_source == "license"
    assert standard_access.enabled is False
    assert standard_access.company_match is True
    assert standard_access.commercial_entitled is False


def test_bim_feature_flags_superadmin_only_database_gate(db, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    db.add(
        SystemBimSetting(
            titulo="BIM superadmin",
            descripcion="Configuracion de prueba",
            is_enabled=True,
            superadmin_only=True,
            allowed_company_ids=None,
        )
    )
    db.commit()

    superadmin_access = resolve_bim_feature_access(
        db=db,
        user_id=1,
        company_id=10,
        role="Superadministrador",
    )
    user_access = resolve_bim_feature_access(db=db, user_id=2, company_id=10, role="usuario")

    assert superadmin_access.enabled is True
    assert superadmin_access.resolved_role == "superadministrador"
    assert user_access.enabled is False


def test_bim_project_resolution_blocks_cross_company_for_regular_user(db, sample_empresa):
    other_company = Empresa(
        nombre="Empresa BIM Externa",
        ruc="9999999990001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()

    project = Proyecto(nombre="Proyecto BIM externo", empresa_id=other_company.id)
    user = Usuario(
        email="bim-user@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    db.add_all([project, user])
    db.commit()

    with pytest.raises(HTTPException) as exc_info:
        _resolve_project(db, project.id, user, empresa_id=other_company.id)

    assert exc_info.value.status_code == 404
    assert "contexto BIM" in exc_info.value.detail


def test_bim_project_resolution_allows_superadmin_declared_company(db, sample_empresa):
    other_company = Empresa(
        nombre="Empresa BIM Piloto",
        ruc="8888888880001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()

    own_project = Proyecto(nombre="Proyecto propio", empresa_id=sample_empresa.id)
    target_project = Proyecto(nombre="Proyecto BIM piloto", empresa_id=other_company.id)
    superadmin = Usuario(
        email="bim-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="Superadmin BIM",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    db.add_all([own_project, target_project, superadmin])
    db.commit()

    resolved = _resolve_project(db, target_project.id, superadmin, empresa_id=other_company.id)
    assert resolved.id == target_project.id
    assert resolved.empresa_id == other_company.id

    with pytest.raises(HTTPException):
        _resolve_project(db, target_project.id, superadmin, empresa_id=None)


def test_bim_feature_flag_endpoint_reports_disabled_context(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-endpoint-disabled@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Endpoint",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    db.add(user)
    db.add(
        SystemBimSetting(
            titulo="BIM apagado",
            descripcion="Configuracion de prueba",
            is_enabled=False,
            superadmin_only=False,
            allowed_company_ids=None,
        )
    )
    db.commit()
    db.refresh(user)

    response = _bim_test_client(db, user).get("/bim/feature-flags/me")

    assert response.status_code == 200
    payload = response.json()
    assert payload["feature"] == "bim"
    assert payload["enabled"] is False
    assert payload["environment_enabled"] is False
    assert payload["resolved_company_id"] == sample_empresa.id


def test_bim_workspace_endpoint_blocks_when_feature_disabled(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-workspace-disabled@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Workspace",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM bloqueado", empresa_id=sample_empresa.id)
    db.add_all([user, project])
    db.add(
        SystemBimSetting(
            titulo="BIM apagado",
            descripcion="Configuracion de prueba",
            is_enabled=False,
            superadmin_only=False,
            allowed_company_ids=None,
        )
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).get(f"/bim/projects/{project.id}/workspace")

    assert response.status_code == 403
    assert response.json()["detail"] == "La capa BIM no está habilitada para este contexto."


def test_bim_workspace_endpoint_returns_empty_ready_workspace_when_enabled(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-workspace-enabled@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Workspace",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM habilitado", empresa_id=sample_empresa.id)
    db.add_all([user, project])
    db.add(
        SystemBimSetting(
            titulo="BIM habilitado",
            descripcion="Configuracion de prueba",
            is_enabled=True,
            superadmin_only=False,
            allowed_company_ids=str(sample_empresa.id),
        )
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).get(f"/bim/projects/{project.id}/workspace")

    assert response.status_code == 200
    payload = response.json()
    assert payload["ready"] is True
    assert payload["tables_ready"] is True
    assert payload["project_id"] == project.id
    assert payload["company_id"] == sample_empresa.id
    assert payload["models"] == []


def test_bim_workspace_endpoint_preserves_tenant_boundary(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    other_company = Empresa(
        nombre="Empresa Endpoint Externa",
        ruc="7777777770001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()
    user = Usuario(
        email="bim-tenant-endpoint@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Tenant",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM ajeno", empresa_id=other_company.id)
    db.add_all([user, project])
    db.add(
        SystemBimSetting(
            titulo="BIM habilitado",
            descripcion="Configuracion de prueba",
            is_enabled=True,
            superadmin_only=False,
            allowed_company_ids=f"{sample_empresa.id},{other_company.id}",
        )
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).get(
        f"/bim/projects/{project.id}/workspace",
        params={"empresa_id": other_company.id},
    )

    assert response.status_code == 404
    assert "contexto BIM" in response.json()["detail"]


def test_bim_view_state_duplicate_blocks_company_scope_for_regular_user(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-view-state-user@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM View State",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM view state", empresa_id=sample_empresa.id)
    db.add_all([user, project])
    db.flush()
    view_state = BimViewState(
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
        usuario_id=user.id,
        nombre="Vista personal",
        scope="personal",
        payload={"storey_name": "Nivel 01"},
    )
    db.add_all(
        [
            view_state,
            SystemBimSetting(
                titulo="BIM habilitado view states",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    db.refresh(view_state)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/view-states/{view_state.id}/duplicate",
        json={"nombre": "Copia compartida bloqueada", "scope": "company"},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Solo superadministrador puede duplicar vistas BIM compartidas."
    assert db.query(BimViewState).filter(BimViewState.proyecto_id == project.id).count() == 1


def test_bim_view_state_rejects_unsupported_public_scope(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-view-state-scope@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Scope",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM scope", empresa_id=sample_empresa.id)
    db.add_all([user, project])
    db.flush()
    view_state = BimViewState(
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
        usuario_id=user.id,
        nombre="Vista base",
        scope="personal",
        payload={"storey_name": "Nivel 01"},
    )
    db.add_all(
        [
            view_state,
            SystemBimSetting(
                titulo="BIM scope habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    db.refresh(view_state)

    client = _bim_test_client(db, user)
    create_response = client.post(
        f"/bim/projects/{project.id}/view-states",
        json={"nombre": "Vista no soportada", "scope": "workspace_context", "storey_name": "Nivel 02"},
    )
    duplicate_response = client.post(
        f"/bim/projects/{project.id}/view-states/{view_state.id}/duplicate",
        json={"nombre": "Copia no soportada", "scope": "legacy"},
    )

    assert create_response.status_code == 400
    assert duplicate_response.status_code == 400
    assert create_response.json()["detail"] == "Scope BIM de vista no soportado."
    assert duplicate_response.json()["detail"] == "Scope BIM de vista no soportado."
    assert db.query(BimViewState).filter(BimViewState.proyecto_id == project.id).count() == 1


def test_bim_workspace_context_is_user_scoped(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    first_user = Usuario(
        email="bim-context-user-a@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Contexto A",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    second_user = Usuario(
        email="bim-context-user-b@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Contexto B",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM workspace context", empresa_id=sample_empresa.id)
    db.add_all(
        [
            first_user,
            second_user,
            project,
            SystemBimSetting(
                titulo="BIM workspace context",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(first_user)
    db.refresh(second_user)
    db.refresh(project)

    first_client = _bim_test_client(db, first_user)
    second_client = _bim_test_client(db, second_user)

    first_response = first_client.put(
        f"/bim/projects/{project.id}/workspace-context",
        json={"storey_name": "Nivel 01", "element_id": 101},
    )
    second_response = second_client.put(
        f"/bim/projects/{project.id}/workspace-context",
        json={"storey_name": "Nivel 02", "element_id": 202},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_response.json()["payload"]["storey_name"] == "Nivel 01"
    assert second_response.json()["payload"]["storey_name"] == "Nivel 02"

    first_read = first_client.get(f"/bim/projects/{project.id}/workspace-context")
    second_read = second_client.get(f"/bim/projects/{project.id}/workspace-context")

    assert first_read.status_code == 200
    assert second_read.status_code == 200
    assert first_read.json()["user_id"] == first_user.id
    assert second_read.json()["user_id"] == second_user.id
    assert first_read.json()["payload"]["element_id"] == 101
    assert second_read.json()["payload"]["element_id"] == 202
    assert (
        db.query(BimViewState)
        .filter(BimViewState.proyecto_id == project.id, BimViewState.scope == "workspace_context")
        .count()
        == 2
    )


def test_bim_workspace_context_blocks_when_feature_disabled(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", False)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-context-disabled@example.com",
        hashed_password="hash",
        nombre_completo="Usuario BIM Contexto Bloqueado",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM workspace context apagado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM workspace context apagado",
                descripcion="Configuracion de prueba",
                is_enabled=False,
                superadmin_only=False,
                allowed_company_ids=None,
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).put(
        f"/bim/projects/{project.id}/workspace-context",
        json={"storey_name": "Nivel bloqueado", "element_id": 303},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "La capa BIM no está habilitada para este contexto."
    assert db.query(BimViewState).filter(BimViewState.proyecto_id == project.id).count() == 0


def test_bim_json_import_creates_active_workspace_model(db, sample_empresa):
    project = Proyecto(nombre="Proyecto BIM import", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    payload = BimJsonImportRequest(
        model_name="Modelo estructural",
        discipline="Estructura",
        description="Paquete BIM de prueba",
        source_filename="modelo.json",
        version_label="v1",
        storeys=[BimImportStoreyPayload(nombre="Nivel 1", codigo="N1", orden=1)],
        elements=[
            BimImportElementPayload(
                global_id="GID-001",
                ifc_class="IfcWall",
                nombre="Muro A",
                storey_name="Nivel 1",
                properties={"material": "Hormigon"},
                geometry_2d={"x": 10, "y": 20, "width": 30, "height": 40},
            )
        ],
    )

    result = import_json_bim_package(db, project_id=project.id, company_id=sample_empresa.id, payload=payload)
    workspace = get_workspace_summary(db, project_id=project.id, company_id=sample_empresa.id)

    assert result.created_storeys == 1
    assert result.created_elements == 1
    assert result.activated is True
    assert workspace.ready is True
    assert workspace.active_version_id == result.version_id
    assert workspace.active_version_label == "v1"
    assert workspace.tree_nodes == [{"id": "storey-1", "label": "Nivel 1", "count": "N1"}]
    assert workspace.property_groups[0]["items"][2]["value"] == 1


def test_bim_json_batch_import_rolls_back_when_any_package_fails(db, sample_empresa, monkeypatch):
    project = Proyecto(nombre="Proyecto BIM batch rollback", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    project_id = project.id
    company_id = sample_empresa.id

    packages = [
        BimJsonImportRequest(
            model_name="Modelo batch A",
            version_label="v1",
            storeys=[BimImportStoreyPayload(nombre="Nivel 01")],
            elements=[
                BimImportElementPayload(
                    global_id="BATCH-A-001",
                    ifc_class="IfcWall",
                    nombre="Muro batch A",
                    storey_name="Nivel 01",
                )
            ],
        ),
        BimJsonImportRequest(
            model_name="Modelo batch B",
            version_label="v1",
            storeys=[BimImportStoreyPayload(nombre="Nivel 01")],
            elements=[
                BimImportElementPayload(
                    global_id="BATCH-B-001",
                    ifc_class="IfcSlab",
                    nombre="Losa batch B",
                    storey_name="Nivel 01",
                )
            ],
        ),
    ]

    original_stage = import_service._stage_json_bim_package
    call_count = {"value": 0}

    def fail_after_first_package(*args, **kwargs):
        call_count["value"] += 1
        if call_count["value"] == 2:
            raise RuntimeError("fallo controlado de batch BIM")
        return original_stage(*args, **kwargs)

    monkeypatch.setattr(import_service, "_stage_json_bim_package", fail_after_first_package)

    with pytest.raises(RuntimeError, match="fallo controlado"):
        import_json_bim_batch(db, project_id=project_id, company_id=company_id, packages=packages)

    assert (
        db.query(BimModel)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .count()
        == 0
    )


def test_bim_json_batch_rejects_duplicate_version_label_without_partial_import(db, sample_empresa):
    project = Proyecto(nombre="Proyecto BIM batch duplicado", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    project_id = project.id
    company_id = sample_empresa.id

    packages = [
        BimJsonImportRequest(
            model_name="Modelo batch duplicado",
            version_label="v1",
            storeys=[BimImportStoreyPayload(nombre="Nivel 01")],
            elements=[
                BimImportElementPayload(
                    global_id="BATCH-DUP-001",
                    ifc_class="IfcWall",
                    nombre="Muro batch duplicado A",
                    storey_name="Nivel 01",
                )
            ],
        ),
        BimJsonImportRequest(
            model_name="Modelo batch duplicado",
            version_label="v1",
            storeys=[BimImportStoreyPayload(nombre="Nivel 01")],
            elements=[
                BimImportElementPayload(
                    global_id="BATCH-DUP-002",
                    ifc_class="IfcSlab",
                    nombre="Losa batch duplicado B",
                    storey_name="Nivel 01",
                )
            ],
        ),
    ]

    with pytest.raises(ValueError, match="Ya existe una version BIM"):
        import_json_bim_batch(db, project_id=project_id, company_id=company_id, packages=packages)

    assert (
        db.query(BimModel)
        .filter(BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .count()
        == 0
    )


def test_bim_json_validation_reports_duplicate_global_ids_and_geometry():
    payload = BimJsonImportRequest(
        model_name="Modelo validacion",
        version_label="v1",
        storeys=[BimImportStoreyPayload(nombre="Nivel 1")],
        elements=[
            BimImportElementPayload(
                global_id="DUP-001",
                ifc_class="IfcWall",
                storey_name="Nivel 1",
                geometry_2d={"x": 0, "y": 0, "width": 10, "height": 10},
            ),
            BimImportElementPayload(
                global_id="DUP-001",
                ifc_class="IfcSlab",
                storey_name="Nivel 1",
                geometry_2d={"points": [{"x": 0, "y": 0}, {"x": 5, "y": 5}]},
            ),
        ],
    )

    summary = validate_json_bim_package(payload)

    issue_codes = {issue.code for issue in summary.issues}
    assert summary.element_count == 2
    assert summary.geometry_summary.rect_count == 1
    assert summary.geometry_summary.line_count == 1
    assert "duplicate_global_id" in issue_codes


def test_bim_json_package_endpoint_rejects_validation_errors(db, sample_empresa):
    user = Usuario(
        email="bim-import-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM Import Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM import bloqueado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM import habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/json-package",
        json={
            "model_name": "Modelo invalido",
            "version_label": "v1",
            "storeys": [{"nombre": "Nivel 1"}],
            "elements": [],
        },
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["total_errors"] == 1
    assert detail["results"][0]["issues"][0]["code"] == "no_elements"
    assert db.query(BimModel).filter(BimModel.proyecto_id == project.id).count() == 0


def test_bim_json_batch_endpoint_rejects_validation_errors_without_partial_import(db, sample_empresa):
    user = Usuario(
        email="bim-batch-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM Batch Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM batch bloqueado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM batch habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/json-batch",
        json={
            "packages": [
                {
                    "model_name": "Modelo valido",
                    "version_label": "v1",
                    "storeys": [{"nombre": "Nivel 1"}],
                    "elements": [{"global_id": "OK-001", "storey_name": "Nivel 1"}],
                },
                {
                    "model_name": "Modelo invalido",
                    "version_label": "v1",
                    "storeys": [{"nombre": "Nivel 1"}],
                    "elements": [],
                },
            ]
        },
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["total_errors"] == 1
    assert detail["results"][1]["issues"][0]["code"] == "no_elements"
    assert db.query(BimModel).filter(BimModel.proyecto_id == project.id).count() == 0


def test_bim_json_package_endpoint_rejects_duplicate_version_label(db, sample_empresa):
    user = Usuario(
        email="bim-json-duplicate-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM JSON Duplicate Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM JSON duplicado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM JSON duplicado habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    client = _bim_test_client(db, user)

    payload = {
        "model_name": "Modelo JSON duplicado",
        "discipline": "Coordinacion",
        "version_label": "json-v1",
        "source_filename": "modelo-json.json",
        "storeys": [{"nombre": "Nivel 1"}],
        "elements": [{"global_id": "JSON-DUP-001", "storey_name": "Nivel 1"}],
        "activate": True,
    }

    first_response = client.post(f"/bim/projects/{project.id}/imports/json-package", json=payload)
    second_response = client.post(f"/bim/projects/{project.id}/imports/json-package", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Ya existe una version BIM con esa etiqueta para este modelo."

    model = db.query(BimModel).filter(BimModel.proyecto_id == project.id).one()
    assert db.query(BimModelVersion).filter(BimModelVersion.bim_model_id == model.id).count() == 1


def test_bim_ifc_manifest_endpoint_registers_version_under_feature_flag(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-ifc-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC manifest", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC manifest habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-manifest",
        json={
            "model_name": "Modelo IFC registrado",
            "version_label": "ifc-v1",
            "source_filename": "modelo-coordinacion.ifc",
            "artifact_path": "bim/artifacts/modelo-coordinacion.ifc",
            "discipline": "Coordinacion",
            "checksum_sha256": "a" * 64,
            "file_size_bytes": 2048,
            "activate": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["model_name"] == "Modelo IFC registrado"
    assert payload["version_label"] == "ifc-v1"
    assert payload["status"] == "ifc_manifest_registered"
    assert payload["activated"] is True

    model = db.query(BimModel).filter(BimModel.proyecto_id == project.id).one()
    version = db.query(BimModelVersion).filter(BimModelVersion.bim_model_id == model.id).one()
    assert model.archivo_fuente == "modelo-coordinacion.ifc"
    assert version.source_filename == "modelo-coordinacion.ifc"
    assert version.artifact_path == "bim/artifacts/modelo-coordinacion.ifc"
    assert version.element_count == 0
    assert version.storey_count == 0
    assert "sha256=" in version.notes
    assert "size=2048" in version.notes


def test_bim_ifc_manifest_endpoint_rejects_non_ifc_artifact(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-ifc-invalid-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC Invalid Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC invalido", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC invalido habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-manifest",
        json={
            "model_name": "Modelo IFC invalido",
            "version_label": "ifc-v1",
            "source_filename": "modelo-coordinacion.json",
            "activate": True,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "El manifiesto BIM debe referenciar un archivo .ifc."
    assert db.query(BimModel).filter(BimModel.proyecto_id == project.id).count() == 0


def test_bim_ifc_manifest_endpoint_rejects_duplicate_version_label(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-ifc-duplicate-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC Duplicate Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC duplicado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC duplicado habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    client = _bim_test_client(db, user)

    payload = {
        "model_name": "Modelo IFC duplicado",
        "version_label": "ifc-v1",
        "source_filename": "modelo-duplicado.ifc",
        "activate": True,
    }

    first_response = client.post(f"/bim/projects/{project.id}/imports/ifc-manifest", json=payload)
    second_response = client.post(f"/bim/projects/{project.id}/imports/ifc-manifest", json=payload)

    assert first_response.status_code == 200
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Ya existe una version BIM con esa etiqueta para este modelo."

    model = db.query(BimModel).filter(BimModel.proyecto_id == project.id).one()
    assert db.query(BimModelVersion).filter(BimModelVersion.bim_model_id == model.id).count() == 1


def test_bim_ifc_text_parser_extracts_storeys_and_elements():
    ifc_text = """
ISO-10303-21;
DATA;
#10=IFCBUILDINGSTOREY('2MS7','$','Nivel 1',$,$,$,$,'Planta baja',.ELEMENT.,0.);
#20=IFCWALLSTANDARDCASE('3MS8',$,'Muro eje A','Muro estructural',$,$,$,$);
#21=IFCDOOR('4MS9',$,'Puerta acceso',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""

    parsed = parse_ifc_text_to_bim_package(
        ifc_text=ifc_text,
        model_name="Modelo IFC parser",
        version_label="ifc-parser-v1",
        source_filename="parser.ifc",
        discipline="Arquitectura",
    )

    assert parsed.summary.entity_count == 3
    assert parsed.summary.storey_count == 1
    assert parsed.summary.element_count == 2
    assert parsed.payload.storeys[0].nombre == "Nivel 1"
    assert {element.ifc_class for element in parsed.payload.elements} == {"IFCWALLSTANDARDCASE", "IFCDOOR"}
    assert parsed.payload.elements[0].properties["ifc_step_id"] == "#20"
    assert "ifc_semantic_parser=step_text_v1" in parsed.payload.notes


def test_bim_ifc_text_endpoint_imports_semantic_elements_under_feature_flag(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-ifc-text-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC Text Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC text", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC text habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-text",
        json={
            "model_name": "Modelo IFC semantico",
            "version_label": "ifc-text-v1",
            "source_filename": "modelo-semantico.ifc",
            "discipline": "Coordinacion",
            "activate": True,
            "ifc_text": """
ISO-10303-21;
DATA;
#10=IFCBUILDINGSTOREY('2MS7',$,'Nivel 1',$,$,$,$,'Planta baja',.ELEMENT.,0.);
#20=IFCWALL('3MS8',$,'Muro BIM','Muro importado',$,$,$,$);
#21=IFCWINDOW('4MS9',$,'Ventana BIM',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
""",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["created_storeys"] == 1
    assert payload["created_elements"] == 2
    assert payload["parsed_entity_count"] == 3
    assert payload["activated"] is True
    assert "IFCWALL" in payload["parsed_ifc_classes"]

    model = db.query(BimModel).filter(BimModel.proyecto_id == project.id).one()
    version = db.query(BimModelVersion).filter(BimModelVersion.bim_model_id == model.id).one()
    elements = db.query(BimElement).filter(BimElement.bim_model_version_id == version.id).all()

    assert version.status == "ready"
    assert version.element_count == 2
    assert version.storey_count == 1
    assert "sha256=" in version.notes
    assert {element.ifc_class for element in elements} == {"IFCWALL", "IFCWINDOW"}


def test_bim_ifc_text_endpoint_rejects_regular_user(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-ifc-text-user@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC Text User",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC text bloqueado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC text habilitado usuario",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-text",
        json={
            "model_name": "Modelo IFC usuario",
            "version_label": "ifc-text-v1",
            "source_filename": "modelo-usuario.ifc",
            "ifc_text": "#20=IFCWALL('3MS8',$,'Muro BIM',$,$,$,$,$);",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Solo superadministrador puede importar IFC BIM."
    assert db.query(BimModel).filter(BimModel.proyecto_id == project.id).count() == 0


def test_bim_ifc_file_endpoint_stores_and_imports_local_artifact(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")

    user = Usuario(
        email="bim-ifc-file-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC File Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC file", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC file habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    ifc_content = b"""
ISO-10303-21;
DATA;
#10=IFCBUILDINGSTOREY('FILE-ST01',$,'Nivel Archivo',$,$,$,$,'Nivel Archivo',.ELEMENT.,0.);
#20=IFCSLAB('FILE-SLAB01',$,'Losa archivo',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""
    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-file",
        data={
            "model_name": "Modelo IFC archivo",
            "version_label": "ifc-file-v1",
            "discipline": "Coordinacion",
            "activate": "true",
        },
        files={"file": ("modelo archivo.ifc", ifc_content, "application/octet-stream")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["created_storeys"] == 1
    assert payload["created_elements"] == 1
    assert payload["file_size_bytes"] == len(ifc_content)
    assert payload["artifact_path"].startswith(str(tmp_path / "bim-storage").replace("\\", "/"))

    artifact_path = tmp_path / "bim-storage" / str(sample_empresa.id) / str(project.id)
    assert artifact_path.exists()
    assert any(path.name.endswith(".ifc") for path in artifact_path.iterdir())

    version = db.query(BimModelVersion).filter(BimModelVersion.id == payload["version_id"]).one()
    assert version.artifact_path == payload["artifact_path"]
    assert version.source_filename == "modelo archivo.ifc"
    assert version.element_count == 1


def test_bim_ifc_file_endpoint_rejects_non_ifc_extension(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")

    user = Usuario(
        email="bim-ifc-file-invalid@example.com",
        hashed_password="hash",
        nombre_completo="BIM IFC File Invalid",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM IFC file invalido", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM IFC file invalido habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(
        f"/bim/projects/{project.id}/imports/ifc-file",
        data={"model_name": "Modelo invalido", "version_label": "ifc-file-v1"},
        files={"file": ("modelo.txt", b"#20=IFCWALL('A',$,'Muro',$,$,$,$,$);", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "El archivo BIM debe tener extension .ifc."
    assert db.query(BimModel).filter(BimModel.proyecto_id == project.id).count() == 0
    assert not (tmp_path / "bim-storage").exists()


def test_bim_viewer_artifact_endpoint_generates_indexed_artifact(db, sample_empresa, monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    monkeypatch.setattr(settings, "BIM_LOCAL_STORAGE_DIR", tmp_path / "bim-storage")

    user = Usuario(
        email="bim-artifact-superadmin@example.com",
        hashed_password="hash",
        nombre_completo="BIM Artifact Admin",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM artifact", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM artifact habilitado",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)
    client = _bim_test_client(db, user)

    import_response = client.post(
        f"/bim/projects/{project.id}/imports/ifc-text",
        json={
            "model_name": "Modelo Artifact",
            "version_label": "artifact-v1",
            "source_filename": "artifact.ifc",
            "activate": True,
            "ifc_text": """
ISO-10303-21;
DATA;
#10=IFCBUILDINGSTOREY('ART-ST01',$,'Nivel Artifact',$,$,$,$,'Nivel Artifact',.ELEMENT.,0.);
#20=IFCWALL('ART-W001',$,'Muro Artifact',$,$,$,$,$);
#30=IFCPROPERTYSINGLEVALUE('FireRating',$,IFCLABEL('RF-90'),$);
#40=IFCPROPERTYSET('ART-PSET01',$,'Pset_WallCommon',$,(#30));
#50=IFCRELDEFINESBYPROPERTIES('ART-REL-PSET',$,$,$,(#20),#40);
#60=IFCRELCONTAINEDINSPATIALSTRUCTURE('ART-REL-SPATIAL',$,$,$,(#20),#10);
ENDSEC;
END-ISO-10303-21;
""",
        },
    )
    version_id = import_response.json()["version_id"]

    artifact_response = client.post(f"/bim/projects/{project.id}/versions/{version_id}/artifacts/viewer")

    assert artifact_response.status_code == 200
    payload = artifact_response.json()
    assert payload["version_id"] == version_id
    assert payload["element_count"] == 1
    assert payload["storey_count"] == 1
    assert payload["ifc_class_count"] == 1
    assert payload["property_key_count"] == 3

    artifact_path = tmp_path / "bim-storage" / str(sample_empresa.id) / str(project.id) / "artifacts" / f"viewer-artifact-v{version_id}.json"
    assert artifact_path.exists()
    artifact_payload = json.loads(artifact_path.read_text(encoding="utf-8"))
    assert artifact_payload["artifact_type"] == "giproy_bim_viewer_artifact"
    assert artifact_payload["indexes"]["storeys"]["Nivel Artifact"] == [1]
    assert artifact_payload["indexes"]["ifc_classes"]["IFCWALL"] == [1]
    assert artifact_payload["indexes"]["properties"]["FireRating"] == [1]

    version = db.query(BimModelVersion).filter(BimModelVersion.id == version_id).one()
    assert "viewer_artifact_path=" in version.notes


def test_bim_viewer_artifact_endpoint_rejects_regular_user(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")

    user = Usuario(
        email="bim-artifact-user@example.com",
        hashed_password="hash",
        nombre_completo="BIM Artifact User",
        rol="usuario",
        empresa_id=sample_empresa.id,
    )
    project = Proyecto(nombre="Proyecto BIM artifact bloqueado", empresa_id=sample_empresa.id)
    db.add_all(
        [
            user,
            project,
            SystemBimSetting(
                titulo="BIM artifact habilitado usuario",
                descripcion="Configuracion de prueba",
                is_enabled=True,
                superadmin_only=False,
                allowed_company_ids=str(sample_empresa.id),
            ),
        ]
    )
    db.commit()
    db.refresh(user)
    db.refresh(project)

    response = _bim_test_client(db, user).post(f"/bim/projects/{project.id}/versions/999/artifacts/viewer")

    assert response.status_code == 403
    assert response.json()["detail"] == "Solo superadministrador puede generar artefactos BIM."


def test_bim_edt_link_creation_is_idempotent_and_listed(db, sample_empresa):
    project = Proyecto(nombre="Proyecto BIM link EDT", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo arquitectura",
            version_label="v1",
            storeys=[BimImportStoreyPayload(nombre="Nivel 1")],
            elements=[BimImportElementPayload(global_id="LINK-EDT-001", nombre="Elemento EDT")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-EDT-001").one()
    edt = EdtNode(
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
        codigo="1.1",
        nombre="Cimentacion",
        orden=1,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    payload = BimLinkCreateRequest(
        bim_element_id=element.id,
        target_type="edt",
        target_id=edt.id,
        notes="Vinculo de prueba",
    )
    first_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    second_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    links = list_links_for_project(db, project_id=project.id, company_id=sample_empresa.id)

    assert first_link.id == second_link.id
    assert first_link.target_type == "edt"
    assert first_link.target_label == "1.1 - Cimentacion"
    assert len(links) == 1
    assert links[0].bim_element_global_id == "LINK-EDT-001"


def test_bim_edt_link_creation_blocks_cross_project_targets(db, sample_empresa):
    other_company = Empresa(
        nombre="Empresa BIM Link Externa",
        ruc="6666666660001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()
    project = Proyecto(nombre="Proyecto BIM link", empresa_id=sample_empresa.id)
    other_project = Proyecto(nombre="Proyecto BIM ajeno", empresa_id=other_company.id)
    db.add_all([project, other_project])
    db.commit()
    db.refresh(project)
    db.refresh(other_project)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo instalaciones",
            version_label="v1",
            elements=[BimImportElementPayload(global_id="LINK-EDT-002", nombre="Elemento ajeno")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-EDT-002").one()
    foreign_edt = EdtNode(
        proyecto_id=other_project.id,
        empresa_id=other_company.id,
        codigo="9.9",
        nombre="Nodo externo",
        orden=1,
    )
    db.add(foreign_edt)
    db.commit()
    db.refresh(foreign_edt)

    with pytest.raises(HTTPException) as exc_info:
        create_link_for_project(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=1,
            payload=BimLinkCreateRequest(
                bim_element_id=element.id,
                target_type="edt",
                target_id=foreign_edt.id,
            ),
        )

    assert exc_info.value.status_code == 404
    assert "Nodo EDT" in exc_info.value.detail


def test_bim_apu_link_creation_is_idempotent_and_company_scoped(db, sample_empresa):
    project = Proyecto(nombre="Proyecto BIM link APU", empresa_id=sample_empresa.id)
    base = BaseTrabajo(
        codigo_unico="BASE-BIM-APU",
        nombre="Base BIM APU",
        empresa_id=sample_empresa.id,
    )
    db.add_all([project, base])
    db.commit()
    db.refresh(project)
    db.refresh(base)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo APU",
            version_label="v1",
            elements=[BimImportElementPayload(global_id="LINK-APU-001", nombre="Elemento APU")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-APU-001").one()
    apu = APU(
        codigo="APU-BIM-001",
        descripcion="APU BIM",
        descripcion_normalizada="apu bim",
        unidad="u",
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(apu)
    db.commit()
    db.refresh(apu)

    payload = BimLinkCreateRequest(
        bim_element_id=element.id,
        target_type="apu",
        target_id=apu.id,
        notes="Vinculo APU",
    )
    first_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    second_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    links = list_links_for_project(db, project_id=project.id, company_id=sample_empresa.id)

    assert first_link.id == second_link.id
    assert first_link.target_type == "apu"
    assert first_link.target_label == "APU-BIM-001 - APU BIM"
    assert len(links) == 1
    assert links[0].target_id == apu.id


def test_bim_apu_link_creation_blocks_other_company_target(db, sample_empresa):
    other_company = Empresa(
        nombre="Empresa BIM APU Externa",
        ruc="6655665560001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()
    project = Proyecto(nombre="Proyecto BIM link APU bloqueado", empresa_id=sample_empresa.id)
    other_base = BaseTrabajo(
        codigo_unico="BASE-BIM-APU-EXT",
        nombre="Base BIM APU externa",
        empresa_id=other_company.id,
    )
    db.add_all([project, other_base])
    db.commit()
    db.refresh(project)
    db.refresh(other_base)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo APU bloqueado",
            version_label="v1",
            elements=[BimImportElementPayload(global_id="LINK-APU-002", nombre="Elemento APU bloqueado")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-APU-002").one()
    foreign_apu = APU(
        codigo="APU-EXT-001",
        descripcion="APU externo",
        descripcion_normalizada="apu externo",
        unidad="u",
        empresa_id=other_company.id,
        base_trabajo_id=other_base.id,
    )
    db.add(foreign_apu)
    db.commit()
    db.refresh(foreign_apu)

    with pytest.raises(HTTPException) as exc_info:
        create_link_for_project(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=1,
            payload=BimLinkCreateRequest(
                bim_element_id=element.id,
                target_type="apu",
                target_id=foreign_apu.id,
            ),
        )

    assert exc_info.value.status_code == 404
    assert "APU" in exc_info.value.detail


def test_bim_presupuesto_link_creation_is_idempotent_and_project_scoped(db, sample_empresa):
    project = Proyecto(nombre="Proyecto BIM link Presupuesto", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo Presupuesto",
            version_label="v1",
            elements=[BimImportElementPayload(global_id="LINK-PRES-001", nombre="Elemento Presupuesto")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-PRES-001").one()
    edt = EdtNode(
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
        codigo="2.1",
        nombre="Estructura",
        orden=1,
    )
    presupuesto = Presupuesto(
        codigo="P-BIM-001",
        descripcion="Presupuesto BIM",
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
    )
    db.add_all([edt, presupuesto])
    db.commit()
    db.refresh(edt)
    db.refresh(presupuesto)
    line = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        edt_id=edt.id,
        codigo_item="2.1.001",
        descripcion="Rubro BIM",
        unidad="u",
    )
    db.add(line)
    db.commit()
    db.refresh(line)

    payload = BimLinkCreateRequest(
        bim_element_id=element.id,
        target_type="presupuesto",
        target_id=line.id,
        notes="Vinculo presupuesto",
    )
    first_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    second_link = create_link_for_project(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=1,
        payload=payload,
    )
    links = list_links_for_project(db, project_id=project.id, company_id=sample_empresa.id)

    assert first_link.id == second_link.id
    assert first_link.target_type == "presupuesto"
    assert first_link.target_label == "2.1.001 - Rubro BIM"
    assert len(links) == 1
    assert links[0].target_id == line.id


def test_bim_presupuesto_link_creation_blocks_other_project_target(db, sample_empresa):
    other_company = Empresa(
        nombre="Empresa BIM Presupuesto Externa",
        ruc="6644664460001",
        proy_prefijo="BIM",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(other_company)
    db.flush()
    project = Proyecto(nombre="Proyecto BIM link Presupuesto bloqueado", empresa_id=sample_empresa.id)
    other_project = Proyecto(nombre="Proyecto presupuesto externo", empresa_id=other_company.id)
    db.add_all([project, other_project])
    db.commit()
    db.refresh(project)
    db.refresh(other_project)

    import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo Presupuesto bloqueado",
            version_label="v1",
            elements=[BimImportElementPayload(global_id="LINK-PRES-002", nombre="Elemento Presupuesto bloqueado")],
        ),
    )
    element = db.query(BimElement).filter(BimElement.global_id == "LINK-PRES-002").one()
    foreign_edt = EdtNode(
        proyecto_id=other_project.id,
        empresa_id=other_company.id,
        codigo="8.1",
        nombre="Capitulo externo",
        orden=1,
    )
    foreign_budget = Presupuesto(
        codigo="P-EXT-001",
        descripcion="Presupuesto externo",
        proyecto_id=other_project.id,
        empresa_id=other_company.id,
    )
    db.add_all([foreign_edt, foreign_budget])
    db.commit()
    db.refresh(foreign_edt)
    db.refresh(foreign_budget)
    foreign_line = PresupuestoDetalle(
        presupuesto_id=foreign_budget.id,
        edt_id=foreign_edt.id,
        codigo_item="8.1.001",
        descripcion="Rubro externo",
        unidad="u",
    )
    db.add(foreign_line)
    db.commit()
    db.refresh(foreign_line)

    with pytest.raises(HTTPException) as exc_info:
        create_link_for_project(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=1,
            payload=BimLinkCreateRequest(
                bim_element_id=element.id,
                target_type="presupuesto",
                target_id=foreign_line.id,
            ),
        )

    assert exc_info.value.status_code == 404
    assert "presupuesto" in exc_info.value.detail.lower()
