from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimSiteGeoreference(Base):
    __tablename__ = "bim_site_georeferences"
    __table_args__ = (
        UniqueConstraint("proyecto_id", "empresa_id", "revision", name="uq_bim_site_georef_project_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="active", index=True)
    project_root_code = Column(String(50), nullable=True)
    project_revision = Column(Integer, nullable=False, default=0)
    crs = Column(String(100), nullable=False, default="EPSG:4326")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=False, default=0.0)
    local_origin_x = Column(Float, nullable=False, default=0.0)
    local_origin_y = Column(Float, nullable=False, default=0.0)
    local_origin_z = Column(Float, nullable=False, default=0.0)
    heading_degrees = Column(Float, nullable=False, default=0.0)
    map_zoom = Column(Integer, nullable=False, default=18)
    justification = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
