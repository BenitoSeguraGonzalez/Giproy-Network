from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimRolloutPlanRequest(BaseModel):
    stage: Literal["internal", "shadow", "pilot", "expanded"]
    status: Literal["draft", "ready", "active", "paused", "rolled_back"] = "draft"
    checklist: dict[str, bool] = Field(default_factory=dict)
    support_owner: str = Field(min_length=2, max_length=255)
    exit_criteria: str = Field(min_length=10, max_length=4000)
    rollback_procedure: str = Field(min_length=10, max_length=4000)


class BimRolloutPlanResponse(BimRolloutPlanRequest):
    contract_version: str = "giproy_bim_rollout_v1"
    id: int
    company_id: int
    rollback_rehearsed_at: datetime | None
    rollback_rehearsed_by: int | None
    updated_by: int | None
    ready_for_activation: bool
