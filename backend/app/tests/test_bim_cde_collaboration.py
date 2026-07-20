from datetime import datetime, timedelta, timezone

from app.main import app
from app.models.bim_cde_collaboration import BimCdeCollaborationPresence
from app.schemas.bim_cde_collaboration import BimCdePresenceHeartbeat
from app.services.bim.cde_collaboration_service import (
    heartbeat_presence,
    leave_presence,
    list_active_presences,
    list_collaboration_events,
)
from app.tests.test_bim_cde_reviews import _context, _create


def test_bim_cde_collaboration_endpoints_are_registered():
    routes = {(route.path, method) for route in app.routes for method in getattr(route, "methods", set())}
    base = "/api/v1/bim/projects/{project_id}/cde/collaboration"
    assert (f"{base}/presence/heartbeat", "POST") in routes
    assert (f"{base}/presence/leave", "POST") in routes
    assert (f"{base}/presences", "GET") in routes
    assert (f"{base}/events", "GET") in routes


def test_presence_is_idempotent_incremental_and_tenant_scoped(db, sample_empresa):
    project, creator, _assignee, _outsider, _revision = _context(db, sample_empresa)
    first = heartbeat_presence(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=creator.id,
        payload=BimCdePresenceHeartbeat(session_key="session-alpha", workspace="coordination", context={"tool": "reviews"}),
    )
    assert first["current_user"] and first["workspace"] == "coordination"
    first_feed = list_collaboration_events(db, project_id=project.id, company_id=sample_empresa.id, after_id=0, limit=20)
    assert [event["event_type"] for event in first_feed["events"]] == ["presence.joined"]

    heartbeat_presence(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=creator.id,
        payload=BimCdePresenceHeartbeat(session_key="session-alpha", workspace="coordination", context={"tool": "reviews"}),
    )
    assert len(list_collaboration_events(db, project_id=project.id, company_id=sample_empresa.id, after_id=0, limit=20)["events"]) == 1

    heartbeat_presence(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=creator.id,
        payload=BimCdePresenceHeartbeat(session_key="session-alpha", workspace="viewer", context={"global_id": "GUID-001"}),
    )
    delta = list_collaboration_events(db, project_id=project.id, company_id=sample_empresa.id, after_id=first_feed["cursor"], limit=20)
    assert [event["event_type"] for event in delta["events"]] == ["presence.context_changed"]
    assert list_active_presences(db, project_id=project.id, company_id=sample_empresa.id, current_user_id=creator.id)[0]["context"]["global_id"] == "GUID-001"
    assert list_active_presences(db, project_id=project.id, company_id=sample_empresa.id + 99, current_user_id=creator.id) == []

    assert leave_presence(db, project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, session_key="session-alpha")
    assert list_active_presences(db, project_id=project.id, company_id=sample_empresa.id, current_user_id=creator.id) == []


def test_review_activity_is_emitted_in_same_cde_domain(db, sample_empresa):
    project, creator, assignee, _outsider, revision = _context(db, sample_empresa)
    review = _create(db, project, sample_empresa, creator, assignee, revision)
    feed = list_collaboration_events(db, project_id=project.id, company_id=sample_empresa.id, after_id=0, limit=20)
    event = feed["events"][-1]
    assert event["event_type"] == "review.created"
    assert event["entity_id"] == review["id"]
    assert event["actor_name"] == creator.nombre_completo


def test_expired_presence_reconnects_without_duplicate_join(db, sample_empresa):
    project, creator, _assignee, _outsider, _revision = _context(db, sample_empresa)
    payload = BimCdePresenceHeartbeat(
        session_key="session-reconnect",
        workspace="coordination",
        context={"tool": "reviews"},
    )
    heartbeat_presence(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=creator.id,
        payload=payload,
    )
    presence = db.query(BimCdeCollaborationPresence).filter_by(session_key="session-reconnect").one()
    presence.last_seen_at = datetime.now(timezone.utc) - timedelta(minutes=2)
    db.commit()

    assert list_active_presences(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        current_user_id=creator.id,
    ) == []
    heartbeat_presence(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=creator.id,
        payload=payload,
    )

    active = list_active_presences(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        current_user_id=creator.id,
    )
    feed = list_collaboration_events(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        after_id=0,
        limit=20,
    )
    assert len(active) == 1
    assert [event["event_type"] for event in feed["events"]].count("presence.joined") == 1
