from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class BaseTrabajoAsignacion(Base):
    __tablename__ = "base_trabajo_asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    asignado_por_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    base_trabajo = relationship("BaseTrabajo", back_populates="asignaciones")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="bases_asignadas")
    asignado_por = relationship("Usuario", foreign_keys=[asignado_por_id])
