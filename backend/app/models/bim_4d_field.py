from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dFieldReport(Base):
    __tablename__ = "bim_4d_field_reports"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)
    progress_snapshot_id = Column(Integer, ForeignKey("bim_4d_progress_snapshots.id", ondelete="RESTRICT"), nullable=False, unique=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True)
    reported_at = Column(DateTime(timezone=True), nullable=False)
    progress_percent = Column(Float, nullable=False)
    installed_quantity = Column(Float, nullable=False)
    installed_unit = Column(String(30), nullable=False)
    labor_hours = Column(Float, nullable=False)
    equipment_hours = Column(Float, nullable=False)
    budget_at_completion = Column(Float, nullable=False)
    planned_value_to_date = Column(Float, nullable=False)
    earned_value = Column(Float, nullable=False)
    actual_cost = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="USD")
    schedule_performance_index = Column(Float, nullable=True)
    cost_performance_index = Column(Float, nullable=True)
    daily_log = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dFieldEvidence(Base):
    __tablename__ = "bim_4d_field_evidence"
    __table_args__ = (
        UniqueConstraint("field_report_id", "checksum_sha256", name="uq_bim_4d_field_evidence_checksum"),
    )

    id = Column(Integer, primary_key=True, index=True)
    field_report_id = Column(Integer, ForeignKey("bim_4d_field_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    byte_size = Column(Integer, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    content = Column(LargeBinary, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
