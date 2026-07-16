from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dResource(Base):
    __tablename__ = "bim_4d_resources"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_resource_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    resource_type = Column(String(30), nullable=False)
    unit = Column(String(30), nullable=False)
    capacity_per_day = Column(Float, nullable=False)
    source_kind = Column(String(50), nullable=False, default="bim_native")
    source_ref = Column(String(255), nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dResourceAssignment(Base):
    __tablename__ = "bim_4d_resource_assignments"
    __table_args__ = (
        UniqueConstraint("resource_id", "activity_snapshot_id", name="uq_bim_4d_resource_activity"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("bim_4d_resources.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    demand_per_day = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dFieldResourceMovement(Base):
    __tablename__ = "bim_4d_field_resource_movements"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    resource_id = Column(Integer, ForeignKey("bim_4d_resources.id", ondelete="RESTRICT"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="SET NULL"), nullable=True, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True, index=True)
    movement_type = Column(String(20), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    occurred_at = Column(DateTime(timezone=True), nullable=False, index=True)
    reference = Column(String(120), nullable=True)
    note = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dCrew(Base):
    __tablename__ = "bim_4d_crews"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_crew_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(80), nullable=False)
    name = Column(String(180), nullable=False)
    trade = Column(String(120), nullable=False, index=True)
    member_count = Column(Integer, nullable=False)
    active = Column(Boolean, nullable=False, default=True, index=True)
    note = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dTimecard(Base):
    __tablename__ = "bim_4d_timecards"
    __table_args__ = (
        UniqueConstraint(
            "crew_id", "activity_snapshot_id", "work_date",
            name="uq_bim_4d_timecard_crew_activity_date",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    crew_id = Column(Integer, ForeignKey("bim_4d_crews.id", ondelete="RESTRICT"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="RESTRICT"), nullable=False, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True, index=True)
    work_date = Column(Date, nullable=False, index=True)
    regular_hours = Column(Float, nullable=False)
    overtime_hours = Column(Float, nullable=False)
    installed_quantity = Column(Float, nullable=False)
    installed_unit = Column(String(30), nullable=False)
    note = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
