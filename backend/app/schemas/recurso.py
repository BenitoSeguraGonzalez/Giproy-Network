"""
Schemas Pydantic para Recursos
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .unidad import UnidadResponse
from .codcpc import CodCPCResponse

class CategoriaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int
    recursos_count: Optional[int] = 0

    class Config:
        from_attributes = True

class RecursoBase(BaseModel):
    descripcion: str
    precio: float = 0.0
    unidad_id: int
    cod_cpc_id: Optional[int] = None
    especificaciones: Optional[str] = None
    subcategoria_item_id: int
    equipment_ownership_kind: Optional[str] = None
    governing_resource_kind: Optional[str] = None
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None

class RecursoCreate(RecursoBase):
    pass

class RecursoUpdate(BaseModel):
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    unidad_id: Optional[int] = None
    cod_cpc_id: Optional[int] = None
    clear_cod_cpc: Optional[bool] = False
    especificaciones: Optional[str] = None
    equipment_ownership_kind: Optional[str] = None
    governing_resource_kind: Optional[str] = None
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None
    
    # Manejo de estado de tanteo
    tanteo_activo: Optional[bool] = None
    precio_original: Optional[float] = None
    precio_tanteo: Optional[float] = None
    revisado: Optional[bool] = None

class RecursoResponse(RecursoBase):
    id: int
    codigo: str
    base_trabajo_id: int
    empresa_id: int
    source_recurso_id: Optional[int] = None
    content_origin: Optional[str] = None
    sync_status: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    revisado: bool
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None
    
    # Nested relations for better UI
    unidad: Optional[UnidadResponse] = None
    cpc: Optional[CodCPCResponse] = None

    class Config:
        from_attributes = True

class RecursoDuplicate(BaseModel):
    recurso_id: int

class RecursoMove(BaseModel):
    target_subcategoria_item_id: int

# Schemas para Import/Export
class RecursoImportItem(BaseModel):
    descripcion: str
    precio: float = 0.0
    unidad_nombre: Optional[str] = None  # Sigla (m, kg, etc.)
    unidad_id: Optional[int] = None
    cod_cpc_codigo: Optional[str] = None
    cod_cpc_id: Optional[int] = None
    especificaciones: Optional[str] = None
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None

class RecursoImportRequest(BaseModel):
    subcategoria_item_id: int
    items: List[RecursoImportItem]

class RecursoExportRequest(BaseModel):
    recurso_ids: List[int]

class RecursoBulkDeleteRequest(BaseModel):
    recurso_ids: List[int]

class RecursoBulkDeleteResponse(BaseModel):
    deleted_ids: List[int]
    deleted_count: int
    message: str

class RecursoBulkCpcRequest(BaseModel):
    recurso_ids: List[int]
    cod_cpc_id: int

class RecursoBulkCpcResponse(BaseModel):
    updated_ids: List[int]
    updated_count: int
    cod_cpc_id: int
    message: str

class RecursoImportResponse(BaseModel):
    imported: int
    duplicates: int
    errors: List[str]
    imported_ids: List[int] = []
    clipboard: Optional[str] = None # Para exportar si se requiere
