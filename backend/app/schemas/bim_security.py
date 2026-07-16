from pydantic import BaseModel, Field

class BimCapabilityResponse(BaseModel):
    capabilities: list[str]

class BimGrantRequest(BaseModel):
    capabilities: list[str] = Field(default_factory=list)
