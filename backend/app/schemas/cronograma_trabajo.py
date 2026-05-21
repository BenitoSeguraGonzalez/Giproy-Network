from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator
from app.schemas.project_calendar import ProjectHolidayCalendarResponse
from app.schemas.cronograma import CronogramaValoradoResponse


def _normalize_slot_time(value: Any, default: str = "00:00") -> str:
    raw_value = default if value is None else value
    if isinstance(raw_value, (int, float)):
        numeric_value = max(0.0, min(float(raw_value), 24.0))
        hour = int(numeric_value)
        minute = int(round((numeric_value - hour) * 60))
        if minute >= 60:
            hour += 1
            minute = 0
        if hour >= 24:
            return "24:00"
        return f"{hour:02d}:{minute:02d}"

    text = str(raw_value or default).strip()
    if not text:
        text = default
    try:
        if ":" not in text and "." in text:
            return _normalize_slot_time(float(text), default)
    except Exception:
        pass
    parts = text.split(":")
    try:
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
    except Exception:
        hour, minute = [int(part) for part in default.split(":")]
    total_minutes = max(0, min(hour * 60 + minute, 24 * 60))
    if total_minutes == 24 * 60:
        return "24:00"
    return f"{total_minutes // 60:02d}:{total_minutes % 60:02d}"


def _slot_time_to_minutes(value: str) -> int:
    hour, minute = [int(part) for part in value.split(":")]
    return hour * 60 + minute


class CronogramaTrabajoTimeSlot(BaseModel):
    start: str = "08:00"
    end: str = "16:00"
    description: Optional[str] = None

    @field_validator("start", "end", mode="before")
    @classmethod
    def normalize_time(cls, value):
        return _normalize_slot_time(value)

    @model_validator(mode="after")
    def validate_range(self):
        if _slot_time_to_minutes(self.end) <= _slot_time_to_minutes(self.start):
            raise ValueError("time slot end must be greater than start")
        return self


class CronogramaTrabajoWeeklyDay(BaseModel):
    day: int = Field(default=0, ge=0, le=6)
    is_working_day: bool = True
    slots: List[CronogramaTrabajoTimeSlot] = Field(default_factory=list)

    @field_validator("day", mode="before")
    @classmethod
    def normalize_day(cls, value):
        try:
            return max(0, min(int(value), 6))
        except Exception:
            return 0

    @model_validator(mode="after")
    def validate_slots(self):
        ordered = sorted(self.slots, key=lambda slot: _slot_time_to_minutes(slot.start))
        previous_end = None
        for slot in ordered:
            start_minutes = _slot_time_to_minutes(slot.start)
            end_minutes = _slot_time_to_minutes(slot.end)
            if previous_end is not None and start_minutes < previous_end:
                raise ValueError("weekly time slots must not overlap")
            previous_end = end_minutes
        self.slots = ordered
        if not self.slots:
            self.is_working_day = False
        return self


class CronogramaTrabajoDateException(BaseModel):
    date: str
    is_working_day: Optional[bool] = None
    slots: Optional[List[CronogramaTrabajoTimeSlot]] = None
    description: Optional[str] = None

    @field_validator("date", mode="before")
    @classmethod
    def normalize_date(cls, value):
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, date):
            return value.isoformat()
        text = str(value or "").strip()[:10]
        try:
            return datetime.fromisoformat(text).date().isoformat()
        except Exception as exc:
            raise ValueError("date exception must use YYYY-MM-DD") from exc

    @model_validator(mode="after")
    def validate_slots(self):
        if self.slots is None:
            return self
        ordered = sorted(self.slots, key=lambda slot: _slot_time_to_minutes(slot.start))
        previous_end = None
        for slot in ordered:
            start_minutes = _slot_time_to_minutes(slot.start)
            if previous_end is not None and start_minutes < previous_end:
                raise ValueError("exception time slots must not overlap")
            previous_end = _slot_time_to_minutes(slot.end)
        self.slots = ordered
        if self.slots == [] and self.is_working_day is None:
            self.is_working_day = False
        return self


class CronogramaTrabajoAdvancedCalendar(BaseModel):
    enabled: bool = False
    mode: Literal["simple", "advanced"] = "simple"
    weekly_pattern: List[CronogramaTrabajoWeeklyDay] = Field(default_factory=list)
    date_exceptions: List[CronogramaTrabajoDateException] = Field(default_factory=list)
    holidays: List[CronogramaTrabajoDateException] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_calendar(self):
        if not self.enabled:
            self.mode = "simple"
        elif self.mode != "advanced":
            self.mode = "advanced"

        seen_days = set()
        ordered_days = []
        for item in sorted(self.weekly_pattern, key=lambda day: day.day):
            if item.day in seen_days:
                raise ValueError("weekly pattern must not duplicate weekdays")
            seen_days.add(item.day)
            ordered_days.append(item)
        self.weekly_pattern = ordered_days

        seen_dates = set()
        ordered_exceptions = []
        for item in sorted(self.date_exceptions, key=lambda exception: exception.date):
            if item.date in seen_dates:
                raise ValueError("date exceptions must not duplicate dates")
            seen_dates.add(item.date)
            ordered_exceptions.append(item)
        self.date_exceptions = ordered_exceptions

        seen_holidays = set()
        ordered_holidays = []
        for item in sorted(self.holidays, key=lambda exception: exception.date):
            if item.date in seen_holidays:
                raise ValueError("holidays must not duplicate dates")
            seen_holidays.add(item.date)
            ordered_holidays.append(item)
        self.holidays = ordered_holidays
        return self


class CronogramaTrabajoConfig(BaseModel):
    hora_inicio_jornada: float = 8.0
    jornada_laboral_horas: float = 8.0
    dias_laborables_semana: int = 5
    dias_laborables_mes: float = 22.0
    dias_mes: float = 30.0
    recursos_asumidos_base: float = 1.0
    fecha_inicio_proyecto: Optional[datetime] = None
    fecha_fin_objetivo_proyecto: Optional[datetime] = None
    manual_milestones: List[Dict[str, Any]] = Field(default_factory=list)
    advanced_calendar: CronogramaTrabajoAdvancedCalendar = Field(
        default_factory=CronogramaTrabajoAdvancedCalendar
    )


class CronogramaTrabajoDependency(BaseModel):
    source_id: int
    target_id: Optional[int] = None
    type: Literal["FS", "SS", "FF", "SF"] = "FS"
    lag_days: float = 0.0
    lag_unit: Literal["day", "hour", "minute", "percent"] = "day"
    lag_mode: Optional[Literal["duration", "percent"]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, value):
        normalized = str(value or "FS").strip().upper()
        return {"FC": "FS", "CC": "SS", "CF": "SF"}.get(normalized, normalized)

    @field_validator("lag_unit", mode="before")
    @classmethod
    def normalize_lag_unit(cls, value):
        normalized = str(value or "day").strip().lower()
        if normalized in {"h", "hr", "hrs"}:
            return "hour"
        if normalized in {"m", "min", "mins", "minutes"}:
            return "minute"
        if normalized in {"%", "percentage"}:
            return "percent"
        return normalized


class CronogramaTrabajoLinea(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration: Optional[float] = None
    predecessors: List[int] = Field(default_factory=list)
    dependencies: List[CronogramaTrabajoDependency] = Field(default_factory=list)
    progress_pct: float = 0.0
    assumed_resource_units: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CronogramaTrabajoComputedRow(BaseModel):
    linea_id: int
    presupuesto_linea_id: int
    sequence_index: int = 0
    edt_id: int
    apu_id: Optional[int] = None
    codigo_item: Optional[str] = None
    descripcion: str
    unidad: Optional[str] = None
    cantidad: float = 0.0
    tipo: str = "apu"
    calculation_mode: str = "simple"
    nested_apu_count: int = 0
    native_line_count: int = 0
    nested_line_count: int = 0
    rendimiento_unitario_equipos: float = 0.0
    rendimiento_unitario_mano_obra: float = 0.0
    rendimiento_unitario_transporte: float = 0.0
    trabajo_equipos: float = 0.0
    trabajo_mano_obra: float = 0.0
    trabajo_transporte: float = 0.0
    trabajo_gobernante: float = 0.0
    rendimiento_gobernante_categoria: Optional[str] = None
    recurso_gobernante_id: Optional[int] = None
    recurso_gobernante_nombre: Optional[str] = None
    recurso_gobernante_categoria_detalle: Optional[str] = None
    recurso_gobernante_criterio: Optional[str] = None
    recurso_gobernante_costo_hora: float = 0.0
    trabajo_total: float = 0.0
    trabajo_propio: float = 0.0
    trabajo_hijos: float = 0.0
    cuadrilla_equipos: float = 0.0
    cuadrilla_mano_obra: float = 0.0
    cuadrilla_total: float = 0.0
    cuadrilla_propia: float = 0.0
    cuadrilla_hijos: float = 0.0
    horas_equipos: float = 0.0
    horas_mano_obra: float = 0.0
    horas_transporte: float = 0.0
    horas_total: float = 0.0
    recursos_calculados: float = 0.0
    recursos_asumidos: float = 0.0
    duracion_horas: float = 0.0
    dias_utiles: float = 0.0
    dias_calendario: float = 0.0
    duracion_horas_exportacion: float = 0.0
    dias_utiles_exportacion: float = 0.0
    dias_calendario_exportacion: float = 0.0
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    predecessors: List[int] = Field(default_factory=list)
    dependencies: List[CronogramaTrabajoDependency] = Field(default_factory=list)
    progress_pct: float = 0.0
    categorias: Dict[str, float] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CronogramaTrabajoSummary(BaseModel):
    partidas_calculables: int = 0
    trabajo_total: float = 0.0
    cuadrilla_total: float = 0.0
    horas_total: float = 0.0
    horas_equipos: float = 0.0
    horas_mano_obra: float = 0.0
    horas_transporte: float = 0.0
    recursos_calculados_total: float = 0.0
    dias_utiles_total: float = 0.0
    dias_calendario_total: float = 0.0


class CronogramaTrabajoParetoItem(BaseModel):
    id: int
    codigo: Optional[str] = None
    descripcion: str
    edt_id: int
    linea_id: int
    apu_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: float = 0.0
    duration_hours: float = 0.0
    work_hours: float = 0.0
    cost_value: float = 0.0
    cost_pct: float = 0.0
    time_value: float = 0.0
    time_pct: float = 0.0
    integrated_value: float = 0.0
    integrated_pct: float = 0.0
    metric_value: float = 0.0
    porcentaje: float = 0.0
    porcentaje_acumulado: float = 0.0
    ranking: int = 0
    is_critical: bool = False


class CronogramaTrabajoParetoResponse(BaseModel):
    presupuesto_id: int
    view: Literal["cost", "time", "integrated"] = "integrated"
    metric_label: str
    total: float = 0.0
    total_items: int = 0
    visible_items: int = 0
    visible_acumulado: float = 0.0
    items: List[CronogramaTrabajoParetoItem] = Field(default_factory=list)


class CronogramaTrabajoExportCapabilities(BaseModel):
    preferred_format: str = "xml"
    available_formats: List[str] = Field(default_factory=lambda: ["xml"])
    direct_mpp_available: bool = False
    direct_export_reason: Optional[str] = None
    template_name: Optional[str] = None


class CronogramaTrabajoResponse(BaseModel):
    id: int
    presupuesto_id: int
    proyecto_id: int
    empresa_id: int
    config: CronogramaTrabajoConfig
    schedule_data: Dict[str, CronogramaTrabajoLinea]
    rows: List[CronogramaTrabajoComputedRow]
    summary: CronogramaTrabajoSummary
    export_capabilities: CronogramaTrabajoExportCapabilities
    holiday_calendar: Optional[ProjectHolidayCalendarResponse] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CronogramaTrabajoUpdate(BaseModel):
    config: Optional[CronogramaTrabajoConfig] = None
    schedule_data: Dict[str, CronogramaTrabajoLinea] = Field(default_factory=dict)


class CronogramaTrabajoDeltaResponse(BaseModel):
    id: int
    presupuesto_id: int
    proyecto_id: int
    empresa_id: int
    response_mode: Literal["delta"] = "delta"
    schedule_data: Dict[str, CronogramaTrabajoLinea] = Field(default_factory=dict)
    rows: List[Dict[str, Any]] = Field(default_factory=list)
    summary: Optional[CronogramaTrabajoSummary] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CronogramaTrabajoInterparentMergeRequest(BaseModel):
    linea_id: int
    source_parent_initial_id: str
    target_parent_initial_id: str
    source_period_id: str
    target_period_id: str
    percent_to_move: float = 0.0
    merged_subbars: List[Dict[str, Any]] = Field(default_factory=list)


class CronogramaTrabajoInterparentMergeResponse(BaseModel):
    cronograma: CronogramaValoradoResponse
    trabajo: CronogramaTrabajoResponse


class CronogramaTrabajoFullResetResponse(BaseModel):
    cronograma: CronogramaValoradoResponse
    trabajo: CronogramaTrabajoResponse
