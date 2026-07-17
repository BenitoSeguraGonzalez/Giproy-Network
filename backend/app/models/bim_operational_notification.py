from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimOperationalNotification(Base):
    __tablename__ = "bim_operational_notifications"
    __table_args__ = (
        UniqueConstraint("dedupe_key", name="uq_bim_operational_notification_dedupe"),
        CheckConstraint("source_type IN ('rfi','submittal','review')", name="ck_bim_operational_notification_source"),
        CheckConstraint("severity IN ('warning','high','critical')", name="ck_bim_operational_notification_severity"),
        CheckConstraint("escalation_level IN (0,1,2)", name="ck_bim_operational_notification_level"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(30), nullable=False, index=True)
    source_id = Column(Integer, nullable=False, index=True)
    source_number = Column(String(30), nullable=False)
    title = Column(String(500), nullable=False)
    event_type = Column(String(30), nullable=False)
    severity = Column(String(20), nullable=False)
    escalation_level = Column(Integer, nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    dedupe_key = Column(String(255), nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
