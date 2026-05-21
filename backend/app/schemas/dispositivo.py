from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class DispositivoBase(BaseModel):
    """Schema base para dispositivo"""
    device_id: str = Field(..., description="Identificador único del dispositivo")
    nombre: Optional[str] = Field(None, description="Nombre descriptivo del dispositivo")
    info_navegador: Optional[str] = Field(None, description="Información del navegador")
    info_pantalla: Optional[str] = Field(None, description="Resolución de pantalla")
    info_sistema: Optional[str] = Field(None, description="Sistema operativo")
    info_ubicacion: Optional[str] = Field(None, description="Ubicación/IP")


class DispositivoCreate(DispositivoBase):
    """Schema para crear un nuevo dispositivo"""
    empresa_id: int = Field(..., description="ID de la empresa")
    usuario_id: Optional[int] = Field(None, description="ID del usuario que registra")


class DispositivoUpdate(BaseModel):
    """Schema para actualizar un dispositivo"""
    nombre: Optional[str] = None
    activo: Optional[bool] = None
    es_confiable: Optional[bool] = None
    bloqueado: Optional[bool] = None


class DispositivoResponse(DispositivoBase):
    """Schema para respuesta de dispositivo"""
    id: int
    empresa_id: int
    usuario_id: Optional[int]
    activo: bool
    es_confiable: bool
    bloqueado: bool
    fecha_primer_acceso: datetime
    fecha_ultimo_acceso: datetime
    intentos_fallidos: int

    class Config:
        from_attributes = True


class DispositivoListResponse(BaseModel):
    """Schema para lista de dispositivos"""
    dispositivos: list[DispositivoResponse]
    total: int


class ValidacionDispositivoResponse(BaseModel):
    """Schema para validación de dispositivo en login"""
    valido: bool = Field(..., description="Si el dispositivo está autorizado")
    dispositivo_id: Optional[int] = Field(None, description="ID del dispositivo si existe")
    mensaje: str = Field(..., description="Mensaje de validación")
    requiere_aprobacion: bool = Field(False, description="Si requiere aprobación manual")
