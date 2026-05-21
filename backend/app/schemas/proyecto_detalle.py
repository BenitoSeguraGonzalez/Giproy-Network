from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ProyectoDetalleBase(BaseModel):
    cod_referencial: Optional[str] = None
    tipo_proyecto_id: Optional[int] = None
    categoria_id: Optional[int] = None
    tipo_construccion: Optional[str] = None
    ambito_contratacion: Optional[str] = None
    tipo_contrato: Optional[str] = None
    normativa_aplicable: Optional[str] = None
    nivel_complejidad: Optional[str] = None
    cliente_contratante_preliminar: Optional[str] = None
    presupuesto_referencial: Optional[float] = None
    moneda: Optional[str] = "USD"
    fuente_financiamiento: Optional[str] = None
    numero_contrato: Optional[str] = None
    fecha_firma_contrato: Optional[datetime] = None
    descripcion_breve: Optional[str] = None
    alcance_detallado: Optional[str] = None
    tipo_medicion: Optional[str] = "area"
    area_terreno: Optional[float] = 0.0
    area_construccion: Optional[float] = 0.0
    num_niveles: Optional[int] = None
    longitud_total: Optional[float] = None
    unidad_longitud: Optional[str] = "m"
    ancho_promedio: Optional[float] = None
    volumen_total: Optional[float] = None
    cantidad_unidades: Optional[int] = None
    descripcion_unidad: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    plazo_ejecucion: Optional[int] = 0
    fecha_finalizacion: Optional[datetime] = None
    pais: Optional[str] = "Ecuador"
    provincia: Optional[str] = None
    canton: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    objetivos_clave: Optional[str] = None
    restricciones_conocidas: Optional[str] = None
    supuestos_iniciales: Optional[str] = None
    imagen_referencial_url: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None
    map_zoom: Optional[int] = 13

class ProyectoDetalleCreate(ProyectoDetalleBase):
    codigo_root: str

class ProyectoDetalleUpdate(ProyectoDetalleBase):
    pass

class ProyectoDetalleResponse(ProyectoDetalleBase):
    id: Optional[int] = None
    codigo_root: str
    empresa_id: Optional[int] = None
    georef_map_url: Optional[str] = None
    georef_map_status: Optional[str] = None
    georef_map_signature: Optional[str] = None
    georef_map_generated_at: Optional[datetime] = None
    georef_map_error: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    ultima_modificacion: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProyectoGeocodeRequest(BaseModel):
    pais: Optional[str] = "Ecuador"
    provincia: Optional[str] = None
    canton: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None


class ProyectoGeocodeResponse(BaseModel):
    latitud: float
    longitud: float
    map_zoom: int
    message: str
    query: str
    source: str = "nominatim"
    display_name: Optional[str] = None


class ProyectoDocumentoResponse(BaseModel):
    id: int
    codigo_root: str
    empresa_id: int
    file_name: str
    content_type: str
    size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True
