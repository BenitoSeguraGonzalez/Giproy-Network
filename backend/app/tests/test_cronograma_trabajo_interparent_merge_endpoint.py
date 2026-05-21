from datetime import datetime
from types import SimpleNamespace
from unittest.mock import Mock

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.schemas.cronograma import (
    CronogramaFooter,
    CronogramaLineaValorada,
    CronogramaPeriodo,
    CronogramaValoradoResponse,
)
from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoConfig,
    CronogramaTrabajoExportCapabilities,
    CronogramaTrabajoResponse,
    CronogramaTrabajoSummary,
)


def _build_valorado_response():
    period_1 = CronogramaPeriodo(
        id="P1",
        label="Abr 2026",
        starts_at=datetime.fromisoformat("2026-04-10T08:00:00"),
        ends_at=datetime.fromisoformat("2026-04-30T17:00:00"),
    )
    period_2 = CronogramaPeriodo(
        id="P2",
        label="May 2026",
        starts_at=datetime.fromisoformat("2026-05-01T08:00:00"),
        ends_at=datetime.fromisoformat("2026-05-31T17:00:00"),
    )
    row = CronogramaLineaValorada(
        linea_id=123,
        codigo_item="1.1.1",
        apu_id=99,
        descripcion="Replanteo y nivelacion",
        precio_total=1000.0,
        distribution=[40.0, 60.0],
    )
    return CronogramaValoradoResponse(
        presupuesto_id=10,
        proyecto_id=20,
        empresa_id=30,
        presupuesto_descripcion="Presupuesto QA",
        period_type="mensual",
        distribution_mode="gantt",
        periods=[period_1, period_2],
        global_distribution=[50.0, 50.0],
        rows=[row],
        footer=CronogramaFooter(),
        curve_s=[],
        cash_flow=[],
    )


def _build_valorado_response_with_distribution(distribution):
    valuado = _build_valorado_response()
    valuado.rows[0].distribution = list(distribution)
    return valuado


def _build_trabajo_response():
    return CronogramaTrabajoResponse(
        id=1,
        presupuesto_id=10,
        proyecto_id=20,
        empresa_id=30,
        config=CronogramaTrabajoConfig(),
        schedule_data={},
        rows=[],
        summary=CronogramaTrabajoSummary(),
        export_capabilities=CronogramaTrabajoExportCapabilities(),
    )


def test_merge_interparent_endpoint_accepts_valid_parent_contract(monkeypatch):
    db = Mock()
    current_user = SimpleNamespace(id=1, rol="administrador")
    presupuesto = SimpleNamespace(id=10, proyecto_id=20, empresa_id=30)
    cronograma = SimpleNamespace(line_distribution_overrides={})
    valuado = _build_valorado_response()
    updated_valuado = _build_valorado_response()
    updated_valuado.rows[0].distribution = [0.0, 100.0]
    trabajo = _build_trabajo_response()

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
    serialize_call_count = {"value": 0}

    def _serialize(*args, **kwargs):
        serialize_call_count["value"] += 1
        return valuado if serialize_call_count["value"] == 1 else updated_valuado

    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._serialize_cronograma",
        _serialize,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service._derive_initial_valued_segments",
        lambda *args, **kwargs: {
            "123": [
                {
                    "parent_initial_id": "valuado-initial-123-P1",
                    "percent": 40.0,
                },
                {
                    "parent_initial_id": "valuado-initial-123-P2",
                    "percent": 60.0,
                },
            ]
        },
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.persist_interparent_merge_schedule_data",
        lambda *args, **kwargs: trabajo,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.record_audit_event",
        lambda *args, **kwargs: None,
    )

    payload = {
        "linea_id": 123,
        "source_parent_initial_id": "valuado-initial-123-P1",
        "target_parent_initial_id": "valuado-initial-123-P2",
        "source_period_id": "P1",
        "target_period_id": "P2",
        "percent_to_move": 40.0,
        "merged_subbars": [
            {
                "id": "seg-1",
                "period_id": "P2",
                "parent_initial_id": "valuado-initial-123-P2",
                "starts_at": "2026-05-01T08:00:00",
                "ends_at": "2026-05-31T17:00:00",
                "percent": 100.0,
                "amount": 1000.0,
                "status": "draft_session",
                "source": "gantt_interparent_merge",
            }
        ],
    }

    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/cronogramas-trabajo/10/merge-interparent-subbars",
                json=payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["cronograma"]["rows"][0]["distribution"] == [0.0, 100.0]
    assert body["trabajo"]["presupuesto_id"] == 10


def test_merge_interparent_endpoint_rejects_parent_contract_drift(monkeypatch):
    db = Mock()
    current_user = SimpleNamespace(id=1, rol="administrador")
    presupuesto = SimpleNamespace(id=10, proyecto_id=20, empresa_id=30)
    cronograma = SimpleNamespace(line_distribution_overrides={})
    valuado = _build_valorado_response()

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
        "app.api.endpoints.cronogramas_trabajo._serialize_cronograma",
        lambda *args, **kwargs: valuado,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service._derive_initial_valued_segments",
        lambda *args, **kwargs: {
            "123": [
                {
                    "parent_initial_id": "valuado-initial-123-P1",
                    "percent": 40.0,
                },
                {
                    "parent_initial_id": "valuado-initial-123-P2",
                    "percent": 60.0,
                },
            ]
        },
    )

    payload = {
        "linea_id": 123,
        "source_parent_initial_id": "valuado-initial-123-P1",
        "target_parent_initial_id": "valuado-initial-123-P2",
        "source_period_id": "P1",
        "target_period_id": "P2",
        "percent_to_move": 40.0,
        "merged_subbars": [
            {
                "id": "seg-1",
                "period_id": "P2",
                "parent_initial_id": "valuado-initial-123-P2",
                "starts_at": "2026-05-01T08:00:00",
                "ends_at": "2026-05-31T17:00:00",
                "percent": 90.0,
                "amount": 900.0,
                "status": "draft_session",
                "source": "gantt_interparent_merge",
            }
        ],
    }

    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/cronogramas-trabajo/10/merge-interparent-subbars",
                json=payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    assert "mandato del tramo inicial" in response.json()["detail"]


def test_merge_interparent_endpoint_supports_sequential_merges_same_line(monkeypatch):
    db = Mock()
    current_user = SimpleNamespace(id=1, rol="administrador")
    presupuesto = SimpleNamespace(id=10, proyecto_id=20, empresa_id=30)
    cronograma = SimpleNamespace(line_distribution_overrides={})
    trabajo = _build_trabajo_response()

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

    def _current_distribution():
        return list(cronograma.line_distribution_overrides.get("123") or [40.0, 60.0])

    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo._serialize_cronograma",
        lambda *args, **kwargs: _build_valorado_response_with_distribution(_current_distribution()),
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service._derive_initial_valued_segments",
        lambda *args, **kwargs: {
            "123": [
                {
                    "parent_initial_id": "valuado-initial-123-P1",
                    "percent": _current_distribution()[0],
                },
                {
                    "parent_initial_id": "valuado-initial-123-P2",
                    "percent": _current_distribution()[1],
                },
            ]
        },
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.cronograma_trabajo_service.persist_interparent_merge_schedule_data",
        lambda *args, **kwargs: trabajo,
    )
    monkeypatch.setattr(
        "app.api.endpoints.cronogramas_trabajo.record_audit_event",
        lambda *args, **kwargs: None,
    )

    first_payload = {
        "linea_id": 123,
        "source_parent_initial_id": "valuado-initial-123-P1",
        "target_parent_initial_id": "valuado-initial-123-P2",
        "source_period_id": "P1",
        "target_period_id": "P2",
        "percent_to_move": 40.0,
        "merged_subbars": [
            {
                "id": "seg-first",
                "period_id": "P2",
                "parent_initial_id": "valuado-initial-123-P2",
                "starts_at": "2026-05-01T08:00:00",
                "ends_at": "2026-05-31T17:00:00",
                "percent": 100.0,
                "amount": 1000.0,
                "status": "draft_session",
                "source": "gantt_interparent_merge",
            }
        ],
    }

    second_payload = {
        "linea_id": 123,
        "source_parent_initial_id": "valuado-initial-123-P2",
        "target_parent_initial_id": "valuado-initial-123-P1",
        "source_period_id": "P2",
        "target_period_id": "P1",
        "percent_to_move": 25.0,
        "merged_subbars": [
            {
                "id": "seg-second-a",
                "period_id": "P1",
                "parent_initial_id": "valuado-initial-123-P1",
                "starts_at": "2026-04-10T08:00:00",
                "ends_at": "2026-04-20T17:00:00",
                "percent": 25.0,
                "amount": 250.0,
                "status": "draft_session",
                "source": "gantt_interparent_merge",
            },
            {
                "id": "seg-second-b",
                "period_id": "P2",
                "parent_initial_id": "valuado-initial-123-P2",
                "starts_at": "2026-05-01T08:00:00",
                "ends_at": "2026-05-31T17:00:00",
                "percent": 75.0,
                "amount": 750.0,
                "status": "draft_session",
                "source": "gantt_interparent_merge",
            },
        ],
    }

    try:
        with TestClient(app) as client:
            first_response = client.post(
                "/api/v1/cronogramas-trabajo/10/merge-interparent-subbars",
                json=first_payload,
            )
            second_response = client.post(
                "/api/v1/cronogramas-trabajo/10/merge-interparent-subbars",
                json=second_payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert first_response.status_code == 200
    assert first_response.json()["cronograma"]["rows"][0]["distribution"] == [0.0, 100.0]
    assert second_response.status_code == 200
    assert second_response.json()["cronograma"]["rows"][0]["distribution"] == [25.0, 75.0]
