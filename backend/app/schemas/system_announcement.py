from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SystemAnnouncementBase(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=255)
    mensaje: str = Field(..., min_length=3)
    tipo: str = Field(default="info")
    scope: str = Field(default="global")
    empresa_id: Optional[int] = None
    target_company_ids: list[int] = Field(default_factory=list)
    display_duration_seconds: Optional[int] = Field(default=30)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True


class SystemAnnouncementCreate(SystemAnnouncementBase):
    pass


class SystemAnnouncementUpdate(BaseModel):
    titulo: Optional[str] = Field(default=None, min_length=3, max_length=255)
    mensaje: Optional[str] = Field(default=None, min_length=3)
    tipo: Optional[str] = None
    scope: Optional[str] = None
    empresa_id: Optional[int] = None
    target_company_ids: Optional[list[int]] = None
    display_duration_seconds: Optional[int] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class SystemAnnouncementResponse(SystemAnnouncementBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    empresa_nombre: Optional[str] = None
    target_company_names: list[str] = Field(default_factory=list)
    status: str = Field(default="upcoming")
    impact_label: str = Field(default="Global")

    class Config:
        from_attributes = True
