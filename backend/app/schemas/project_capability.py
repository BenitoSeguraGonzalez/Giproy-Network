from pydantic import BaseModel, Field


class ProjectCapabilityGrantRequest(BaseModel):
    capabilities: list[str] = Field(default_factory=list)
    edt_id: int | None = None
    profile_code: str | None = None


class ProjectCapabilityResponse(BaseModel):
    capabilities: list[str]
    edt_ids: list[int] = Field(default_factory=list)
    modules: list[str] = Field(default_factory=list)
    source: str


class ProjectCapabilityCatalogResponse(BaseModel):
    capabilities: list[str]
    profiles: dict[str, list[str]]
    actions: dict[str, dict[str, str | bool | list[str]]]
