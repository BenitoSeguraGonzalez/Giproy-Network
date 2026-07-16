from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BimCostPaymentApplicationCreate(BaseModel):
    contract_id: int = Field(gt=0)
    application_number: str = Field(min_length=1, max_length=100)
    period_start: date
    period_end: date
    gross_requested: float = Field(gt=0)
    retention_requested: float = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_amounts_and_period(self):
        if self.period_end < self.period_start:
            raise ValueError("La fecha final no puede preceder a la fecha inicial.")
        if self.retention_requested > self.gross_requested:
            raise ValueError("La retencion no puede superar el importe bruto.")
        return self


class BimCostPaymentApplicationSubmit(BaseModel):
    expected_lock_version: int = Field(ge=1)


class BimCostPaymentApplicationDecision(BaseModel):
    decision: Literal["certified", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)
    certified_gross: float | None = Field(default=None, gt=0)
    certified_retention: float = Field(default=0, ge=0)


class BimCostPaymentApplicationResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_payment_application_v1"
    id: int
    project_id: int
    company_id: int
    contract_id: int
    contract_number: str
    application_number: str
    period_start: date
    period_end: date
    currency: str
    gross_requested: float
    retention_requested: float
    net_requested: float
    certified_gross: float | None
    certified_retention: float | None
    certified_net: float | None
    status: Literal["draft", "submitted", "certified", "rejected"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    submitted_by: int | None
    decided_by: int | None
    created_at: datetime
    submitted_at: datetime | None
    decided_at: datetime | None
