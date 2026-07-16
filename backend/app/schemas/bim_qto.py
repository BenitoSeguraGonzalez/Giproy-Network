from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimQtoMappingRule(BaseModel):
    ifc_class: str | None = Field(default=None, max_length=100)
    storey: str | None = Field(default=None, max_length=255)
    material: str | None = Field(default=None, max_length=255)
    classification: str | None = Field(default=None, max_length=255)
    wbs_code: str | None = Field(default=None, max_length=255)
    cost_code: str | None = Field(default=None, max_length=255)


class BimQtoSnapshotCreate(BaseModel):
    version_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    group_by: list[Literal["ifc_class", "storey", "material", "classification"]] = Field(
        default_factory=lambda: ["ifc_class", "storey"]
    )
    quantity_names: list[str] = Field(default_factory=list)
    mappings: list[BimQtoMappingRule] = Field(default_factory=list)
    rounding_digits: int = Field(default=3, ge=0, le=6)


class BimQtoSnapshotResponse(BaseModel):
    contract_version: str = "giproy_bim_qto_snapshot_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    revision: str
    group_by: list[str]
    quantity_names: list[str]
    mappings: list[dict]
    rows: list[dict]
    totals: list[dict]
    coverage: dict
    checksum_sha256: str
    status: Literal["draft", "approved", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None


class BimQtoDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimQto5dPackageResponse(BaseModel):
    contract_version: str = "giproy_bim_qto_5d_package_v1"
    snapshot_id: int
    project_id: int
    company_id: int
    version_id: int
    revision: str
    qto_checksum_sha256: str
    rows: list[dict]
    totals: list[dict]
    coverage: dict
    approved_by: int | None
    approved_at: datetime


class BimCostEstimateRate(BaseModel):
    row_index: int = Field(ge=0)
    unit_rate: float = Field(ge=0)


class BimCostEstimateCreate(BaseModel):
    qto_snapshot_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    rates: list[BimCostEstimateRate] = Field(min_length=1)


class BimCostEstimateDecision(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=1000)
    expected_lock_version: int = Field(ge=1)


class BimCostEstimateResponse(BaseModel):
    contract_version: str = "giproy_bim_cost_estimate_v1"
    id: int
    project_id: int
    company_id: int
    qto_snapshot_id: int
    revision: str
    currency: str
    qto_checksum_sha256: str
    lines: list[dict]
    subtotal: float
    status: Literal["draft", "approved", "rejected", "superseded"]
    decision_reason: str | None
    lock_version: int
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None
