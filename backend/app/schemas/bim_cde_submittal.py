from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


SubmittalType = Literal["shop_drawing", "product_data", "sample", "method_statement", "calculation", "other"]


class BimCdeSubmittalCreate(BaseModel):
    title: str = Field(min_length=3, max_length=500)
    submittal_type: SubmittalType
    discipline: str = Field(min_length=2, max_length=80)
    specification_section: str | None = Field(default=None, max_length=120)
    reviewer_id: int = Field(gt=0)
    required_at: datetime
    document_id: int = Field(gt=0)
    submission_notes: str | None = Field(default=None, max_length=10000)


class BimCdeSubmittalRevisionCreate(BaseModel):
    document_id: int = Field(gt=0)
    submission_notes: str = Field(min_length=3, max_length=10000)
    expected_lock_version: int = Field(ge=1)


class BimCdeSubmittalTransition(BaseModel):
    action: Literal["submit", "start_review", "approve", "reject", "void"]
    comment: str = Field(min_length=3, max_length=10000)
    expected_lock_version: int = Field(ge=1)


class BimCdeSubmittalEventResponse(BaseModel):
    id: int
    event_type: str
    payload: dict
    created_by: int | None
    created_at: datetime


class BimCdeSubmittalRevisionResponse(BaseModel):
    id: int
    revision: int
    document_id: int
    document_revision_id: int
    status: str
    submission_notes: str | None
    decision_comment: str | None
    submitted_by: int | None
    reviewed_by: int | None
    submitted_at: datetime | None
    reviewed_at: datetime | None
    created_at: datetime


class BimCdeSubmittalResponse(BaseModel):
    id: int
    project_id: int
    company_id: int
    submittal_number: str
    title: str
    submittal_type: str
    discipline: str
    specification_section: str | None
    reviewer_id: int | None
    required_at: datetime
    status: Literal["draft", "submitted", "under_review", "approved", "rejected", "void"]
    current_revision: int
    lock_version: int
    created_by: int | None
    created_at: datetime
    updated_at: datetime
    revisions: list[BimCdeSubmittalRevisionResponse]
    events: list[BimCdeSubmittalEventResponse]
