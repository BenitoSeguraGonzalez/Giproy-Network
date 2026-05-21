from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class SystemAuditEventResponse(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    empresa_id: Optional[int] = None
    empresa_nombre: Optional[str] = None
    target_user_id: Optional[int] = None
    target_user_email: Optional[str] = None
    target_empresa_id: Optional[int] = None
    target_empresa_nombre: Optional[str] = None
    module: str
    event_type: str
    severity: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    message: str
    payload: Optional[Any] = None
    created_at: datetime
