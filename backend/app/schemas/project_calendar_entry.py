from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProjectCalendarEntryBase(BaseModel):
    calendar_date: date
    entry_type: str = Field(default="annotation")
    title: Optional[str] = Field(default=None, max_length=255)
    message: str = Field(..., min_length=3)
    proyecto_codigo_root: Optional[str] = Field(default=None, max_length=50)


class ProjectCalendarEntryCreate(ProjectCalendarEntryBase):
    pass


class ProjectCalendarEntryUpdate(BaseModel):
    calendar_date: Optional[date] = None
    title: Optional[str] = Field(default=None, max_length=255)
    message: Optional[str] = Field(default=None, min_length=3)
    proyecto_codigo_root: Optional[str] = Field(default=None, max_length=50)


class ProjectCalendarEntryResponse(ProjectCalendarEntryBase):
    id: int
    empresa_id: int
    created_by: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    can_edit: bool = False
    can_delete: bool = False

    class Config:
        from_attributes = True
