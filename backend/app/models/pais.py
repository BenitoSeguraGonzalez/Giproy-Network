from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Pais(Base):
    __tablename__ = "paises"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False, unique=True)
    codigo = Column(String(10), nullable=True) # ISO code
    prefijo = Column(String(50), nullable=True)
    moneda = Column(String(100), nullable=True)
    simbolo_moneda = Column(String(10), nullable=True)
