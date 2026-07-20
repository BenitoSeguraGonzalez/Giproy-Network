from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class BimIntegrationSubscriptionCreate(BaseModel):
    label: str = Field(min_length=3, max_length=120)
    target_url: str = Field(min_length=12, max_length=2048)
    event_types: list[Literal["erp.package.published"]] = Field(min_length=1, max_length=8)


class BimIntegrationSubscriptionTransition(BaseModel):
    status: Literal["active", "disabled"]
    expected_lock_version: int = Field(ge=1)
    reason: str = Field(min_length=5, max_length=1000)


class BimIntegrationSubscriptionResponse(BaseModel):
    contract_version: str = "giproy_bim_integration_subscription_v1"
    id: int
    project_id: int
    company_id: int
    label: str
    target_url: str
    event_types: list[str]
    status: Literal["active", "disabled"]
    secret_hint: str
    secret_once: str | None = None
    lock_version: int
    created_by: int | None
    created_at: datetime
    updated_at: datetime


class BimIntegrationDeliveryResponse(BaseModel):
    contract_version: str = "giproy_bim_integration_delivery_v1"
    id: int
    project_id: int
    company_id: int
    subscription_id: int
    event_id: str
    event_type: str
    payload_checksum_sha256: str
    status: Literal["pending", "delivering", "retry", "delivered", "dead"]
    attempt_count: int
    max_attempts: int
    next_attempt_at: datetime
    last_http_status: int | None
    last_error_code: str | None
    created_at: datetime
    delivered_at: datetime | None


class BimIntegrationDeliveryEnvelope(BaseModel):
    contract_version: str = "giproy_bim_integration_event_v1"
    event_id: str
    event_type: str
    occurred_at: datetime
    project_id: int
    company_id: int
    data: dict[str, Any]
