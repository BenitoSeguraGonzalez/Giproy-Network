from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Bim4dUnplannedEventCreate(BaseModel):
    activity_snapshot_id: int = Field(gt=0)
    work_area_id: int | None = Field(default=None, gt=0)
    event_type: Literal["weather", "design_change", "supply", "safety", "quality", "other"]
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=3, max_length=2000)
    occurred_at: datetime
    delay_days: float = Field(default=0, ge=0, le=3650)
    actual_cost: float = Field(default=0, ge=0, le=1_000_000_000)


class Bim4dUnplannedEventDecision(BaseModel):
    action: Literal["validate", "void"]
    reason: str = Field(min_length=3, max_length=1000)


class Bim4dUnplannedEventResponse(Bim4dUnplannedEventCreate):
    contract_version: str = "giproy_bim_4d_unplanned_event_v1"
    id: int
    project_id: int
    company_id: int
    status: str
    decision_reason: str | None
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
