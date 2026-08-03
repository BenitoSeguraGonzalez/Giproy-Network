from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


Vector3 = tuple[float, float, float]


class BimFederationTransform(BaseModel):
    translation: Vector3 = (0.0, 0.0, 0.0)
    rotation_degrees: Vector3 = (0.0, 0.0, 0.0)
    scale: Vector3 = (1.0, 1.0, 1.0)

    @field_validator("scale")
    @classmethod
    def validate_scale(cls, value: Vector3) -> Vector3:
        if any(component <= 0 for component in value):
            raise ValueError("La escala de federacion debe ser positiva.")
        return value


class BimFederationGeoreference(BaseModel):
    crs: str = Field(default="LOCAL", min_length=1, max_length=100)
    origin: Vector3 = (0.0, 0.0, 0.0)
    units: Literal["m", "mm", "ft"] = "m"


class BimFederationMemberPayload(BaseModel):
    version_id: int = Field(gt=0)
    discipline: str = Field(min_length=1, max_length=100)
    display_order: int = Field(default=0, ge=0)
    enabled: bool = True
    transform: BimFederationTransform = Field(default_factory=BimFederationTransform)
    georeference: BimFederationGeoreference = Field(default_factory=BimFederationGeoreference)


class BimFederationSaveRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    justification: str = Field(min_length=3, max_length=2000)
    members: list[BimFederationMemberPayload] = Field(min_length=1)


class BimFederationMemberResponse(BimFederationMemberPayload):
    id: int
    model_id: int
    model_name: str
    version_label: str
    alignment_status: Literal["reference", "aligned", "misaligned", "disabled"]
    alignment_distance: float


class BimFederationResponse(BaseModel):
    contract_version: str = "giproy_bim_federation_v1"
    id: int
    project_id: int
    company_id: int
    name: str
    revision: int
    status: str
    justification: str
    created_by: int | None = None
    created_at: datetime
    members: list[BimFederationMemberResponse]
    summary: dict[str, int]


class BimReconciliationDecisionRequest(BaseModel):
    source_version_id: int = Field(gt=0)
    target_version_id: int = Field(gt=0)
    candidate_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    decision: Literal["approved", "rejected"]
    selected_target_global_id: str | None = Field(default=None, max_length=255)
    reason: str = Field(min_length=3, max_length=2000)
