from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ProyectoAsignacion(Base):
    __tablename__ = "proyectos_asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Alcance de la asignación
    modulo = Column(String(50), default="todos", index=True) # todos, presupuesto, planificacion, etc.
    es_global = Column(Boolean, default=False, index=True) # True si aplica a todas las revisiones del codigo_root
    
    # Metadata
    asignado_por_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_asignacion = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    proyecto = relationship("Proyecto", back_populates="asignaciones")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="proyectos_asignados")
    asignado_por = relationship("Usuario", foreign_keys=[asignado_por_id])
    edt_node = relationship("EdtNode")
