from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class BimHandoverDossierCreate(BaseModel):
    revision: str = Field(min_length=1, max_length=100)
    assembly_notes: str = Field(min_length=5, max_length=4000)


class BimHandoverDossierResponse(BaseModel):
    contract_version: str = "giproy_bim_handover_dossier_v1"
    id: int
    project_id: int
    company_id: int
    as_built_acceptance_id: int
    punch_closure_id: int
    revision: str
    manifest: dict[str, Any]
    manifest_checksum_sha256: str
    system_ids: list[int]
    asset_ids: list[int]
    cde_revision_ids: list[int]
    total_systems: int
    total_assets: int
    total_documents: int
    assembly_notes: str
    status: Literal["submitted", "accepted", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    submitted_by: int | None
    decided_by: int | None
    submitted_at: datetime
    decided_at: datetime | None
