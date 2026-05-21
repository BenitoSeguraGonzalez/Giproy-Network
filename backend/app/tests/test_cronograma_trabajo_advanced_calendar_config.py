import pytest
from pydantic import ValidationError
from datetime import date, datetime
from types import SimpleNamespace

from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoConfig,
    CronogramaTrabajoDependency,
    CronogramaTrabajoLinea,
)
from app.services.cronograma_trabajo import cronograma_trabajo_service


def test_resolve_config_keeps_legacy_calendar_disabled():
    config = cronograma_trabajo_service._resolve_config(
        {
            "hora_inicio_jornada": 7.5,
            "jornada_laboral_horas": 9,
            "dias_laborables_semana": 5,
        }
    )

    assert config.hora_inicio_jornada == 7.5
    assert config.jornada_laboral_horas == 9
    assert config.dias_laborables_semana == 5
    assert config.advanced_calendar.enabled is False
    assert config.advanced_calendar.mode == "simple"
    assert config.advanced_calendar.weekly_pattern == []


def test_resolve_config_accepts_sorted_advanced_calendar_slots():
    config = cronograma_trabajo_service._resolve_config(
        {
            "advanced_calendar": {
                "enabled": True,
                "mode": "advanced",
                "weekly_pattern": [
                    {
                        "day": 1,
                        "is_working_day": True,
                        "slots": [
                            {"start": "13:00", "end": "17:00", "description": "pm"},
                            {"start": "08:00", "end": "12:00", "description": "am"},
                        ],
                    }
                ],
                "date_exceptions": [
                    {
                        "date": "2026-05-04",
                        "is_working_day": True,
                        "slots": [{"start": 9.5, "end": 11}],
                    }
                ],
                "holidays": [
                    {
                        "date": "2026-05-01",
                        "is_working_day": False,
                        "description": "Festivo",
                    }
                ],
            }
        }
    )

    advanced_calendar = config.advanced_calendar
    assert advanced_calendar.enabled is True
    assert advanced_calendar.mode == "advanced"
    assert [slot.start for slot in advanced_calendar.weekly_pattern[0].slots] == [
        "08:00",
        "13:00",
    ]
    assert advanced_calendar.date_exceptions[0].slots[0].start == "09:30"
    assert advanced_calendar.date_exceptions[0].slots[0].end == "11:00"
    assert advanced_calendar.holidays[0].date == "2026-05-01"


def test_resolve_config_rejects_overlapping_advanced_calendar_slots():
    with pytest.raises(ValidationError):
        cronograma_trabajo_service._resolve_config(
            {
                "advanced_calendar": {
                    "enabled": True,
                    "mode": "advanced",
                    "weekly_pattern": [
                        {
                            "day": 2,
                            "is_working_day": True,
                            "slots": [
                                {"start": "08:00", "end": "12:00"},
                                {"start": "11:30", "end": "15:00"},
                            ],
                        }
                    ],
                }
            }
        )


def test_resolve_config_normalizes_disabled_advanced_calendar_to_simple():
    config = cronograma_trabajo_service._resolve_config(
        {
            "advanced_calendar": {
                "enabled": False,
                "mode": "advanced",
                "weekly_pattern": [
                    {
                        "day": 0,
                        "is_working_day": True,
                        "slots": [{"start": "08:00", "end": "16:00"}],
                    }
                ],
            }
        }
    )

    assert config.advanced_calendar.enabled is False
    assert config.advanced_calendar.mode == "simple"
    assert config.advanced_calendar.weekly_pattern[0].slots[0].start == "08:00"


def _advanced_config():
    return cronograma_trabajo_service._resolve_config(
        {
            "hora_inicio_jornada": 8,
            "jornada_laboral_horas": 8,
            "dias_laborables_semana": 5,
            "advanced_calendar": {
                "enabled": True,
                "mode": "advanced",
                "weekly_pattern": [
                    {
                        "day": day,
                        "is_working_day": day < 5,
                        "slots": (
                            [
                                {"start": "08:00", "end": "12:00"},
                                {"start": "13:00", "end": "17:00"},
                            ]
                            if day < 5
                            else []
                        ),
                    }
                    for day in range(7)
                ],
                "date_exceptions": [
                    {
                        "date": "2026-05-06",
                        "is_working_day": True,
                        "slots": [{"start": "10:00", "end": "12:00"}],
                    }
                ],
                "holidays": [{"date": "2026-05-05", "is_working_day": False}],
            },
        }
    )


def test_advanced_calendar_adds_duration_across_slot_gap():
    config = _advanced_config()

    finish = cronograma_trabajo_service._add_work_duration(
        datetime(2026, 5, 4, 11, 0),
        0.25,
        config,
    )

    assert finish == datetime(2026, 5, 4, 14, 0)


def test_advanced_calendar_skips_holidays_and_uses_date_exceptions():
    config = _advanced_config()

    finish = cronograma_trabajo_service._add_work_duration(
        datetime(2026, 5, 4, 16, 0),
        0.25,
        config,
    )

    assert finish == datetime(2026, 5, 6, 11, 0)


def test_advanced_calendar_subtracts_duration_across_gap():
    config = _advanced_config()

    start = cronograma_trabajo_service._add_work_duration(
        datetime(2026, 5, 4, 14, 0),
        -0.25,
        config,
    )

    assert start == datetime(2026, 5, 4, 11, 0)


def test_advanced_calendar_dependency_lag_uses_effective_work_time():
    config = _advanced_config()
    dependency = cronograma_trabajo_service._resolve_line_dependencies(
        2,
        CronogramaTrabajoLinea(
            dependencies=[
                {
                    "source_id": 1,
                    "target_id": 2,
                    "type": "FS",
                    "lag_days": 0.25,
                    "lag_unit": "day",
                }
            ]
        ),
    )[0]

    target_start = cronograma_trabajo_service._resolve_dependency_target_start(
        datetime(2026, 5, 4, 8, 0),
        datetime(2026, 5, 4, 11, 0),
        0.5,
        dependency,
        config,
    )

    assert target_start == datetime(2026, 5, 4, 14, 0)


def test_simple_calendar_fs_uses_remaining_workday_before_next_workday():
    config = CronogramaTrabajoConfig(
        hora_inicio_jornada=8,
        jornada_laboral_horas=8,
        dias_laborables_semana=5,
    )
    dependency = CronogramaTrabajoDependency(
        source_id=27,
        target_id=28,
        type="FS",
        lag_days=0,
    )
    holidays = {date(2026, 5, 1)}

    target_start = cronograma_trabajo_service._resolve_dependency_target_start(
        datetime(2026, 4, 22, 9, 18),
        datetime(2026, 4, 30, 13, 47),
        0.3375,
        dependency,
        config,
        holiday_dates=holidays,
    )
    target_finish = cronograma_trabajo_service._build_finish_from_start(
        target_start,
        0.3375,
        config,
        holiday_dates=holidays,
    )

    assert target_start == datetime(2026, 4, 30, 13, 47)
    assert target_finish == datetime(2026, 5, 4, 8, 29)


def test_simple_calendar_builds_auto_subbars_across_workday_cut():
    config = CronogramaTrabajoConfig(
        hora_inicio_jornada=8,
        jornada_laboral_horas=8,
        dias_laborables_semana=5,
    )

    segments = cronograma_trabajo_service._build_workday_auto_segments(
        budget_line_id="28",
        start_date=datetime(2026, 4, 30, 13, 47),
        duration_days=0.3375,
        config=config,
        holiday_dates={date(2026, 5, 1)},
    )

    assert len(segments) == 2
    assert segments[0]["starts_at"] == "2026-04-30T13:47:00"
    assert segments[0]["ends_at"] == "2026-04-30T16:00:00"
    assert segments[1]["starts_at"] == "2026-05-04T08:00:00"
    assert segments[1]["ends_at"] == "2026-05-04T08:29:00"
    assert {segment["source"] for segment in segments} == {"gantt_workday_auto_segment"}


def test_simple_calendar_fs_obeys_external_holiday_before_remaining_workday():
    config = CronogramaTrabajoConfig(
        hora_inicio_jornada=8,
        jornada_laboral_horas=8,
        dias_laborables_semana=5,
    )
    dependency = CronogramaTrabajoDependency(
        source_id=27,
        target_id=28,
        type="FS",
        lag_days=0,
    )
    holidays = {date(2026, 4, 30), date(2026, 5, 1)}

    target_start = cronograma_trabajo_service._resolve_dependency_target_start(
        datetime(2026, 4, 22, 9, 18),
        datetime(2026, 4, 30, 13, 47),
        0.3375,
        dependency,
        config,
        holiday_dates=holidays,
    )

    assert target_start == datetime(2026, 5, 4, 8, 0)


def test_workday_auto_segments_replace_renewable_seed_but_keep_manual_subbars():
    config = CronogramaTrabajoConfig(
        hora_inicio_jornada=8,
        jornada_laboral_horas=8,
        dias_laborables_semana=5,
    )
    renewable_row = SimpleNamespace(
        presupuesto_linea_id="28",
        start_date=datetime(2026, 4, 30, 13, 47),
        dias_calendario=0.3375,
        dias_utiles=0.3375,
        metadata={
            "gantt_subbars": [
                {
                    "id": "factory-reset-seed-segment-28",
                    "source": "factory_reset_seed",
                    "starts_at": "2026-02-22T12:42:53",
                    "ends_at": "2026-02-22T15:24:53",
                    "percent": 100,
                    "status": "confirmed_against_budget",
                }
            ]
        },
    )
    manual_row = SimpleNamespace(
        presupuesto_linea_id="29",
        start_date=datetime(2026, 4, 30, 13, 47),
        dias_calendario=0.3375,
        dias_utiles=0.3375,
        metadata={
            "gantt_subbars": [
                {
                    "id": "manual-segment-29",
                    "source": "gantt_manual_split",
                    "starts_at": "2026-04-30T13:47:00",
                    "ends_at": "2026-05-04T08:29:00",
                    "percent": 100,
                    "status": "draft",
                }
            ]
        },
    )

    cronograma_trabajo_service._decorate_rows_with_workday_auto_segments(
        [renewable_row, manual_row],
        config,
        holiday_dates={date(2026, 5, 1)},
    )

    renewable_sources = {
        segment["source"]
        for segment in renewable_row.metadata.get("gantt_subbars", [])
    }
    manual_sources = {
        segment["source"] for segment in manual_row.metadata.get("gantt_subbars", [])
    }
    assert renewable_sources == {"gantt_workday_auto_segment"}
    assert len(renewable_row.metadata["gantt_subbars"]) == 2
    assert manual_sources == {"gantt_manual_split"}


def test_dependency_percent_and_minute_lag_are_not_interpreted_as_days():
    config = CronogramaTrabajoConfig(jornada_laboral_horas=8)
    percent_dependency = CronogramaTrabajoDependency(
        source_id=1,
        target_id=2,
        type="FF",
        lag_days=-50,
        lag_unit="percent",
    )
    minute_dependency = CronogramaTrabajoDependency(
        source_id=1,
        target_id=2,
        type="FF",
        lag_days=-30,
        lag_unit="minute",
    )

    assert cronograma_trabajo_service._dependency_lag_to_work_days(
        percent_dependency,
        config,
        source_duration_days=0.7919,
    ) == pytest.approx(-0.39595)
    assert cronograma_trabajo_service._dependency_lag_to_work_days(
        minute_dependency,
        config,
        source_duration_days=0.7919,
    ) == pytest.approx(-0.0625)


def test_dependency_schema_accepts_visible_aliases_and_percent_unit():
    dependency = CronogramaTrabajoDependency(
        source_id=1,
        target_id=2,
        type="CC",
        lag_days=-50,
        lag_unit="%",
    )

    assert dependency.type == "SS"
    assert dependency.lag_unit == "percent"


def test_advanced_calendar_can_be_overridden_by_external_holidays():
    config = _advanced_config()

    finish = cronograma_trabajo_service._add_work_duration(
        datetime(2026, 5, 7, 16, 0),
        0.25,
        config,
        {date(2026, 5, 8)},
    )

    assert finish == datetime(2026, 5, 11, 9, 0)
