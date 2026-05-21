from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.models.edo import TipoNodo
from app.schemas.stakeholder import Stakeholder, Rol

class EdoNodeBase(BaseModel):
    proyecto_id: int
    parent_id: Optional[int] = None
    tipo_nodo: TipoNodo
    orden: int
    codigo: str
    nombre: Optional[str] = None
    stakeholder_id: Optional[int] = None
    rol_id: Optional[int] = None
    actividades_claves: Optional[str] = None

class EdoNodeCreate(EdoNodeBase):
    pass

class EdoNodeUpdate(BaseModel):
    nombre: Optional[str] = None
    stakeholder_id: Optional[int] = None
    rol_id: Optional[int] = None
    actividades_claves: Optional[str] = None

class EdoNodeMove(BaseModel):
    new_parent_id: Optional[int] = None
    new_orden: int

class EdoBulkDelete(BaseModel):
    ids: List[int]

class EdoBulkMove(BaseModel):
    ids: List[int]
    new_parent_id: Optional[int] = None

class EdoNode(EdoNodeBase):
    id: int
    empresa_id: int
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None
    
    # Nested data
    stakeholder: Optional[Stakeholder] = None
    rol: Optional[Rol] = None
    hijos: List["EdoNode"] = []

    class Config:
        from_attributes = True

EdoNode.model_rebuild()
