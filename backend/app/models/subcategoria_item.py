"""
Modelo para Items de Subcategoría de Precios Unitarios
Cada subcategoría (Equipos, Materiales, etc.) puede tener múltiples items
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class SubcategoriaItem(Base):
    """
    Items belonging to a subcategory (Equipment, Materials, Transport, Labor, Unit Prices)
    Each item has: Código (unique within subcat), Descripción, Observaciones
    """
    __tablename__ = "subcategorias_items"

    id = Column(Integer, primary_key=True, index=True)
    
    # Código del item: formato "1-001", "2-015", etc. (no editable después de creado)
    codigo = Column(String(50), nullable=False, index=True)
    
    # Descripción única por subcategoría
    descripcion = Column(String(500), nullable=False)
    
    # Observaciones adicionales
    observaciones = Column(Text, nullable=True)
    
    # Subcategoría padre (1-5)
    subcategoria_codigo = Column(Integer, nullable=False)  # 1=Equipos, 2=Materiales, 3=Transporte, 4=ManoObra, 5=PreciosUnitarios

    # Orden visual persistente entre hermanos
    orden = Column(Integer, nullable=False, default=0, server_default="0", index=True)
    
    # Vinculación a base de trabajo
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Estado de revisión (importante para duplicados)
    revisado = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # OmniClass (Mapeo estándar)
    omniclass_codigo = Column(String(50), nullable=True, index=True)
    omniclass_titulo = Column(String(500), nullable=True)

    # Relaciones
    base_trabajo = relationship("BaseTrabajo", back_populates="subcategorias")
    empresa = relationship("Empresa")
    
    # Constraint: descripcion única por subcategoría y empresa
    __table_args__ = (
        UniqueConstraint('subcategoria_codigo', 'descripcion', 'empresa_id', 'base_trabajo_id', name='uq_subcategoria_item_descripcion'),
        UniqueConstraint('subcategoria_codigo', 'codigo', 'empresa_id', 'base_trabajo_id', name='uq_subcategoria_item_codigo'),
    )
