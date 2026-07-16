from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCostSovLine(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)
    scheduled_value: float = Field(gt=0)


class BimCostSovCreate(BaseModel):
    contract_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    lines: list[BimCostSovLine] = Field(min_length=1)


class BimCostSovDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimCostSovResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_sov_v1"
    id: int
    project_id: int
    company_id: int
    contract_id: int
    contract_number: str
    revision: str
    lines: list[dict]
    total_scheduled_value: float
    contract_committed_amount: float
    currency: str
    status: Literal["draft", "approved", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
