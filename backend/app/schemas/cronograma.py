from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


PeriodType = Literal["diario", "semanal", "quincenal", "mensual", "bimestral", "trimestral", "semestral", "anual"]
DistributionMode = Literal["homogeneo", "usuario", "gantt"]


class CronogramaPeriodo(BaseModel):
    id: str
    label: str
    starts_at: datetime
    ends_at: datetime


class CronogramaLineaValorada(BaseModel):
    linea_id: int
    codigo_item: Optional[str] = None
    apu_id: Optional[int] = None
    descripcion: str
    unidad: Optional[str] = None
    cantidad: float = 0
    precio_unitario: float = 0
    precio_total: float = 0
    distribution: list[float] = Field(default_factory=list)
    has_override: bool = False
    temporal_source: Optional[str] = None
    requires_manual_schedule: bool = False
    is_material_only: bool = False


class CronogramaFooter(BaseModel):
    inversion_parcial: list[float] = Field(default_factory=list)
    avance_parcial_pct: list[float] = Field(default_factory=list)
    inversion_acumulada: list[float] = Field(default_factory=list)
    avance_acumulado_pct: list[float] = Field(default_factory=list)


class CronogramaCurvaSPoint(BaseModel):
    label: str
    value: float


class CronogramaCashFlowPoint(BaseModel):
    period_id: str
    label: str
    starts_at: datetime
    ends_at: datetime
    work_hours: float = 0
    cost: float = 0
    cumulative_cost: float = 0
    cost_pct: float = 0
    cumulative_pct: float = 0
    category_costs: dict[str, float] = Field(default_factory=dict)
    category_hours: dict[str, float] = Field(default_factory=dict)
    dominant_category: Optional[str] = None


class CronogramaValoradoResponse(BaseModel):
    presupuesto_id: int
    proyecto_id: int
    empresa_id: int
    presupuesto_descripcion: str
    moneda: str = "USD"
    dec_moneda: int = 2
    dec_calculos: int = 4
    period_type: PeriodType
    distribution_mode: DistributionMode
    periods: list[CronogramaPeriodo] = Field(default_factory=list)
    global_distribution: list[float] = Field(default_factory=list)
    rows: list[CronogramaLineaValorada] = Field(default_factory=list)
    footer: CronogramaFooter
    curve_s: list[CronogramaCurvaSPoint] = Field(default_factory=list)
    cash_flow: list[CronogramaCashFlowPoint] = Field(default_factory=list)
    has_line_overrides: bool = False
    updated_at: Optional[datetime] = None


class CronogramaConfigUpdate(BaseModel):
    period_type: PeriodType
    distribution_mode: DistributionMode = "gantt"
    global_distribution: list[float] = Field(default_factory=list)
    clear_line_overrides: bool = False

    @model_validator(mode="after")
    def validate_distribution(self):
        if self.distribution_mode == "usuario" and not self.global_distribution:
            raise ValueError("Debe indicar una distribución global cuando el modo es definido por usuario.")
        return self


class CronogramaLineaUpdate(BaseModel):
    distribution: list[float] = Field(default_factory=list)


class CronogramaLineaBulkItem(BaseModel):
    linea_id: int
    distribution: list[float] = Field(default_factory=list)


class CronogramaLineBulkUpdate(BaseModel):
    lines: list[CronogramaLineaBulkItem] = Field(default_factory=list)
