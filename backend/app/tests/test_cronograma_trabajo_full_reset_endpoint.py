from types import SimpleNamespace
from unittest.mock import Mock

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app


def test_full_reset_endpoint_restores_creation_defaults(monkeypatch):
    db = Mock()
    current_user = SimpleNamespace(id=7, rol="administrador")
    proyecto = SimpleNamespace(id=20, empresa_id=30)
    presupuesto = SimpleNamespace(
        id=10,
        proyecto_id=20,
        empresa_id=30,
        proyecto=proyecto,
    )
    cronograma = SimpleNamespace(
        period_type="quincenal",
        distribution_mode="gantt",
        global_distribution=[20.0, 80.0],
        line_distribution_overrides={"15": [100.0, 0.0]},
    )
    schedule = SimpleNamespace(schedule_data={"15": {"duration": 4}})
    factory_reset_schedule = {
        "__config__": {},
        "15": {
            "metadata": {
                "gantt_subbars": [
                    {
                        "id": "factory-reset-segment-15",
                        "source": "factory_reset_seed",
                        "percent": 100.0,
                    }
                ]
            }
        },
    }
    updated_cronograma = {
        "presupuesto_id": 10,
        "proyecto_id": 20,
        "empresa_id": 30,
        "presupuesto_descripcion": "Presupuesto QA",
        "moneda": "USD",
        "dec_moneda": 2,
        "dec_calculos": 4,
        "period_type": "mensual",
        "distribution_mode": "gantt",
        "periods": [],
        "global_distribution": [100.0],
        "rows": [],
        "footer": {
            "inversion_parcial": [],
            "avance_parcial_pct": [],
            "inversion_acumulada": [],
            "avance_acumulado_pct": [],
        },
        "curve_s": [],
        "cash_flow": [],
        "has_line_overrides": False,
        "updated_at": None,
    }
    updated_trabajo = {
        "id": 1,
        "presupuesto_id": 10,
        "proyecto_id": 20,
        "empresa_id": 30,
        "config": {
            "hora_inicio_jornada": 8.0,
            "jornada_laboral_horas": 8.0,
            "dias_laborables_semana": 5,
            "dias_laborables_mes": 22.0,
            "dias_mes": 30.0,
            "recursos_asumidos_base": 1.0,
            "fecha_inicio_proyecto": None,
        },
        "schedule_data": {},
        "rows": [],
        "summary": {
            "presupuesto_descripcion": None,
            "total_actividades": 0,
            "total_duracion_dias": 0.0,
            "total_trabajo_horas": 0.0,
            "fecha_inicio": None,
            "fecha_fin": None,
        },
        "export_capabilities": {
            "preferred_format": "xml",
            "available_formats": ["xml"],
            "direct_mpp_available": False,
            "direct_export_reason": None,
            "template_name": None,
        },
        "holiday_calendar": None,
        "fecha_inicio": None,
        "fecha_fin": None,
        "updated_at": None,
    }
    reset_calendar_calls = []

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._resolve_budget",
        lambda *args, **kwargs: presupuesto,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._verify_module_access",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._get_or_create_cronograma",
        lambda *args, **kwargs: cronograma,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service._ensure_schedule",
        lambda *args, **kwargs: schedule,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.build_factory_reset_schedule_data",
        lambda *args, **kwargs: factory_reset_schedule,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._serialize_cronograma",
        lambda *args, **kwargs: updated_cronograma,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.get_schedule",
        lambda *args, **kwargs: updated_trabajo,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.project_calendar_service.reset_project_calendar",
        lambda *args, **kwargs: reset_calendar_calls.append(kwargs.get("proyecto")),
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.record_audit_event",
        lambda *args, **kwargs: None,
    )

    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/cronogramas-trabajo/10/reset-integral")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert cronograma.period_type == "mensual"
    assert cronograma.distribution_mode == "gantt"
    assert cronograma.global_distribution == []
    assert cronograma.line_distribution_overrides == {}
    assert schedule.schedule_data == factory_reset_schedule
    assert reset_calendar_calls == [proyecto]
    body = response.json()
    assert body["cronograma"]["distribution_mode"] == "gantt"
    assert body["trabajo"]["schedule_data"] == {}


def test_full_reset_endpoint_requires_admin_role(monkeypatch):
    db = Mock()
    current_user = SimpleNamespace(id=8, rol="usuario")

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._resolve_budget",
        lambda *args, **kwargs: None,
    )

    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/cronogramas-trabajo/10/reset-integral")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "resetear el cronograma" in response.json()["detail"]
