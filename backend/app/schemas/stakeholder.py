from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# --- ROL SCHEMAS ---
class RolBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

class Rol(RolBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    empresa_id: int
    fecha_creacion: datetime

# --- STAKEHOLDER SCHEMAS ---
class StakeholderBase(BaseModel):
    nombre: str
    apellidos: str
    email: Optional[str] = None
    movil: Optional[str] = None
    profesion: Optional[str] = None
    institucion: Optional[str] = None
    pais: str = "Ecuador"
    provincia: Optional[str] = None
    canton: Optional[str] = None
    ciudad: Optional[str] = None
    direccion_detalle: Optional[str] = None
    proyecto_codigo_root: str

class StakeholderCreate(StakeholderBase):
    pass

class StakeholderUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    email: Optional[str] = None
    movil: Optional[str] = None
    profesion: Optional[str] = None
    institucion: Optional[str] = None
    pais: Optional[str] = None
    provincia: Optional[str] = None
    canton: Optional[str] = None
    ciudad: Optional[str] = None
    direccion_detalle: Optional[str] = None

class Stakeholder(StakeholderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    codigo: str
    empresa_id: int
    fecha_creacion: datetime
    
    # Estos campos se inyectarán en la respuesta de la API cuando se consulte por proyecto
    assigned: Optional[bool] = False
    rol_id: Optional[int] = None
    rol_nombre: Optional[str] = None

# --- ASSIGNMENT SCHEMAS ---
class StakeholderAssignment(BaseModel):
    proyecto_id: int
    stakeholder_id: int
    rol_id: Optional[int] = None
