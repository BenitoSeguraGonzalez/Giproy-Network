from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional
from typing import List
from app.schemas.empresa import EmpresaResponse

class UsuarioBase(BaseModel):
    email: str
    nombre_completo: str
    rol: str = "usuario"
    activo: bool = True
    empresa_id: int
    
    # Nuevos campos para usuarios
    ruc: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    alias: Optional[str] = None
    empresa_alias: Optional[str] = None
    nacionalidad: Optional[str] = None
    profesion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    canton: Optional[str] = None
    pais: Optional[str] = None
    movil: Optional[str] = None
    acepta_politica_privacidad: bool = False
    acepta_politicas_comunicacion: bool = False
    autoriza_publicidad: bool = False

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioRegister(BaseModel):
    email: str
    nombre_completo: str
    password: str
    
    # Campos adicionales para registro extendido
    ruc: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    alias: Optional[str] = None
    empresa_alias: Optional[str] = None
    nacionalidad: Optional[str] = None
    profesion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    canton: Optional[str] = None
    pais: Optional[str] = None
    movil: Optional[str] = None
    acepta_politica_privacidad: bool = False
    acepta_politicas_comunicacion: bool = False
    autoriza_publicidad: bool = False
    ruc_verification_token: Optional[str] = None


class RegisterPendingResponse(BaseModel):
    status: str = "pending_email_verification"
    message: str
    email: str
    empresa_id: int


class RegisterVerificationResponse(BaseModel):
    status: str = "verified"
    message: str
    email: str
    empresa_id: int

class UsuarioResponse(UsuarioBase):
    id: int
    fecha_creacion: datetime
    last_active_at: Optional[datetime] = None
    fecha_expiracion: Optional[datetime] = None
    ruc_verificado: bool = False
    razon_social_ruc: Optional[str] = None
    estado_contribuyente: Optional[str] = None
    clase_contribuyente: Optional[str] = None
    fecha_inicio_actividades: Optional[str] = None
    actividad_economica: Optional[str] = None
    fecha_aceptacion_politica_privacidad: Optional[datetime] = None
    fecha_aceptacion_politicas_comunicacion: Optional[datetime] = None
    fecha_autorizacion_publicidad: Optional[datetime] = None
    empresa: Optional[EmpresaResponse] = None
    marketplace_permissions: List[str] = Field(default_factory=list)
    marketplace_profile_complete: bool = False
    marketplace_profile_missing_fields: List[str] = Field(default_factory=list)
    marketplace_profile_missing_labels: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

    @field_validator(
        "marketplace_permissions",
        "marketplace_profile_missing_fields",
        "marketplace_profile_missing_labels",
        mode="before",
    )
    @classmethod
    def _empty_list_when_null(cls, value):
        return [] if value is None else value

class UsuarioUpdate(BaseModel):
    """Schema para actualizar usuario"""
    email: Optional[str] = None
    nombre_completo: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    ruc: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    alias: Optional[str] = None
    nacionalidad: Optional[str] = None
    profesion: Optional[str] = None
    ciudad: Optional[str] = None
    provincia: Optional[str] = None
    canton: Optional[str] = None
    pais: Optional[str] = None
    movil: Optional[str] = None
    password: Optional[str] = None
    acepta_politica_privacidad: Optional[bool] = None
    acepta_politicas_comunicacion: Optional[bool] = None
    autoriza_publicidad: Optional[bool] = None

class ValidarRucResponse(BaseModel):
    """Respuesta de validación de RUC"""
    valido: bool
    mensaje: str
    ruc: Optional[str] = None
    razon_social: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    estado_contribuyente: Optional[str] = None
    clase_contribuyente: Optional[str] = None
    fecha_inicio_actividades: Optional[str] = None
    actividad_economica: Optional[str] = None
    verification_status: str = "source_unavailable"
    source: Optional[str] = None
    source_date: Optional[datetime] = None
    requires_manual_review: bool = False
