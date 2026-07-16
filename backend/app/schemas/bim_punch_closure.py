from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimPunchClosureCreate(BaseModel):
    revision: str = Field(min_length=1, max_length=100)
    closure_criteria: list[str] = Field(min_length=1, max_length=50)
    verification_notes: str = Field(min_length=5, max_length=4000)


class BimPunchClosureDecision(BaseModel):
    decision: Literal["accepted", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)
    expected_lock_version: int = Field(ge=1)


class BimPunchClosureResponse(BaseModel):
    contract_version: str = "giproy_bim_punch_closure_v1"
    id: int
    project_id: int
    company_id: int
    as_built_acceptance_id: int
    revision: str
    punch_item_ids: list[int]
    punch_snapshot_sha256: str
    total_items: int
    critical_items: int
    closure_criteria: list[str]
    verification_notes: str
    status: Literal["submitted", "accepted", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    submitted_by: int | None
    decided_by: int | None
    submitted_at: datetime
    decided_at: datetime | None
