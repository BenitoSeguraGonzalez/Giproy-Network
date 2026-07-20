from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimMapCatalog(Base):
    __tablename__ = "bim_map_catalogs"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_map_catalog_revision"),
        CheckConstraint("status IN ('active','superseded')", name="ck_bim_map_catalog_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="active", index=True)
    project_root_code = Column(String(50), nullable=True)
    project_revision = Column(Integer, nullable=False, default=0)
    layers_json = Column(JSON, nullable=False)
    justification = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
