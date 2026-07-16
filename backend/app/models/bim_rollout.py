from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimRolloutPlan(Base):
    __tablename__ = "bim_rollout_plans"
    __table_args__ = (UniqueConstraint("empresa_id", name="uq_bim_rollout_plan_company"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    stage = Column(String(30), nullable=False, default="internal")
    status = Column(String(30), nullable=False, default="draft")
    checklist_json = Column(JSON, nullable=False, default=dict)
    support_owner = Column(String(255), nullable=False)
    exit_criteria = Column(Text, nullable=False)
    rollback_procedure = Column(Text, nullable=False)
    rollback_rehearsed_at = Column(DateTime(timezone=True), nullable=True)
    rollback_rehearsed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
