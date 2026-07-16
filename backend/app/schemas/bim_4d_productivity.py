from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.bim_quantity import BimQuantityCandidate


class Bim4dProductivityProposalCreate(BaseModel):
    element_id: int = Field(gt=0)
    activity_snapshot_id: int = Field(gt=0)
    target_type: Literal["activity", "edt", "presupuesto", "apu"] = "activity"
    target_id: int = Field(gt=0)
    candidate: BimQuantityCandidate
    productivity_value: float = Field(gt=0)
    crew_size: float = Field(gt=0)
    resource_code: str = Field(min_length=1, max_length=100)
    resource_name: str = Field(min_length=2, max_length=255)


class Bim4dProductivityDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)


class Bim4dProductivityProposalResponse(Bim4dProductivityProposalCreate):
    contract_version: str = "giproy_bim_4d_productivity_proposal_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    global_id: str
    calculated_duration_days: float
    formula: str
    status: str
    decision_reason: str | None
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
