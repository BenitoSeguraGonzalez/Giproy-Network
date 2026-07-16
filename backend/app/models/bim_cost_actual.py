from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCostActualEntry(Base):
    __tablename__ = "bim_cost_actual_entries"
    __table_args__ = (
        UniqueConstraint("field_report_id", name="uq_bim_cost_actual_field_report"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    field_report_id = Column(Integer, ForeignKey("bim_4d_field_reports.id", ondelete="RESTRICT"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True, index=True)
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    currency = Column(String(3), nullable=False)
    cumulative_actual_cost = Column(Numeric(18, 2), nullable=False)
    incremental_actual_cost = Column(Numeric(18, 2), nullable=False)
    posted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    posted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
