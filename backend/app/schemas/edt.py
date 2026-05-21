from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from app.models.edt import TipoNodoEdt
from app.schemas.stakeholder import Stakeholder, Rol

class EdtNodeBase(BaseModel):
    nombre: Optional[str] = None
    definicion: Optional[str] = None
    stakeholder_id: Optional[int] = None
    rol_id: Optional[int] = None
    actividades_claves: Optional[str] = None

class EdtNodeCreate(EdtNodeBase):
    proyecto_id: int
    parent_id: Optional[int] = None
    tipo_nodo: TipoNodoEdt

class EdtNodeUpdate(EdtNodeBase):
    pass

class EdtNodeMove(BaseModel):
    new_parent_id: Optional[int] = None
    new_orden: int

class EdtBulkDelete(BaseModel):
    ids: List[int]

class EdtBulkMove(BaseModel):
    ids: List[int]
    new_parent_id: Optional[int] = None

class EdtNodeResponse(EdtNodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int
    parent_id: Optional[int]
    tipo_nodo: TipoNodoEdt
    orden: int
    codigo: str
    
    # Nested info
    stakeholder: Optional[Stakeholder] = None
    rol: Optional[Rol] = None
    hijos: List['EdtNodeResponse'] = []
    
# Para resolver la recursividad circular
EdtNodeResponse.model_rebuild()
