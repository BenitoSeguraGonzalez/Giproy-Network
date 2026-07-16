from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCostForecastCreate(BaseModel):
    revision: str = Field(min_length=1, max_length=100)
    currency: str = Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    estimate_to_complete: float = Field(ge=0)
    rationale: str = Field(min_length=5, max_length=2000)


class BimCostForecastDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimCostForecastResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_forecast_v1"
    id: int
    project_id: int
    company_id: int
    estimate_id: int
    revision: str
    currency: str
    baseline_budget: float
    committed_cost: float
    actual_cost: float
    estimate_to_complete: float
    forecast_at_completion: float
    variance_at_completion: float
    rationale: str
    status: Literal["draft", "approved", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
