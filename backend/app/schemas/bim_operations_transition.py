from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class BimOperationsTransitionCreate(BaseModel):
    revision: str = Field(min_length=1, max_length=100)
    operating_organization: str = Field(min_length=2, max_length=255)
    responsible_role: str = Field(min_length=2, max_length=150)
    effective_date: date
    readiness_criteria: list[str] = Field(min_length=1, max_length=50)
    transition_notes: str = Field(min_length=5, max_length=4000)


class BimOperationsTransitionResponse(BaseModel):
    contract_version: str = "giproy_bim_operations_transition_v1"
    id: int
    project_id: int
    company_id: int
    handover_dossier_id: int
    revision: str
    operating_organization: str
    responsible_role: str
    effective_date: date
    readiness_criteria: list[str]
    asset_baseline: dict[str, Any]
    baseline_checksum_sha256: str
    total_systems: int
    total_assets: int
    transition_notes: str
    status: Literal["submitted", "accepted", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    submitted_by: int | None
    decided_by: int | None
    submitted_at: datetime
    decided_at: datetime | None
