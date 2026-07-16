from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class Bim4dWorkAreaCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=2, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class Bim4dWorkAreaResponse(Bim4dWorkAreaCreate):
    contract_version: str = "giproy_bim_4d_work_area_v1"
    id: int
    project_id: int
    company_id: int
    component_count: int
    created_by: int | None
    created_at: datetime


class Bim4dConstructibleComponentCreate(BaseModel):
    work_area_id: int = Field(gt=0)
    version_id: int = Field(gt=0)
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=2, max_length=255)
    element_ids: list[int] = Field(min_length=1)
    activity_snapshot_ids: list[int] = Field(min_length=1)


class Bim4dConstructibleComponentResponse(Bim4dConstructibleComponentCreate):
    contract_version: str = "giproy_bim_4d_constructible_component_v1"
    id: int
    project_id: int
    company_id: int
    global_ids: list[str]
    created_by: int | None
    created_at: datetime


class Bim4dScenarioShift(BaseModel):
    activity_snapshot_id: int = Field(gt=0)
    offset_days: int = Field(ge=-3650, le=3650)


class Bim4dScenarioCreate(BaseModel):
    baseline_id: int = Field(gt=0)
    name: str = Field(min_length=2, max_length=255)
    revision: str = Field(min_length=1, max_length=100)
    shifts: list[Bim4dScenarioShift] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_activities(self):
        activity_ids = [shift.activity_snapshot_id for shift in self.shifts]
        if len(activity_ids) != len(set(activity_ids)):
            raise ValueError("Cada actividad puede desplazarse una sola vez por escenario")
        return self


class Bim4dScenarioResponse(Bim4dScenarioCreate):
    contract_version: str = "giproy_bim_4d_scenario_v1"
    id: int
    project_id: int
    company_id: int
    metrics: dict
    created_by: int | None
    created_at: datetime


class Bim4dSpaceTimeConflict(BaseModel):
    conflict_key: str
    severity: str
    reason: str
    activity_ids: list[int]
    activity_codes: list[str]
    work_area_ids: list[int]
    component_ids: list[int]
    element_ids: list[int]
    global_ids: list[str]
    overlap_start: datetime
    overlap_finish: datetime


class Bim4dSpaceTimeConflictResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_space_time_conflicts_v1"
    project_id: int
    company_id: int
    counts: dict[str, int]
    conflicts: list[Bim4dSpaceTimeConflict]
