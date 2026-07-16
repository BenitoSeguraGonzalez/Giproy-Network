from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class BimScheduleCalendarException(BaseModel):
    date: date
    working: bool
    working_hours: float | None = Field(default=None, ge=0, le=24)


class BimScheduleCalendar(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=255)
    timezone: str = Field(min_length=1, max_length=100)
    working_weekdays: list[int] = Field(default_factory=lambda: [1, 2, 3, 4, 5])
    working_hours_per_day: float = Field(default=8, gt=0, le=24)
    exceptions: list[BimScheduleCalendarException] = Field(default_factory=list)


class BimScheduleWbsNode(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=500)
    parent_id: str | None = Field(default=None, max_length=120)


class BimScheduleActivity(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=500)
    activity_type: Literal["task", "start_milestone", "finish_milestone", "level_of_effort"] = "task"
    wbs_id: str | None = Field(default=None, max_length=120)
    calendar_id: str | None = Field(default=None, max_length=120)
    planned_start: datetime
    planned_finish: datetime
    actual_start: datetime | None = None
    actual_finish: datetime | None = None
    percent_complete: float = Field(default=0, ge=0, le=100)
    duration_hours: float = Field(default=0, ge=0)
    constraint_type: Literal[
        "none",
        "start_on",
        "start_no_earlier_than",
        "start_no_later_than",
        "finish_on",
        "finish_no_earlier_than",
        "finish_no_later_than",
        "mandatory_start",
        "mandatory_finish",
    ] = "none"
    constraint_date: datetime | None = None
    custom_fields: dict[str, Any] = Field(default_factory=dict)


class BimScheduleDependency(BaseModel):
    predecessor_id: str = Field(min_length=1, max_length=120)
    successor_id: str = Field(min_length=1, max_length=120)
    dependency_type: Literal["FS", "SS", "FF", "SF"] = "FS"
    lag_hours: float = Field(default=0, ge=-87600, le=87600)


class BimScheduleResource(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=500)
    resource_type: Literal["labor", "equipment", "material", "role", "cost"]
    max_units: float | None = Field(default=None, ge=0)
    unit_cost: float | None = Field(default=None, ge=0)


class BimScheduleAssignment(BaseModel):
    activity_id: str = Field(min_length=1, max_length=120)
    resource_id: str = Field(min_length=1, max_length=120)
    planned_units: float = Field(default=0, ge=0)
    planned_work_hours: float = Field(default=0, ge=0)
    planned_cost: float = Field(default=0, ge=0)
    actual_work_hours: float = Field(default=0, ge=0)
    actual_cost: float = Field(default=0, ge=0)


class BimScheduleBaseline(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=255)
    captured_at: datetime
    activity_ids: list[str] = Field(default_factory=list)


class BimScheduleInterchangeDocument(BaseModel):
    contract_version: Literal["giproy_bim_schedule_interchange_v1"] = "giproy_bim_schedule_interchange_v1"
    source_format: Literal["canonical_json", "mspdi_xml", "p6_xml", "p6_xer"]
    source_filename: str = Field(min_length=1, max_length=255)
    source_checksum_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    source_application: str | None = Field(default=None, max_length=255)
    project_external_id: str = Field(min_length=1, max_length=255)
    project_name: str = Field(min_length=1, max_length=500)
    timezone: str = Field(min_length=1, max_length=100)
    currency: str = Field(default="USD", pattern=r"^[A-Z]{3}$")
    data_date: datetime
    calendars: list[BimScheduleCalendar] = Field(default_factory=list)
    wbs: list[BimScheduleWbsNode] = Field(default_factory=list)
    activities: list[BimScheduleActivity] = Field(min_length=1)
    dependencies: list[BimScheduleDependency] = Field(default_factory=list)
    resources: list[BimScheduleResource] = Field(default_factory=list)
    assignments: list[BimScheduleAssignment] = Field(default_factory=list)
    baselines: list[BimScheduleBaseline] = Field(default_factory=list)
    unsupported_source_fields: list[str] = Field(default_factory=list)


class BimSchedulePreflightIssue(BaseModel):
    severity: Literal["error", "warning"]
    code: str
    path: str
    message: str


class BimSchedulePreflightResponse(BaseModel):
    contract_version: str = "giproy_bim_schedule_preflight_v1"
    valid: bool
    normalized_checksum_sha256: str
    counts: dict[str, int]
    errors: list[BimSchedulePreflightIssue]
    warnings: list[BimSchedulePreflightIssue]


class BimScheduleImportPreviewResponse(BaseModel):
    contract_version: str = "giproy_bim_schedule_import_preview_v1"
    document: BimScheduleInterchangeDocument
    preflight: BimSchedulePreflightResponse


class BimScheduleInteropFormatCapability(BaseModel):
    format: Literal["canonical_json", "mspdi_xml", "p6_xml", "p6_xer", "mpp", "powerproject_pp"]
    status: Literal["available", "conditional", "unavailable"]
    import_preview: bool
    export: bool
    native_extension: str
    reason: str | None = None
    requires_authorized_corpus: bool = False
    requires_licensed_adapter: bool = False


class BimScheduleInteropCapabilitiesResponse(BaseModel):
    contract_version: str = "giproy_bim_schedule_interop_capabilities_v1"
    formats: list[BimScheduleInteropFormatCapability]


class BimScheduleImportDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=3, max_length=2000)
    expected_version: int = Field(ge=1)


class BimScheduleImportRollbackRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)
    expected_version: int = Field(ge=1)


class BimScheduleImportRevisionResponse(BaseModel):
    id: int
    project_id: int
    company_id: int
    revision: int
    version: int
    source_format: str
    source_filename: str
    source_checksum_sha256: str
    normalized_checksum_sha256: str
    status: Literal["pending", "approved", "rejected", "superseded", "rolled_back"]
    counts: dict[str, int]
    previous_approved_revision_id: int | None = None
    decision_reason: str | None = None
    rollback_reason: str | None = None
    created_by: int | None = None
    decided_by: int | None = None
    rolled_back_by: int | None = None
    created_at: datetime
    decided_at: datetime | None = None
    rolled_back_at: datetime | None = None


class BimScheduleComparisonRequest(BaseModel):
    left: BimScheduleInterchangeDocument
    right: BimScheduleInterchangeDocument


class BimScheduleComparisonDifference(BaseModel):
    section: str
    left_checksum_sha256: str
    right_checksum_sha256: str


class BimScheduleComparisonResponse(BaseModel):
    contract_version: str = "giproy_bim_schedule_comparison_v1"
    equivalent: bool
    left_checksum_sha256: str
    right_checksum_sha256: str
    differences: list[BimScheduleComparisonDifference]
