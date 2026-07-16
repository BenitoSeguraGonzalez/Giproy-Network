from datetime import datetime

from pydantic import BaseModel


class BimCostActualEntryResponse(BaseModel):
    id: int
    project_id: int
    company_id: int
    field_report_id: int
    activity_snapshot_id: int
    activity_code: str
    activity_name: str
    work_area_id: int | None
    occurred_at: datetime
    currency: str
    cumulative_actual_cost: float
    incremental_actual_cost: float
    posted_by: int | None
    posted_at: datetime


class BimCostActualLedgerResponse(BaseModel):
    contract_version: str = "giproy_bim_actual_cost_ledger_v1"
    entries: list[BimCostActualEntryResponse]
    currency_totals: dict[str, float]
    source_report_count: int
    posted_report_count: int
    validated_exception_cost: float
