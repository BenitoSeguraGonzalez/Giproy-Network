from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Presupuesto(Base):
    """Cabecera de un Presupuesto de Construcción/Servicio"""
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(100), nullable=True, index=True)
    revision = Column(Integer, default=1)
    descripcion = Column(String(500), nullable=False)
    
    # Costos Agregados
    subtotal = Column(DECIMAL(15, 4), default=0.0)
    indirectos_total = Column(DECIMAL(15, 4), default=0.0)
    impuestos = Column(DECIMAL(15, 4), default=0.0)
    total = Column(DECIMAL(15, 4), default=0.0)
    
    estado = Column(String(50), default="En Elaboración") # Elaboración, Aprobado, Ejecución, Cerrado
    moneda = Column(String(10), default="USD")
    
    # Configuraciones de Cálculo y Presentación (Por Revisión/Presupuesto)
    iva_aplicado = Column(DECIMAL(5, 2), default=15.00) # Por defecto 15%
    dec_moneda = Column(Integer, default=2) # Num decimales para presentación de dinero
    dec_calculos = Column(Integer, default=4) # Num decimales para cantidades internas

    # Relaciones Clave
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    proyecto = relationship("Proyecto")
    empresa = relationship("Empresa")
    detalle = relationship("PresupuestoDetalle", back_populates="presupuesto", cascade="all, delete-orphan")
    notas = relationship("PresupuestoNota", back_populates="presupuesto", cascade="all, delete-orphan")
    indirectos = relationship("PresupuestoIndirecto", back_populates="presupuesto", cascade="all, delete-orphan")
    vistas_usuario = relationship("PresupuestoVistaUsuario", back_populates="presupuesto", cascade="all, delete-orphan")
    vistas_linea_usuario = relationship("PresupuestoLineaVistaUsuario", back_populates="presupuesto", cascade="all, delete-orphan")

    @property
    def indirectos_porcentaje(self):
        return sum((indirecto.porcentaje or 0) for indirecto in self.indirectos or [])
    
    @property
    def total_lineas(self) -> int:
        return len(self.detalle) if self.detalle else 0


class PresupuestoDetalle(Base):
    """Renglones del Presupuesto (Las líneas base o rubros a construir, mapean a APUs)"""
    __tablename__ = "presupuesto_detalles"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    apu_id = Column(Integer, ForeignKey("apus.id", ondelete="SET NULL"), nullable=True) # ID del catálogo APU (Si es partida)
    parent_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="CASCADE"), nullable=True)
    tipo = Column(String(50), nullable=True)
    
    # Sincronización directa con EDT (WBS)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Los detalles de la línea se basan en la APU seleccionada
    codigo_item = Column(String(100), nullable=True) # Ej: 1.1 - 1001 (EDT - APU)
    descripcion = Column(String(500), nullable=False)
    unidad = Column(String(20), nullable=True)
    
    # Los detalles de la línea se basan en la APU seleccionada
    codigo_item = Column(String(100), nullable=True) # Ej: 1.1 - 1001 (EDT - APU)
    descripcion = Column(String(500), nullable=False)
    unidad = Column(String(20), nullable=True)
    
    # Volúmenes de obra y Costos
    cantidad = Column(DECIMAL(15, 6), default=1.0)
    precio_unitario = Column(DECIMAL(15, 6), default=0.0)
    precio_total = Column(DECIMAL(15, 6), default=0.0)
    
    # Orden de los rubros dentro del capítulo
    orden = Column(Integer, default=0)

    # OmniClass (Mapeo estándar)
    omniclass_codigo = Column(String(50), nullable=True, index=True)
    omniclass_titulo = Column(String(500), nullable=True)

    # Notas inmutables adosadas a la línea
    notas = Column(Text, nullable=True)

    # Indicador de si esta línea tiene un tanteo activo (precalculado o real)
    tanteo_activo = Column(Boolean, default=False)

    # Relaciones
    presupuesto = relationship("Presupuesto", back_populates="detalle")
    apu = relationship("APU")
    edt_node = relationship("EdtNode")
    parent = relationship("PresupuestoDetalle", remote_side=[id], backref="children")
    notas_registradas = relationship("PresupuestoNota", back_populates="linea_presupuesto")


class PresupuestoIndirecto(Base):
    __tablename__ = "presupuesto_indirectos"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    concepto_codigo = Column(String(100), nullable=False, index=True)
    concepto_id = Column(Integer, nullable=True)
    categoria_codigo = Column(String(20), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    porcentaje = Column(DECIMAL(8, 4), default=0.0, nullable=False)
    observaciones = Column(Text, nullable=True)
    fijo = Column(Boolean, default=False, nullable=False)
    usuario = Column(Boolean, default=False, nullable=False)
    custom = Column(Boolean, default=False, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    presupuesto = relationship("Presupuesto", back_populates="indirectos")
    empresa = relationship("Empresa")


class PresupuestoNota(Base):
    """Bitácora inmutable de notas generales y de línea de presupuesto."""
    __tablename__ = "presupuesto_notas"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    linea_presupuesto_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="CASCADE"), nullable=True, index=True)
    autor_usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    autor_nombre_snapshot = Column(String(255), nullable=False)
    tipo = Column(String(20), nullable=False, index=True)  # general | linea
    texto = Column(Text, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    presupuesto = relationship("Presupuesto", back_populates="notas")
    linea_presupuesto = relationship("PresupuestoDetalle", back_populates="notas_registradas")
    autor = relationship("Usuario")


class PresupuestoVistaUsuario(Base):
    """Estado de última apertura del presupuesto por usuario para detectar novedades."""
    __tablename__ = "presupuesto_vistas_usuario"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    last_opened_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_general_notes_at = Column(DateTime(timezone=True), nullable=True)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    presupuesto = relationship("Presupuesto", back_populates="vistas_usuario")
    usuario = relationship("Usuario")


class PresupuestoLineaVistaUsuario(Base):
    """Estado de última visualización de notas por línea y usuario."""
    __tablename__ = "presupuesto_linea_vistas_usuario"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    linea_presupuesto_id = Column(Integer, ForeignKey("presupuesto_detalles.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    presupuesto = relationship("Presupuesto", back_populates="vistas_linea_usuario")
    linea_presupuesto = relationship("PresupuestoDetalle")
    usuario = relationship("Usuario")
