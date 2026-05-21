from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SystemBimSettingBase(BaseModel):
    titulo: str = "Activación BIM"
    descripcion: Optional[str] = None
    is_enabled: bool = False
    superadmin_only: bool = True
    allowed_company_ids: Optional[str] = None


class SystemBimSettingUpdate(SystemBimSettingBase):
    pass


class SystemBimSettingResponse(SystemBimSettingBase):
    id: int
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    allowed_company_ids_list: list[int] = []
    source: str = "database"

    class Config:
        from_attributes = True
