from datetime import datetime, timedelta, timezone

from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoComputedRow,
    CronogramaTrabajoConfig,
    CronogramaTrabajoDependency,
)
from app.services.cronograma_trabajo import cronograma_trabajo_service


def test_work_duration_roundtrip_keeps_finish_finish_relations_exact():
    config = CronogramaTrabajoConfig(
        jornada_laboral_horas=8,
        hora_inicio_jornada=8,
        dias_laborables_semana=5,
    )
    target_finish = datetime(2026, 4, 1, 12, 31, 49)

    target_start = cronograma_trabajo_service._subtract_work_duration(
        target_finish,
        1.8653,
        config,
    )
    rebuilt_finish = cronograma_trabajo_service._build_finish_from_start(
        target_start,
        1.8653,
        config,
    )

    assert abs(rebuilt_finish - target_finish) <= timedelta(seconds=1)


def test_resolve_rows_dates_dependencies_override_stale_manual_dates():
    config = CronogramaTrabajoConfig(
        jornada_laboral_horas=8,
        hora_inicio_jornada=8,
        dias_laborables_semana=5,
    )
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=1,
            dias_calendario=1,
            duracion_horas=8,
            progress_pct=0,
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=1,
            dias_calendario=1,
            duracion_horas=8,
            progress_pct=0,
            metadata={},
        ),
    ]

    resolved = cronograma_trabajo_service._resolve_rows_dates(
        rows,
        None,
        {
            "1": {
                "start_date": "2026-04-20T08:00:00",
                "end_date": "2026-04-20T16:00:00",
            },
            "2": {
                "start_date": "2026-01-01T08:00:00",
                "end_date": "2026-01-01T16:00:00",
                "dependencies": [{"source_id": 1, "type": "FS", "lag_days": 0}],
            },
        },
        config,
    )

    assert resolved[1].start_date == datetime(2026, 4, 20, 16, 0, 0)
    assert resolved[1].end_date == datetime(2026, 4, 21, 16, 0, 0)


def test_resolve_rows_dates_finish_finish_aligns_target_finish_to_source_finish():
    config = CronogramaTrabajoConfig(
        jornada_laboral_horas=8,
        hora_inicio_jornada=8,
        dias_laborables_semana=5,
    )
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=6.5663,
            dias_calendario=6.5663,
            duracion_horas=52.5304,
            progress_pct=0,
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=1.8653,
            dias_calendario=1.8653,
            duracion_horas=14.9224,
            progress_pct=0,
            metadata={},
        ),
    ]

    resolved = cronograma_trabajo_service._resolve_rows_dates(
        rows,
        None,
        {
            "1": {"start_date": "2026-03-24T11:00:11"},
            "2": {
                "start_date": "2026-01-02T08:00:00",
                "end_date": "2026-01-05T16:00:00",
                "dependencies": [{"source_id": 1, "type": "FF", "lag_days": 0}],
            },
        },
        config,
    )

    assert abs(resolved[1].end_date - resolved[0].end_date) <= timedelta(seconds=1)
    assert resolved[1].start_date > datetime(2026, 3, 30, 0, 0, 0)


def test_resolve_rows_dates_finish_finish_floors_start_to_project_boundary():
    config = CronogramaTrabajoConfig(
        jornada_laboral_horas=8,
        hora_inicio_jornada=8,
        dias_laborables_semana=5,
    )
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            codigo_item="1.1.1",
            descripcion="A",
            dias_utiles=0.5,
            dias_calendario=0.5,
            duracion_horas=4,
            progress_pct=0,
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            codigo_item="1.1.2",
            descripcion="B",
            dias_utiles=3,
            dias_calendario=3,
            duracion_horas=24,
            progress_pct=0,
            metadata={},
        ),
    ]

    project_start = datetime(2026, 3, 24, 8, 0, 0)
    resolved = cronograma_trabajo_service._resolve_rows_dates(
        rows,
        project_start,
        {
            "1": {"start_date": "2026-03-24T08:00:00"},
            "2": {
                "dependencies": [{"source_id": 1, "type": "FF", "lag_days": 0}],
            },
        },
        config,
    )

    assert resolved[1].start_date >= project_start
    assert resolved[1].end_date >= resolved[0].end_date


def test_decorate_rows_with_cpm_metadata_marks_critical_path_without_changing_visible_schedule():
    config = CronogramaTrabajoConfig()
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=3,
            dias_calendario=4,
            duracion_horas=24,
            progress_pct=0,
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=4,
            dias_calendario=5,
            duracion_horas=32,
            progress_pct=0,
            dependencies=[CronogramaTrabajoDependency(source_id=1, type="FS", lag_days=0)],
            metadata={},
        ),
    ]

    original_calendar_days = [row.dias_calendario for row in rows]
    enriched = cronograma_trabajo_service._decorate_rows_with_cpm_metadata(rows, config)

    assert [row.dias_calendario for row in enriched] == original_calendar_days
    assert enriched[0].metadata["cpm_available"] is True
    assert enriched[0].metadata["is_critical"] is True
    assert enriched[1].metadata["critical"] is True
    assert enriched[0].metadata["cpm"]["early_start_days"] == 0.0
    assert enriched[1].metadata["cpm"]["early_start_days"] == 3.0
    assert enriched[1].metadata["cpm"]["late_finish_days"] == 7.0
    assert enriched[0].metadata["cpm"]["critical_path_indexes"] == [1]
    assert enriched[1].metadata["cpm"]["critical_path_count"] == 1
    assert enriched[1].metadata["cpm_network"]["critical_path_count"] == 1
    assert enriched[1].metadata["cpm_network"]["critical_paths"] == [["1", "2"]]
    assert enriched[0].metadata["cpm_schedule_alignment"]["has_drift"] is False
    assert enriched[1].metadata["cpm_schedule_alignment"]["status"] == "aligned"
    assert enriched[1].metadata["cpm_schedule_alignment"]["manual_reconciliation_eligible"] is False


def test_decorate_rows_with_cpm_metadata_degrades_to_warning_on_cycle():
    config = CronogramaTrabajoConfig()
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=1,
            duracion_horas=8,
            dependencies=[CronogramaTrabajoDependency(source_id=2, type="FS", lag_days=0)],
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=1,
            duracion_horas=8,
            dependencies=[CronogramaTrabajoDependency(source_id=1, type="FS", lag_days=0)],
            metadata={},
        ),
    ]

    enriched = cronograma_trabajo_service._decorate_rows_with_cpm_metadata(rows, config)

    assert enriched[0].metadata["cpm_available"] is False
    assert "cpm_warning" in enriched[0].metadata
    assert "ciclo" in enriched[0].metadata["cpm_warning"].lower()


def test_decorate_rows_with_cpm_metadata_reports_schedule_drift_without_mutating_dates():
    config = CronogramaTrabajoConfig()
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=3,
            dias_calendario=3,
            duracion_horas=24,
            progress_pct=0,
            start_date=datetime(2026, 4, 10, 8, 0, 0),
            end_date=datetime(2026, 4, 12, 16, 0, 0),
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=2,
            dias_calendario=2,
            duracion_horas=16,
            progress_pct=0,
            start_date=datetime(2026, 4, 10, 8, 0, 0),
            end_date=datetime(2026, 4, 11, 16, 0, 0),
            dependencies=[CronogramaTrabajoDependency(source_id=1, type="FS", lag_days=0)],
            metadata={},
        ),
    ]

    enriched = cronograma_trabajo_service._decorate_rows_with_cpm_metadata(rows, config)

    assert enriched[1].start_date == datetime(2026, 4, 10, 8, 0, 0)
    assert enriched[1].metadata["cpm_schedule_alignment"]["has_drift"] is True
    assert enriched[1].metadata["cpm_schedule_alignment"]["status"] == "warning"
    assert enriched[1].metadata["cpm_schedule_alignment"]["drift_start_days"] == -3.0
    assert enriched[1].metadata["cpm_schedule_alignment"]["drift_duration_days"] == 1.0
    assert enriched[1].metadata["cpm_schedule_alignment"]["recommended_start"] == "2026-04-13T08:00:00"
    assert enriched[1].metadata["cpm_schedule_alignment"]["recommended_finish"] == "2026-04-13T16:00:00"
    assert enriched[1].metadata["cpm_schedule_alignment"]["recommended_duration_days"] == 1.0
    assert enriched[1].metadata["cpm_schedule_alignment"]["manual_reconciliation_eligible"] is True
    assert enriched[1].metadata["cpm_schedule_alignment"]["manual_reconciliation_reason"] == ""


def test_decorate_rows_with_cpm_metadata_accepts_mixed_naive_and_aware_datetimes():
    config = CronogramaTrabajoConfig()
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=1,
            dias_calendario=1,
            duracion_horas=8,
            progress_pct=0,
            start_date=datetime(2026, 4, 10, 8, 0, 0, tzinfo=timezone.utc),
            end_date=datetime(2026, 4, 10, 16, 0, 0, tzinfo=timezone.utc),
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=1,
            dias_calendario=1,
            duracion_horas=8,
            progress_pct=0,
            start_date=datetime(2026, 4, 11, 8, 0, 0),
            end_date=datetime(2026, 4, 11, 16, 0, 0),
            dependencies=[CronogramaTrabajoDependency(source_id=1, type="FS", lag_days=0)],
            metadata={},
        ),
    ]

    enriched = cronograma_trabajo_service._decorate_rows_with_cpm_metadata(rows, config)

    assert enriched[0].metadata["cpm_available"] is True
    assert enriched[1].metadata["cpm_available"] is True


def test_resolve_config_rounds_working_days_per_week_and_keeps_project_start():
    config = cronograma_trabajo_service._resolve_config({
        "dias_laborables_semana": 5.13,
        "dias_mes": 30,
        "fecha_inicio_proyecto": "2026-04-15T00:00:00+00:00",
    })

    assert config.dias_laborables_semana == 5
    assert config.dias_laborables_mes == round((5 * 30) / 7, 4)
    assert config.fecha_inicio_proyecto == datetime(2026, 4, 15, 0, 0, 0)


def test_decorate_rows_with_cpm_metadata_tracks_multiple_critical_paths_and_restrictions():
    config = CronogramaTrabajoConfig()
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=1,
            presupuesto_linea_id=1,
            sequence_index=1,
            edt_id=1,
            descripcion="A",
            dias_utiles=5,
            duracion_horas=40,
            progress_pct=0,
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=2,
            presupuesto_linea_id=2,
            sequence_index=2,
            edt_id=1,
            descripcion="B",
            dias_utiles=8,
            duracion_horas=64,
            progress_pct=0,
            dependencies=[CronogramaTrabajoDependency(source_id=1, type="FS", lag_days=0)],
            metadata={},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=3,
            presupuesto_linea_id=3,
            sequence_index=3,
            edt_id=1,
            descripcion="C",
            dias_utiles=6,
            duracion_horas=48,
            progress_pct=0,
            metadata={"restriction_type": "SNET", "restriction_value": 0},
        ),
        CronogramaTrabajoComputedRow(
            linea_id=4,
            presupuesto_linea_id=4,
            sequence_index=4,
            edt_id=1,
            descripcion="D",
            dias_utiles=7,
            duracion_horas=56,
            progress_pct=0,
            dependencies=[CronogramaTrabajoDependency(source_id=3, type="FS", lag_days=0)],
            metadata={},
        ),
    ]

    enriched = cronograma_trabajo_service._decorate_rows_with_cpm_metadata(rows, config)

    assert enriched[0].metadata["cpm_network"]["critical_path_count"] == 2
    assert enriched[1].metadata["cpm"]["critical_path_indexes"] == [1]
    assert enriched[2].metadata["cpm"]["critical_path_indexes"] == [2]
    assert enriched[2].metadata["cpm"]["restriction_type"] == "SNET"
    assert enriched[2].metadata["cpm"]["restriction_state"] == "window"
