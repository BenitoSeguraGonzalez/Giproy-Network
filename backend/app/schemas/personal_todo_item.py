from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PersonalTodoItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=4000)


class PersonalTodoItemCreate(PersonalTodoItemBase):
    sort_order: Optional[int] = Field(default=0, ge=0)


class PersonalTodoItemUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=255)
    notes: Optional[str] = Field(default=None, max_length=4000)
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = Field(default=None, ge=0)


class PersonalTodoItemResponse(PersonalTodoItemBase):
    id: int
    empresa_id: int
    user_id: int
    is_completed: bool = False
    sort_order: int = 0
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
