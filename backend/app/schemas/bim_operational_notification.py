from datetime import datetime

from pydantic import BaseModel


class BimOperationalNotificationResponse(BaseModel):
    contract_version: str = "giproy_bim_operational_notification_v1"
    id: int
    project_id: int
    company_id: int
    user_id: int
    source_type: str
    source_id: int
    source_number: str
    title: str
    event_type: str
    severity: str
    escalation_level: int
    due_at: datetime
    acknowledged_at: datetime | None = None
    resolved_at: datetime | None = None
    created_at: datetime


class BimOperationalNotificationReconcileResponse(BaseModel):
    contract_version: str = "giproy_bim_operational_notification_reconcile_v1"
    generated: int
    active: int
    resolved: int
    generated_at: datetime
