from types import SimpleNamespace

from app.api.endpoints import proyecto_detalles


class FakeSession:
    def __init__(self):
        self.added = []
        self.commits = 0
        self.refreshed = []

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.commits += 1

    def refresh(self, value):
        self.refreshed.append(value)


class FakeExecutor:
    def __init__(self):
        self.calls = []

    def submit(self, function, *args):
        self.calls.append((function, args))


def test_stale_georef_map_is_queued_without_rendering_in_request(monkeypatch):
    detail = SimpleNamespace(
        id=17,
        georef_map_status="failed",
        georef_map_signature="old",
        georef_map_error="network",
    )
    db = FakeSession()
    executor = FakeExecutor()

    monkeypatch.setattr(
        proyecto_detalles.reporting_service,
        "_build_project_georef_signature",
        lambda value: "new-signature",
    )
    monkeypatch.setattr(
        proyecto_detalles.reporting_service,
        "_get_project_cached_georef_map_bytes",
        lambda value: None,
    )
    monkeypatch.setattr(proyecto_detalles, "_GEOREF_MAP_EXECUTOR", executor)

    proyecto_detalles._queue_project_georef_map_refresh(db, detail, 3)

    assert detail.georef_map_status == "pending"
    assert detail.georef_map_signature == "new-signature"
    assert detail.georef_map_error is None
    assert db.commits == 1
    assert executor.calls == [
        (proyecto_detalles._refresh_project_georef_map_cache_background, (17, 3))
    ]


def test_pending_georef_map_is_not_queued_twice(monkeypatch):
    detail = SimpleNamespace(
        id=17,
        georef_map_status="pending",
        georef_map_signature="same-signature",
        georef_map_error=None,
    )
    db = FakeSession()
    executor = FakeExecutor()

    monkeypatch.setattr(
        proyecto_detalles.reporting_service,
        "_build_project_georef_signature",
        lambda value: "same-signature",
    )
    monkeypatch.setattr(
        proyecto_detalles.reporting_service,
        "_get_project_cached_georef_map_bytes",
        lambda value: None,
    )
    monkeypatch.setattr(proyecto_detalles, "_GEOREF_MAP_EXECUTOR", executor)

    proyecto_detalles._queue_project_georef_map_refresh(db, detail, 3)

    assert db.commits == 0
    assert executor.calls == []
