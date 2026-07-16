from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCdeReviewCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    document_revision_id: int = Field(gt=0)
    global_id: str | None = Field(default=None, max_length=64)
    viewpoint: dict | None = None
    assigned_to: int = Field(gt=0)
    due_at: datetime
    initial_comment: str = Field(min_length=3, max_length=5000)


class BimCdeReviewCommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=5000)
    expected_lock_version: int = Field(gt=0)


class BimCdeReviewTransition(BaseModel):
    action: Literal["resolve", "reopen", "close"]
    expected_lock_version: int = Field(gt=0)
    resolution: str | None = Field(default=None, max_length=5000)


class BimCdeReviewCommentResponse(BaseModel):
    id: int
    body: str
    created_by: int | None = None
    created_at: datetime


class BimCdeReviewResponse(BaseModel):
    contract_version: str = "giproy_bim_cde_review_v1"
    id: int
    project_id: int
    company_id: int
    review_number: str
    title: str
    status: str
    document_revision_id: int
    document_id: int
    document_code: str
    document_revision: int
    version_label: str
    global_id: str | None = None
    viewpoint: dict | None = None
    assigned_to: int
    assigned_name: str
    due_at: datetime
    created_by: int | None = None
    resolution: str | None = None
    lock_version: int
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    comments: list[BimCdeReviewCommentResponse]


class BimCdeReviewNotificationResponse(BaseModel):
    id: int
    review_id: int
    review_number: str
    title: str
    event_type: str
    read_at: datetime | None = None
    created_at: datetime
