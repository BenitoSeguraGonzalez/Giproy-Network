from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BimCostContractCreate(BaseModel):
    estimate_id: int = Field(gt=0)
    contract_number: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=255)
    counterparty_name: str = Field(min_length=1, max_length=255)
    committed_amount: float = Field(gt=0)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_period(self):
        if self.end_date < self.start_date:
            raise ValueError("La fecha final no puede preceder a la fecha inicial.")
        return self


class BimCostContractTransition(BaseModel):
    target_status: Literal["active", "closed", "cancelled"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimCostContractResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_contract_v1"
    id: int
    project_id: int
    company_id: int
    estimate_id: int
    estimate_revision: str
    contract_number: str
    title: str
    counterparty_name: str
    currency: str
    committed_amount: float
    estimate_subtotal: float
    start_date: date
    end_date: date
    status: Literal["draft", "active", "closed", "cancelled"]
    transition_reason: str | None
    lock_version: int
    created_by: int | None
    transitioned_by: int | None
    created_at: datetime
    transitioned_at: datetime | None
