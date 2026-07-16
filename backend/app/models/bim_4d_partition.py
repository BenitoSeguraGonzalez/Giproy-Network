from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class Bim4dPartitionSpec(Base):
    __tablename__ = "bim_4d_partition_specs"
    __table_args__ = (
        UniqueConstraint("bim_element_id", "revision", name="uq_bim_4d_partition_element_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(String(100), nullable=False)
    axis = Column(String(1), nullable=False)
    segment_count = Column(Integer, nullable=False)
    gap_ratio = Column(Float, nullable=False, default=0)
    status = Column(String(30), nullable=False, default="preview")
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dPartitionArtifact(Base):
    __tablename__ = "bim_4d_partition_artifacts"
    __table_args__ = (
        UniqueConstraint("partition_spec_id", name="uq_bim_4d_partition_artifact_spec"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    partition_spec_id = Column(Integer, ForeignKey("bim_4d_partition_specs.id", ondelete="CASCADE"), nullable=False, index=True)
    contract_version = Column(String(80), nullable=False)
    geometry_method = Column(String(50), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    geometry_json = Column(JSON, nullable=False)
    total_volume = Column(Float, nullable=False)
    total_surface_area = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Bim4dPartitionCsgArtifact(Base):
    __tablename__ = "bim_4d_partition_csg_artifacts"
    __table_args__ = (
        UniqueConstraint("partition_spec_id", "artifact_revision", name="uq_bim_4d_partition_csg_spec_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="CASCADE"), nullable=False, index=True)
    partition_spec_id = Column(Integer, ForeignKey("bim_4d_partition_specs.id", ondelete="CASCADE"), nullable=False, index=True)
    artifact_revision = Column(String(100), nullable=False)
    contract_version = Column(String(80), nullable=False)
    geometry_method = Column(String(50), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    geometry_json = Column(JSON, nullable=False)
    source_volume = Column(Float, nullable=False)
    partition_volume = Column(Float, nullable=False)
    conservation_delta = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
