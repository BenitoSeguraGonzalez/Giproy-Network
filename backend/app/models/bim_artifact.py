from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimArtifact(Base):
    __tablename__ = "bim_artifacts"
    __table_args__ = (
        UniqueConstraint("bim_model_version_id", "artifact_type", "generation", name="uq_bim_artifact_generation"),
    )

    id = Column(Integer, primary_key=True, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    artifact_type = Column(String(50), nullable=False, index=True)
    contract_version = Column(String(100), nullable=False)
    generation = Column(Integer, nullable=False)
    artifact_path = Column(String(500), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    source_checksum_sha256 = Column(String(64), nullable=True)
    status = Column(String(30), nullable=False, default="active", index=True)
    metadata_json = Column(JSON, nullable=False, default=dict)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    version = relationship("BimModelVersion")
    proyecto = relationship("Proyecto")
    empresa = relationship("Empresa")
