from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCommissioningSystemCreate(BaseModel):
    system_code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    discipline: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)


class BimCommissioningAssetCreate(BaseModel):
    system_id: int = Field(gt=0)
    version_id: int = Field(gt=0)
    element_id: int = Field(gt=0)
    asset_tag: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    asset_type: str = Field(min_length=1, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=255)
    model_reference: str | None = Field(default=None, max_length=255)
    serial_number: str | None = Field(default=None, max_length=255)


class BimCommissioningTestCreate(BaseModel):
    asset_id: int = Field(gt=0)
    protocol_code: str = Field(min_length=1, max_length=100)
    protocol_name: str = Field(min_length=1, max_length=255)
    checklist: list[str] = Field(min_length=1, max_length=100)
    results: dict[str, str | int | float | bool | None] = Field(min_length=1)
    outcome: Literal["passed", "failed"]
    evidence_reference: str | None = Field(default=None, max_length=500)


class BimCommissioningDecision(BaseModel):
    decision: Literal["accepted", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)
    expected_lock_version: int = Field(ge=1)


class BimCommissioningSystemAcceptance(BaseModel):
    reason: str = Field(min_length=5, max_length=2000)
    expected_lock_version: int = Field(ge=1)


class BimCommissioningSystemResponse(BaseModel):
    id: int
    system_code: str
    name: str
    discipline: str | None
    description: str | None
    status: Literal["registered", "commissioning", "accepted", "retired"]
    asset_count: int
    decision_reason: str | None
    lock_version: int
    accepted_by: int | None
    accepted_at: datetime | None
    created_by: int | None
    created_at: datetime


class BimCommissioningAssetResponse(BaseModel):
    id: int
    system_id: int
    version_id: int
    element_id: int
    asset_tag: str
    name: str
    asset_type: str
    global_id: str
    source_system_name: str | None
    manufacturer: str | None
    model_reference: str | None
    serial_number: str | None
    status: Literal["registered", "testing", "accepted", "rejected", "retired"]
    decision_reason: str | None
    lock_version: int
    decided_by: int | None
    decided_at: datetime | None
    created_by: int | None
    created_at: datetime


class BimCommissioningTestResponse(BaseModel):
    id: int
    asset_id: int
    protocol_code: str
    attempt: int
    protocol_name: str
    checklist: list[str]
    results: dict
    outcome: Literal["passed", "failed"]
    evidence_reference: str | None
    status: Literal["submitted", "accepted", "rejected"]
    decision_reason: str | None
    lock_version: int
    submitted_by: int | None
    decided_by: int | None
    submitted_at: datetime
    decided_at: datetime | None


class BimCommissioningRegistryResponse(BaseModel):
    contract_version: str = "giproy_bim_commissioning_registry_v2"
    project_id: int
    company_id: int
    systems: list[BimCommissioningSystemResponse]
    assets: list[BimCommissioningAssetResponse]
    tests: list[BimCommissioningTestResponse]
