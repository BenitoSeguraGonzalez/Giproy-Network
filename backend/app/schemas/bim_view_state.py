from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BimViewStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int
    empresa_id: int
    usuario_id: int
    bim_model_version_id: Optional[int] = None
    nombre: str
    scope: str
    payload: Optional[dict] = None
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None


class BimWorkspaceContextPayload(BaseModel):
    view_state_id: Optional[int] = None
    active_version_id: Optional[int] = None
    storey_name: Optional[str] = None
    element_id: Optional[int] = None
    link_id: Optional[int] = None


class BimWorkspaceContextResponse(BaseModel):
    project_id: int
    company_id: int
    user_id: int
    payload: BimWorkspaceContextPayload
    source: str = "database"


class BimWorkspaceContextUpsertRequest(BaseModel):
    view_state_id: Optional[int] = None
    active_version_id: Optional[int] = None
    storey_name: Optional[str] = None
    element_id: Optional[int] = None
    link_id: Optional[int] = None


class BimViewStatePayload(BaseModel):
    active_version_id: Optional[int] = None
    storey_name: Optional[str] = None
    element_id: Optional[int] = None
    link_id: Optional[int] = None


class BimViewStateCreateRequest(BaseModel):
    nombre: str
    scope: str = "personal"
    active_version_id: Optional[int] = None
    storey_name: Optional[str] = None
    element_id: Optional[int] = None
    link_id: Optional[int] = None


class BimViewStateUpdateRequest(BaseModel):
    nombre: str


class BimViewStateDuplicateRequest(BaseModel):
    nombre: Optional[str] = None
    scope: Optional[str] = None
