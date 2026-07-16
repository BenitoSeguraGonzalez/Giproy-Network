from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, UniqueConstraint
from sqlalchemy.sql import func
from app.core.database import Base


class BimAccessGrant(Base):
    __tablename__ = "bim_access_grants"
    __table_args__ = (UniqueConstraint("empresa_id", "usuario_id", name="uq_bim_access_grant_company_user"),)
    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    capabilities_json = Column(JSON, nullable=False, default=list)
    active = Column(Boolean, nullable=False, default=True)
    granted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
