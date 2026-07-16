from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func
from app.core.database import Base


class BimQuantityProposal(Base):
    __tablename__ = "bim_quantity_proposals"
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(30), nullable=False)
    target_id = Column(Integer, nullable=False)
    quantity_name = Column(String(255), nullable=False)
    source_kind = Column(String(50), nullable=False)
    original_value = Column(Float, nullable=False)
    original_unit = Column(String(30), nullable=False)
    presented_value = Column(Float, nullable=False)
    presented_unit = Column(String(30), nullable=False)
    conversion_factor = Column(Float, nullable=False)
    rounding_digits = Column(Integer, nullable=False)
    normalization_rule = Column(String(255), nullable=False)
    status = Column(String(30), nullable=False, default="pending", index=True)
    decision_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_decision = Column(DateTime(timezone=True), nullable=True)
