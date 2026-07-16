from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Bim4dLevelingCreate(BaseModel):
    baseline_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    resource_ids: list[int] = Field(default_factory=list)
    max_shift_days: int = Field(default=365, ge=0, le=3650)


class Bim4dLevelingDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class Bim4dLevelingResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_resource_leveling_v1"
    id: int
    project_id: int
    company_id: int
    baseline_id: int
    project_revision: int
    revision: str
    inputs: dict
    result: dict
    checksum_sha256: str
    status: Literal["proposed", "approved", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
