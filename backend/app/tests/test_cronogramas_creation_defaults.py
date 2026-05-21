from types import SimpleNamespace
from unittest.mock import Mock

from app.api.endpoints.cronogramas import _get_or_create_cronograma


def test_get_or_create_cronograma_creates_gantt_defaults():
    db = Mock()
    db.query.return_value.filter.return_value.first.return_value = None
    refreshed = []
    db.refresh.side_effect = lambda instance: refreshed.append(instance)

    presupuesto = SimpleNamespace(
        id=13,
        empresa_id=3,
        proyecto_id=7,
    )

    cronograma = _get_or_create_cronograma(db, presupuesto)

    assert cronograma.presupuesto_id == 13
    assert cronograma.proyecto_id == 7
    assert cronograma.empresa_id == 3
    assert cronograma.period_type == "mensual"
    assert cronograma.distribution_mode == "gantt"
    assert cronograma.global_distribution == []
    assert cronograma.line_distribution_overrides == {}
    db.add.assert_called_once_with(cronograma)
    db.commit.assert_called_once()
    assert refreshed == [cronograma]
