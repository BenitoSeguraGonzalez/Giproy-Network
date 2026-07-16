from sqlalchemy import CheckConstraint, Column, Date, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimOperationsTransition(Base):
    __tablename__ = "bim_operations_transitions"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_operations_transition_revision"),
        CheckConstraint("status IN ('submitted','accepted','rejected','superseded')", name="ck_bim_operations_transition_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    handover_dossier_id = Column(Integer, ForeignKey("bim_handover_dossiers.id", ondelete="RESTRICT"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    operating_organization = Column(String(255), nullable=False)
    responsible_role = Column(String(150), nullable=False)
    effective_date = Column(Date, nullable=False)
    readiness_criteria_json = Column(JSON, nullable=False)
    asset_baseline_json = Column(JSON, nullable=False)
    baseline_checksum_sha256 = Column(String(64), nullable=False)
    total_systems = Column(Integer, nullable=False)
    total_assets = Column(Integer, nullable=False)
    transition_notes = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="submitted", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
