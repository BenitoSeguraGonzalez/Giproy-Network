from sqlalchemy import Column, Integer, ForeignKey, BigInteger, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class EmpresaUso(Base):
    """
    Métricas de uso actual de la empresa.
    Calculadas periódicamente.
    """
    __tablename__ = "empresa_uso"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    # Métricas actuales
    usuarios_count = Column(Integer, default=0)
    proyectos_count = Column(Integer, default=0)
    almacenamiento_bytes = Column(BigInteger, default=0) # Almacenamiento real en DB
    
    # Cuotas máximas (denormalizadas de la licencia para acceso rápido en middleware)
    max_usuarios = Column(Integer, nullable=False)
    max_proyectos = Column(Integer, nullable=False)
    max_almacenamiento_bytes = Column(BigInteger, nullable=False)
    
    ultima_actualizacion = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    empresa = relationship("Empresa")
