import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from app.services.cronograma_trabajo import cronograma_trabajo_service
from app.models.presupuesto import Presupuesto
from app.schemas.cronograma_trabajo import CronogramaTrabajoSummary
from sqlalchemy.orm import Session


@pytest.fixture
def mock_db():
    db = Mock(spec=Session)
    mock_presupuesto = Mock()
    mock_presupuesto.detalle = []
    db.query.return_value.filter.return_value.first.return_value = mock_presupuesto
    return db


@pytest.fixture
def mock_presupuesto():
    presupuesto = Mock()
    presupuesto.detalle = []
    return presupuesto


def test_derive_initial_valued_segments(mock_db, mock_presupuesto):
    """TASK-1082: deriva tramos iniciales reales desde el cronograma valorado."""
    mock_period_1 = Mock(id="P1", label="Abr 2026", starts_at="2026-04-10T08:00:00", ends_at="2026-04-30T17:00:00")
    mock_period_2 = Mock(id="P2", label="May 2026", starts_at="2026-05-01T08:00:00", ends_at="2026-05-31T17:00:00")
    mock_presupuesto.proyecto = Mock(codigo_root="ROOT", codigo="ROOT")
    mock_presupuesto.empresa_id = 1
    mock_presupuesto.detalle = [
        Mock(
            id=123,
            apu_id=77,
            precio_total=1000.0,
            descripcion="Replanteo y nivelación",
            orden=1,
        )
    ]
    mock_cronograma = Mock(
        period_type="mensual",
        distribution_mode="homogeneo",
        global_distribution=[],
        line_distribution_overrides={"123": [40.0, 60.0]},
    )
    mock_project_detail = Mock(plazo_ejecucion=60)
    mock_db.query.return_value.filter.return_value.first.return_value = mock_project_detail

    with patch("app.services.cronograma_trabajo.presupuesto_repo.get", return_value=mock_presupuesto), \
         patch("app.api.endpoints.cronogramas._get_or_create_cronograma", return_value=mock_cronograma), \
         patch("app.api.endpoints.cronogramas._normalize_execution_window", return_value=(Mock(), Mock())), \
         patch("app.api.endpoints.cronogramas._build_periods", return_value=[mock_period_1, mock_period_2]), \
         patch("app.api.endpoints.cronogramas._build_homogeneous_distribution", return_value=[50.0, 50.0]), \
         patch("app.api.endpoints.cronogramas._validate_distribution", side_effect=lambda distribution, *_args, **_kwargs: distribution):
        segments = cronograma_trabajo_service._derive_initial_valued_segments(mock_db, 1, 1)

    assert "123" in segments
    assert len(segments["123"]) == 2
    assert segments["123"][0]["parent_initial_id"] == "valuado-initial-123-P1"
    assert segments["123"][0]["amount"] == 400.0
    assert segments["123"][0]["status"] == "confirmed_against_budget"
    assert segments["123"][1]["amount"] == 600.0
    assert segments["123"][1]["metadata"]["label"] == "May 2026"
    assert segments["123"][0]["metadata"]["temporal_source"] == "line_override"


def test_derive_initial_valued_segments_rolls_back_failed_session(mock_db, mock_presupuesto):
    mock_presupuesto.proyecto = Mock(codigo_root="ROOT", codigo="ROOT")
    mock_presupuesto.empresa_id = 1

    with patch("app.services.cronograma_trabajo.presupuesto_repo.get", return_value=mock_presupuesto), \
         patch("app.api.endpoints.cronogramas._get_or_create_cronograma", side_effect=RuntimeError("db broken")):
        segments = cronograma_trabajo_service._derive_initial_valued_segments(mock_db, 1, 1)

    assert segments == {}
    mock_db.rollback.assert_called()


def test_normalize_gantt_subbar_parent_initial():
    """Verify parent_initial_id prioritization TASK-1079."""
    raw_subbar = {
        "parent_initial_id": "SB123",
        "parent_period_id": "P456",
        "period_id": "P789",
    }
    normalized = cronograma_trabajo_service._normalize_gantt_subbar(
        budget_line_id="line-1", raw_value=raw_subbar, index=0
    )
    assert normalized["parent_initial_id"] == "SB123"


def test_persist_interparent_merge_schedule_data_preserves_operational_metadata(mock_db):
    """TASK-1081: persistir borrador operativo tras fusión interpadre."""
    mock_schedule = Mock()
    mock_schedule.schedule_data = {
        "__config__": {},
        "123": {
            "metadata": {
                "manual_temporal_window": {
                    "starts_at": "2026-04-01T08:00:00",
                    "ends_at": "2026-04-03T17:00:00",
                    "source": "manual_temporal_material_only",
                }
            }
        },
    }
    merged_subbars = [
        {
            "id": "seg-1",
            "period_id": "P1",
            "parent_initial_id": "SB-123",
            "starts_at": "2026-04-01T08:00:00",
            "ends_at": "2026-04-02T17:00:00",
            "percent": 40.0,
            "amount": 400.0,
            "status": "draft_session",
            "source": "gantt_interparent_merge",
        }
    ]

    with patch.object(cronograma_trabajo_service, "_ensure_schedule", return_value=mock_schedule), \
         patch("app.services.cronograma_trabajo.cronograma_trabajo_repo.update") as mock_update, \
         patch.object(cronograma_trabajo_service, "_build_response", return_value="OK"):
        mock_update.return_value = mock_schedule
        result = cronograma_trabajo_service.persist_interparent_merge_schedule_data(
            mock_db,
            presupuesto_id=1,
            proyecto_id=1,
            empresa_id=1,
            linea_id=123,
            merged_subbars=merged_subbars,
        )

    assert result == "OK"
    payload = mock_update.call_args.args[2]
    line_data = payload["schedule_data"]["123"]
    metadata = line_data["metadata"]
    assert metadata["gantt_subbars"][0]["parent_initial_id"] == "SB-123"
    assert metadata["gantt_subbars"][0]["source"] == "gantt_interparent_merge"
    assert metadata["gantt_operational"]["subbar_count"] == 1
    assert metadata["manual_temporal_window"]["source"] == "manual_temporal_material_only"


def test_validate_interparent_merge_subbars_accepts_expected_parent_contract():
    merged_subbars = [
        {
            "id": "seg-a",
            "period_id": "P2",
            "parent_initial_id": "valuado-initial-123-P2",
            "starts_at": "2026-05-01T08:00:00",
            "ends_at": "2026-05-10T17:00:00",
            "percent": 55.0,
            "amount": 550.0,
            "status": "draft_session",
            "source": "gantt_interparent_merge",
        },
        {
            "id": "seg-b",
            "period_id": "P3",
            "parent_initial_id": "valuado-initial-123-P3",
            "starts_at": "2026-06-01T08:00:00",
            "ends_at": "2026-06-10T17:00:00",
            "percent": 45.0,
            "amount": 450.0,
            "status": "draft_session",
            "source": "valuado_initial_segment",
        },
    ]
    normalized = cronograma_trabajo_service.validate_interparent_merge_subbars(
        budget_line_id="123",
        merged_subbars=merged_subbars,
        expected_parent_percent_map={
            "valuado-initial-123-P1": 0.0,
            "valuado-initial-123-P2": 55.0,
            "valuado-initial-123-P3": 45.0,
        },
    )

    assert len(normalized) == 2
    assert normalized[0]["parent_initial_id"] == "valuado-initial-123-P2"


def test_validate_interparent_merge_subbars_rejects_parent_drift():
    merged_subbars = [
        {
            "id": "seg-a",
            "period_id": "P2",
            "parent_initial_id": "valuado-initial-123-P2",
            "starts_at": "2026-05-01T08:00:00",
            "ends_at": "2026-05-10T17:00:00",
            "percent": 60.0,
            "amount": 600.0,
            "status": "draft_session",
            "source": "gantt_interparent_merge",
        }
    ]

    with pytest.raises(ValueError, match="mandato del tramo inicial"):
        cronograma_trabajo_service.validate_interparent_merge_subbars(
            budget_line_id="123",
            merged_subbars=merged_subbars,
            expected_parent_percent_map={
                "valuado-initial-123-P2": 55.0,
            },
        )


def test_validate_interparent_merge_subbars_accepts_chained_segments_same_parent():
    merged_subbars = [
        {
            "id": "seg-a",
            "period_id": "P2",
            "parent_initial_id": "valuado-initial-123-P2",
            "starts_at": "2026-05-01T08:00:00",
            "ends_at": "2026-05-10T17:00:00",
            "percent": 35.0,
            "amount": 350.0,
            "status": "draft_session",
            "source": "gantt_interparent_merge",
        },
        {
            "id": "seg-b",
            "period_id": "P2",
            "parent_initial_id": "valuado-initial-123-P2",
            "starts_at": "2026-05-11T08:00:00",
            "ends_at": "2026-05-20T17:00:00",
            "percent": 20.0,
            "amount": 200.0,
            "status": "draft_session",
            "source": "gantt_split",
        },
        {
            "id": "seg-c",
            "period_id": "P3",
            "parent_initial_id": "valuado-initial-123-P3",
            "starts_at": "2026-06-01T08:00:00",
            "ends_at": "2026-06-10T17:00:00",
            "percent": 45.0,
            "amount": 450.0,
            "status": "draft_session",
            "source": "valuado_initial_segment",
        },
    ]
    normalized = cronograma_trabajo_service.validate_interparent_merge_subbars(
        budget_line_id="123",
        merged_subbars=merged_subbars,
        expected_parent_percent_map={
            "valuado-initial-123-P1": 0.0,
            "valuado-initial-123-P2": 55.0,
            "valuado-initial-123-P3": 45.0,
        },
    )

    assert len(normalized) == 3
    parent_summary = cronograma_trabajo_service._summarize_gantt_subbars_by_parent_initial(normalized)
    assert parent_summary["valuado-initial-123-P2"] == 55.0
    assert parent_summary["valuado-initial-123-P3"] == 45.0


def test_build_rows_derive_initial_segments_does_not_override_persisted_subbars(mock_db):
    presupuesto = Mock()
    presupuesto.id = 10
    presupuesto.empresa_id = 30
    presupuesto.proyecto_id = 20
    presupuesto.detalle = []

    config = cronograma_trabajo_service._resolve_config({})
    line_overrides = {
        "123": {
            "metadata": {
                "gantt_subbars": [
                    {
                        "id": "persisted-seg-1",
                        "period_id": "P2",
                        "parent_initial_id": "valuado-initial-123-P2",
                        "percent": 55.0,
                        "amount": 550.0,
                        "status": "draft_session",
                        "source": "gantt_interparent_merge",
                    }
                ]
            }
        }
    }

    with patch("app.services.cronograma_trabajo.refresh_presupuesto_prices", lambda *args, **kwargs: None), \
         patch.object(mock_db, "refresh", lambda *args, **kwargs: None), \
         patch.object(cronograma_trabajo_service, "_resolve_rows_dates", side_effect=lambda rows, *args, **kwargs: rows), \
         patch.object(cronograma_trabajo_service, "_decorate_rows_with_cpm_metadata", side_effect=lambda rows, *args, **kwargs: rows), \
         patch.object(cronograma_trabajo_service, "_derive_initial_valued_segments", return_value={
             "123": [
                 {
                     "id": "derived-seg-1",
                     "period_id": "P1",
                     "parent_initial_id": "valuado-initial-123-P1",
                     "percent": 40.0,
                     "amount": 400.0,
                     "status": "confirmed_against_budget",
                     "source": "valuado_initial_segment",
                 }
             ]
         }):
        cronograma_trabajo_service._build_rows(
            mock_db,
            presupuesto,
            config,
            line_overrides,
            holiday_dates=set(),
            derive_initial_segments=True,
        )

    assert line_overrides["123"]["metadata"]["gantt_subbars"][0]["id"] == "persisted-seg-1"


def test_build_rows_derive_initial_segments_replaces_legacy_auto_seeded_subbars(mock_db):
    presupuesto = Mock()
    presupuesto.id = 10
    presupuesto.empresa_id = 30
    presupuesto.proyecto_id = 20
    presupuesto.detalle = []

    config = cronograma_trabajo_service._resolve_config({})
    line_overrides = {
        "123": {
            "metadata": {
                "gantt_subbars": [
                    {
                        "id": "legacy-seed-1",
                        "period_id": "P1",
                        "parent_initial_id": "P1",
                        "percent": 100.0,
                        "amount": 1000.0,
                        "status": "draft_session",
                        "source": "gantt_schedule_period_seed",
                    }
                ]
            }
        }
    }
    authoritative_segments = {
        "123": [
            {
                "id": "line-123-initial-P1",
                "period_id": "P1",
                "parent_initial_id": "valuado-initial-123-P1",
                "percent": 12.0,
                "amount": 120.0,
                "status": "confirmed_against_budget",
                "source": "valuado_initial_segment",
            },
            {
                "id": "line-123-initial-P2",
                "period_id": "P2",
                "parent_initial_id": "valuado-initial-123-P2",
                "percent": 15.0,
                "amount": 150.0,
                "status": "confirmed_against_budget",
                "source": "valuado_initial_segment",
            },
        ]
    }

    with patch("app.services.cronograma_trabajo.refresh_presupuesto_prices", lambda *args, **kwargs: None), \
         patch.object(mock_db, "refresh", lambda *args, **kwargs: None), \
         patch.object(cronograma_trabajo_service, "_resolve_rows_dates", side_effect=lambda rows, *args, **kwargs: rows), \
         patch.object(cronograma_trabajo_service, "_decorate_rows_with_cpm_metadata", side_effect=lambda rows, *args, **kwargs: rows), \
         patch.object(cronograma_trabajo_service, "_derive_initial_valued_segments", return_value=authoritative_segments), \
         patch.object(cronograma_trabajo_service, "_resolve_project_detail", return_value=None), \
         patch.object(cronograma_trabajo_service, "_resolve_project_start_reference", return_value=None):
        cronograma_trabajo_service._build_rows(
            mock_db,
            presupuesto,
            config,
            line_overrides,
            holiday_dates=set(),
            derive_initial_segments=True,
        )

    persisted = line_overrides["123"]["metadata"]["gantt_subbars"]
    assert len(persisted) == 2
    assert persisted[0]["parent_initial_id"] == "valuado-initial-123-P1"
    assert persisted[1]["parent_initial_id"] == "valuado-initial-123-P2"
    assert persisted[0]["source"] == "valuado_initial_segment"
    assert persisted[1]["source"] == "valuado_initial_segment"


def test_build_response_skips_budget_price_refresh_on_read(mock_db):
    schedule = Mock()
    schedule.id = 1
    schedule.presupuesto_id = 10
    schedule.proyecto_id = 20
    schedule.empresa_id = 30
    schedule.schedule_data = {"__config__": {}}
    schedule.updated_at = None

    presupuesto = Mock()
    presupuesto.id = 10
    presupuesto.empresa_id = 30
    presupuesto.proyecto_id = 20
    presupuesto.detalle = []

    proyecto = Mock()
    proyecto.id = 20
    proyecto.empresa_id = 30
    proyecto.fecha_inicio = None

    mock_db.query.return_value.filter.return_value.first.side_effect = [
        schedule,
        presupuesto,
        proyecto,
    ]

    with patch.object(
        cronograma_trabajo_service,
        "_build_rows",
        return_value=([], CronogramaTrabajoSummary()),
    ) as mock_build_rows, patch.object(
        cronograma_trabajo_service,
        "_resolve_project_detail",
        return_value=None,
    ), patch.object(
        cronograma_trabajo_service,
        "_resolve_project_start_reference",
        return_value=None,
    ), patch.object(
        cronograma_trabajo_service,
        "_estimate_calendar_window",
        return_value=(None, None),
    ), patch(
        "app.services.cronograma_trabajo.project_calendar_service.get_snapshot_calendar",
        return_value=None,
    ):
        cronograma_trabajo_service._build_response(mock_db, schedule)

    assert mock_build_rows.call_args.kwargs["refresh_budget_prices"] is False


def test_sync_config_with_external_project_start_shifts_gantt_when_datos_proyecto_changes():
    config = cronograma_trabajo_service._resolve_config(
        {
            "fecha_inicio_proyecto": "2026-01-12T08:00:00",
            "fecha_inicio_referencia_proyecto": "2026-01-12T08:00:00",
            "fecha_inicio_autoridad": "gantt",
        }
    )
    detail = Mock(fecha_inicio=datetime(2026, 1, 19, 8, 0, 0))
    lineas = {
        "101": {
            "start_date": "2026-01-13T08:00:00",
            "end_date": "2026-01-14T17:00:00",
            "metadata": {
                "manual_temporal_window": {
                    "starts_at": "2026-01-13T08:00:00",
                    "ends_at": "2026-01-14T17:00:00",
                },
                "gantt_subbars": [
                    {
                        "starts_at": "2026-01-13T08:00:00",
                        "ends_at": "2026-01-13T17:00:00",
                    }
                ],
            },
        }
    }

    next_config, shifted_lineas, changed = (
        cronograma_trabajo_service._sync_config_with_external_project_start(
            config=config,
            lineas=lineas,
            detail=detail,
        )
    )

    assert changed is True
    assert next_config.fecha_inicio_autoridad == "datos_proyecto"
    assert next_config.fecha_inicio_proyecto == datetime(2026, 1, 19, 8, 0, 0)
    assert next_config.fecha_inicio_referencia_proyecto == datetime(2026, 1, 19, 8, 0, 0)
    assert shifted_lineas["101"]["start_date"] == "2026-01-20T08:00:00"
    assert (
        shifted_lineas["101"]["metadata"]["manual_temporal_window"]["starts_at"]
        == "2026-01-20T08:00:00"
    )
    assert (
        shifted_lineas["101"]["metadata"]["gantt_subbars"][0]["starts_at"]
        == "2026-01-20T08:00:00"
    )


def test_sync_config_initializes_project_start_without_shifting_legacy_schedule():
    config = cronograma_trabajo_service._resolve_config({})
    detail = Mock(fecha_inicio=datetime(2026, 1, 19, 8, 0, 0))
    lineas = {
        "101": {
            "start_date": "2026-01-20T08:00:00",
            "end_date": "2026-01-21T17:00:00",
        }
    }

    next_config, next_lineas, changed = (
        cronograma_trabajo_service._sync_config_with_external_project_start(
            config=config,
            lineas=lineas,
            detail=detail,
        )
    )

    assert changed is True
    assert next_config.fecha_inicio_autoridad == "datos_proyecto"
    assert next_config.fecha_inicio_proyecto == datetime(2026, 1, 19, 8, 0, 0)
    assert next_config.fecha_inicio_referencia_proyecto == datetime(2026, 1, 19, 8, 0, 0)
    assert next_lineas["101"]["start_date"] == "2026-01-20T08:00:00"
    assert next_lineas["101"]["end_date"] == "2026-01-21T17:00:00"


def test_mark_gantt_start_authority_preserves_project_reference_for_future_sync():
    config = cronograma_trabajo_service._resolve_config(
        {
            "fecha_inicio_proyecto": "2026-02-03T08:00:00",
            "fecha_inicio_referencia_proyecto": "2026-02-01T08:00:00",
            "fecha_inicio_autoridad": "datos_proyecto",
        }
    )
    detail = Mock(fecha_inicio=datetime(2026, 2, 1, 8, 0, 0))

    next_config = cronograma_trabajo_service._mark_gantt_start_authority(
        config=config,
        detail=detail,
    )

    assert next_config.fecha_inicio_autoridad == "gantt"
    assert next_config.fecha_inicio_proyecto == datetime(2026, 2, 3, 8, 0, 0)
    assert next_config.fecha_inicio_referencia_proyecto == datetime(2026, 2, 1, 8, 0, 0)


def test_build_initial_creation_schedule_data_creates_single_100_percent_seed_per_line(mock_db):
    proyecto = Mock(id=7, empresa_id=3)
    presupuesto = Mock(
        id=13,
        proyecto_id=7,
        empresa_id=3,
    )
    presupuesto.detalle = [
        Mock(id=101, apu_id=900, precio_total=1250.5),
        Mock(id=102, apu_id=901, precio_total=0),
    ]
    rows = [
        Mock(
            presupuesto_linea_id=101,
            start_date="2026-03-24T08:00:00",
            end_date="2026-03-30T17:00:00",
        ),
        Mock(
            presupuesto_linea_id=102,
            start_date="2026-03-24T08:00:00",
            end_date="2026-03-24T17:00:00",
        ),
    ]
    presupuesto_query = Mock()
    presupuesto_query.options.return_value.filter.return_value.first.return_value = presupuesto
    proyecto_query = Mock()
    proyecto_query.filter.return_value.first.return_value = proyecto

    with patch("app.services.cronograma_trabajo.presupuesto_repo.get", return_value=presupuesto), \
         patch.object(cronograma_trabajo_service, "_build_rows", return_value=(rows, CronogramaTrabajoSummary())), \
         patch.object(cronograma_trabajo_service, "_estimate_calendar_window", return_value=(None, None)), \
         patch("app.services.cronograma_trabajo.project_calendar_service.get_snapshot_calendar", return_value=None):
        mock_db.query.side_effect = [presupuesto_query, proyecto_query]
        payload = cronograma_trabajo_service.build_initial_creation_schedule_data(
            mock_db,
            presupuesto_id=13,
            proyecto_id=7,
            empresa_id=3,
        )

    assert "__config__" in payload
    assert "101" in payload
    assert "102" in payload
    line_101_subbars = payload["101"]["metadata"]["gantt_subbars"]
    assert len(line_101_subbars) == 1
    assert line_101_subbars[0]["percent"] == 100.0
    assert line_101_subbars[0]["amount"] == 1250.5
    assert line_101_subbars[0]["source"] == "initial_creation_seed"
    assert line_101_subbars[0]["metadata"]["source_contract"] == "initial_creation"
    assert payload["101"]["metadata"]["gantt_session"]["created_from_session"] == "initial_creation"


def test_ensure_schedule_uses_initial_creation_seed_for_new_schedule(mock_db):
    expected_payload = {
        "__config__": {},
        "101": {
            "metadata": {
                "gantt_subbars": [
                    {
                        "id": "initial-creation-seed-segment-101",
                        "source": "initial_creation_seed",
                        "percent": 100.0,
                    }
                ]
            }
        },
    }
    created_schedule = Mock(schedule_data=expected_payload)

    with patch("app.services.cronograma_trabajo.cronograma_trabajo_repo.get_by_budget_id", return_value=None), \
         patch.object(cronograma_trabajo_service, "build_initial_creation_schedule_data", return_value=expected_payload) as build_seed_mock, \
         patch("app.services.cronograma_trabajo.cronograma_trabajo_repo.create", return_value=created_schedule) as create_mock:
        schedule = cronograma_trabajo_service._ensure_schedule(
            mock_db,
            presupuesto_id=13,
            proyecto_id=7,
            empresa_id=3,
        )

    assert schedule is created_schedule
    build_seed_mock.assert_called_once_with(
        mock_db,
        presupuesto_id=13,
        proyecto_id=7,
        empresa_id=3,
    )
    create_mock.assert_called_once()
    create_payload = create_mock.call_args.args[1]
    assert create_payload["schedule_data"] == expected_payload
