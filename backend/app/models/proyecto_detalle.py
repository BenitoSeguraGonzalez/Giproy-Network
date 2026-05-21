from sqlalchemy import Column, Integer, String, Text, DECIMAL, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class ProyectoDetalle(Base):
    __tablename__ = "proyecto_detalles"

    id = Column(Integer, primary_key=True, index=True)
    # Vinculamos por codigo_root para que sea común a todas las revisiones de una misma empresa
    codigo_root = Column(String(50), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)
    
    cod_referencial = Column(String(255), nullable=True)
    tipo_proyecto_id = Column(Integer, nullable=True)
    categoria_id = Column(Integer, nullable=True)
    
    tipo_construccion = Column(String(100), nullable=True) # Nueva Construcción, Renovación
    ambito_contratacion = Column(String(100), nullable=True) # Privado, Público
    tipo_contrato = Column(String(255), nullable=True)
    normativa_aplicable = Column(Text, nullable=True)
    nivel_complejidad = Column(String(50), nullable=True)
    cliente_contratante_preliminar = Column(String(255), nullable=True)
    presupuesto_referencial = Column(DECIMAL(15, 2), nullable=True)
    moneda = Column(String(10), nullable=True, default="USD")
    fuente_financiamiento = Column(String(100), nullable=True)
    numero_contrato = Column(String(120), nullable=True)
    fecha_firma_contrato = Column(DateTime(timezone=True), nullable=True)
    
    descripcion_breve = Column(String(200), nullable=True)
    alcance_detallado = Column(Text, nullable=True)
    tipo_medicion = Column(String(50), nullable=True, default="area")
    area_terreno = Column(DECIMAL(15, 2), default=0.0)
    area_construccion = Column(DECIMAL(15, 2), default=0.0)
    num_niveles = Column(Integer, nullable=True)
    longitud_total = Column(DECIMAL(15, 2), nullable=True)
    unidad_longitud = Column(String(10), nullable=True, default="m")
    ancho_promedio = Column(DECIMAL(15, 2), nullable=True)
    volumen_total = Column(DECIMAL(15, 2), nullable=True)
    cantidad_unidades = Column(Integer, nullable=True)
    descripcion_unidad = Column(String(255), nullable=True)
    
    fecha_inicio = Column(DateTime(timezone=True), nullable=True)
    plazo_ejecucion = Column(Integer, default=0) # Días
    fecha_finalizacion = Column(DateTime(timezone=True), nullable=True)
    
    pais = Column(String(100), default="Ecuador")
    provincia = Column(String(100), nullable=True)
    canton = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=True)
    direccion = Column(Text, nullable=True)
    
    objetivos_clave = Column(Text, nullable=True)
    restricciones_conocidas = Column(Text, nullable=True)
    supuestos_iniciales = Column(Text, nullable=True)
    imagen_referencial_url = Column(String(1024), nullable=True)
    
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    map_zoom = Column(Integer, nullable=True, default=13)
    georef_map_url = Column(String(1024), nullable=True)
    georef_map_status = Column(String(40), nullable=True, default="pending")
    georef_map_signature = Column(String(120), nullable=True)
    georef_map_generated_at = Column(DateTime(timezone=True), nullable=True)
    georef_map_error = Column(Text, nullable=True)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
