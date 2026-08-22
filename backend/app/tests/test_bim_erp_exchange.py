from datetime import date, datetime, timezone

import pytest
from fastapi import HTTPException

from app.main import app
from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dProgressSnapshot
from app.models.bim_4d_resources import Bim4dCrew, Bim4dTimecard
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_erp_exchange import BimErpExchangeCreate, BimErpExchangeTransition
from app.services.bim.erp_exchange_service import create_erp_exchange_package, get_published_erp_exchange_content, list_erp_exchange_packages, transition_erp_exchange_package


def test_bim_erp_exchange_endpoints_are_registered():
    routes = {(path, method.upper()) for path, operations in app.openapi()["paths"].items() for method in operations}
    base = "/api/v1/bim/projects/{project_id}/erp-exchange/packages"
    assert (base, "GET") in routes
    assert (base, "POST") in routes
    assert (f"{base}/{{package_id}}/transition", "POST") in routes
    assert (f"{base}/{{package_id}}/content", "GET") in routes


def _context(db, company_id):
    project = Proyecto(nombre="ERP bridge BIM", codigo_root="ERP-001", revision=6, empresa_id=company_id)
    user = Usuario(email="erp.bridge.bim@example.com", hashed_password="test", nombre_completo="ERP Bridge", rol="usuario", empresa_id=company_id)
    db.add_all([project, user]); db.flush()
    activity = Bim4dActivitySnapshot(
        empresa_id=company_id, proyecto_id=project.id, source_kind="giproy_classic_schedule",
        source_ref="classic-line-42", snapshot_revision="R6", activity_code="A-100",
        activity_name="Cimentación", planned_start=datetime(2026, 7, 1, tzinfo=timezone.utc),
        planned_finish=datetime(2026, 7, 30, tzinfo=timezone.utc), captured_by=user.id,
    )
    crew = Bim4dCrew(empresa_id=company_id, proyecto_id=project.id, code="CREW-01", name="Civil", trade="Estructura", member_count=8, active=True, note="Cuadrilla validada", created_by=user.id)
    db.add_all([activity, crew]); db.flush()
    db.add(Bim4dProgressSnapshot(empresa_id=company_id, proyecto_id=project.id, activity_snapshot_id=activity.id, progress_percent=42, reported_by=user.id, reported_at=datetime(2026, 7, 20, 12, tzinfo=timezone.utc)))
    db.add(Bim4dTimecard(empresa_id=company_id, proyecto_id=project.id, crew_id=crew.id, activity_snapshot_id=activity.id, work_area_id=None, work_date=date(2026, 7, 20), regular_hours=8, overtime_hours=2, installed_quantity=12, installed_unit="m3", note="Hormigón", created_by=user.id))
    db.commit()
    return project, user


def test_bim_erp_exchange_is_deterministic_publishable_and_tenant_scoped(db, sample_empresa):
    project, user = _context(db, sample_empresa.id)
    request = BimErpExchangeCreate(cutoff_at=datetime(2026, 7, 20, 23, 59, tzinfo=timezone.utc), justification="Corte contractual de avance y horas.")
    first = create_erp_exchange_package(db, project=project, company_id=sample_empresa.id, user_id=user.id, payload=request)
    second = create_erp_exchange_package(db, project=project, company_id=sample_empresa.id, user_id=user.id, payload=request)
    assert first.checksum_sha256 == second.checksum_sha256
    assert second.activity_count == 1 and second.timecard_count == 1
    assert second.regular_hours == 8 and second.overtime_hours == 2
    published = transition_erp_exchange_package(db, package_id=second.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeTransition(action="publish", reason="Paquete aprobado para consumo ERP.", expected_lock_version=1))
    assert published.status == "published" and published.lock_version == 2
    content = get_published_erp_exchange_content(db, package_id=second.id, project_id=project.id, company_id=sample_empresa.id)
    assert content.payload["progress"][0]["source_ref"] == "classic-line-42"
    assert content.payload["timecards"][0]["crew_code"] == "CREW-01"
    assert list_erp_exchange_packages(db, project_id=project.id, company_id=sample_empresa.id)[0].revision == 2
    with pytest.raises(HTTPException) as cross_tenant:
        get_published_erp_exchange_content(db, package_id=second.id, project_id=project.id, company_id=sample_empresa.id + 999)
    assert cross_tenant.value.status_code == 404


def test_bim_erp_exchange_rejects_stale_transition(db, sample_empresa):
    project, user = _context(db, sample_empresa.id)
    value = create_erp_exchange_package(db, project=project, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeCreate(cutoff_at=datetime(2026, 7, 20, 23, 59, tzinfo=timezone.utc), justification="Corte contractual de avance y horas."))
    with pytest.raises(HTTPException) as stale:
        transition_erp_exchange_package(db, package_id=value.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeTransition(action="publish", reason="Versión obsoleta rechazada.", expected_lock_version=2))
    assert stale.value.status_code == 409
