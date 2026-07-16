from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Bim4dSafetyZone(BaseModel):
    x: float
    y: float
    z: float
    radius: float = Field(gt=0, le=1000)


class Bim4dSafetyRiskCreate(BaseModel):
    activity_snapshot_id: int = Field(gt=0)
    element_id: int | None = Field(default=None, gt=0)
    work_area_id: int | None = Field(default=None, gt=0)
    title: str = Field(min_length=3, max_length=255)
    hazard_type: Literal["fall", "collision", "lifting", "excavation", "electrical", "general"] = "general"
    severity: int = Field(ge=1, le=5)
    likelihood: int = Field(ge=1, le=5)
    controls: list[str] = Field(min_length=1, max_length=20)
    zone: Bim4dSafetyZone
    active_start: datetime
    active_finish: datetime

    @model_validator(mode="after")
    def valid_window(self):
        if self.active_finish <= self.active_start:
            raise ValueError("La ventana de riesgo debe tener duracion positiva.")
        return self


class Bim4dSafetyRiskResponse(Bim4dSafetyRiskCreate):
    contract_version: str = "giproy_bim_4d_safety_risk_v1"
    id: int
    project_id: int
    company_id: int
    risk_score: int
    status: str
    created_by: int | None
    created_at: datetime


class Bim4dSafetyChecklistItem(BaseModel):
    label: str = Field(min_length=3, max_length=255)
    passed: bool
    note: str | None = Field(default=None, max_length=500)


class Bim4dSafetyInspectionCreate(BaseModel):
    inspected_at: datetime
    result: Literal["compliant", "observation", "non_compliant"]
    note: str = Field(min_length=3, max_length=2000)
    evidence_ref: str | None = Field(default=None, max_length=500)
    checklist: list[Bim4dSafetyChecklistItem] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def result_matches_checklist(self):
        has_failure = any(not item.passed for item in self.checklist)
        if self.result == "compliant" and has_failure:
            raise ValueError("Una inspeccion conforme no puede contener checks fallidos.")
        if self.result == "non_compliant" and not has_failure:
            raise ValueError("Una inspeccion no conforme requiere al menos un check fallido.")
        return self


class Bim4dSafetyInspectionResponse(Bim4dSafetyInspectionCreate):
    contract_version: str = "giproy_bim_4d_safety_inspection_v1"
    id: int
    risk_id: int
    project_id: int
    company_id: int
    inspected_by: int | None
    created_at: datetime


class Bim4dSafetyPunchCreate(BaseModel):
    inspection_id: int = Field(gt=0)
    title: str = Field(min_length=3, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    priority: Literal["low", "normal", "high", "critical"] = "normal"
    due_at: datetime | None = None


class Bim4dSafetyPunchUpdate(BaseModel):
    status: Literal["open", "in_progress", "closed"]


class Bim4dSafetyPunchResponse(Bim4dSafetyPunchCreate):
    contract_version: str = "giproy_bim_4d_safety_punch_v1"
    id: int
    risk_id: int
    project_id: int
    company_id: int
    status: str
    created_by: int | None
    closed_by: int | None
    created_at: datetime
    closed_at: datetime | None


class Bim4dSafetyExposureResponse(BaseModel):
    risk_id: int
    motion_plan_id: int
    exposed: bool
    minimum_distance: float
    exclusion_distance: float
    sampled_points: int
