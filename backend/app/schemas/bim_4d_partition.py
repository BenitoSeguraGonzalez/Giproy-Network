from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class Bim4dPartitionSpecCreate(BaseModel):
    element_id: int = Field(gt=0)
    revision: str = Field(min_length=1, max_length=100)
    axis: Literal["x", "y", "z"]
    segment_count: int = Field(ge=2, le=20)
    gap_ratio: float = Field(default=0, ge=0, le=0.2)


class Bim4dPartitionPreviewBounds(BaseModel):
    width: float
    height: float
    depth: float


class Bim4dPartitionSpecResponse(Bim4dPartitionSpecCreate):
    contract_version: str = "giproy_bim_4d_partition_preview_v1"
    id: int
    project_id: int
    company_id: int
    version_id: int
    global_id: str
    status: Literal["preview", "materialized"]
    materialized: bool
    preview_bounds: Bim4dPartitionPreviewBounds
    created_by: int | None
    created_at: datetime


class Bim4dPartitionPoint(BaseModel):
    x: float
    y: float
    z: float


class Bim4dPartitionSegment(BaseModel):
    index: int
    source_global_id: str
    min: Bim4dPartitionPoint
    max: Bim4dPartitionPoint
    volume: float
    surface_area: float


class Bim4dPartitionArtifactResponse(BaseModel):
    contract_version: Literal["giproy_bim_4d_partition_artifact_v1"]
    id: int
    partition_spec_id: int
    project_id: int
    company_id: int
    version_id: int
    element_id: int
    source_global_id: str
    geometry_method: Literal["bounding_box_v1"]
    exact_ifc_csg: bool = False
    checksum_sha256: str
    segments: list[Bim4dPartitionSegment]
    total_volume: float
    total_surface_area: float
    created_by: int | None
    created_at: datetime


class Bim4dCsgMesh(BaseModel):
    positions: list[float] = Field(min_length=9, max_length=600000)
    normals: list[float] = Field(default_factory=list, max_length=600000)
    indices: list[int] = Field(min_length=3, max_length=600000)
    volume: float = Field(gt=0, allow_inf_nan=False)
    triangle_count: int = Field(gt=0, le=200000)


class Bim4dCsgSegment(BaseModel):
    index: int = Field(gt=0, le=20)
    mesh: Bim4dCsgMesh


class Bim4dPartitionCsgArtifactCreate(BaseModel):
    contract_version: Literal["giproy_bim_4d_csg_artifact_v1"]
    artifact_revision: str = Field(min_length=1, max_length=100)
    source_global_id: str = Field(min_length=1, max_length=255)
    geometry_method: Literal["exact_bvh_csg_v1"]
    source_mesh: Bim4dCsgMesh
    segments: list[Bim4dCsgSegment] = Field(min_length=2, max_length=20)
    conservation_delta: float = Field(ge=0, allow_inf_nan=False)


class Bim4dPartitionCsgArtifactResponse(Bim4dPartitionCsgArtifactCreate):
    id: int
    partition_spec_id: int
    project_id: int
    company_id: int
    version_id: int
    element_id: int
    checksum_sha256: str
    partition_volume: float
    created_by: int | None
    created_at: datetime
