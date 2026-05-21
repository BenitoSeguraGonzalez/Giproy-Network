"""
Modelo para Recursos y Categorías de Recursos
Los recursos están asociados a una subcategoría y tienen atributos de precio, unidad y CPC.
"""
from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Boolean, UniqueConstraint, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class CategoriaRecurso(Base):
    """
    Categorias base para recursos (Equipos, Materiales, Transporte, Mano de Obra, APU)
    Utilizado principalmente para la clasificación de alto nivel y compatibilidad con APUs.
    """
    __tablename__ = "categorias_recursos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False) # Removido unique=True global
    descripcion = Column(String(500), nullable=True)
    
    # Multi-tenant y scoping por base
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=True, index=True)

class Recurso(Base):
    """
    Maestro de Recursos
    Un recurso es un elemento básico (clavo, hora de albañil, etc.) que se usa en los APUs.
    """
    __tablename__ = "recursos"

    id = Column(Integer, primary_key=True, index=True)
    
    # Código del recurso: formato "C-SSSS-RRRRR" (Categoría-Subcategoría-Serial)
    # C: 1 dígito, SSSS: 4 dígitos (padded subcat code), RRRRR: 5 dígitos secuenciales
    codigo = Column(String(20), nullable=False, index=True)
    
    # Descripción del recurso (Nombre). Única en toda la empresa.
    descripcion = Column(String(500), nullable=False)
    
    # Descripción normalizada (sin acentos, minúsculas) para búsquedas de duplicados
    descripcion_normalizada = Column(String(500), nullable=False, index=True)
    
    # Precio base del recurso (sin indirectos)
    precio = Column(DECIMAL(18, 4), nullable=False, default=0.0)

    # Ownership clásico para equipos: permite distinguir costo de equipo propio vs alquilado
    equipment_ownership_kind = Column(String(20), nullable=True, index=True)

    # Clasificación fina para la lógica de recurso gobernante del APU
    governing_resource_kind = Column(String(40), nullable=True, index=True)
    
    # Unidad de medida
    unidad_id = Column(Integer, ForeignKey("unidades.id", ondelete="RESTRICT"), nullable=False)
    
    # Código CPC (opcional)
    cod_cpc_id = Column(Integer, ForeignKey("codcpc.id", ondelete="SET NULL"), nullable=True)
    
    # Especificaciones técnicas (Memo/Text)
    especificaciones = Column(Text, nullable=True)
    
    # Vinculación jerárquica
    subcategoria_item_id = Column(Integer, ForeignKey("subcategorias_items.id", ondelete="CASCADE"), nullable=False, index=True)
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    source_recurso_id = Column(Integer, ForeignKey("recursos.id", ondelete="SET NULL"), nullable=True, index=True)
    content_origin = Column(String(20), nullable=False, default="native")
    sync_status = Column(String(20), nullable=False, default="not_applicable")
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    
    # Estado de revisión para duplicados
    revisado = Column(Boolean, default=True, nullable=False)
    revision = Column(Integer, default=0, nullable=False, index=True) # Revisión del proyecto
    
    # Soporte para Tanteo Reversible (Global Undo)
    tanteo_activo = Column(Boolean, default=False, nullable=False)
    precio_original = Column(DECIMAL(18, 4), nullable=True)
    precio_tanteo = Column(DECIMAL(18, 4), nullable=True)
    
    # Timestamps
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # OmniClass (Mapeo estándar)
    omniclass_codigo = Column(String(50), nullable=True, index=True)
    omniclass_titulo = Column(String(500), nullable=True)
    
    @property
    def subcategoria_codigo(self):
        return self.subcategoria_item.subcategoria_codigo if self.subcategoria_item else None

    @property
    def cod_cpc_codigo(self):
        return self.cpc.codCPC if self.cpc else None

    @property
    def cpc_descripcion(self):
        return self.cpc.descripcion if self.cpc else None

    @property
    def cpc_porcentaje(self):
        return self.cpc.porcentaje if self.cpc else None

    # Relaciones
    unidad = relationship("Unidad")
    cpc = relationship("CodCPC")
    subcategoria_item = relationship("SubcategoriaItem")
    base_trabajo = relationship("BaseTrabajo", back_populates="recursos")
    empresa = relationship("Empresa")
    source_recurso = relationship("Recurso", remote_side=[id], foreign_keys=[source_recurso_id])

    __table_args__ = (
        # Unicidad de descripción por base de trabajo y empresa
        UniqueConstraint('descripcion_normalizada', 'empresa_id', 'base_trabajo_id', name='uq_recurso_descripcion_base'),
        # Unicidad de código por base de trabajo
        UniqueConstraint('codigo', 'base_trabajo_id', name='uq_recurso_codigo'),
    )
