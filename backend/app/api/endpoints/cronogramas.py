from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from math import floor
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.cronograma import CronogramaValorado
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.usuario import Usuario
from app.schemas.cronograma import (
    CronogramaConfigUpdate,
    CronogramaCashFlowPoint,
    CronogramaCurvaSPoint,
    CronogramaFooter,
    CronogramaLineaUpdate,
    CronogramaLineaValorada,
    CronogramaPeriodo,
    CronogramaValoradoResponse,
)
from app.services.audit_event import record_audit_event
from app.core.rounding import round_decimal
from app.core.calculation_policy import as_decimal, round_operational_calc
from app.services.cronograma_trabajo import cronograma_trabajo_service

router = APIRouter()

PERIOD_LABELS = {
    "diario": "Diario",
    "semanal": "Semanal",
    "quincenal": "Quincenal",
    "mensual": "Mensual",
    "bimestral": "Bimestral",
    "trimestral": "Trimestral",
    "semestral": "Semestral",
    "anual": "Anual",
}

DEFAULT_WORKDAY_START_HOUR = 8.0
DEFAULT_WORKDAY_HOURS = 8.0


def _normalize_workday_start_hour(value: float | None) -> float:
    try:
        return round(min(max(float(value or DEFAULT_WORKDAY_START_HOUR), 0.0), 23.5), 4)
    except Exception:
        return DEFAULT_WORKDAY_START_HOUR


def _normalize_workday_hours(value: float | None) -> float:
    try:
        return round(min(max(float(value or DEFAULT_WORKDAY_HOURS), 0.5), 24.0), 4)
    except Exception:
        return DEFAULT_WORKDAY_HOURS


def _hour_parts(value: float) -> tuple[int, int]:
    normalized = _normalize_workday_start_hour(value)
    hour = int(normalized)
    minute = int(round((normalized - hour) * 60))
    if minute >= 60:
        hour = min(hour + 1, 23)
        minute = 0
    return hour, minute


def _apply_workday_start(value: date | datetime | None, start_hour: float = DEFAULT_WORKDAY_START_HOUR) -> datetime:
    if value is None:
        base = datetime.now(timezone.utc)
    elif isinstance(value, datetime):
        base = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    else:
        base = datetime.combine(value, time.min, tzinfo=timezone.utc)
    hour, minute = _hour_parts(start_hour)
    if base.hour == 0 and base.minute == 0 and base.second == 0 and base.microsecond == 0:
        return base.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return base.replace(microsecond=0)


def _apply_workday_finish(
    value: date | datetime | None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> datetime:
    base = _apply_workday_start(value, start_hour)
    if isinstance(value, datetime) and (value.hour != 0 or value.minute != 0 or value.second != 0 or value.microsecond != 0):
        return base.replace(microsecond=0)
    return (base + timedelta(hours=_normalize_workday_hours(workday_hours))).replace(microsecond=0)


def _to_datetime_start(value: date | datetime | None, start_hour: float = DEFAULT_WORKDAY_START_HOUR) -> datetime:
    return _apply_workday_start(value, start_hour)


def _to_datetime_end(
    value: date | datetime | None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> datetime:
    return _apply_workday_finish(value, start_hour, workday_hours)


def _get_month_end(year: int, month: int) -> date:
    return date(year, month, monthrange(year, month)[1])


def _shift_month(year: int, month: int, offset: int) -> tuple[int, int]:
    absolute_month = (year * 12) + (month - 1) + offset
    target_year = absolute_month // 12
    target_month = (absolute_month % 12) + 1
    return target_year, target_month


def _get_period_bucket_bounds(anchor: date, period_type: str) -> tuple[date, date]:
    if period_type == "diario":
        return anchor, anchor
    if period_type == "semanal":
        start = anchor - timedelta(days=anchor.weekday())
        return start, start + timedelta(days=6)
    if period_type == "quincenal":
        if anchor.day <= 15:
            return anchor.replace(day=1), anchor.replace(day=15)
        return anchor.replace(day=16), _get_month_end(anchor.year, anchor.month)
    if period_type == "mensual":
        return anchor.replace(day=1), _get_month_end(anchor.year, anchor.month)
    if period_type == "bimestral":
        start_month = anchor.month if anchor.month % 2 else anchor.month - 1
        start = date(anchor.year, start_month, 1)
        end_year, end_month = _shift_month(anchor.year, start_month, 1)
        return start, _get_month_end(end_year, end_month)
    if period_type == "trimestral":
        start_month = ((anchor.month - 1) // 3) * 3 + 1
        start = date(anchor.year, start_month, 1)
        end_year, end_month = _shift_month(anchor.year, start_month, 2)
        return start, _get_month_end(end_year, end_month)
    if period_type == "semestral":
        start_month = 1 if anchor.month <= 6 else 7
        start = date(anchor.year, start_month, 1)
        end_year, end_month = _shift_month(anchor.year, start_month, 5)
        return start, _get_month_end(end_year, end_month)
    if period_type == "anual":
        return date(anchor.year, 1, 1), date(anchor.year, 12, 31)
    raise HTTPException(status_code=400, detail="Tipo de periodo no válido.")


def _normalize_execution_window(
    project_detail: Optional[ProyectoDetalle],
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> tuple[datetime, datetime]:
    if project_detail and project_detail.fecha_inicio:
        start_at = _to_datetime_start(project_detail.fecha_inicio, start_hour)
    else:
        start_at = _to_datetime_start(None, start_hour)

    if project_detail and project_detail.fecha_finalizacion:
        end_at = _to_datetime_end(project_detail.fecha_finalizacion, start_hour, workday_hours)
    elif project_detail and project_detail.plazo_ejecucion:
        days = max(int(project_detail.plazo_ejecucion), 1)
        end_at = _apply_workday_finish(start_at + timedelta(days=days - 1), start_hour, workday_hours)
    else:
        end_at = _apply_workday_finish(start_at + timedelta(days=179), start_hour, workday_hours)

    if end_at < start_at:
        end_at = _apply_workday_finish(start_at, start_hour, workday_hours)
    return start_at, end_at


def _build_periods(
    start_at: datetime,
    end_at: datetime,
    period_type: str,
    plazo_days: int | None = None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> list[CronogramaPeriodo]:
    periods: list[CronogramaPeriodo] = []
    cursor = _apply_workday_start(start_at, start_hour)
    index = 1
    while cursor <= end_at:
        _, bucket_end_date = _get_period_bucket_bounds(cursor.date(), period_type)
        candidate_end = _apply_workday_finish(bucket_end_date, start_hour, workday_hours)
        period_end = candidate_end if candidate_end <= end_at else end_at
        periods.append(
            CronogramaPeriodo(
                id=f"P{index}",
                label=f"P{index}",
                starts_at=cursor,
                ends_at=period_end,
            )
        )
        if period_end >= end_at:
            break
        cursor = _apply_workday_start((period_end + timedelta(days=1)).date(), start_hour)
        index += 1
    return periods


def _build_workday_window(reference: datetime, start_hour: float, workday_hours: float) -> tuple[datetime, datetime]:
    work_start = _apply_workday_start(reference, start_hour)
    work_end = work_start + timedelta(hours=_normalize_workday_hours(workday_hours))
    return work_start, work_end


def _measure_work_window_seconds(
    range_start: datetime,
    range_end: datetime,
    start_hour: float,
    workday_hours: float,
) -> float:
    if range_end < range_start:
        return 0.0
    cursor_date = range_start.date()
    last_date = range_end.date()
    total_seconds = 0.0
    while cursor_date <= last_date:
        day_anchor = datetime.combine(cursor_date, time.min, tzinfo=range_start.tzinfo or timezone.utc)
        work_start, work_end = _build_workday_window(day_anchor, start_hour, workday_hours)
        overlap_start = max(range_start, work_start)
        overlap_end = min(range_end, work_end)
        if overlap_end > overlap_start:
            total_seconds += (overlap_end - overlap_start).total_seconds()
        cursor_date += timedelta(days=1)
    return total_seconds


def _round_distribution(raw_values: list[float], decimals: int = 6) -> list[float]:
    if not raw_values:
        return []
    rounded = [float(round_decimal(Decimal(str(value)), decimals)) for value in raw_values]
    total = round_decimal(as_decimal(sum(rounded), "0"), decimals)
    diff = round_decimal(Decimal("100") - total, decimals)
    rounded[-1] = float(round_decimal(as_decimal(rounded[-1], "0") + diff, decimals))
    return rounded


def _build_zero_distribution(period_count: int) -> list[float]:
    return [0.0 for _ in range(max(int(period_count or 0), 0))]


def _resolve_valued_line_distribution(
    period_count: int,
    derived_distribution: list[float] | None,
    global_distribution: list[float] | None,
    requires_manual_schedule: bool = False,
) -> list[float]:
    if requires_manual_schedule:
        return _build_zero_distribution(period_count)
    if derived_distribution:
        return list(derived_distribution)
    if global_distribution:
        return list(global_distribution)
    return _build_zero_distribution(period_count)


def _build_homogeneous_distribution(period_count: int) -> list[float]:
    if period_count <= 0:
        return []
    base_value = floor((100 / period_count) * 1_000_000) / 1_000_000
    distribution = [base_value for _ in range(period_count)]
    return _round_distribution(distribution)


def _as_datetime(
    value: date | datetime | None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
    mode: str = "start",
) -> datetime | None:
    if value is None:
        return None
    if mode == "finish":
        return _apply_workday_finish(value, start_hour, workday_hours)
    return _apply_workday_start(value, start_hour)


def _build_gantt_distribution_for_periods(
    periods: list[CronogramaPeriodo],
    task_start: date | datetime | None,
    task_end: date | datetime | None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> list[float]:
    if not periods:
        return []

    start_at = _as_datetime(task_start, start_hour, workday_hours, "start")
    end_at = _as_datetime(task_end, start_hour, workday_hours, "finish") or start_at
    if start_at is None:
        return _build_homogeneous_distribution(len(periods))
    if end_at is None or end_at < start_at:
        end_at = _apply_workday_finish(start_at, start_hour, workday_hours)

    total_seconds = max(_measure_work_window_seconds(start_at, end_at, start_hour, workday_hours), 1.0)
    raw_distribution: list[float] = []
    for period in periods:
        period_start = _as_datetime(period.starts_at, start_hour, workday_hours, "start")
        period_end = _as_datetime(period.ends_at, start_hour, workday_hours, "finish")
        if not period_start or not period_end:
            raw_distribution.append(0.0)
            continue
        overlap_start = max(start_at, period_start)
        overlap_end = min(end_at, period_end)
        overlap_seconds = _measure_work_window_seconds(overlap_start, overlap_end, start_hour, workday_hours) if overlap_end >= overlap_start else 0.0
        raw_distribution.append((overlap_seconds / total_seconds) * 100 if total_seconds else 0.0)

    if any(value > 0 for value in raw_distribution):
        return _round_distribution(raw_distribution)

    for index, period in enumerate(periods):
        period_start = _as_datetime(period.starts_at, start_hour, workday_hours, "start")
        period_end = _as_datetime(period.ends_at, start_hour, workday_hours, "finish")
        if period_start and period_end and period_start <= start_at <= period_end:
            raw_distribution[index] = 100.0
            return _round_distribution(raw_distribution)

    first_period_start = _as_datetime(periods[0].starts_at, start_hour, workday_hours, "start")
    target_index = 0 if first_period_start and end_at < first_period_start else len(periods) - 1
    raw_distribution[target_index] = 100.0
    return _round_distribution(raw_distribution)


def _build_schedule_override_map(schedule: Any) -> dict[str, Any]:
    raw_schedule_data = getattr(schedule, "schedule_data", {}) or {}
    return {str(key): value for key, value in raw_schedule_data.items()}


def _is_schedule_row_material_only(row: Any) -> bool:
    governing_kind = str(getattr(row, "recurso_gobernante_categoria_detalle", "") or "").strip().lower()
    if governing_kind == "materiales":
        return True
    metadata = dict(getattr(row, "metadata", {}) or {})
    governing_resource = dict(metadata.get("governing_resource") or {})
    duration_model = dict(metadata.get("duration_model") or {})
    for candidate in (
        governing_resource.get("kind"),
        governing_resource.get("category"),
        duration_model.get("governing_resource_kind"),
        duration_model.get("governing_category"),
    ):
        if str(candidate or "").strip().lower() == "materiales":
            return True
    return False


def _has_manual_temporal_window(schedule_override: Any) -> bool:
    if not schedule_override:
        return False
    for attr in ("start_date", "end_date"):
        if getattr(schedule_override, attr, None):
            return True
    try:
        duration = float(getattr(schedule_override, "duration", None) or 0)
    except Exception:
        duration = 0.0
    return duration > 0


def _resolve_schedule_temporal_status(row: Any, schedule_override: Any) -> dict[str, Any]:
    is_material_only = _is_schedule_row_material_only(row)
    has_manual_window = _has_manual_temporal_window(schedule_override)
    has_dates = bool(getattr(row, "start_date", None) and getattr(row, "end_date", None))
    try:
        duration_hours = float(getattr(row, "duracion_horas", 0) or 0)
    except Exception:
        duration_hours = 0.0

    if is_material_only:
        if has_manual_window and has_dates:
            return {
                "is_material_only": True,
                "requires_manual_schedule": False,
                "is_temporally_derivable": True,
                "temporal_source": "manual_temporal_material_only",
            }
        return {
            "is_material_only": True,
            "requires_manual_schedule": True,
            "is_temporally_derivable": False,
            "temporal_source": "manual_schedule_required_material_only",
        }

    if has_dates and duration_hours > 0:
        return {
            "is_material_only": False,
            "requires_manual_schedule": False,
            "is_temporally_derivable": True,
            "temporal_source": "gantt_overlap",
        }

    if has_dates:
        return {
            "is_material_only": False,
            "requires_manual_schedule": False,
            "is_temporally_derivable": True,
            "temporal_source": "gantt_dates_fallback",
        }

    return {
        "is_material_only": False,
        "requires_manual_schedule": False,
        "is_temporally_derivable": False,
        "temporal_source": "global_fallback",
    }


def _build_gantt_distribution_map(
    db: Session,
    presupuesto: Presupuesto,
    periods: list[CronogramaPeriodo],
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> dict[str, list[float]]:
    if not periods:
        return {}
    try:
        schedule = cronograma_trabajo_service.get_schedule(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
        )
    except Exception:
        return {}

    schedule_override_map = _build_schedule_override_map(schedule)
    distribution_map: dict[str, list[float]] = {}
    for row in schedule.rows or []:
        start_date = getattr(row, "start_date", None)
        end_date = getattr(row, "end_date", None)
        row_key = str(row.presupuesto_linea_id)
        temporal_status = _resolve_schedule_temporal_status(row, schedule_override_map.get(row_key))
        if not temporal_status["is_temporally_derivable"] or not start_date:
            distribution_map[row_key] = {
                "distribution": None,
                **temporal_status,
            }
            continue
        distribution_map[row_key] = {
            "distribution": _build_gantt_distribution_for_periods(
            periods,
            start_date,
            end_date or start_date,
            start_hour=start_hour,
            workday_hours=workday_hours,
            ),
            **temporal_status,
        }
    return distribution_map


def _decimal_to_float(value: Decimal | float | int | None) -> float:
    if value is None:
        return 0.0
    return float(value)


def _build_cash_flow_from_footer(
    periods: list[CronogramaPeriodo],
    footer: CronogramaFooter,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
) -> list[CronogramaCashFlowPoint]:
    cash_flow: list[CronogramaCashFlowPoint] = []
    for index, period in enumerate(periods):
        work_hours = _measure_work_window_seconds(
            _as_datetime(period.starts_at, start_hour, workday_hours, "start") or period.starts_at,
            _as_datetime(period.ends_at, start_hour, workday_hours, "finish") or period.ends_at,
            start_hour,
            workday_hours,
        ) / 3600
        cash_flow.append(
            CronogramaCashFlowPoint(
                period_id=period.id,
                label=period.label,
                starts_at=period.starts_at,
                ends_at=period.ends_at,
                work_hours=float(round_decimal(Decimal(str(work_hours)), 4)),
                cost=footer.inversion_parcial[index] if index < len(footer.inversion_parcial) else 0.0,
                cumulative_cost=footer.inversion_acumulada[index] if index < len(footer.inversion_acumulada) else 0.0,
                cost_pct=footer.avance_parcial_pct[index] if index < len(footer.avance_parcial_pct) else 0.0,
                cumulative_pct=footer.avance_acumulado_pct[index] if index < len(footer.avance_acumulado_pct) else 0.0,
            )
        )
    return cash_flow


def _build_schedule_row_map(schedule: Any) -> dict[str, Any]:
    rows = getattr(schedule, "rows", []) or []
    return {
        str(getattr(row, "presupuesto_linea_id", getattr(row, "linea_id", ""))): row
        for row in rows
        if getattr(row, "presupuesto_linea_id", getattr(row, "linea_id", None)) is not None
    }


def _build_cash_flow_with_resource_categories(
    periods: list[CronogramaPeriodo],
    footer: CronogramaFooter,
    rows: list[CronogramaLineaValorada],
    schedule_row_map: dict[str, Any] | None = None,
    start_hour: float = DEFAULT_WORKDAY_START_HOUR,
    workday_hours: float = DEFAULT_WORKDAY_HOURS,
    dec_moneda: int = 2,
    dec_calculos: int = 4,
) -> list[CronogramaCashFlowPoint]:
    schedule_row_map = schedule_row_map or {}
    cash_flow = _build_cash_flow_from_footer(periods, footer, start_hour=start_hour, workday_hours=workday_hours)
    category_cost_totals: list[dict[str, Decimal]] = [dict() for _ in periods]
    category_hour_totals: list[dict[str, Decimal]] = [dict() for _ in periods]

    for row in rows or []:
        distribution = list(getattr(row, "distribution", []) or [])
        if not distribution:
            continue
        line_cost_total = Decimal(str(getattr(row, "precio_total", 0) or 0))
        if line_cost_total <= 0:
            continue
        schedule_row = schedule_row_map.get(str(getattr(row, "linea_id", "")))
        category_hours_source = {
            "Equipos": Decimal(str(getattr(schedule_row, "horas_equipos", 0) or 0)),
            "Mano de obra": Decimal(str(getattr(schedule_row, "horas_mano_obra", 0) or 0)),
            "Transporte": Decimal(str(getattr(schedule_row, "horas_transporte", 0) or 0)),
        }
        category_hours_total = sum(category_hours_source.values(), Decimal("0"))
        normalized_categories = (
            category_hours_source
            if category_hours_total > 0
            else {"Sin categoría": Decimal("1")}
        )
        normalized_total = sum(normalized_categories.values(), Decimal("0")) or Decimal("1")

        for index, pct in enumerate(distribution[: len(periods)]):
            pct_decimal = Decimal(str(pct or 0))
            if pct_decimal <= 0:
                continue
            period_cost = line_cost_total * pct_decimal / Decimal("100")
            for category_label, category_hours in normalized_categories.items():
                share = category_hours / normalized_total if normalized_total > 0 else Decimal("0")
                category_cost = period_cost * share
                category_cost_totals[index][category_label] = category_cost_totals[index].get(category_label, Decimal("0")) + category_cost
                if schedule_row is not None:
                    period_category_hours = category_hours * pct_decimal / Decimal("100")
                    category_hour_totals[index][category_label] = category_hour_totals[index].get(category_label, Decimal("0")) + period_category_hours

    enriched: list[CronogramaCashFlowPoint] = []
    for index, point in enumerate(cash_flow):
        point_category_costs = {
            key: float(round_decimal(value, dec_moneda))
            for key, value in category_cost_totals[index].items()
            if abs(float(value)) > 0.000001
        }
        point_category_hours = {
            key: float(round_decimal(value, dec_calculos))
            for key, value in category_hour_totals[index].items()
            if abs(float(value)) > 0.000001
        }
        dominant_category = None
        if point_category_costs:
            dominant_category = max(point_category_costs.items(), key=lambda item: abs(item[1]))[0]
        point_payload = point.model_dump()
        point_payload["category_costs"] = point_category_costs
        point_payload["category_hours"] = point_category_hours
        point_payload["dominant_category"] = dominant_category
        enriched.append(
            CronogramaCashFlowPoint(**point_payload)
        )
    return enriched


def _validate_distribution(distribution: list[float], period_count: int, *, detail: str, max_deviation: float = 5.0) -> list[float]:
    if period_count <= 0:
        raise HTTPException(status_code=400, detail="No se pudieron calcular periodos para el cronograma.")
    if len(distribution) != period_count:
        raise HTTPException(status_code=400, detail=detail)
    normalized = [float(value) for value in distribution]
    total = float(round_decimal(as_decimal(sum(normalized), "0"), 6))

    if abs(total - 100) > max_deviation:
        raise HTTPException(status_code=400, detail="La distribución debe sumar 100%.")

    balanced = _round_distribution(normalized, 6)
    balanced_total = float(round_decimal(as_decimal(sum(balanced), "0"), 6))
    if abs(balanced_total - 100) > 0.001:
        raise HTTPException(status_code=400, detail="La distribución debe sumar 100%.")
    return balanced


def _check_write_permissions(current_user: Usuario):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para editar cronogramas.")

def _verify_module_access(db: Session, proyecto_id: int, usuario_id: int):
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return
    if "todos" in perms["allowed_modules"] or "cronogramas" in perms["allowed_modules"]:
        return
    raise HTTPException(status_code=403, detail="Acceso denegado al módulo cronogramas")


def _resolve_budget(
    db: Session,
    presupuesto_id: int,
    current_user: Usuario,
    empresa_id: Optional[int],
) -> Presupuesto:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    presupuesto = (
        db.query(Presupuesto)
        .options(joinedload(Presupuesto.proyecto), joinedload(Presupuesto.detalle))
        .filter(Presupuesto.id == presupuesto_id, Presupuesto.empresa_id == target_empresa_id)
        .first()
    )
    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    return presupuesto


def _get_or_create_cronograma(db: Session, presupuesto: Presupuesto) -> CronogramaValorado:
    cronograma = (
        db.query(CronogramaValorado)
        .filter(CronogramaValorado.presupuesto_id == presupuesto.id)
        .first()
    )
    if cronograma:
        return cronograma

    cronograma = CronogramaValorado(
        empresa_id=presupuesto.empresa_id,
        proyecto_id=presupuesto.proyecto_id,
        presupuesto_id=presupuesto.id,
        period_type="mensual",
        distribution_mode="gantt",
        global_distribution=[],
        line_distribution_overrides={},
    )
    db.add(cronograma)
    db.commit()
    db.refresh(cronograma)
    return cronograma


def _serialize_cronograma(
    db: Session,
    presupuesto: Presupuesto,
    cronograma: CronogramaValorado,
) -> CronogramaValoradoResponse:
    codigo_root = presupuesto.proyecto.codigo_root or presupuesto.proyecto.codigo
    project_detail = None
    if codigo_root:
        project_detail = (
            db.query(ProyectoDetalle)
            .filter(ProyectoDetalle.codigo_root == codigo_root, ProyectoDetalle.empresa_id == presupuesto.empresa_id)
            .first()
        )

    gantt_schedule = None
    try:
        gantt_schedule = cronograma_trabajo_service.get_schedule(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
        )
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        gantt_schedule = None

    gantt_config = getattr(gantt_schedule, "config", None)
    start_hour = _normalize_workday_start_hour(getattr(gantt_config, "hora_inicio_jornada", DEFAULT_WORKDAY_START_HOUR))
    workday_hours = _normalize_workday_hours(getattr(gantt_config, "jornada_laboral_horas", DEFAULT_WORKDAY_HOURS))

    start_at, end_at = _normalize_execution_window(project_detail, start_hour, workday_hours)
    periods = _build_periods(
        start_at,
        end_at,
        cronograma.period_type,
        project_detail.plazo_ejecucion if project_detail else None,
        start_hour=start_hour,
        workday_hours=workday_hours,
    )
    period_count = len(periods)

    gantt_distribution_map = (
        _build_gantt_distribution_map(db, presupuesto, periods, start_hour=start_hour, workday_hours=workday_hours)
        if cronograma.distribution_mode == "gantt"
        else {}
    )

    global_distribution = cronograma.global_distribution or []
    if cronograma.distribution_mode == "gantt":
        global_distribution = _build_homogeneous_distribution(period_count)
    elif cronograma.distribution_mode == "homogeneo" or not global_distribution:
        global_distribution = _build_homogeneous_distribution(period_count)
    else:
        try:
            global_distribution = _validate_distribution(
                list(global_distribution),
                period_count,
                detail="La distribución global no coincide con el número de periodos.",
            )
        except HTTPException:
            global_distribution = _build_homogeneous_distribution(period_count)

    line_overrides = cronograma.line_distribution_overrides or {}
    schedule_row_map = _build_schedule_row_map(gantt_schedule)
    rows: list[CronogramaLineaValorada] = []
    inversion_parcial = [0.0 for _ in range(period_count)]
    total_budget = 0.0

    for line in sorted(presupuesto.detalle, key=lambda item: ((item.orden or 0), item.id)):
        if not line.apu_id:
            continue
        override_key = str(line.id)
        override_distribution = line_overrides.get(override_key)
        temporal_source = "global_fallback"
        requires_manual_schedule = False
        is_material_only = False
        has_override = isinstance(override_distribution, list) and len(override_distribution) == period_count
        if has_override:
            try:
                distribution = _validate_distribution(
                    list(override_distribution),
                    period_count,
                    detail=f"La línea {line.descripcion} tiene una distribución inválida.",
                )
            except HTTPException:
                distribution = list(global_distribution)
                has_override = False
        else:
            gantt_distribution_entry = gantt_distribution_map.get(override_key) or {}
            if isinstance(gantt_distribution_entry, dict):
                derived_distribution = gantt_distribution_entry.get("distribution")
                temporal_source = gantt_distribution_entry.get("temporal_source")
                requires_manual_schedule = bool(gantt_distribution_entry.get("requires_manual_schedule"))
                is_material_only = bool(gantt_distribution_entry.get("is_material_only"))
            else:
                derived_distribution = gantt_distribution_entry
                temporal_source = "gantt_overlap" if gantt_distribution_entry else "global_fallback"
                requires_manual_schedule = False
                is_material_only = False

            distribution = _resolve_valued_line_distribution(
                period_count,
                derived_distribution,
                global_distribution,
                requires_manual_schedule=requires_manual_schedule,
            )
        if has_override:
            temporal_source = "line_override"
            requires_manual_schedule = False
            schedule_row = schedule_row_map.get(override_key) if gantt_schedule else None
            is_material_only = _is_schedule_row_material_only(schedule_row) if schedule_row else False

        precio_total = _decimal_to_float(line.precio_total)
        total_budget += precio_total
        for index, pct in enumerate(distribution):
            inversion_parcial[index] += precio_total * (pct / 100)

        rows.append(
            CronogramaLineaValorada(
                linea_id=line.id,
                codigo_item=line.codigo_item,
                apu_id=line.apu_id,
                descripcion=line.descripcion,
                unidad=line.unidad,
                cantidad=_decimal_to_float(line.cantidad),
                precio_unitario=_decimal_to_float(line.precio_unitario),
                precio_total=precio_total,
                distribution=distribution,
                has_override=has_override,
                temporal_source=temporal_source,
                requires_manual_schedule=requires_manual_schedule,
                is_material_only=is_material_only,
            )
        )

    dec_moneda = int(presupuesto.dec_moneda or 2)
    dec_calculos = int(presupuesto.dec_calculos or 4)

    inversion_parcial = [float(round_decimal(Decimal(str(value)), dec_moneda)) for value in inversion_parcial]
    inversion_acumulada: list[float] = []
    avance_parcial_pct: list[float] = []
    avance_acumulado_pct: list[float] = []
    running = Decimal("0.0")
    for value in inversion_parcial:
        running += Decimal(str(value))
        inversion_acumulada.append(float(round_decimal(running, dec_moneda)))
        
        avance_parcial_p = (Decimal(str(value)) / Decimal(str(total_budget)) * 100) if total_budget else Decimal("0.0")
        avance_parcial_pct.append(float(round_operational_calc(avance_parcial_p, dec_calculos)))
        
        avance_acum_p = (running / Decimal(str(total_budget)) * 100) if total_budget else Decimal("0.0")
        avance_acumulado_pct.append(float(round_operational_calc(avance_acum_p, dec_calculos)))

    footer = CronogramaFooter(
        inversion_parcial=inversion_parcial,
        avance_parcial_pct=avance_parcial_pct,
        inversion_acumulada=inversion_acumulada,
        avance_acumulado_pct=avance_acumulado_pct,
    )
    curve_s = [
        CronogramaCurvaSPoint(label=period.label, value=inversion_acumulada[index])
        for index, period in enumerate(periods)
    ]
    cash_flow = _build_cash_flow_with_resource_categories(
        periods,
        footer,
        rows,
        schedule_row_map=schedule_row_map,
        start_hour=start_hour,
        workday_hours=workday_hours,
        dec_moneda=dec_moneda,
        dec_calculos=dec_calculos,
    )

    return CronogramaValoradoResponse(
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
        presupuesto_descripcion=presupuesto.descripcion,
        moneda=presupuesto.moneda or "USD",
        dec_moneda=int(presupuesto.dec_moneda or 2),
        dec_calculos=int(presupuesto.dec_calculos or 4),
        period_type=cronograma.period_type,
        distribution_mode=cronograma.distribution_mode,
        periods=periods,
        global_distribution=global_distribution,
        rows=rows,
        footer=footer,
        curve_s=curve_s,
        cash_flow=cash_flow,
        has_line_overrides=bool(line_overrides),
        updated_at=cronograma.updated_at,
    )


@router.get("/valorados/{presupuesto_id}", response_model=CronogramaValoradoResponse)
def read_cronograma_valorado(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    cronograma = _get_or_create_cronograma(db, presupuesto)
    return _serialize_cronograma(db, presupuesto, cronograma)


@router.put("/valorados/{presupuesto_id}/config", response_model=CronogramaValoradoResponse)
def update_cronograma_valorado_config(
    presupuesto_id: int,
    payload: CronogramaConfigUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _check_write_permissions(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    cronograma = _get_or_create_cronograma(db, presupuesto)

    codigo_root = presupuesto.proyecto.codigo_root or presupuesto.proyecto.codigo
    project_detail = None
    if codigo_root:
        project_detail = (
            db.query(ProyectoDetalle)
            .filter(ProyectoDetalle.codigo_root == codigo_root, ProyectoDetalle.empresa_id == presupuesto.empresa_id)
            .first()
        )
    gantt_schedule = None
    try:
        gantt_schedule = cronograma_trabajo_service.get_schedule(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
        )
    except Exception:
        gantt_schedule = None

    gantt_config = getattr(gantt_schedule, "config", None)
    start_hour = _normalize_workday_start_hour(getattr(gantt_config, "hora_inicio_jornada", DEFAULT_WORKDAY_START_HOUR))
    workday_hours = _normalize_workday_hours(getattr(gantt_config, "jornada_laboral_horas", DEFAULT_WORKDAY_HOURS))
    start_at, end_at = _normalize_execution_window(project_detail, start_hour, workday_hours)
    periods = _build_periods(
        start_at,
        end_at,
        payload.period_type,
        project_detail.plazo_ejecucion if project_detail else None,
        start_hour=start_hour,
        workday_hours=workday_hours,
    )

    cronograma.period_type = payload.period_type
    cronograma.distribution_mode = payload.distribution_mode
    if payload.distribution_mode in {"homogeneo", "gantt"}:
        cronograma.global_distribution = _build_homogeneous_distribution(len(periods))
    else:
        cronograma.global_distribution = _validate_distribution(
            payload.global_distribution,
            len(periods),
            detail="La distribución global no coincide con el número de periodos.",
        )
    if payload.clear_line_overrides:
        cronograma.line_distribution_overrides = {}
    db.add(cronograma)
    db.commit()
    db.refresh(cronograma)

    record_audit_event(
        db,
        module="cronogramas",
        event_type="cronograma_config_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto",
        entity_id=presupuesto.id,
        message=f"Cronograma valorado actualizado para presupuesto {presupuesto.id}",
        payload={
            "period_type": cronograma.period_type,
            "distribution_mode": cronograma.distribution_mode,
            "periods": len(periods),
            "clear_line_overrides": payload.clear_line_overrides,
        },
    )
    return _serialize_cronograma(db, presupuesto, cronograma)


@router.put("/valorados/{presupuesto_id}/lineas/{linea_id}", response_model=CronogramaValoradoResponse)
def update_cronograma_valorado_line(
    presupuesto_id: int,
    linea_id: int,
    payload: CronogramaLineaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _check_write_permissions(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    cronograma = _get_or_create_cronograma(db, presupuesto)

    line = next((item for item in presupuesto.detalle if item.id == linea_id and item.apu_id), None)
    if not line:
        raise HTTPException(status_code=404, detail="Línea de presupuesto no encontrada para cronograma.")

    serialized = _serialize_cronograma(db, presupuesto, cronograma)
    distribution = _validate_distribution(
        payload.distribution,
        len(serialized.periods),
        detail="La distribución de la línea no coincide con el número de periodos.",
    )

    current_overrides = dict(cronograma.line_distribution_overrides or {})
    current_overrides[str(linea_id)] = distribution
    cronograma.line_distribution_overrides = current_overrides
    db.add(cronograma)
    db.commit()
    db.refresh(cronograma)

    record_audit_event(
        db,
        module="cronogramas",
        event_type="cronograma_line_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto_detalle",
        entity_id=linea_id,
        message=f"Cronograma valorado ajustado manualmente en línea {linea_id}",
        payload={
            "presupuesto_id": presupuesto.id,
            "linea_id": linea_id,
            "period_type": cronograma.period_type,
        },
    )
    return _serialize_cronograma(db, presupuesto, cronograma)


@router.delete("/valorados/{presupuesto_id}/lineas/{linea_id}", response_model=CronogramaValoradoResponse)
def reset_cronograma_valorado_line(
    presupuesto_id: int,
    linea_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _check_write_permissions(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    cronograma = _get_or_create_cronograma(db, presupuesto)

    current_overrides = dict(cronograma.line_distribution_overrides or {})
    current_overrides.pop(str(linea_id), None)
    cronograma.line_distribution_overrides = current_overrides
    db.add(cronograma)
    db.commit()
    db.refresh(cronograma)

    record_audit_event(
        db,
        module="cronogramas",
        event_type="cronograma_line_reset",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto_detalle",
        entity_id=linea_id,
        message=f"Cronograma valorado restaurado a distribución global en línea {linea_id}",
        payload={"presupuesto_id": presupuesto.id, "linea_id": linea_id},
    )
    return _serialize_cronograma(db, presupuesto, cronograma)
