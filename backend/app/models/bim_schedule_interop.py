from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimScheduleImportRevision(Base):
    __tablename__ = "bim_schedule_import_revisions"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "revision",
            name="uq_bim_schedule_import_project_revision",
        ),
        Index(
            "uq_bim_schedule_import_active",
            "empresa_id",
            "proyecto_id",
            unique=True,
            postgresql_where=text("status = 'approved'"),
            sqlite_where=text("status = 'approved'"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    version = Column(Integer, nullable=False, default=1)
    source_format = Column(String(30), nullable=False, index=True)
    source_filename = Column(String(255), nullable=False)
    source_checksum_sha256 = Column(String(64), nullable=False)
    normalized_checksum_sha256 = Column(String(64), nullable=False)
    status = Column(String(30), nullable=False, default="pending", index=True)
    document_json = Column(JSON, nullable=False)
    preflight_json = Column(JSON, nullable=False)
    previous_approved_revision_id = Column(
        Integer,
        ForeignKey("bim_schedule_import_revisions.id", ondelete="SET NULL"),
        nullable=True,
    )
    decision_reason = Column(Text, nullable=True)
    rollback_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    rolled_back_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    rolled_back_at = Column(DateTime(timezone=True), nullable=True)
