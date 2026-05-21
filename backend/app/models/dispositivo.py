from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Dispositivo(Base):
    """
    Modelo para gestionar dispositivos autorizados por empresa.
    Cada dispositivo tiene un identificador único generado desde el frontend.
    """
    __tablename__ = "dispositivos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Identificador único del dispositivo (generado en frontend)
    device_id = Column(String(100), unique=True, nullable=False, index=True)
    
    # Empresa a la que pertenece el dispositivo
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)
    
    # Usuario que registró el dispositivo
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Información del dispositivo (almacenada como JSON en texto)
    info_navegador = Column(Text, nullable=True)  # User agent
    info_pantalla = Column(String(100), nullable=True)  # Resolución
    info_sistema = Column(String(100), nullable=True)  # OS
    info_ubicacion = Column(String(255), nullable=True)  # Ubicación/IP
    
    # Nombre descriptivo del dispositivo
    nombre = Column(String(255), nullable=True)
    
    # Estado
    activo = Column(Boolean, default=True)
    es_confiable = Column(Boolean, default=False)  # Si fue verificado manualmente
    
    # Fechas
    fecha_primer_acceso = Column(DateTime(timezone=True), server_default=func.now())
    fecha_ultimo_acceso = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Contador de accesos fallidos
    intentos_fallidos = Column(Integer, default=0)
    bloqueado = Column(Boolean, default=False)
    
    # Relaciones
    empresa = relationship("Empresa", back_populates="dispositivos")
    usuario = relationship("Usuario", back_populates="dispositivos")
