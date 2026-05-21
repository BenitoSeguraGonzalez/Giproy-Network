from datetime import datetime
from types import SimpleNamespace

from app.services.cronograma_trabajo import cronograma_trabajo_service


class _FakeQuery:
    def __init__(self, result):
        self._result = result

    def options(self, *args, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result


class _FakeDB:
    def __init__(self, results):
        self._results = list(results)
        self._cursor = 0

    def query(self, *args, **kwargs):
        result = self._results[self._cursor]
        self._cursor += 1
        return _FakeQuery(result)


def test_seed_contracts_keep_same_functional_shape_but_distinct_traceability(
    monkeypatch,
):
    presupuesto = SimpleNamespace(
        detalle=[SimpleNamespace(id=15, apu_id=501, precio_total=42.75)]
    )
    proyecto = SimpleNamespace(id=7, empresa_id=3)
    row = SimpleNamespace(
        presupuesto_linea_id="15",
        start_date=datetime(2026, 4, 21, 8, 0, 0),
        end_date=datetime(2026, 4, 23, 12, 0, 0),
    )
    fake_db = _FakeDB([presupuesto, proyecto])

    monkeypatch.setattr(
        "app.services.cronograma_trabajo.project_calendar_service.get_snapshot_calendar",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_estimate_calendar_window",
        lambda *args, **kwargs: (
            datetime(2026, 4, 1).date(),
            datetime(2026, 4, 30).date(),
        ),
    )
    monkeypatch.setattr(
        cronograma_trabajo_service,
        "_build_rows",
        lambda *args, **kwargs: ([row], SimpleNamespace()),
    )

    initial = cronograma_trabajo_service.build_initial_creation_schedule_data(
        fake_db,
        presupuesto_id=13,
        proyecto_id=7,
        empresa_id=3,
    )

    fake_db = _FakeDB([presupuesto, proyecto])
    reset = cronograma_trabajo_service.build_factory_reset_schedule_data(
        fake_db,
        presupuesto_id=13,
        proyecto_id=7,
        empresa_id=3,
    )

    initial_subbar = initial["15"]["metadata"]["gantt_subbars"][0]
    reset_subbar = reset["15"]["metadata"]["gantt_subbars"][0]

    assert initial_subbar["starts_at"] == reset_subbar["starts_at"]
    assert initial_subbar["ends_at"] == reset_subbar["ends_at"]
    assert initial_subbar["amount"] == reset_subbar["amount"] == 42.75
    assert initial_subbar["parent_initial_id"] == "initial-creation-line-15"
    assert reset_subbar["parent_initial_id"] == "factory-reset-line-15"
    assert (
        initial["15"]["metadata"]["gantt_session"]["created_from_session"]
        == "initial_creation"
    )
    assert (
        reset["15"]["metadata"]["gantt_session"]["created_from_session"]
        == "factory_reset"
    )
