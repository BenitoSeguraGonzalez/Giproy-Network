from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class ProjectFunctionalModification(Base):
    __tablename__ = "project_functional_modifications"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    presupuesto_id = Column(Integer, ForeignKey("presupuestos.id", ondelete="CASCADE"), nullable=False, index=True)
    base_trabajo_id = Column(Integer, ForeignKey("bases_trabajo.id", ondelete="SET NULL"), nullable=True, index=True)
    revision = Column(Integer, nullable=False, default=0, index=True)

    status = Column(String(30), nullable=False, default="active", index=True)
    active = Column(Boolean, nullable=False, default=True, index=True)
    source = Column(String(30), nullable=False, default="manual", index=True)
    source_ref = Column(JSON, nullable=False, default=dict)
    patch = Column(JSON, nullable=False, default=dict)
    snapshot = Column(JSON, nullable=False, default=dict)
    audit_log = Column(JSON, nullable=False, default=list)

    created_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    superseded_by_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    superseded_at = Column(DateTime(timezone=True), nullable=True)
    superseded_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
