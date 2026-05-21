from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, JSON
from sqlalchemy.orm import relationship, deferred
from sqlalchemy.sql import func
from app.core.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    rol = Column(String(50), default="usuario", nullable=False) 
    activo = Column(Boolean, default=True)
    
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Nuevos campos para usuarios (no superadministradores)
    ruc = Column(String(20), nullable=True, index=True)  # Id Fiscal (RUC)
    nombres = Column(String(255), nullable=True)  # Nombres
    apellidos = Column(String(255), nullable=True)  # Apellidos
    alias = Column(String(100), nullable=True)  # Alias
    nacionalidad = Column(String(100), nullable=True)  # Nacionalidad
    profesion = Column(String(255), nullable=True)  # Profesion
    ciudad = Column(String(255), nullable=True)  # Ciudad
    provincia = Column(String(255), nullable=True)  # Provincia
    canton = Column(String(255), nullable=True)  # Cantón
    pais = Column(String(100), nullable=True)  # Pais
    movil = Column(String(20), nullable=True)  # Movil
    
    # Campos de politica y consentimiento
    acepta_politica_privacidad = Column(Boolean, default=False)
    acepta_politicas_comunicacion = Column(Boolean, default=False)
    autoriza_publicidad = Column(Boolean, default=False)
    fecha_aceptacion_politica_privacidad = Column(DateTime(timezone=True), nullable=True)
    fecha_aceptacion_politicas_comunicacion = Column(DateTime(timezone=True), nullable=True)
    fecha_autorizacion_publicidad = Column(DateTime(timezone=True), nullable=True)
    ruc_verificado = Column(Boolean, default=False)  # Si el RUC fue verificado
    
    # Información del RUC consultada
    razon_social_ruc = Column(String(500), nullable=True)
    estado_contribuyente = Column(String(100), nullable=True)
    clase_contribuyente = Column(String(100), nullable=True)
    fecha_inicio_actividades = Column(String(50), nullable=True)
    actividad_economica = Column(Text, nullable=True)
    
    # Control de vigencia
    fecha_expiracion = Column(DateTime(timezone=True), nullable=True)
    
    current_session_id = Column(String(255), nullable=True)  # Para política de sesión única
    current_session_started_at = Column(DateTime(timezone=True), nullable=True)
    current_session_expires_at = Column(DateTime(timezone=True), nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    current_session_device_id = Column(String(100), nullable=True)
    marketplace_permissions = deferred(Column(JSON, nullable=True))

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (UniqueConstraint('email', 'empresa_id', name='uq_usuario_email_empresa'),)

    empresa = relationship("Empresa", back_populates="usuarios")
    dispositivos = relationship("Dispositivo", back_populates="usuario")
    proyectos_asignados = relationship("ProyectoAsignacion", foreign_keys="ProyectoAsignacion.usuario_id", back_populates="usuario", cascade="all, delete-orphan")
    bases_asignadas = relationship("BaseTrabajoAsignacion", foreign_keys="BaseTrabajoAsignacion.usuario_id", back_populates="usuario", cascade="all, delete-orphan")
    system_roles_link = relationship("UserRole", back_populates="usuario", cascade="all, delete-orphan")
