from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dProductivityProposal(Base):
    __tablename__ = "bim_4d_productivity_proposals"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="RESTRICT"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)
    target_type = Column(String(30), nullable=False)
    target_id = Column(Integer, nullable=False)
    quantity_name = Column(String(255), nullable=False)
    original_value = Column(Float, nullable=False)
    original_unit = Column(String(30), nullable=False)
    quantity_value = Column(Float, nullable=False)
    quantity_unit = Column(String(30), nullable=False)
    quantity_source_kind = Column(String(50), nullable=False)
    conversion_factor = Column(Float, nullable=False)
    rounding_digits = Column(Integer, nullable=False)
    normalization_rule = Column(String(255), nullable=False)
    productivity_value = Column(Float, nullable=False)
    crew_size = Column(Float, nullable=False)
    calculated_duration_days = Column(Float, nullable=False)
    resource_code = Column(String(100), nullable=False)
    resource_name = Column(String(255), nullable=False)
    formula = Column(String(255), nullable=False)
    status = Column(String(30), nullable=False, default="pending", index=True)
    decision_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
