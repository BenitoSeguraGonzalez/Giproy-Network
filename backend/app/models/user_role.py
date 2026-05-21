from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class SystemRole(Base):
    """
    Catálogo maestro de roles del sistema.
    Ej: 'admin' (Administrador de Empresa), 'collaborator' (Colaborador).
    """
    __tablename__ = "system_roles"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    codigo = Column(String(50), unique=True, nullable=False) # ADMIN, COLLABORATOR
    descripcion = Column(String(500), nullable=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

class UserRole(Base):
    """
    Asociación de usuarios con roles de sistema.
    """
    __tablename__ = "user_roles"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("system_roles.id"), nullable=False)
    
    fecha_asignacion = Column(DateTime(timezone=True), server_default=func.now())
    
    usuario = relationship("Usuario", back_populates="system_roles_link")
    role = relationship("SystemRole")
