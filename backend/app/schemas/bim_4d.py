from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Bim4dActivitySnapshotCreate(BaseModel):
    source_kind: Literal["giproy_classic_schedule", "microsoft_project", "primavera", "synchro"] = "giproy_classic_schedule"
    source_ref: str = Field(min_length=1, max_length=255)
    snapshot_revision: str = Field(min_length=1, max_length=100)
    activity_code: str = Field(min_length=1, max_length=100)
    activity_name: str = Field(min_length=2, max_length=500)
    planned_start: datetime
    planned_finish: datetime

    @model_validator(mode="after")
    def validate_dates(self):
        if self.planned_finish < self.planned_start:
            raise ValueError("planned_finish no puede ser anterior a planned_start")
        return self


class Bim4dActivitySnapshotResponse(Bim4dActivitySnapshotCreate):
    contract_version: str = "giproy_bim_4d_activity_v1"
    id: int
    project_id: int
    company_id: int
    captured_by: int | None
    captured_at: datetime


class Bim4dLinkProposalCreate(BaseModel):
    element_id: int = Field(gt=0)
    activity_snapshot_id: int = Field(gt=0)
    link_type: Literal["construction", "demolition", "temporary", "inspection"] = "construction"
    proposal_reason: str = Field(min_length=5, max_length=2000)


class Bim4dLinkDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    reason: str = Field(min_length=5, max_length=2000)


class Bim4dLinkProposalResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_link_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    element_id: int
    global_id: str
    activity: Bim4dActivitySnapshotResponse
    link_type: str
    status: str
    proposal_reason: str
    decision_reason: str | None
    created_by: int | None
    decided_by: int | None
    created_at: datetime
    decided_at: datetime | None


class Bim4dProgressSnapshotCreate(BaseModel):
    activity_snapshot_id: int = Field(gt=0)
    progress_percent: float = Field(ge=0, le=100)
    actual_start: datetime | None = None
    actual_finish: datetime | None = None
    note: str | None = Field(default=None, max_length=2000)
    reported_at: datetime

    @model_validator(mode="after")
    def validate_actual_dates(self):
        if self.actual_start and self.actual_finish and self.actual_finish < self.actual_start:
            raise ValueError("actual_finish no puede ser anterior a actual_start")
        if self.progress_percent == 100 and not self.actual_finish:
            raise ValueError("actual_finish es obligatorio al reportar 100%")
        return self


class Bim4dProgressSnapshotResponse(Bim4dProgressSnapshotCreate):
    contract_version: str = "giproy_bim_4d_progress_v1"
    id: int
    project_id: int
    company_id: int
    reported_by: int | None
    created_at: datetime


class Bim4dTimelineItem(BaseModel):
    global_id: str
    element_id: int
    version_id: int
    activity_snapshot_id: int
    activity_code: str
    activity_name: str
    link_type: str
    state: Literal["not_started", "in_progress", "completed", "delayed", "demolished"]
    progress_percent: float
    visible: bool
    opacity: float
    color: str


class Bim4dTimelineResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_timeline_v1"
    project_id: int
    company_id: int
    cutoff: datetime
    range_start: datetime | None
    range_finish: datetime | None
    counts: dict[str, int]
    items: list[Bim4dTimelineItem]


class Bim4dDependencyCreate(BaseModel):
    predecessor_activity_id: int = Field(gt=0)
    successor_activity_id: int = Field(gt=0)
    dependency_type: Literal["FS", "SS", "FF", "SF"] = "FS"
    lag_days: float = Field(default=0, ge=-3650, le=3650)

    @model_validator(mode="after")
    def validate_distinct_activities(self):
        if self.predecessor_activity_id == self.successor_activity_id:
            raise ValueError("Una actividad no puede depender de si misma")
        return self


class Bim4dBaselineCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    revision: str = Field(min_length=1, max_length=100)
    activity_snapshot_ids: list[int] = Field(min_length=1)
    dependencies: list[Bim4dDependencyCreate] = Field(default_factory=list)


class Bim4dBaselineResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_baseline_v1"
    id: int
    project_id: int
    company_id: int
    name: str
    revision: str
    methodology: str
    activities: list[Bim4dActivitySnapshotResponse]
    dependencies: list[Bim4dDependencyCreate]
    created_by: int | None
    created_at: datetime


class Bim4dDeviationViewpoint(BaseModel):
    source_version_id: int
    selected_guids: list[str]


class Bim4dDeviationItem(BaseModel):
    activity_snapshot_id: int
    activity_code: str
    activity_name: str
    planned_progress_percent: float
    actual_progress_percent: float
    progress_variance_percent: float
    schedule_variance_days: float
    status: Literal["ahead", "on_track", "behind"]
    viewpoints: list[Bim4dDeviationViewpoint]


class Bim4dDeviationResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_deviation_v1"
    project_id: int
    company_id: int
    baseline_id: int
    cutoff: datetime
    methodology: str
    counts: dict[str, int]
    items: list[Bim4dDeviationItem]


class Bim4dGanttActivity(BaseModel):
    id: int
    code: str
    name: str
    planned_start: datetime
    planned_finish: datetime
    duration_days: float
    critical: bool
    global_ids: list[str]


class Bim4dGanttDependency(BaseModel):
    predecessor_activity_id: int
    successor_activity_id: int
    dependency_type: str
    lag_days: float


class Bim4dGanttResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_gantt_v1"
    project_id: int
    company_id: int
    baseline_id: int
    range_start: datetime
    range_finish: datetime
    critical_path_activity_ids: list[int]
    activities: list[Bim4dGanttActivity]
    dependencies: list[Bim4dGanttDependency]
