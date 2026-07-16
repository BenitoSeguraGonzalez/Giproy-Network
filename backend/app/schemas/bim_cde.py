from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCdeRevisionResponse(BaseModel):
    id: int
    document_id: int
    revision: int
    version_label: str
    source_filename: str
    media_type: str
    file_size_bytes: int
    checksum_sha256: str
    notes: str | None = None
    status: Literal["current", "superseded"]
    created_by: int | None = None
    created_at: datetime


class BimCdeDocumentResponse(BaseModel):
    id: int
    project_id: int
    company_id: int
    document_code: str
    title: str
    category: str
    status: Literal["active", "archived"]
    current_revision: int
    created_by: int | None = None
    created_at: datetime
    updated_at: datetime
    current: BimCdeRevisionResponse | None = None


class BimCdeArchiveRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=2000)
