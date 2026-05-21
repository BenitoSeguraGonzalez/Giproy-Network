from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, DECIMAL, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class IndiceINEC(Base):
    """
    Catálogo de Índices de Precios a la Construcción (INEC)
    Utilizado para los monomios de la fórmula polinómica en Ecuador.
    """
    __tablename__ = "indices_inec"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), nullable=False, unique=True, index=True)
    descripcion = Column(String(500), nullable=False)
    
    # Metadata opcional
    observaciones = Column(Text, nullable=True)

class FormulaPolinomica(Base):
    """
    Cabecera de la Fórmula Polinómica vinculada a una revisión de presupuesto.
    """
    __tablename__ = "formula_polinomica"

    id = Column(Integer, primary_key=True, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)
    
    # Coeficiente de Gastos Generales y Utilidad (A) - Término fijo que no se reajusta
    coeficiente_fijo = Column(DECIMAL(10, 3), default=0.0)
    
    # Costo Directo Total de referencia al momento de generar la fórmula
    costo_directo_total = Column(DECIMAL(18, 4), default=0.0)
    
    # Tipo de fórmula: SIN_DESGLOSE, CON_DESGLOSE
    tipo = Column(String(50), default="SIN_DESGLOSE")
    # Configuración de porcentajes para desglose de equipo (si aplica)
    # Ejemplo: {"B": 0.1, "C": 0.1, "E": 0.7, "R": 0.1, "X": 0.0}
    from sqlalchemy import JSON
    config_desglose = Column(JSON, nullable=True)

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultima_modificacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    presupuesto = relationship("Presupuesto")
    monomios = relationship("FormulaPolinomicaMonomio", back_populates="formula", cascade="all, delete-orphan")
    cuadrilla_tipo = relationship("CuadrillaTipo", back_populates="formula", cascade="all, delete-orphan")

class FormulaPolinomicaMonomio(Base):
    """
    Cada término (monomio) de la fórmula polinómica (B, C, D, E... X)
    """
    __tablename__ = "formula_polinomica_monomios"

    id = Column(Integer, primary_key=True, index=True)
    formula_id = Column(Integer, ForeignKey("formula_polinomica.id", ondelete="CASCADE"), nullable=False, index=True)
    
    simbolo = Column(String(5), nullable=False) # B, C, D, E... X
    descripcion = Column(String(255), nullable=True)
    
    # Índice INEC asociado (excepto para B si es cuadrilla tipo compleja, aunque usualmente se asigna uno base)
    indice_inec_id = Column(Integer, ForeignKey("indices_inec.id"), nullable=True)
    
    # Coeficiente (p1, p2, p3... px)
    coeficiente = Column(DECIMAL(10, 3), nullable=False, default=0.0)
    
    # Relaciones
    formula = relationship("FormulaPolinomica", back_populates="monomios")
    indice_inec = relationship("IndiceINEC")

class CuadrillaTipo(Base):
    """
    Desglose del monomio de Mano de Obra (B)
    """
    __tablename__ = "cuadrilla_tipo"

    id = Column(Integer, primary_key=True, index=True)
    formula_id = Column(Integer, ForeignKey("formula_polinomica.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Por lo general se asocia a la categoría 4 de recursos (Mano de Obra)
    recurso_id = Column(Integer, ForeignKey("recursos.id", ondelete="CASCADE"), nullable=False)
    
    # Índice INEC específico para esta categoría ocupacional
    indice_inec_id = Column(Integer, ForeignKey("indices_inec.id"), nullable=True)
    
    cantidad_hh = Column(DECIMAL(18, 6), default=0.0)
    coeficiente_incidencia = Column(DECIMAL(10, 4), default=0.0)
    
    # Relaciones
    formula = relationship("FormulaPolinomica", back_populates="cuadrilla_tipo")
    recurso = relationship("Recurso")
    indice_inec = relationship("IndiceINEC")
class FormulaPolinomicaAsignacion(Base):
    """
    Persistencia de la asignación manual de un recurso a un símbolo monomio específico.
    Si un recurso no tiene asignación aquí, el sistema puede sugerir una por subcategoría.
    """
    __tablename__ = "formula_polinomica_asignaciones"

    id = Column(Integer, primary_key=True, index=True)
    formula_id = Column(Integer, ForeignKey("formula_polinomica.id", ondelete="CASCADE"), nullable=False, index=True)
    recurso_id = Column(Integer, ForeignKey("recursos.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Símbolo asignado (B, C, D, E... X)
    simbolo = Column(String(5), nullable=False)
    
    # Relaciones
    formula = relationship("FormulaPolinomica", back_populates="asignaciones")
    recurso = relationship("Recurso")

    __table_args__ = (
        UniqueConstraint('formula_id', 'recurso_id', name='uq_formula_recurso_asignacion'),
    )

# Update FormulaPolinomica to include the relationship
FormulaPolinomica.asignaciones = relationship("FormulaPolinomicaAsignacion", back_populates="formula", cascade="all, delete-orphan")
