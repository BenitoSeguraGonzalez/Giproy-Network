from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.license_event import LicenseEvent
from app.models.usuario import Usuario


def _create_license_assignment(db, empresa_id: int, *, conecta_base_slots: int) -> Licencia:
    licencia = Licencia(
        nombre=f"Conecta Endpoint {empresa_id}-{conecta_base_slots}",
        codigo=f"CONEND_{empresa_id}_{conecta_base_slots}",
        descripcion="Licencia focal para endpoints Conecta.",
        plan_kind="estandar",
        limites={
            "usuarios": 5,
            "administradores": 1,
            "usuarios_normales": 4,
            "modulos_permitidos": ["apus", "presupuestos"],
            "conecta_base_slots": conecta_base_slots,
            "excel_exports": True,
        },
        activo=True,
    )
    db.add(licencia)
    db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa_id,
            licencia_id=licencia.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.commit()
    return licencia


def _create_user(db, empresa_id: int, email: str, rol: str = "usuario") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email.split("@")[0],
        rol=rol,
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _create_company(db, name: str) -> Empresa:
    empresa = Empresa(
        nombre=name,
        ruc=f"999{len(name)}",
        proy_prefijo="TST",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


def _client(db, current_user):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def test_conecta_limits_endpoint_uses_active_company(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=2)
    current_user = _create_user(db, sample_empresa.id, "conecta-limits@giproy.test")

    try:
        with _client(db, current_user) as client:
            response = client.get("/api/v1/conecta/limits")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["empresa_id"] == sample_empresa.id
    assert response.json()["total_slots"] == 2


def test_conecta_create_and_list_slots_endpoint(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    current_user = _create_user(db, sample_empresa.id, "conecta-owner@giproy.test")

    try:
        with _client(db, current_user) as client:
            create_response = client.post(
                "/api/v1/conecta/slots",
                json={"invited_email": "externo@giproy.test"},
            )
            list_response = client.get("/api/v1/conecta/slots")
    finally:
        app.dependency_overrides.clear()

    assert create_response.status_code == 200
    assert create_response.json()["owner_user_id"] == current_user.id
    assert create_response.json()["invited_email"] == "externo@giproy.test"
    assert "proyecto_id" not in create_response.json()
    assert "edt_id" not in create_response.json()
    assert list_response.status_code == 200
    assert list_response.json()["limits"]["used_slots"] == 1
    assert len(list_response.json()["items"]) == 1


def test_conecta_release_endpoint_blocks_early_reassignment(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    current_user = _create_user(db, sample_empresa.id, "conecta-locked@giproy.test")

    try:
        with _client(db, current_user) as client:
            create_response = client.post(
                "/api/v1/conecta/slots",
                json={"invited_email": "locked@giproy.test"},
            )
            slot_id = create_response.json()["id"]
            release_response = client.post(f"/api/v1/conecta/slots/{slot_id}/release", json={})
    finally:
        app.dependency_overrides.clear()

    assert release_response.status_code == 403
    assert release_response.json()["detail"]["code"] == "conecta_reassignment_locked"


def test_conecta_release_endpoint_allows_superadmin_force_with_audit(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    owner = _create_user(db, sample_empresa.id, "conecta-force-owner@giproy.test")
    superadmin = _create_user(db, sample_empresa.id, "conecta-force-super@giproy.test", rol="superadministrador")

    try:
        with _client(db, owner) as client:
            create_response = client.post(
                "/api/v1/conecta/slots",
                json={"invited_email": "force@giproy.test"},
            )
            slot_id = create_response.json()["id"]
        app.dependency_overrides.clear()

        with _client(db, superadmin) as client:
            release_response = client.post(
                f"/api/v1/conecta/slots/{slot_id}/release",
                json={
                    "empresa_id": sample_empresa.id,
                    "force": True,
                    "reason": "Correccion comercial aprobada.",
                },
            )
    finally:
        app.dependency_overrides.clear()

    event = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_id == sample_empresa.id,
            LicenseEvent.event_type == "saas_conecta_slot_released",
        )
        .one()
    )

    assert release_response.status_code == 200
    assert release_response.json()["status"] == "released"
    assert release_response.json()["forced_by_user_id"] == superadmin.id
    assert event.payload["forced"] is True


def test_conecta_endpoint_rejects_cross_company_for_non_superadmin(db, sample_empresa):
    other_empresa = _create_company(db, "Empresa Conecta Externa")
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    _create_license_assignment(db, other_empresa.id, conecta_base_slots=1)
    current_user = _create_user(db, sample_empresa.id, "conecta-tenant@giproy.test")

    try:
        with _client(db, current_user) as client:
            response = client.get(f"/api/v1/conecta/limits?empresa_id={other_empresa.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["empresa_id"] == sample_empresa.id


def test_conecta_admin_summary_reports_slots_and_events(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=2)
    owner = _create_user(db, sample_empresa.id, "conecta-summary-owner@giproy.test")
    superadmin = _create_user(db, sample_empresa.id, "conecta-summary-super@giproy.test", rol="superadministrador")

    try:
        with _client(db, owner) as client:
            create_response = client.post(
                "/api/v1/conecta/slots",
                json={"invited_email": "summary@giproy.test"},
            )
            slot_id = create_response.json()["id"]
        app.dependency_overrides.clear()

        with _client(db, superadmin) as client:
            release_response = client.post(
                f"/api/v1/conecta/slots/{slot_id}/release",
                json={
                    "empresa_id": sample_empresa.id,
                    "force": True,
                    "reason": "Resumen KPI focal.",
                },
            )
            summary_response = client.get("/api/v1/conecta/admin/summary")
    finally:
        app.dependency_overrides.clear()

    assert release_response.status_code == 200
    assert summary_response.status_code == 200
    payload = summary_response.json()
    company = next(item for item in payload["companies"] if item["empresa_id"] == sample_empresa.id)
    assert payload["totals"]["companies"] >= 1
    assert payload["events"]["assigned"] >= 1
    assert payload["events"]["released"] >= 1
    assert company["total_slots"] == 2
    assert company["used_slots"] == 0
    assert company["released_slots"] == 1
    assert company["forced_releases"] == 1


def test_conecta_admin_summary_requires_superadmin(db, sample_empresa):
    _create_license_assignment(db, sample_empresa.id, conecta_base_slots=1)
    current_user = _create_user(db, sample_empresa.id, "conecta-summary-user@giproy.test")

    try:
        with _client(db, current_user) as client:
            response = client.get("/api/v1/conecta/admin/summary")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
