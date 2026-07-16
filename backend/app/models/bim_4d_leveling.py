from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dResourceLevelingScenario(Base):
    __tablename__ = "bim_4d_resource_leveling_scenarios"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "baseline_id", "revision", name="uq_bim_4d_leveling_revision"),
        Index(
            "uq_bim_4d_leveling_active",
            "empresa_id",
            "proyecto_id",
            "baseline_id",
            unique=True,
            postgresql_where=text("status = 'approved'"),
            sqlite_where=text("status = 'approved'"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    baseline_id = Column(Integer, ForeignKey("bim_4d_baselines.id", ondelete="CASCADE"), nullable=False, index=True)
    project_revision = Column(Integer, nullable=False)
    revision = Column(String(100), nullable=False)
    input_json = Column(JSON, nullable=False)
    result_json = Column(JSON, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    status = Column(String(30), nullable=False, default="proposed", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
