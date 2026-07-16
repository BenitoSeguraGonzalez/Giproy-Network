from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimIdsProfile(Base):
    __tablename__ = "bim_ids_profiles"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source_filename = Column(String(255), nullable=False)
    ids_version = Column(String(50), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    xml_content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimIdsValidation(Base):
    __tablename__ = "bim_ids_validations"

    id = Column(Integer, primary_key=True, index=True)
    bim_ids_profile_id = Column(Integer, ForeignKey("bim_ids_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False)
    summary_json = Column(JSON, nullable=False, default=dict)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    findings = relationship("BimIdsFinding", back_populates="validation", cascade="all, delete-orphan")


class BimIdsFinding(Base):
    __tablename__ = "bim_ids_findings"

    id = Column(Integer, primary_key=True, index=True)
    bim_ids_validation_id = Column(Integer, ForeignKey("bim_ids_validations.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id = Column(String(255), nullable=False, index=True)
    specification_name = Column(String(255), nullable=False)
    global_id = Column(String(255), nullable=True, index=True)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, index=True)
    message = Column(Text, nullable=False)
    exception_reason = Column(Text, nullable=True)
    exception_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    exception_at = Column(DateTime(timezone=True), nullable=True)

    validation = relationship("BimIdsValidation", back_populates="findings")
