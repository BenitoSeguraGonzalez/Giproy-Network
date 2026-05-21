from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict
from decimal import Decimal
from datetime import datetime
from .unidad import UnidadResponse
from .codcpc import CodCPCResponse


# --- Esquemas de Líneas de APU ---

class APULineaBase(BaseModel):
    recurso_id: Optional[int] = None
    apu_hijo_id: Optional[int] = None
    cantidad: Decimal
    rendimiento: Optional[Decimal] = 1.0
    orden: Optional[int] = 0
    precio_congelado: Optional[Decimal] = None
    subtotal: Optional[Decimal] = None

class APULineaCreate(APULineaBase):
    pass

# Esquemas mínimos para relaciones anidadas
class RecursoMinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    descripcion: str
    precio: Decimal
    unidad_id: int
    unidad: Optional[UnidadResponse] = None
    cod_cpc_id: Optional[int] = None
    cod_cpc_codigo: Optional[str] = None
    cpc_descripcion: Optional[str] = None
    cpc_porcentaje: Optional[float] = None
    cpc: Optional[CodCPCResponse] = None
    subcategoria_codigo: Optional[int] = None

    tanteo_activo: Optional[bool] = False
    precio_original: Optional[Decimal] = None
    
class APUMinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    descripcion: str
    costo_directo: Decimal
    precio_unitario_total: Decimal
    vae_total: Optional[Decimal] = None
    unidad: str
    
class APULineaResponse(APULineaBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    apu_id: int
    tanteo_activo: Optional[bool] = False
    rendimiento_original: Optional[Decimal] = None
    rendimiento_tanteo: Optional[Decimal] = None
    recurso: Optional[RecursoMinResponse] = None
    apu_hijo: Optional[APUMinResponse] = None

# --- Esquemas de Cabecera de APU ---

class APUBase(BaseModel):
    codigo: str
    descripcion: str
    unidad: str
    rendimiento_estandar: Optional[Decimal] = 1.0
    moneda: Optional[str] = "USD"
    estado_revision: Optional[str] = "Borrador"
    categoria_id: Optional[int] = None
    subcategoria_item_id: Optional[int] = None
    base_trabajo_id: Optional[int] = 1
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None

class APUCreate(APUBase):
    lineas: List[APULineaCreate] = []

class APUUpdate(BaseModel):
    descripcion: Optional[str] = None
    unidad: Optional[str] = None
    rendimiento_estandar: Optional[Decimal] = None
    estado_revision: Optional[str] = None
    categoria_id: Optional[int] = None
    subcategoria_item_id: Optional[int] = None
    omniclass_codigo: Optional[str] = None
    omniclass_titulo: Optional[str] = None
    lineas: List[APULineaCreate] = []

class APUResponse(APUBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    costo_directo: Decimal
    costo_indirecto: Decimal
    precio_unitario_total: Decimal
    empresa_id: int
    source_apu_id: Optional[int] = None
    content_origin: Optional[str] = None
    sync_status: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None
    lineas: List[APULineaResponse] = []

class APUImportRequest(BaseModel):
    source_base_id: int
    target_base_id: int
    source_revision: Optional[int] = 0
    target_revision: Optional[int] = 0
    apu_ids: List[int]
    dry_run: bool = False
    resolutions: Optional[Dict[int, str]] = None # {source_apu_id: 'skip' | 'overwrite'}

class APULineaMoveRequest(BaseModel):
    linea_id: int
    target_index: int = Field(ge=0)

class APUClipboardImportItem(BaseModel):
    descripcion: str
    unidad: str

class APUImpactSummaryResponse(BaseModel):
    apu_id: int
    parent_apus_count: int
    affected_apus_count: int
    affected_presupuestos_count: int

class APUBulkDeleteRequest(BaseModel):
    apu_ids: List[int]

class APUBatchDetailRequest(BaseModel):
    apu_ids: List[int]

class APUBulkDeleteResponse(BaseModel):
    deleted_ids: List[int]
    deleted_count: int
    message: str


class ProyectoApuCpcUpsertRequest(BaseModel):
    proyecto_id: int
    cod_cpc_id: int


class ProyectoApuCpcResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    proyecto_root_codigo: str
    apu_id: int
    cod_cpc_id: int
    cpc: CodCPCResponse
