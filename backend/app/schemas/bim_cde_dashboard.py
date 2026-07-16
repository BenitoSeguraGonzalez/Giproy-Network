from datetime import datetime

from pydantic import BaseModel


class BimCdeDashboardTotals(BaseModel):
    documents: int
    document_revisions: int
    open_rfis: int
    overdue_rfis: int
    pending_submittals: int
    overdue_submittals: int
    open_reviews: int
    overdue_reviews: int
    unread_notifications: int


class BimCdeDashboardResponsible(BaseModel):
    user_id: int
    name: str
    rfis: int
    submittals: int
    reviews: int
    overdue: int
    total: int


class BimCdeDashboardWorkItem(BaseModel):
    item_type: str
    item_id: int
    number: str
    title: str
    status: str
    due_at: datetime | None = None
    responsible_id: int | None = None
    responsible_name: str | None = None
    overdue: bool


class BimCdeDashboardResponse(BaseModel):
    contract_version: str = "giproy_bim_cde_dashboard_v1"
    project_id: int
    company_id: int
    generated_at: datetime
    scope: str
    totals: BimCdeDashboardTotals
    document_statuses: dict[str, int]
    rfi_statuses: dict[str, int]
    submittal_statuses: dict[str, int]
    review_statuses: dict[str, int]
    responsible_workload: list[BimCdeDashboardResponsible]
    priority_queue: list[BimCdeDashboardWorkItem]
