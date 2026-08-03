from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class EmpresaBase(BaseModel):
    nombre: str
    alias: Optional[str] = None
    codigo: Optional[str] = None
    ruc: str
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    canton: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    logo_url: Optional[str] = None
    activa: bool = True
    limite_administradores: int = 1
    limite_usuarios: int = 1
    license_start_date: Optional[date] = None
    license_end_date: Optional[date] = None
    decimales_moneda: int = 2
    decimales_calculos: int = 4
    use_omniclass: bool = False
    marketplace_can_sell: bool = True
    lifecycle_status: str = "active"
    baja_purged_at: Optional[datetime] = None
    baja_backup_hash: Optional[str] = None
    baja_backup_manifest: Optional[dict] = None
    baja_purged_counts: Optional[dict] = None
    baja_requested_by_email: Optional[str] = None
    baja_recovery_required: bool = False
    proy_prefijo: Optional[str] = None
    proy_periodo: Optional[str] = None
    proy_secuencial: int = 1
    proy_secuencial_size: int = 9
    plantillas_config: Optional[dict] = None
    session_timeout_minutes: int = 30



class EmpresaCreate(EmpresaBase):
    pass

class EmpresaUpdate(BaseModel):
    ruc: None = None
    nombre: None = None
    alias: Optional[str] = None
    codigo: Optional[str] = None
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    canton: Optional[str] = None
    provincia: Optional[str] = None
    pais: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    logo_url: Optional[str] = None
    activa: Optional[bool] = None
    limite_administradores: Optional[int] = None
    limite_usuarios: Optional[int] = None
    license_start_date: Optional[date] = None
    license_end_date: Optional[date] = None
    decimales_moneda: Optional[int] = None
    decimales_calculos: Optional[int] = None
    use_omniclass: Optional[bool] = None
    omniclass_change_acknowledged: Optional[bool] = None
    omniclass_change_reason: Optional[str] = None
    marketplace_can_sell: Optional[bool] = None
    lifecycle_status: Optional[str] = None
    baja_purged_at: Optional[datetime] = None
    baja_backup_hash: Optional[str] = None
    baja_backup_manifest: Optional[dict] = None
    baja_purged_counts: Optional[dict] = None
    baja_requested_by_email: Optional[str] = None
    baja_recovery_required: Optional[bool] = None
    proy_prefijo: Optional[str] = None
    proy_periodo: Optional[str] = None
    proy_secuencial: Optional[int] = None
    proy_secuencial_size: Optional[int] = None
    plantillas_config: Optional[dict] = None
    session_timeout_minutes: Optional[int] = None



class EmpresaResponse(EmpresaBase):
    id: int
    fecha_creacion: datetime
    license_start_date: Optional[date] = None
    license_end_date: Optional[date] = None
    total_administradores: int = 0
    total_usuarios: int = 0
    registration_status: str = "active"
    is_system_company: bool = False
    fiscal_status: Optional[str] = None
    fiscal_taxpayer_type: Optional[str] = None
    fiscal_start_date: Optional[str] = None
    fiscal_economic_activity: Optional[str] = None
    fiscal_source: Optional[str] = None
    fiscal_source_date: Optional[datetime] = None
    fiscal_verified_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
