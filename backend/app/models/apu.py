from decimal import Decimal

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class APU(Base):
    """Análisis de Precio Unitario - Cabecera"""
    __tablename__ = "apus"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), nullable=False, index=True)
    descripcion = Column(String(500), nullable=False)
    descripcion_normalizada = Column(String(500), nullable=False, index=True)
    unidad = Column(String(20), nullable=False)
    
    # Rendimientos y Costos Totales precalculados
    rendimiento_estandar = Column(DECIMAL(10, 4), default=1.0)
    costo_directo = Column(DECIMAL(15, 4), default=0.0)
    costo_indirecto = Column(DECIMAL(15, 4), default=0.0)
    precio_unitario_total = Column(DECIMAL(15, 4), default=0.0)
    moneda = Column(String(10), default="USD")
    
    # Metadata del legacy
    estado_revision = Column(String(50), default="Borrador") # Borrador, Aprobado, Pendiente
    revision = Column(Integer, default=0, nullable=False, index=True) # Revisión del proyecto al que pertenece
    
    # Relaciones estructurales
    categoria_id = Column(Integer, ForeignKey("categorias_recursos.id", ondelete="CASCADE"), nullable=True)
    subcategoria_item_id = Column(Integer, ForeignKey("subcategorias_items.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Multi-tenant
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="CASCADE"), nullable=False, index=True, default=1)
    source_apu_id = Column(Integer, ForeignKey("apus.id", ondelete="SET NULL"), nullable=True, index=True)
    content_origin = Column(String(20), nullable=False, default="native")
    sync_status = Column(String(20), nullable=False, default="not_applicable")
    last_sync_at = Column(DateTime(timezone=True), nullable=True)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # OmniClass (Mapeo estándar)
    omniclass_codigo = Column(String(50), nullable=True, index=True)
    omniclass_titulo = Column(String(500), nullable=True)

    # Constraints
    __table_args__ = (
        UniqueConstraint('codigo', 'base_trabajo_id', 'empresa_id', name='uq_apu_codigo_base_empresa'),
    )

    # Relaciones
    categoria = relationship("CategoriaRecurso")
    subcategoria_item = relationship("SubcategoriaItem")
    empresa = relationship("Empresa")
    base_trabajo = relationship("BaseTrabajo", back_populates="apus")
    source_apu = relationship("APU", remote_side=[id], foreign_keys=[source_apu_id])
    lineas = relationship(
        "APULinea",
        back_populates="apu",
        cascade="all, delete-orphan",
        foreign_keys="[APULinea.apu_id]",
        order_by=lambda: (APULinea.orden.asc(), APULinea.id.asc()),
    )

    @property
    def vae_total(self):
        """VAE total del APU usando recursos reales y APUs anidados como APU normal."""
        return self._calculate_vae_total(set())

    def _calculate_vae_total(self, visited):
        apu_id = int(self.id or 0)
        if apu_id and apu_id in visited:
            return None
        if apu_id:
            visited.add(apu_id)

        costo_directo = Decimal(str(self.costo_directo or 0))
        if costo_directo <= 0:
            return Decimal("0")

        total = Decimal("0")
        for linea in self.lineas or []:
            subtotal = Decimal(str(linea.subtotal or 0))
            if subtotal <= 0:
                cantidad = Decimal(str(linea.cantidad or 0))
                if linea.precio_congelado is not None:
                    subtotal = Decimal(str(linea.precio_congelado or 0)) * cantidad
                elif linea.recurso is not None:
                    subtotal = Decimal(str(linea.recurso.precio or 0)) * cantidad
                elif linea.apu_hijo is not None:
                    subtotal = Decimal(str(linea.apu_hijo.costo_directo or linea.apu_hijo.precio_unitario_total or 0)) * cantidad

            if subtotal <= 0:
                continue

            peso = subtotal / costo_directo
            if linea.apu_hijo is not None:
                nested_vae = linea.apu_hijo._calculate_vae_total(set(visited))
                if nested_vae is None:
                    return None
                total += peso * Decimal(str(nested_vae or 0))
                continue

            recurso = linea.recurso
            cpc = getattr(recurso, "cpc", None)
            if not cpc:
                return None
            total += peso * (Decimal(str(cpc.porcentaje or 0)) / Decimal("100"))

        return total


class APULinea(Base):
    """Detalle de recursos que componen un APU"""
    __tablename__ = "apu_lineas"

    id = Column(Integer, primary_key=True, index=True)
    apu_id = Column(Integer, ForeignKey("apus.id", ondelete="CASCADE"), nullable=False, index=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id", ondelete="SET NULL"), nullable=True)
    apu_hijo_id = Column(Integer, ForeignKey("apus.id", ondelete="SET NULL"), nullable=True)
    
    # Cuantificación
    cantidad = Column(DECIMAL(15, 6), nullable=False)
    rendimiento = Column(DECIMAL(15, 6), nullable=True)
    orden = Column(Integer, nullable=False, default=0, index=True)
    tanteo_activo = Column(Boolean, default=False, nullable=False)
    rendimiento_original = Column(DECIMAL(15, 6), nullable=True)
    rendimiento_tanteo = Column(DECIMAL(15, 6), nullable=True)
    
    # Histórico de precio en el momento de armar el APU (para que al cambiar el maestro no rompa presupuestos cerrados)
    precio_congelado = Column(DECIMAL(15, 4), nullable=True)
    subtotal = Column(DECIMAL(15, 4), nullable=True)

    # Relaciones
    apu = relationship("APU", foreign_keys=[apu_id], back_populates="lineas")
    apu_hijo = relationship("APU", foreign_keys=[apu_hijo_id])
    recurso = relationship("Recurso")
