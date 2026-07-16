from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dActivitySnapshot(Base):
    __tablename__ = "bim_4d_activity_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "source_kind",
            "source_ref",
            "snapshot_revision",
            name="uq_bim_4d_activity_snapshot_source_revision",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    source_kind = Column(String(50), nullable=False, default="giproy_classic_schedule")
    source_ref = Column(String(255), nullable=False)
    snapshot_revision = Column(String(100), nullable=False)
    activity_code = Column(String(100), nullable=False)
    activity_name = Column(String(500), nullable=False)
    planned_start = Column(DateTime(timezone=True), nullable=False)
    planned_finish = Column(DateTime(timezone=True), nullable=False)
    captured_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    captured_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dLinkProposal(Base):
    __tablename__ = "bim_4d_link_proposals"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    link_type = Column(String(30), nullable=False, default="construction")
    status = Column(String(30), nullable=False, default="pending", index=True)
    proposal_reason = Column(Text, nullable=False)
    decision_reason = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)


class Bim4dProgressSnapshot(Base):
    __tablename__ = "bim_4d_progress_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    progress_percent = Column(Float, nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_finish = Column(DateTime(timezone=True), nullable=True)
    note = Column(Text, nullable=True)
    reported_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    reported_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dBaseline(Base):
    __tablename__ = "bim_4d_baselines"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_4d_baseline_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    revision = Column(String(100), nullable=False)
    methodology = Column(String(100), nullable=False, default="linear_planned_progress")
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dBaselineActivity(Base):
    __tablename__ = "bim_4d_baseline_activities"
    __table_args__ = (
        UniqueConstraint("baseline_id", "activity_snapshot_id", name="uq_bim_4d_baseline_activity"),
    )

    id = Column(Integer, primary_key=True, index=True)
    baseline_id = Column(Integer, ForeignKey("bim_4d_baselines.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)


class Bim4dDependencySnapshot(Base):
    __tablename__ = "bim_4d_dependency_snapshots"
    __table_args__ = (
        UniqueConstraint(
            "baseline_id",
            "predecessor_activity_id",
            "successor_activity_id",
            "dependency_type",
            name="uq_bim_4d_baseline_dependency",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    baseline_id = Column(Integer, ForeignKey("bim_4d_baselines.id", ondelete="CASCADE"), nullable=False, index=True)
    predecessor_activity_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False)
    successor_activity_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False)
    dependency_type = Column(String(2), nullable=False, default="FS")
    lag_days = Column(Float, nullable=False, default=0)
