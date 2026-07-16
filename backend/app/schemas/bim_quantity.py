from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class BimQuantityCandidate(BaseModel):
    quantity_name: str
    source_kind: str
    original_value: float
    original_unit: str
    presented_value: float
    presented_unit: str
    conversion_factor: float
    rounding_digits: int
    normalization_rule: str


class BimQuantityProposalCreate(BaseModel):
    element_id: int = Field(gt=0)
    target_type: Literal["edt", "presupuesto", "apu"]
    target_id: int = Field(gt=0)
    candidate: BimQuantityCandidate


class BimQuantityDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)


class BimQuantityProposalResponse(BimQuantityProposalCreate):
    contract_version: str = "giproy_bim_quantity_proposal_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    global_id: str
    status: str
    decision_reason: str | None
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
