from datetime import date, timedelta

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, JSON, Text

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(Text, nullable=False, index=True)
    alias = Column(String(100), nullable=True, index=True)
    codigo = Column(String(50), unique=True, nullable=True, index=True)
    ruc = Column(String(20), unique=True, nullable=False, index=True)
    is_system_company = Column(Boolean, default=False, nullable=False, server_default="0", index=True)
    fiscal_status = Column(String(100), nullable=True)
    fiscal_taxpayer_type = Column(String(150), nullable=True)
    fiscal_start_date = Column(String(50), nullable=True)
    fiscal_economic_activity = Column(Text, nullable=True)
    fiscal_source = Column(String(50), nullable=True)
    fiscal_source_date = Column(DateTime(timezone=True), nullable=True)
    fiscal_verified_at = Column(DateTime(timezone=True), nullable=True)
    direccion = Column(String(500), nullable=True)
    localidad = Column(String(255), nullable=True)
    canton = Column(String(255), nullable=True)
    provincia = Column(String(255), nullable=True)
    pais = Column(String(100), nullable=True)
    telefono = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    contacto_nombre = Column(String(255), nullable=True)
    contacto_email = Column(String(255), nullable=True)
    contacto_telefono = Column(String(50), nullable=True)
    logo_url = Column(Text, nullable=True) # Almacena Base64 para portabilidad

    activa = Column(Boolean, default=True)
    limite_administradores = Column(Integer, default=1, nullable=False)
    limite_usuarios = Column(Integer, default=1, nullable=False)
    license_start_date = Column(Date, default=date.today, nullable=False)
    license_end_date = Column(Date, default=lambda: date.today() + timedelta(days=365), nullable=False)
    
    decimales_moneda = Column(Integer, default=2, nullable=False)
    decimales_calculos = Column(Integer, default=4, nullable=False)
    session_timeout_minutes = Column(Integer, default=30, nullable=False)
    use_omniclass = Column(Boolean, default=False, nullable=False, server_default="0")
    marketplace_can_sell = Column(Boolean, default=True, nullable=False, server_default="1")

    lifecycle_status = Column(String(40), default="active", nullable=False, server_default="active", index=True)
    baja_purged_at = Column(DateTime(timezone=True), nullable=True)
    baja_backup_hash = Column(String(128), nullable=True, index=True)
    baja_backup_manifest = Column(JSON, nullable=True)
    baja_purged_counts = Column(JSON, nullable=True)
    baja_requested_by_email = Column(String(255), nullable=True)
    baja_recovery_required = Column(Boolean, default=False, nullable=False, server_default="0")
    
    # Configuración de Proyectos
    proy_prefijo = Column(String(50), nullable=True) # Prefijo (ej. GiProy)
    proy_periodo = Column(String(10), nullable=True) # Periodo (ej. 2026)
    proy_secuencial = Column(Integer, default=1, nullable=False) # Próximo número
    proy_secuencial_size = Column(Integer, default=9, nullable=False) # Tamaño del secuencial (ej. 9 para 000000001)
    
    # Configuración de Plantillas (JSON)
    plantillas_config = Column(JSON, nullable=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    usuarios = relationship("Usuario", back_populates="empresa", cascade="all, delete-orphan")
    dispositivos = relationship("Dispositivo", back_populates="empresa", cascade="all, delete-orphan")

    @property
    def total_administradores(self) -> int:
        return sum(1 for u in self.usuarios if u.rol and u.rol.lower() == "administrador")

    @property
    def total_usuarios(self) -> int:
        return sum(1 for u in self.usuarios if u.rol and u.rol.lower() in {"usuario", "usuario_comunidad"})
