from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Bim4dResourceCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=2, max_length=255)
    resource_type: Literal["labor", "equipment", "material", "location", "cost"]
    unit: str = Field(min_length=1, max_length=30)
    capacity_per_day: float = Field(gt=0)
    source_kind: Literal["bim_native", "classic_snapshot"] = "bim_native"
    source_ref: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate_source(self):
        if self.source_kind == "classic_snapshot" and not self.source_ref:
            raise ValueError("source_ref es obligatorio para snapshots clasicos")
        return self


class Bim4dResourceResponse(Bim4dResourceCreate):
    contract_version: str = "giproy_bim_4d_resource_v1"
    id: int
    project_id: int
    company_id: int
    created_by: int | None
    created_at: datetime


class Bim4dResourceAssignmentCreate(BaseModel):
    resource_id: int = Field(gt=0)
    activity_snapshot_id: int = Field(gt=0)
    demand_per_day: float = Field(gt=0)


class Bim4dResourceAssignmentResponse(Bim4dResourceAssignmentCreate):
    contract_version: str = "giproy_bim_4d_resource_assignment_v1"
    id: int
    project_id: int
    company_id: int
    created_by: int | None
    created_at: datetime


class Bim4dResourceHistogramPoint(BaseModel):
    date: date
    demand: float
    capacity: float
    utilization_percent: float
    overloaded: bool


class Bim4dResourceHistogramResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_resource_histogram_v1"
    project_id: int
    company_id: int
    resource: Bim4dResourceResponse
    range_start: date | None
    range_finish: date | None
    overloaded_days: int
    peak_demand: float
    points: list[Bim4dResourceHistogramPoint]


class Bim4dFieldResourceMovementCreate(BaseModel):
    resource_id: int = Field(gt=0)
    activity_snapshot_id: int | None = Field(default=None, gt=0)
    work_area_id: int | None = Field(default=None, gt=0)
    movement_type: Literal["receipt", "consume", "return"]
    quantity: float = Field(gt=0)
    occurred_at: datetime
    reference: str | None = Field(default=None, max_length=120)
    note: str = Field(min_length=3, max_length=2000)

    @model_validator(mode="after")
    def validate_consumption_context(self):
        if self.movement_type == "consume" and self.activity_snapshot_id is None:
            raise ValueError("activity_snapshot_id es obligatorio para consumos")
        return self


class Bim4dFieldResourceMovementResponse(Bim4dFieldResourceMovementCreate):
    contract_version: str = "giproy_bim_4d_field_resource_movement_v1"
    id: int
    project_id: int
    company_id: int
    balance_after: float
    created_by: int | None
    created_at: datetime


class Bim4dCrewCreate(BaseModel):
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=180)
    trade: str = Field(min_length=2, max_length=120)
    member_count: int = Field(gt=0, le=500)
    active: bool = True
    note: str = Field(default="", max_length=2000)


class Bim4dCrewResponse(Bim4dCrewCreate):
    contract_version: str = "giproy_bim_4d_crew_v1"
    id: int
    project_id: int
    company_id: int
    created_by: int | None
    created_at: datetime


class Bim4dTimecardCreate(BaseModel):
    crew_id: int = Field(gt=0)
    activity_snapshot_id: int = Field(gt=0)
    work_area_id: int | None = Field(default=None, gt=0)
    work_date: date
    regular_hours: float = Field(ge=0, le=24)
    overtime_hours: float = Field(ge=0, le=24)
    installed_quantity: float = Field(ge=0)
    installed_unit: str = Field(min_length=1, max_length=30)
    note: str = Field(min_length=3, max_length=2000)

    @model_validator(mode="after")
    def validate_hours(self):
        if self.regular_hours + self.overtime_hours <= 0:
            raise ValueError("El parte debe registrar horas de trabajo")
        if self.regular_hours + self.overtime_hours > 24:
            raise ValueError("La suma de horas no puede superar 24")
        return self


class Bim4dTimecardResponse(Bim4dTimecardCreate):
    contract_version: str = "giproy_bim_4d_timecard_v1"
    id: int
    project_id: int
    company_id: int
    total_hours: float
    crew_code: str
    crew_name: str
    created_by: int | None
    created_at: datetime
