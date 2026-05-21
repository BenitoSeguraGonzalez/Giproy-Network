from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, Numeric
from sqlalchemy.sql import func
from app.core.database import Base

class Licencia(Base):
    __tablename__ = "licencias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False, index=True) # Ej: Exprés, Estándar, Profesional, Empresarial
    codigo = Column(String(50), unique=True, nullable=False, index=True) # Ej: EXPRES, STANDARD, PRO, ENTERPRISE
    descripcion = Column(String(500), nullable=True)
    
    # Límites definidos en JSON para flexibilidad
    # { "usuarios": 5, "proyectos": 100, "almacenamiento_gb": 20, "modulos_permitidos": ["*"] }
    limites = Column(JSON, nullable=False)
    
    # Campo para derivar licencias especiales (Tester, Académica, etc)
    es_especial = Column(Boolean, default=False)
    base_licencia_id = Column(Integer, nullable=True) # ID de la licencia base si es especial

    plan_kind = Column(String(50), nullable=True, index=True)  # express, estandar, profesional, empresarial
    precio_mensual = Column(Numeric(10, 2), nullable=True)
    precio_anual = Column(Numeric(10, 2), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_default_express = Column(Boolean, default=False, nullable=False, server_default="0")
    
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
