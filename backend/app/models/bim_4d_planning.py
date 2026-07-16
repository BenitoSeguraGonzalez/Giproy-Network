from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dWorkArea(Base):
    __tablename__ = "bim_4d_work_areas"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_work_area_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dConstructibleComponent(Base):
    __tablename__ = "bim_4d_constructible_components"
    __table_args__ = (
        UniqueConstraint("work_area_id", "code", name="uq_bim_4d_component_area_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False)
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    element_ids_json = Column(JSON, nullable=False, default=list)
    activity_snapshot_ids_json = Column(JSON, nullable=False, default=list)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dScenario(Base):
    __tablename__ = "bim_4d_scenarios"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_4d_scenario_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    baseline_id = Column(Integer, ForeignKey("bim_4d_baselines.id", ondelete="RESTRICT"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    revision = Column(String(100), nullable=False)
    shifts_json = Column(JSON, nullable=False, default=list)
    metrics_json = Column(JSON, nullable=False, default=dict)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
