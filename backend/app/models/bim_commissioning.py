from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
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
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    accepted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
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
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimCommissioningTest(Base):
    __tablename__ = "bim_commissioning_tests"
    __table_args__ = (
        UniqueConstraint("asset_id", "protocol_code", "attempt", name="uq_bim_commissioning_test_protocol_attempt"),
        CheckConstraint("outcome IN ('passed','failed')", name="ck_bim_commissioning_test_outcome"),
        CheckConstraint("status IN ('submitted','accepted','rejected')", name="ck_bim_commissioning_test_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("bim_commissioning_assets.id", ondelete="RESTRICT"), nullable=False, index=True)
    protocol_code = Column(String(100), nullable=False)
    attempt = Column(Integer, nullable=False, default=1)
    protocol_name = Column(String(255), nullable=False)
    checklist_json = Column(JSON, nullable=False, default=list)
    results_json = Column(JSON, nullable=False, default=dict)
    outcome = Column(String(20), nullable=False)
    evidence_reference = Column(String(500), nullable=True)
    status = Column(String(30), nullable=False, default="submitted", index=True)
    decision_reason = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
