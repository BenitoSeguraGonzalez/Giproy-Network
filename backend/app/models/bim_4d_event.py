from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dUnplannedEvent(Base):
    __tablename__ = "bim_4d_unplanned_events"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False)
    delay_days = Column(Float, nullable=False, default=0)
    actual_cost = Column(Float, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="reported")
    decision_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
