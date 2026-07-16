from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimAsBuiltAcceptance(Base):
    __tablename__ = "bim_as_built_acceptances"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_as_built_acceptance_revision"),
        Index(
            "uq_bim_as_built_acceptance_current",
            "empresa_id",
            "proyecto_id",
            unique=True,
            postgresql_where=text("status = 'accepted'"),
            sqlite_where=text("status = 'accepted'"),
        ),
        CheckConstraint("status IN ('submitted','accepted','rejected','superseded')", name="ck_bim_as_built_acceptance_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    version_label = Column(String(50), nullable=False)
    source_filename = Column(String(255), nullable=True)
    source_checksum_sha256 = Column(String(64), nullable=False)
    quality_status = Column(String(30), nullable=False)
    acceptance_criteria_json = Column(JSON, nullable=False, default=list)
    declaration_notes = Column(Text, nullable=False)
    status = Column(String(30), nullable=False, default="submitted", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
