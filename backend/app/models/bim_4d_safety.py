from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dSafetyRisk(Base):
    __tablename__ = "bim_4d_safety_risks"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_snapshot_id = Column(Integer, ForeignKey("bim_4d_activity_snapshots.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="SET NULL"), nullable=True, index=True)
    work_area_id = Column(Integer, ForeignKey("bim_4d_work_areas.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    hazard_type = Column(String(50), nullable=False)
    severity = Column(Integer, nullable=False)
    likelihood = Column(Integer, nullable=False)
    controls_json = Column(JSON, nullable=False)
    zone_json = Column(JSON, nullable=False)
    active_start = Column(DateTime(timezone=True), nullable=False)
    active_finish = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), nullable=False, default="open")
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dSafetyInspection(Base):
    __tablename__ = "bim_4d_safety_inspections"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_id = Column(Integer, ForeignKey("bim_4d_safety_risks.id", ondelete="CASCADE"), nullable=False, index=True)
    inspected_at = Column(DateTime(timezone=True), nullable=False)
    result = Column(String(30), nullable=False)
    checklist_json = Column(JSON, nullable=False, default=list)
    note = Column(Text, nullable=False)
    evidence_ref = Column(String(500), nullable=True)
    inspected_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dSafetyPunchItem(Base):
    __tablename__ = "bim_4d_safety_punch_items"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_id = Column(Integer, ForeignKey("bim_4d_safety_risks.id", ondelete="CASCADE"), nullable=False, index=True)
    inspection_id = Column(Integer, ForeignKey("bim_4d_safety_inspections.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="normal")
    status = Column(String(30), nullable=False, default="open")
    due_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    closed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at = Column(DateTime(timezone=True), nullable=True)
