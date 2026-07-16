from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class LicenseNotificationResponse(BaseModel):
    id: int
    empresa_id: int
    empresa_licencia_id: Optional[int] = None
    licencia_id: Optional[int] = None
    recipient_usuario_id: Optional[int] = None
    notification_type: str
    channel: str
    recipient_email: Optional[str] = None
    status: str
    title: str
    subject: Optional[str] = None
    body: Optional[str] = None
    severity: str = "info"
    action_label: Optional[str] = None
    payload: dict[str, Any] = Field(default_factory=dict)
    scheduled_for: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime


class LicenseNotificationListResponse(BaseModel):
    items: list[LicenseNotificationResponse] = Field(default_factory=list)


class LicenseNotificationDispatchResponse(BaseModel):
    dispatched_count: int
    items: list[LicenseNotificationResponse] = Field(default_factory=list)


class LicenseNotificationHousekeepingResponse(BaseModel):
    queued_count: int
    dispatched_count: int = 0
    queued_purchase_count: int = 0
    queued_license_count: int = 0
    queued_items: list[LicenseNotificationResponse] = Field(default_factory=list)
    queued_purchase_items: list[LicenseNotificationResponse] = Field(default_factory=list)
    queued_license_items: list[LicenseNotificationResponse] = Field(default_factory=list)
    dispatched_items: list[LicenseNotificationResponse] = Field(default_factory=list)
