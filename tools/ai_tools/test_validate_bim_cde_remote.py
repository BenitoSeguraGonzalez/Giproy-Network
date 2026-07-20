from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from threading import Lock

import pytest


SCRIPT = Path(__file__).with_name("validate_bim_cde_remote.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_cde_remote", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


class FakeCdeBackend:
    def __init__(self) -> None:
        self.now = 0.0
        self.next_presence_id = 1
        self.next_event_id = 1
        self.presence_rows = {}
        self.event_rows = []
        self.lock = Lock()

    def client(self):
        backend = self

        class Client:
            def heartbeat(self, project_id, session_key, workspace, context):
                with backend.lock:
                    row = backend.presence_rows.get(session_key)
                    if row is None:
                        row = {"id": backend.next_presence_id, "session_key": session_key}
                        backend.next_presence_id += 1
                        backend.presence_rows[session_key] = row
                        backend._event("presence.joined")
                    elif row["workspace"] != workspace or row["context"] != context:
                        backend._event("presence.context_changed")
                    row.update(project_id=project_id, workspace=workspace, context=context, last_seen=backend.now)
                    return dict(row)

            def presences(self, project_id):
                with backend.lock:
                    return [dict(row) for row in backend.presence_rows.values() if row["project_id"] == project_id and row["last_seen"] >= backend.now - 45]

            def events(self, project_id, after_id):
                with backend.lock:
                    rows = [dict(row) for row in backend.event_rows if row["id"] > after_id]
                    page = rows[:100]
                    return {
                        "cursor": page[-1]["id"] if page else after_id,
                        "events": page,
                        "has_more": len(rows) > len(page),
                    }

            def metrics(self, project_id):
                active = self.presences(project_id)
                return {"collaboration": {"presence_active": len(active), "latest_cursor": backend.next_event_id - 1}}

            def leave(self, project_id, session_key):
                with backend.lock:
                    backend.presence_rows.pop(session_key, None)

        return Client()

    def _event(self, event_type):
        self.event_rows.append({"id": self.next_event_id, "event_type": event_type})
        self.next_event_id += 1

    def sleep(self, seconds):
        self.now += seconds


def test_remote_probe_covers_expiry_reconnection_cursor_metrics_and_cleanup():
    backend = FakeCdeBackend()
    report = MODULE.run_probe(
        backend.client(),
        backend.client(),
        project_id=7,
        expiry_wait_seconds=50,
        sleep_fn=backend.sleep,
        session_prefix="test",
    )
    assert report.initial_sessions == 2
    assert report.expired_sessions == 1
    assert report.reconnected_sessions == 2
    assert report.delta_events == 1
    assert report.metrics_active == 2
    assert backend.presence_rows == {}


@pytest.mark.parametrize(
    "base_url",
    (
        "http://giproy.example.test",
        "giproy.example.test",
        "https://user:secret@giproy.example.test",
    ),
)
def test_http_client_rejects_insecure_or_credentialed_base_urls(base_url):
    with pytest.raises(ValueError):
        MODULE.HttpCdeClient(base_url=base_url, token="test-token", company_id=1, timeout=1)


def test_http_client_declares_certification_user_agent():
    captured = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def read(self):
            return json.dumps([]).encode("utf-8")

    class Opener:
        def open(self, request, timeout):
            captured["user_agent"] = request.get_header("User-agent")
            captured["timeout"] = timeout
            return Response()

    client = MODULE.HttpCdeClient(
        base_url="https://giproy.example.test",
        token="test-token",
        company_id=1,
        timeout=7,
    )
    client.opener = Opener()

    assert client.presences(22) == []
    assert captured == {
        "user_agent": "GiProy-BIM-CDE-Certification/1.0",
        "timeout": 7,
    }


def test_remote_burst_probe_drains_205_events_in_bounded_pages():
    backend = FakeCdeBackend()
    ticks = iter(index / 1000 for index in range(1000))

    report = MODULE.run_burst_probe(
        backend.client(),
        project_id=7,
        event_count=205,
        session_prefix="burst-test",
        clock_fn=lambda: next(ticks),
    )

    assert report.event_count == 205
    assert report.page_sizes == (100, 100, 5)
    assert report.heartbeat_p95_ms == pytest.approx(1)
    assert backend.presence_rows == {}
