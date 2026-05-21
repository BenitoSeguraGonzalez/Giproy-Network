from unittest.mock import Mock, patch

from app.api.endpoints.cronogramas import _serialize_cronograma
from app.schemas.cronograma import CronogramaPeriodo


def test_serialize_cronograma_rolls_back_when_gantt_fails():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = Mock(plazo_ejecucion=180)

    presupuesto = Mock()
    presupuesto.id = 13
    presupuesto.proyecto_id = 7
    presupuesto.empresa_id = 3
    presupuesto.descripcion = "Presupuesto QA"
    presupuesto.moneda = "USD"
    presupuesto.dec_moneda = 2
    presupuesto.dec_calculos = 4
    presupuesto.detalle = []
    presupuesto.proyecto = Mock(codigo_root="ROOT", codigo="ROOT")

    cronograma = Mock()
    cronograma.period_type = "mensual"
    cronograma.distribution_mode = "homogeneo"
    cronograma.global_distribution = []
    cronograma.line_distribution_overrides = {}
    cronograma.updated_at = None

    mock_period = CronogramaPeriodo(
        id="P1",
        label="P1",
        starts_at="2026-03-24T08:00:00",
        ends_at="2026-03-31T17:00:00",
    )

    with patch(
        "app.api.endpoints.cronogramas.cronograma_trabajo_service.get_schedule",
        side_effect=RuntimeError("gantt broken"),
    ), patch(
        "app.api.endpoints.cronogramas._normalize_execution_window",
        return_value=(Mock(), Mock()),
    ), patch(
        "app.api.endpoints.cronogramas._build_periods",
        return_value=[mock_period],
    ), patch(
        "app.api.endpoints.cronogramas._build_homogeneous_distribution",
        return_value=[100.0],
    ), patch(
        "app.api.endpoints.cronogramas._build_cash_flow_with_resource_categories",
        return_value=[],
    ):
        response = _serialize_cronograma(db, presupuesto, cronograma)

    assert response.presupuesto_id == 13
    db.rollback.assert_called()
