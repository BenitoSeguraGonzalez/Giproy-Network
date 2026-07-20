from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class BimErpExchangeCreate(BaseModel):
    cutoff_at: datetime
    justification: str = Field(min_length=5, max_length=2000)


class BimErpExchangeTransition(BaseModel):
    action: Literal["publish", "revoke"]
    reason: str = Field(min_length=5, max_length=2000)
    expected_lock_version: int = Field(ge=1)


class BimErpExchangeResponse(BaseModel):
    contract_version: str = "giproy_bim_erp_exchange_package_v1"
    id: int
    project_id: int
    company_id: int
    revision: int
    status: Literal["draft", "published", "superseded", "revoked"]
    project_root_code: str | None
    project_revision: int
    cutoff_at: datetime
    checksum_sha256: str
    activity_count: int
    timecard_count: int
    regular_hours: float
    overtime_hours: float
    justification: str
    lock_version: int
    created_by: int | None
    published_by: int | None
    created_at: datetime
    published_at: datetime | None


class BimErpExchangeContent(BaseModel):
    contract_version: str = "giproy_bim_erp_exchange_content_v1"
    package: BimErpExchangeResponse
    payload: dict[str, Any]
