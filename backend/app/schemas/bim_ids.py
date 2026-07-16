from datetime import datetime

from pydantic import BaseModel, Field


class BimIdsProfileImportRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    source_filename: str = Field(min_length=1, max_length=255)
    xml_content: str = Field(min_length=20)


class BimIdsProfileResponse(BaseModel):
    id: int
    name: str
    source_filename: str
    ids_version: str
    checksum_sha256: str
    specification_count: int
    created_at: datetime


class BimIdsFindingResponse(BaseModel):
    id: int
    requirement_id: str
    specification_name: str
    global_id: str | None
    severity: str
    status: str
    message: str
    exception_reason: str | None = None
    exception_by: int | None = None
    exception_at: datetime | None = None


class BimIdsValidationResponse(BaseModel):
    contract_version: str = "giproy_bim_ids_validation_v1"
    id: int
    profile_id: int
    version_id: int
    status: str
    summary: dict[str, int]
    created_at: datetime
    findings: list[BimIdsFindingResponse]


class BimIdsExceptionRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=2000)
