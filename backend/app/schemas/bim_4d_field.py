from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class Bim4dFieldReportCreate(BaseModel):
    activity_snapshot_id: int = Field(gt=0)
    work_area_id: int | None = Field(default=None, gt=0)
    reported_at: datetime
    progress_percent: float = Field(ge=0, le=100)
    actual_start: datetime | None = None
    actual_finish: datetime | None = None
    installed_quantity: float = Field(ge=0)
    installed_unit: str = Field(min_length=1, max_length=30)
    labor_hours: float = Field(ge=0)
    equipment_hours: float = Field(ge=0)
    budget_at_completion: float = Field(ge=0)
    planned_value_to_date: float = Field(ge=0)
    actual_cost: float = Field(ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    daily_log: str = Field(min_length=3, max_length=10000)

    @model_validator(mode="after")
    def validate_finish(self):
        if self.progress_percent == 100 and not self.actual_finish:
            raise ValueError("actual_finish es obligatorio al reportar 100%")
        return self


class Bim4dFieldEvidenceResponse(BaseModel):
    id: int
    field_report_id: int
    filename: str
    content_type: str
    byte_size: int
    checksum_sha256: str
    uploaded_by: int | None
    uploaded_at: datetime


class Bim4dFieldReportResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_field_report_v1"
    id: int
    project_id: int
    company_id: int
    activity_snapshot_id: int
    progress_snapshot_id: int
    work_area_id: int | None
    reported_at: datetime
    progress_percent: float
    installed_quantity: float
    installed_unit: str
    labor_hours: float
    equipment_hours: float
    budget_at_completion: float
    planned_value_to_date: float
    earned_value: float
    actual_cost: float
    currency: str
    schedule_performance_index: float | None
    cost_performance_index: float | None
    daily_log: str
    evidence: list[Bim4dFieldEvidenceResponse]
    created_by: int | None
    created_at: datetime
