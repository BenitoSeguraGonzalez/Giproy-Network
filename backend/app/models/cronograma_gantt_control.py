from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class CronogramaGanttDraft(Base):
    __tablename__ = "cronogramas_gantt_drafts"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    cronograma_id = Column(Integer, ForeignKey("cronogramas_trabajo.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="draft", server_default="draft", index=True)
    version = Column(Integer, nullable=False, default=1, server_default="1")
    base_snapshot = Column(JSON, nullable=False, default=dict, server_default="{}")
    intentions = Column(JSON, nullable=False, default=list, server_default="[]")
    preview_snapshot = Column(JSON, nullable=False, default=dict, server_default="{}")
    invalidations = Column(JSON, nullable=False, default=list, server_default="[]")
    audit_log = Column(JSON, nullable=False, default=list, server_default="[]")
    created_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    updated_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    applied_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())


class CronogramaGanttEditLock(Base):
    __tablename__ = "cronogramas_gantt_edit_locks"
    __table_args__ = (
        UniqueConstraint("cronograma_id", name="uq_cronogramas_gantt_edit_locks_cronograma_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    cronograma_id = Column(Integer, ForeignKey("cronogramas_trabajo.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    locked_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    locked_by_name = Column(String(255), nullable=True)
    requested_release_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    requested_release_by_name = Column(String(255), nullable=True)
    request_message = Column(Text, nullable=True)
    acquired_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_heartbeat_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    released_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    audit_log = Column(JSON, nullable=False, default=list, server_default="[]")
