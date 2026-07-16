from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional
from datetime import datetime
from decimal import Decimal

class BaseTrabajoBase(BaseModel):
    codigo_unico: Optional[str] = None
    nombre: str
    tipo: str = "Base Maestra"
    descripcion: Optional[str] = None
    porcentaje_indirectos: Decimal = Decimal("0.0")
    activa: bool = False  # Solo una base puede estar activa por empresa
    tipo_rendimiento: str = "Rendimiento Unitario"
    unidad_tiempo: str = "Horas"
    pais_id: Optional[int] = None
    moneda: str = "USD"
    observaciones: Optional[str] = None

class BaseTrabajoCreate(BaseTrabajoBase):
    source_base_id: Optional[int] = None # Para clonación
    empresa_id: Optional[int] = None # Para que el Superadmin especifique la empresa
    content_revision: Optional[int] = None

class BaseTrabajoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    porcentaje_indirectos: Optional[Decimal] = None
    activa: Optional[bool] = None
    tipo_rendimiento: Optional[str] = None
    unidad_tiempo: Optional[str] = None
    pais_id: Optional[int] = None
    moneda: Optional[str] = None
    observaciones: Optional[str] = None

class BaseTrabajoResponse(BaseTrabajoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    source_base_id: Optional[int] = None
    clone_created_at: Optional[datetime] = None
    last_reconciled_at: Optional[datetime] = None
    sync_mode: Optional[str] = None
    snapshot_subcategories_count: Optional[int] = None
    snapshot_resources_count: Optional[int] = None
    snapshot_apus_count: Optional[int] = None
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    deleted_by_user_id: Optional[int] = None
    recycle_expires_at: Optional[datetime] = None
    deletion_reason: Optional[str] = None
    trash_original_nombre: Optional[str] = None
    trash_original_codigo_unico: Optional[str] = None
    trash_original_activa: Optional[bool] = None
    
    # Campos dinámicos agregados en el repositorio (outerjoin con proyectos)
    proyecto_id: Optional[int] = None
    codigo_root: Optional[str] = None
    revision: Optional[int] = None


class ProjectBaseSyncOperationRequest(BaseModel):
    mode: Literal["new_apus", "apu_values", "integral"]


class ProjectBaseSyncRevertRequest(BaseModel):
    sync_event_id: int

