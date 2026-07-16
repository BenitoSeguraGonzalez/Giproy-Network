from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BimCdeRfiCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=500)
    question: str = Field(min_length=5, max_length=10000)
    priority: Literal["low", "normal", "high", "critical"] = "normal"
    due_at: datetime | None = None
    document_id: int | None = Field(default=None, gt=0)
    global_id: str | None = Field(default=None, max_length=64)
    assigned_to: int | None = Field(default=None, gt=0)


class BimCdeRfiTransition(BaseModel):
    action: Literal["submit", "answer", "close", "void"]
    reason: str = Field(min_length=3, max_length=10000)
    answer: str | None = Field(default=None, max_length=10000)
    assigned_to: int | None = Field(default=None, gt=0)
    due_at: datetime | None = None
    expected_lock_version: int = Field(ge=1)


class BimCdeRfiEventResponse(BaseModel):
    id: int
    event_type: str
    payload: dict
    created_by: int | None
    created_at: datetime


class BimCdeRfiResponse(BaseModel):
    id: int
    project_id: int
    company_id: int
    rfi_number: str
    subject: str
    question: str
    priority: str
    status: Literal["draft", "submitted", "answered", "closed", "void"]
    due_at: datetime | None
    document_id: int | None
    global_id: str | None
    assigned_to: int | None
    answer: str | None
    created_by: int | None
    answered_by: int | None
    closed_by: int | None
    lock_version: int
    created_at: datetime
    submitted_at: datetime | None
    answered_at: datetime | None
    closed_at: datetime | None
    updated_at: datetime
    events: list[BimCdeRfiEventResponse]


class BimCdeRfiAssigneeResponse(BaseModel):
    id: int
    name: str
    email: str
