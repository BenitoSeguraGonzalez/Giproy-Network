from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    codigo = Column(String(50), nullable=True, index=True)
    codigo_root = Column(String(50), nullable=True, index=True)
    revision = Column(Integer, default=0)
    descripcion = Column(Text, nullable=True)
    estado = Column(String(50), default="Planificación")  # Planificación, En Ejecución, Finalizado, Suspendido
    fecha_inicio = Column(DateTime(timezone=True), nullable=True)
    fecha_fin_estimada = Column(DateTime(timezone=True), nullable=True)
    
    # Presupuesto Referencial General
    presupuesto_estimado = Column(DECIMAL(15, 2), default=0.0)
    moneda = Column(String(10), default="USD")

    # Multi-tenant: Todo proyecto le pertenece a una empresa
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    cliente_id = Column(Integer, nullable=True) # Más adelante podemos tener un catálogo de clientes

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Papelera clasica: borrado reversible durante ventana operativa.
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deleted_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    recycle_expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deletion_reason = Column(Text, nullable=True)
    trash_original_nombre = Column(String(255), nullable=True)
    trash_original_codigo = Column(String(50), nullable=True)

    # Relación con la Base de Trabajo específica del proyecto
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="SET NULL"), nullable=True, index=True)

    # Configuración de Plantillas específica por proyecto
    plantillas_config = Column(JSON, nullable=True)

    # Relaciones
    empresa = relationship("Empresa")
    base_trabajo = relationship("BaseTrabajo")
    asignaciones = relationship("ProyectoAsignacion", back_populates="proyecto", cascade="all, delete-orphan")
    # presupuestos = relationship("Presupuesto", back_populates="proyecto")
