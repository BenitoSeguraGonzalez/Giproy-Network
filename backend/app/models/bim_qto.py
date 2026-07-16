from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimQtoSnapshot(Base):
    __tablename__ = "bim_qto_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "bim_model_version_id",
            "revision",
            name="uq_bim_qto_snapshot_revision",
        ),
        Index(
            "uq_bim_qto_snapshot_active_approval",
            "empresa_id",
            "proyecto_id",
            "bim_model_version_id",
            unique=True,
            postgresql_where=text("status = 'approved'"),
            sqlite_where=text("status = 'approved'"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    grouping_json = Column(JSON, nullable=False)
    quantity_names_json = Column(JSON, nullable=False)
    mappings_json = Column(JSON, nullable=False)
    rows_json = Column(JSON, nullable=False)
    totals_json = Column(JSON, nullable=False)
    coverage_json = Column(JSON, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    status = Column(String(30), nullable=False, default="draft", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
