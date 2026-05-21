"""
Catálogo de Códigos Centrales de Productos (CPC)
Referencia global para la clasificación de recursos y servicios.
"""
from sqlalchemy import Column, Integer, String, Text, Float
from app.core.database import Base

class CodCPC(Base):
    __tablename__ = "codcpc"

    id = Column(Integer, primary_key=True, index=True)
    
    # Código oficial CPC
    codCPC = Column(String(50), nullable=False, index=True, unique=True)
    
    # Descripción detallada del producto o servicio
    descripcion = Column(Text, nullable=False)
    
    # Tipo (ej. ND, M, S, etc.)
    tipo = Column(String(50), nullable=True)
    
    # Porcentaje asociado (según el dump)
    porcentaje = Column(Float, nullable=True)
