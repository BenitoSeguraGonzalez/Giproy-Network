from datetime import datetime, timezone

from app.schemas.bim_schedule_interop import BimScheduleInterchangeDocument
from app.services.bim.schedule_interop_service import preflight_schedule_interchange
from app.api.endpoints.bim_models import router as bim_router


def _document(**overrides):
    payload = {
        "source_format": "canonical_json",
        "source_filename": "schedule.json",
        "source_checksum_sha256": "a" * 64,
        "project_external_id": "P-001",
        "project_name": "Proyecto interoperable",
        "timezone": "America/Bogota",
        "currency": "USD",
        "data_date": datetime(2026, 7, 13, tzinfo=timezone.utc),
        "calendars": [{"id": "CAL-1", "name": "Laboral", "timezone": "America/Bogota"}],
        "wbs": [{"id": "WBS-1", "code": "1", "name": "Obra"}],
        "activities": [
            {
                "id": "A-1",
                "code": "A-1",
                "name": "Inicio",
                "activity_type": "start_milestone",
                "wbs_id": "WBS-1",
                "calendar_id": "CAL-1",
                "planned_start": "2026-07-14T08:00:00-05:00",
                "planned_finish": "2026-07-14T08:00:00-05:00",
                "duration_hours": 0,
            },
            {
                "id": "A-2",
                "code": "A-2",
                "name": "Ejecucion",
                "wbs_id": "WBS-1",
                "calendar_id": "CAL-1",
                "planned_start": "2026-07-14T08:00:00-05:00",
                "planned_finish": "2026-07-18T17:00:00-05:00",
                "duration_hours": 40,
            },
        ],
        "dependencies": [{"predecessor_id": "A-1", "successor_id": "A-2", "dependency_type": "FS"}],
        "resources": [{"id": "R-1", "code": "R-1", "name": "Cuadrilla", "resource_type": "labor"}],
        "assignments": [{"activity_id": "A-2", "resource_id": "R-1", "planned_work_hours": 40}],
        "baselines": [{"id": "BL-1", "name": "Contractual", "captured_at": "2026-07-13T12:00:00Z", "activity_ids": ["A-1", "A-2"]}],
    }
    payload.update(overrides)
    return BimScheduleInterchangeDocument.model_validate(payload)


def test_preflight_accepts_complete_canonical_schedule():
    result = preflight_schedule_interchange(_document())
    assert result["valid"] is True
    assert result["counts"] == {
        "calendars": 1,
        "wbs": 1,
        "activities": 2,
        "dependencies": 1,
        "resources": 1,
        "assignments": 1,
        "baselines": 1,
        "errors": 0,
        "warnings": 0,
    }
    assert len(result["normalized_checksum_sha256"]) == 64


def test_preflight_reports_cross_reference_cycle_and_loss_without_writing():
    document = _document(
        dependencies=[
            {"predecessor_id": "A-1", "successor_id": "A-2"},
            {"predecessor_id": "A-2", "successor_id": "A-1"},
        ],
        assignments=[{"activity_id": "A-2", "resource_id": "R-MISSING"}],
        unsupported_source_fields=["RiskAnalysis", "NotebookTopic"],
    )
    result = preflight_schedule_interchange(document)
    assert result["valid"] is False
    assert {issue["code"] for issue in result["errors"]} == {
        "dependency_cycle",
        "missing_assignment_resource",
    }
    assert [issue["code"] for issue in result["warnings"]] == [
        "unsupported_source_field",
        "unsupported_source_field",
    ]


def test_preflight_checksum_is_deterministic():
    first = preflight_schedule_interchange(_document())
    second = preflight_schedule_interchange(_document())
    assert first["normalized_checksum_sha256"] == second["normalized_checksum_sha256"]


def test_preflight_endpoint_is_registered_only_inside_bim_router():
    route = next(
        item
        for item in bim_router.routes
        if item.path == "/projects/{project_id}/4d/schedule-interchange/preflight"
    )
    assert route.methods == {"POST"}
    assert route.response_model.__name__ == "BimSchedulePreflightResponse"
