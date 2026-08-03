from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimFederation(Base):
    __tablename__ = "bim_federations"
    __table_args__ = (
        UniqueConstraint("proyecto_id", "empresa_id", "revision", name="uq_bim_federation_project_revision"),
    )

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    revision = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="active", index=True)
    justification = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    members = relationship("BimFederationMember", back_populates="federation", cascade="all, delete-orphan")


class BimFederationMember(Base):
    __tablename__ = "bim_federation_members"
    __table_args__ = (
        UniqueConstraint("bim_federation_id", "bim_model_version_id", name="uq_bim_federation_member_version"),
    )

    id = Column(Integer, primary_key=True, index=True)
    bim_federation_id = Column(Integer, ForeignKey("bim_federations.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    discipline = Column(String(100), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    enabled = Column(Boolean, nullable=False, default=True)
    transform_json = Column(JSON, nullable=False, default=dict)
    georeference_json = Column(JSON, nullable=False, default=dict)

    federation = relationship("BimFederation", back_populates="members")
    version = relationship("BimModelVersion")


class BimVersionReconciliationDecision(Base):
    __tablename__ = "bim_version_reconciliation_decisions"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "source_version_id", "target_version_id", "candidate_hash", name="uq_bim_reconciliation_candidate"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    source_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    target_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="RESTRICT"), nullable=False, index=True)
    candidate_hash = Column(String(64), nullable=False, index=True)
    candidate_json = Column(JSON, nullable=False)
    decision = Column(String(20), nullable=False)
    selected_target_element_id = Column(Integer, ForeignKey("bim_elements.id", ondelete="RESTRICT"), nullable=True)
    reason = Column(Text, nullable=False)
    affected_link_count = Column(Integer, nullable=False, default=0)
    reviewed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
