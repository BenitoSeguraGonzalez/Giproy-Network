from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import enum
from app.core.database import Base

class TipoNodo(str, enum.Enum):
    HITO = "HITO"
    STAKEHOLDER = "STAKEHOLDER"

class EdoNode(Base):
    __tablename__ = "edo_nodes"

    id = Column(Integer, primary_key=True, index=True)
    # Jerarquía
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("edo_nodes.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Base
    tipo_nodo = Column(Enum(TipoNodo), nullable=False, default=TipoNodo.HITO)
    orden = Column(Integer, nullable=False, default=0) # Posición entre sus hermanos
    codigo = Column(String(50), nullable=False, index=True) # Ej: 1, 1.1, 1.1.1
    
    # Específico de HITOS
    nombre = Column(String(255), nullable=True) # Solo para HITOS
    
    # Específico de STAKEHOLDERS
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=True, index=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True)
    actividades_claves = Column(Text, nullable=True)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    proyecto = relationship("Proyecto")
    hijos = relationship("EdoNode", back_populates="padre", cascade="all, delete-orphan", order_by="EdoNode.orden")
    padre = relationship("EdoNode", back_populates="hijos", remote_side=[id])
    stakeholder = relationship("Stakeholder")
    rol = relationship("Rol")
