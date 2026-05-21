"""
Modelo para Unidades de Medida
Pueden ser globales (cargadas por defecto) o específicas de una empresa/base de trabajo.
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Unidad(Base):
    __tablename__ = "unidades"

    id = Column(Integer, primary_key=True, index=True)
    
    # Sigla de la unidad (m, Km, Un, etc.)
    descripcion = Column(String(20), nullable=False)
    
    # Nombre completo (Metro, Kilómetro, Unidad, etc.)
    descripcion_completa = Column(String(255), nullable=True)
    
    # Categoría a la que aplica (1=Equipos, 2=Materiales, 3=Transporte, 4=Mano de Obra, 5=APU/Otros)
    # Según el dump, las unidades dependen de la subcategoría/categoría
    subcategoria_codigo = Column(Integer, nullable=False)
    
    # Si es global, está disponible para todos. Si no, solo para la empresa/base específica.
    es_global = Column(Boolean, default=True, nullable=False)
    
    # Multi-tenant (opcional para unidades personalizadas)
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)

    # Relaciones
    base_trabajo = relationship("BaseTrabajo")
    empresa = relationship("Empresa")

    __table_args__ = (
        # Unicidad: No permitir duplicados de la misma sigla para la misma categoría en el mismo contexto
        UniqueConstraint('descripcion', 'subcategoria_codigo', 'empresa_id', 'base_trabajo_id', name='uq_unidad_desc_context'),
    )
