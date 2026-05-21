from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Rol(Base):
    __tablename__ = "roles"
    __table_args__ = (
        UniqueConstraint("codigo", "empresa_id", name="uq_roles_codigo_empresa"),
    )

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), index=True, nullable=False) # ROL-0001
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

class Stakeholder(Base):
    __tablename__ = "stakeholders"
    __table_args__ = (
        UniqueConstraint("codigo", "empresa_id", name="uq_stakeholders_codigo_empresa"),
    )

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), index=True, nullable=False) # STK-0001
    nombre = Column(String(255), nullable=False)
    apellidos = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    movil = Column(String(50), nullable=True)
    profesion = Column(String(255), nullable=True)
    institucion = Column(String(255), nullable=True)
    
    # Dirección (Libro de Estilo)
    pais = Column(String(100), default="Ecuador")
    provincia = Column(String(100), nullable=True)
    canton = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=True)
    direccion_detalle = Column(Text, nullable=True)
    
    # Vinculación Trans-Revisión (Común a todas)
    proyecto_codigo_root = Column(String(50), index=True, nullable=False)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

class ProyectoStakeholder(Base):
    """
    Tabla de unión para asignar stakeholders al PROYECTO RAÍZ.
    `proyecto_id` siempre debe apuntar a la revisión inicial del `codigo_root`
    para que el mismo grupo de stakeholders se comparta entre revisiones.
    """
    __tablename__ = "proyecto_stakeholders"
    __table_args__ = (
        UniqueConstraint("proyecto_id", "stakeholder_id", name="uq_proyecto_stakeholder_root_pair"),
    )

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    stakeholder_id = Column(Integer, ForeignKey("stakeholders.id", ondelete="CASCADE"), nullable=False, index=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Relaciones para facilitar acceso
    proyecto = relationship("Proyecto")
    stakeholder = relationship("Stakeholder")
    rol = relationship("Rol")
