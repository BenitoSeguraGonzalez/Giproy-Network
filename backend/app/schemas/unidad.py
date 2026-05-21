"""
Schemas Pydantic para Unidades de Medida
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional

class UnidadBase(BaseModel):
    descripcion: str
    descripcion_completa: Optional[str] = None
    subcategoria_codigo: int
    es_global: bool = True

class UnidadCreate(UnidadBase):
    base_trabajo_id: Optional[int] = None
    empresa_id: Optional[int] = None

class UnidadUpdate(BaseModel):
    descripcion: Optional[str] = None
    descripcion_completa: Optional[str] = None

class UnidadResponse(UnidadBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    base_trabajo_id: Optional[int] = None
    empresa_id: Optional[int] = None
