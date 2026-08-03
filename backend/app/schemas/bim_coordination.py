from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class CoordinationSetCreate(BaseModel):
    presupuesto_id: int | None = None
    presupuesto_revision: int | None = None
    cronograma_trabajo_id: int | None = None
    baseline_id: int | None = None
    bim_version_ids: list[int] = Field(default_factory=list)


class CoordinationSetResponse(BaseModel):
    id: int
    proyecto_id: int
    proyecto_codigo_root: str
    proyecto_revision: int
    revision: int
    presupuesto_id: int | None
    presupuesto_revision: int | None
    cronograma_trabajo_id: int | None
    baseline_id: int | None
    bim_version_ids: list[int]
    process_status: str
    coordination_status: str
    omniclass_status: str
    official: bool
    active: bool


class CoordinationSetOfficialAction(BaseModel):
    expected_revision: int = Field(ge=1)
    reason: str = Field(min_length=3, max_length=1000)


class CoordinationLinkCreate(BaseModel):
    budget_line_id: int | None = None
    apu_id: int | None = None
    activity_ref: str | None = None
    activity_snapshot_id: int | None = None
    bim_element_id: int | None = None
    bim_global_id: str | None = None
    allocation_key: str = "primary"
    allocation_type: str = "percentage"
    allocation_value: Decimal = Decimal("100")
    unit: str | None = None
    additive: bool = True
    source: str = "manual"
    notes: str | None = None


class CoordinationLinkIdentityReconcile(BaseModel):
    activity_snapshot_id: int | None = Field(default=None, gt=0)
    bim_element_id: int | None = Field(default=None, gt=0)
    reason: str = Field(min_length=3, max_length=1000)


class CoordinationProposalCreate(BaseModel):
    proposal_type: str
    source_domain: str
    target_domain: str
    diff: dict[str, Any] = Field(default_factory=dict)
    impact: dict[str, Any] = Field(default_factory=dict)
    reason: str | None = None


class CoordinationProposalDecision(BaseModel):
    decision: str
    reason: str | None = None


class CoordinationProposalAction(BaseModel):
    expected_version: int = Field(ge=1)
    reason: str | None = None


class ClassificationResolutionCreate(BaseModel):
    bim_element_id: int
    bim_model_version_id: int
    system: str = "OmniClass"
    edition: str = "unknown"
    table_code: str | None = None
    source_code: str | None = None
    source_title: str | None = None
    omniclass_id: int | None = None
    resolution_status: str = "unresolved"
    confidence: Decimal | None = None
    source: str = "ifc"


class CoordinationCoverageResponse(BaseModel):
    link_count: int
    additive_link_count: int
    incomplete_count: int
    overallocated_count: int
    coordinated_count: int
    quantified_count: int = 0
    coordination_status: str
    groups: list[dict[str, Any]]


class CoordinationImportPreflight(BaseModel):
    source_domain: str
    source_format: str
    filename: str = Field(min_length=1, max_length=255)
    content_base64: str = Field(min_length=1)
    coordination_set_id: int | None = None


class CoordinationImportConfirm(BaseModel):
    expected_checksum_sha256: str = Field(min_length=64, max_length=64)
    reason: str = Field(min_length=3, max_length=1000)
