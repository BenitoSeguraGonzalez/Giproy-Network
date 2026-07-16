from typing import Optional, List
from pydantic import BaseModel, ConfigDict, computed_field
from datetime import datetime

# --- PROYECTOS ---
class ProyectoBase(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    codigo_root: Optional[str] = None
    revision: Optional[int] = 0
    descripcion: Optional[str] = None
    estado: Optional[str] = "Planificación"
    fecha_inicio: Optional[datetime] = None
    fecha_fin_estimada: Optional[datetime] = None
    presupuesto_estimado: Optional[float] = 0.0
    moneda: Optional[str] = "USD"
    cliente_id: Optional[int] = None
    plantillas_config: Optional[dict] = None

class ProyectoCreate(ProyectoBase):
    nombre: str # Requerido para creación
    source_base_id: Optional[int] = None

class ProyectoUpdate(ProyectoBase):
    pass

class ProyectoResponse(ProyectoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    empresa_id: int
    base_trabajo_id: Optional[int] = None
    plantillas_config: Optional[dict] = None
    codigo_root: Optional[str] = None
    revision: int
    fecha_creacion: datetime
    ultima_modificacion: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    deleted_by_user_id: Optional[int] = None
    recycle_expires_at: Optional[datetime] = None
    deletion_reason: Optional[str] = None
    trash_original_nombre: Optional[str] = None
    trash_original_codigo: Optional[str] = None
    num_revisiones: Optional[int] = 1
    sole_presupuesto_total: Optional[float] = None
    sole_indirectos_porcentaje: Optional[float] = None

    @computed_field
    @property
    def created_at(self) -> datetime:
        return self.fecha_creacion

    @computed_field
    @property
    def updated_at(self) -> datetime:
        return self.ultima_modificacion or self.fecha_creacion

# --- ASIGNACIONES ---
class ProyectoAsignacionBase(BaseModel):
    usuario_id: int
    edt_id: Optional[int] = None
    modulo: str = "todos"
    es_global: bool = False

class ProyectoAsignacionCreate(ProyectoAsignacionBase):
    pass

class ProyectoAsignacionResponse(ProyectoAsignacionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proyecto_id: int
    fecha_asignacion: datetime
