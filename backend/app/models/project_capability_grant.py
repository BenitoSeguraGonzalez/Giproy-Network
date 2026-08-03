from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class ProjectCapabilityGrant(Base):
    __tablename__ = "project_capability_grants"
    __table_args__ = (
        UniqueConstraint(
            "empresa_id",
            "proyecto_id",
            "usuario_id",
            "scope_key",
            name="uq_project_capability_grant_scope",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    edt_id = Column(Integer, ForeignKey("edt_nodes.id", ondelete="CASCADE"), nullable=True, index=True)
    scope_key = Column(String(80), nullable=False, default="project")
    profile_code = Column(String(80), nullable=True)
    capabilities_json = Column(JSON, nullable=False, default=list)
    active = Column(Boolean, nullable=False, default=True)
    granted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
