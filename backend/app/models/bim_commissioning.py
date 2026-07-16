from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCommissioningSystem(Base):
    __tablename__ = "bim_commissioning_systems"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "system_code", name="uq_bim_commissioning_system_code"),
        CheckConstraint("status IN ('registered','commissioning','accepted','retired')", name="ck_bim_commissioning_system_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    system_code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    discipline = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="registered", index=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimCommissioningAsset(Base):
    __tablename__ = "bim_commissioning_assets"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "asset_tag", name="uq_bim_commissioning_asset_tag"),
        CheckConstraint("status IN ('registered','testing','accepted','rejected','retired')", name="ck_bim_commissioning_asset_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    system_id = Column(Integer, ForeignKey("bim_commissioning_systems.id", ondelete="RESTRICT"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="RESTRICT"), nullable=False, index=True)
    asset_tag = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    asset_type = Column(String(100), nullable=False)
    global_id = Column(String(255), nullable=False)
    source_system_name = Column(String(255), nullable=True)
    manufacturer = Column(String(255), nullable=True)
    model_reference = Column(String(255), nullable=True)
    serial_number = Column(String(255), nullable=True)
    status = Column(String(30), nullable=False, default="registered", index=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
