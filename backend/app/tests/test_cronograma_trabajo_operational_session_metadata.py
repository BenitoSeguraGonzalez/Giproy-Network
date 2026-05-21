from datetime import datetime

from app.services.cronograma_trabajo import cronograma_trabajo_service


def test_resolve_line_override_normalizes_operational_session_metadata():
    override = cronograma_trabajo_service._resolve_line_override({
        "start_date": "2026-04-15T08:00:00",
        "end_date": "2026-04-20T17:00:00",
        "duration": 0,
        "metadata": {
            "session_state": "accepted_session",
            "subbars": [
                {
                    "periodId": "2026-04",
                    "startDate": "2026-04-15T08:00:00",
                    "endDate": "2026-04-18T17:00:00",
                    "percent": 12,
                    "amount": 1500,
                }
            ],
            "manualTemporalWindow": {
                "startDate": "2026-04-15T08:00:00",
                "endDate": "2026-04-20T17:00:00",
                "duration_days": 5,
            },
        },
    })

    metadata = override.metadata
    assert metadata["gantt_session"]["status"] == "accepted_session"
    assert metadata["gantt_session"]["created_from_session"] is None
    assert metadata["gantt_subbars"][0]["id"] == "line-unbound-period-2026-04-segment-1"
    assert metadata["gantt_subbars"][0]["budget_line_id"] is None
    assert metadata["gantt_subbars"][0]["period_id"] == "2026-04"
    assert metadata["gantt_subbars"][0]["status"] == "draft_session"
    assert metadata["manual_temporal_window"]["source"] == "manual_temporal_material_only"
    assert "session_state" not in metadata
    assert "subbars" not in metadata
    assert "manualTemporalWindow" not in metadata


def test_shift_line_overrides_moves_manual_window_and_subbars_with_project_anchor():
    shifted = cronograma_trabajo_service._shift_line_overrides_for_project_start_delta(
        {
            "12": {
                "start_date": "2026-04-15T08:00:00",
                "end_date": "2026-04-20T17:00:00",
                "metadata": {
                    "gantt_session": {"status": "draft_session"},
                    "gantt_subbars": [
                        {
                            "id": "seg-1",
                            "period_id": "2026-04",
                            "starts_at": "2026-04-15T08:00:00",
                            "ends_at": "2026-04-17T17:00:00",
                            "percent": 6,
                            "amount": 800,
                            "status": "accepted_session",
                        }
                    ],
                    "manual_temporal_window": {
                        "starts_at": "2026-04-15T08:00:00",
                        "ends_at": "2026-04-20T17:00:00",
                        "duration_days": 5,
                        "duration_hours": 40,
                    },
                },
            }
        },
        old_anchor=datetime(2026, 4, 1, 8, 0, 0),
        new_anchor=datetime(2026, 4, 3, 8, 0, 0),
    )

    payload = shifted["12"]
    metadata = payload["metadata"]
    assert payload["start_date"] == "2026-04-17T08:00:00"
    assert payload["end_date"] == "2026-04-22T17:00:00"
    assert metadata["manual_temporal_window"]["starts_at"] == "2026-04-17T08:00:00"
    assert metadata["manual_temporal_window"]["ends_at"] == "2026-04-22T17:00:00"
    assert metadata["gantt_subbars"][0]["starts_at"] == "2026-04-17T08:00:00"
    assert metadata["gantt_subbars"][0]["ends_at"] == "2026-04-19T17:00:00"
    assert metadata["gantt_session"]["status"] == "draft_session"


def test_build_gantt_operational_summary_exposes_ready_to_render_signals():
    summary = cronograma_trabajo_service._build_gantt_operational_summary(
        "12",
        {
            "gantt_session": {
                "status": "accepted_session",
                "created_from_session": "session-2026-04-15",
            },
            "gantt_subbars": [
                {
                    "id": "seg-1",
                    "period_id": "2026-04",
                    "status": "accepted_session",
                    "percent": 6,
                    "amount": 800,
                },
                {
                    "id": "seg-2",
                    "period_id": "2026-05",
                    "status": "confirmed_against_budget",
                    "percent": 4,
                    "amount": 500,
                },
            ],
            "manual_temporal_window": {
                "starts_at": "2026-04-15T08:00:00",
                "ends_at": "2026-04-20T17:00:00",
                "duration_days": 5,
                "duration_hours": 40,
                "source": "manual_temporal_material_only",
            },
        },
    )

    assert summary["budget_line_id"] == "12"
    assert summary["session_status"] == "accepted_session"
    assert summary["has_subbars"] is True
    assert summary["subbar_count"] == 2
    assert summary["accepted_subbar_count"] == 2
    assert summary["confirmed_subbar_count"] == 1
    assert summary["has_manual_temporal_window"] is True
    assert summary["manual_temporal_source"] == "manual_temporal_material_only"
    assert summary["manual_temporal_duration_days"] == 5.0
    assert summary["manual_temporal_duration_hours"] == 40.0


def test_normalize_operational_metadata_preserves_session_reconciliation_fields():
    metadata = cronograma_trabajo_service._normalize_operational_metadata(
        "44",
        {
            "gantt_session": {
                "status": "confirmed_against_budget",
                "session_id": "session-qa-44",
                "accepted_at": "2026-04-15T10:00:00",
                "confirmed_against_budget_at": "2026-04-15T10:30:00",
                "conflict_code": "conflict_valued_period_cap",
            },
            "gantt_subbars": [],
        },
    )

    assert metadata["gantt_session"]["status"] == "confirmed_against_budget"
    assert metadata["gantt_session"]["created_from_session"] == "session-qa-44"
    assert metadata["gantt_session"]["accepted_at"] == "2026-04-15T10:00:00"
    assert metadata["gantt_session"]["confirmed_against_budget_at"] == "2026-04-15T10:30:00"
    assert metadata["gantt_session"]["conflict_code"] == "conflict_valued_period_cap"
