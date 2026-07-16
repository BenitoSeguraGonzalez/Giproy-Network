from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dEquipment(Base):
    __tablename__ = "bim_4d_equipment"
    __table_args__ = (UniqueConstraint("empresa_id", "proyecto_id", "code", name="uq_bim_4d_equipment_code"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    equipment_type = Column(String(50), nullable=False)
    dimensions_json = Column(JSON, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dEquipmentMotionPlan(Base):
    __tablename__ = "bim_4d_equipment_motion_plans"
    __table_args__ = (UniqueConstraint("equipment_id", "revision", name="uq_bim_4d_equipment_motion_revision"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("bim_4d_equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    path_json = Column(JSON, nullable=False)
    operation_radius = Column(Float, nullable=False)
    temporary_geometry_json = Column(JSON, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
