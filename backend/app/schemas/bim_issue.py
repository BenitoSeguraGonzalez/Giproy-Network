from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimIssueViewpoint(BaseModel):
    contract_version: str = "giproy_bim_issue_viewpoint_v1"
    source_version_id: int | None = None
    camera: dict = Field(default_factory=dict)
    selected_guids: list[str] = Field(default_factory=list)
    visibility: dict = Field(default_factory=dict)
    clipping: dict = Field(default_factory=dict)


class BimIssueCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    version_id: int | None = Field(default=None, gt=0)
    priority: Literal["low", "normal", "high", "critical"] = "normal"
    assigned_to: int | None = Field(default=None, gt=0)
    viewpoint: BimIssueViewpoint = Field(default_factory=BimIssueViewpoint)


class BimIssueUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    priority: Literal["low", "normal", "high", "critical"] | None = None
    status: Literal["open", "assigned", "in_review", "resolved", "closed", "discarded"] | None = None
    assigned_to: int | None = Field(default=None, gt=0)


class BimIssueCommentRequest(BaseModel):
    body: str = Field(min_length=1, max_length=5000)


class BimIssueAttachmentResponse(BaseModel):
    contract_version: str = "giproy_bim_issue_attachment_v1"
    id: int
    issue_id: int
    filename: str
    content_type: str
    byte_size: int
    checksum_sha256: str
    uploaded_by: int | None
    uploaded_at: datetime


class BimIssueResponse(BaseModel):
    contract_version: str = "giproy_bim_issue_v1"
    id: int
    topic_guid: str
    project_id: int
    company_id: int
    version_id: int | None
    title: str
    description: str | None
    priority: str
    status: str
    assigned_to: int | None
    created_by: int | None
    viewpoint: BimIssueViewpoint
    snapshot_path: str | None
    created_at: datetime
    updated_at: datetime | None
    comments: list[dict]
    events: list[dict]
    attachments: list[BimIssueAttachmentResponse]
