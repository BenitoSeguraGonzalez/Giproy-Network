from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Bim4dVector3(BaseModel):
    x: float
    y: float
    z: float


class Bim4dEquipmentCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=2, max_length=255)
    equipment_type: Literal["crane", "excavator", "truck", "lift", "generic"] = "generic"
    dimensions: Bim4dVector3

    @model_validator(mode="after")
    def positive_dimensions(self):
        if min(self.dimensions.x, self.dimensions.y, self.dimensions.z) <= 0:
            raise ValueError("Las dimensiones del equipo deben ser positivas.")
        return self


class Bim4dEquipmentResponse(Bim4dEquipmentCreate):
    contract_version: str = "giproy_bim_4d_equipment_v1"
    id: int
    project_id: int
    company_id: int
    created_by: int | None
    created_at: datetime


class Bim4dMotionPoint(Bim4dVector3):
    offset_seconds: float = Field(ge=0)


class Bim4dEquipmentMotionCreate(BaseModel):
    equipment_id: int = Field(gt=0)
    activity_snapshot_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    path: list[Bim4dMotionPoint] = Field(min_length=2, max_length=200)
    operation_radius: float = Field(gt=0, le=1000)
    temporary_geometry: Literal["box", "cylinder"] = "box"

    @model_validator(mode="after")
    def ordered_path(self):
        offsets = [point.offset_seconds for point in self.path]
        if any(current <= previous for previous, current in zip(offsets, offsets[1:])):
            raise ValueError("Los tiempos de trayectoria deben crecer estrictamente.")
        return self


class Bim4dEquipmentMotionResponse(Bim4dEquipmentMotionCreate):
    contract_version: str = "giproy_bim_4d_equipment_motion_v1"
    id: int
    project_id: int
    company_id: int
    duration_seconds: float
    created_by: int | None
    created_at: datetime


class Bim4dEquipmentPlaybackResponse(BaseModel):
    contract_version: str = "giproy_bim_4d_equipment_playback_v1"
    motion_plan_id: int
    percent: float
    offset_seconds: float
    position: Bim4dVector3
    operation_radius: float
    temporary_geometry: str


class Bim4dEquipmentConflictResponse(BaseModel):
    motion_plan_id: int
    conflicting_motion_plan_id: int
    temporal_overlap_seconds: float
    minimum_path_distance: float
    operation_radius_sum: float
