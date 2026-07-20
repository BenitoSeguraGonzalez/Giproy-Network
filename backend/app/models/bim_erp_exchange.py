from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimErpExchangePackage(Base):
    __tablename__ = "bim_erp_exchange_packages"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "revision", name="uq_bim_erp_exchange_revision"),
        CheckConstraint("status IN ('draft','published','superseded','revoked')", name="ck_bim_erp_exchange_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="draft", index=True)
    project_root_code = Column(String(50), nullable=True)
    project_revision = Column(Integer, nullable=False, default=0)
    cutoff_at = Column(DateTime(timezone=True), nullable=False, index=True)
    payload_json = Column(JSON, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False, index=True)
    activity_count = Column(Integer, nullable=False)
    timecard_count = Column(Integer, nullable=False)
    regular_hours = Column(Float, nullable=False)
    overtime_hours = Column(Float, nullable=False)
    justification = Column(Text, nullable=False)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    published_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
