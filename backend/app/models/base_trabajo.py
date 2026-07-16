from sqlalchemy import Column, Integer, String, DECIMAL, Text, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class BaseTrabajo(Base):
    """
    Contenedor principal para Precios Unitarios (PU).
    Relaciona subcategorias, recursos y APUs.
    """
    __tablename__ = "bases_trabajo"

    id = Column(Integer, primary_key=True, index=True)
    codigo_unico = Column(String(100), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    tipo = Column(String(50), default="Base Maestra") # Base Maestra, Base de Proyecto
    descripcion = Column(Text, nullable=True)
    porcentaje_indirectos = Column(DECIMAL(5, 2), default=0.0) # % Indirectos
    
    # Estado de activación - solo una base puede estar activa por empresa
    activa = Column(Boolean, default=False, nullable=False)
    
    # Rendimiento Base
    tipo_rendimiento = Column(String(50), default="Rendimiento Unitario") # Rendimiento Unitario, Producción Unitaria
    unidad_tiempo = Column(String(20), default="Horas") # Minutos, Horas, Dias, Semanas
    
    # Configuración Regional
    pais_id = Column(Integer, ForeignKey("paises.id"), nullable=True)
    moneda = Column(String(100), default="USD")
    
    # Adicionales
    observaciones = Column(Text, nullable=True)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False, index=True)

    # Trazabilidad de clonación
    source_base_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="SET NULL"), nullable=True, index=True)
    clone_created_at = Column(DateTime(timezone=True), nullable=True)
    last_reconciled_at = Column(DateTime(timezone=True), nullable=True)
    sync_mode = Column(String(30), nullable=False, default="snapshot_locked", server_default="snapshot_locked")
    snapshot_subcategories_count = Column(Integer, nullable=True)
    snapshot_resources_count = Column(Integer, nullable=True)
    snapshot_apus_count = Column(Integer, nullable=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Papelera clasica: borrado reversible durante ventana operativa.
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    recycle_expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deletion_reason = Column(Text, nullable=True)
    trash_original_nombre = Column(String(255), nullable=True)
    trash_original_codigo_unico = Column(String(100), nullable=True)
    trash_original_activa = Column(Boolean, nullable=True)

    # Relaciones
    empresa = relationship("Empresa")
    pais = relationship("Pais")
    source_base = relationship("BaseTrabajo", remote_side=[id], foreign_keys=[source_base_id])
    
    # Cascada de integridad: borrar la base borra todo su contenido
    subcategorias = relationship("SubcategoriaItem", back_populates="base_trabajo", cascade="all, delete-orphan")
    recursos = relationship("Recurso", back_populates="base_trabajo", cascade="all, delete-orphan")
    apus = relationship("APU", back_populates="base_trabajo", cascade="all, delete-orphan")
    asignaciones = relationship("BaseTrabajoAsignacion", back_populates="base_trabajo", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        UniqueConstraint('nombre', 'empresa_id', name='uq_base_trabajo_nombre_empresa'),
        UniqueConstraint('codigo_unico', 'empresa_id', name='uq_base_trabajo_codigo_empresa'),
    )
