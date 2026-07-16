from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BimCostChangeOrderCreate(BaseModel):
    contract_id: int = Field(gt=0)
    change_number: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=5, max_length=4000)
    requested_cost_delta: float
    requested_schedule_days: int = Field(default=0, ge=-3650, le=3650)

    @model_validator(mode="after")
    def validate_delta(self):
        if self.requested_cost_delta == 0 and self.requested_schedule_days == 0:
            raise ValueError("La orden debe solicitar impacto de coste o plazo.")
        return self


class BimCostChangeOrderTransition(BaseModel):
    target_status: Literal["submitted", "cancelled"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimCostChangeOrderDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)
    approved_cost_delta: float | None = None
    approved_schedule_days: int | None = Field(default=None, ge=-3650, le=3650)


class BimCostChangeOrderResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_change_order_v1"
    id: int
    project_id: int
    company_id: int
    contract_id: int
    contract_number: str
    change_number: str
    title: str
    description: str
    currency: str
    requested_cost_delta: float
    requested_schedule_days: int
    approved_cost_delta: float | None
    approved_schedule_days: int | None
    contract_amount_before: float | None
    contract_amount_after: float | None
    status: Literal["potential", "submitted", "approved", "rejected", "cancelled"]
    transition_reason: str | None
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    submitted_by: int | None
    decided_by: int | None
    created_at: datetime
    submitted_at: datetime | None
    decided_at: datetime | None
