from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SystemMaintenanceBase(BaseModel):
    titulo: str
    mensaje: Optional[str] = None
    mode: str = "readonly"
    is_enabled: bool = False
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class SystemMaintenanceUpdate(SystemMaintenanceBase):
    pass


class SystemMaintenanceResponse(SystemMaintenanceBase):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active_now: bool = False

    class Config:
        from_attributes = True
