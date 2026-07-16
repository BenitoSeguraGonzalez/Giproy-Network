from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class BimSiteGeoreferenceSave(BaseModel):
    crs: str = Field(default="EPSG:4326", min_length=3, max_length=100)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    altitude: float = Field(default=0.0, ge=-500, le=10000)
    local_origin: tuple[float, float, float] = (0.0, 0.0, 0.0)
    heading_degrees: float = Field(default=0.0, ge=0, lt=360)
    map_zoom: int = Field(default=18, ge=3, le=22)
    justification: str = Field(min_length=3, max_length=2000)

    @field_validator("crs")
    @classmethod
    def normalize_crs(cls, value: str) -> str:
        return value.strip().upper()


class BimSiteMapPoint(BaseModel):
    version_id: int
    model_id: int
    model_name: str
    version_label: str
    discipline: str
    latitude: float
    longitude: float
    altitude: float
    alignment_status: str


class BimSiteGeoreferenceResponse(BaseModel):
    contract_version: str = "giproy_bim_site_georeference_v1"
    id: int
    project_id: int
    company_id: int
    revision: int
    status: str
    project_root_code: str | None = None
    project_revision: int
    crs: str
    latitude: float
    longitude: float
    altitude: float
    local_origin: tuple[float, float, float]
    heading_degrees: float
    map_zoom: int
    justification: str
    created_by: int | None = None
    created_at: datetime
    map_points: list[BimSiteMapPoint]
