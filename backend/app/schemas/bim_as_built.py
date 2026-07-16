from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimAsBuiltAcceptanceCreate(BaseModel):
    version_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    acceptance_criteria: list[str] = Field(min_length=1, max_length=50)
    declaration_notes: str = Field(min_length=5, max_length=4000)


class BimAsBuiltAcceptanceDecision(BaseModel):
    decision: Literal["accepted", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)
    expected_lock_version: int = Field(ge=1)


class BimAsBuiltAcceptanceResponse(BaseModel):
    contract_version: str = "giproy_bim_as_built_acceptance_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    revision: str
    version_label: str
    source_filename: str | None
    source_checksum_sha256: str
    quality_status: str
    acceptance_criteria: list[str]
    declaration_notes: str
    status: Literal["submitted", "accepted", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    submitted_by: int | None
    decided_by: int | None
    submitted_at: datetime
    decided_at: datetime | None
