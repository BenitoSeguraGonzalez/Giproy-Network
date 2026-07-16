from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCdeSubmittal(Base):
    __tablename__ = "bim_cde_submittals"
    __table_args__ = (UniqueConstraint("empresa_id", "proyecto_id", "submittal_number", name="uq_bim_cde_submittal_number"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    submittal_number = Column(String(30), nullable=False)
    title = Column(String(500), nullable=False)
    submittal_type = Column(String(40), nullable=False, index=True)
    discipline = Column(String(80), nullable=False, index=True)
    specification_section = Column(String(120), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    required_at = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="draft", index=True)
    current_revision = Column(Integer, nullable=False, default=1)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BimCdeSubmittalRevision(Base):
    __tablename__ = "bim_cde_submittal_revisions"
    __table_args__ = (UniqueConstraint("submittal_id", "revision", name="uq_bim_cde_submittal_revision"),)

    id = Column(Integer, primary_key=True, index=True)
    submittal_id = Column(Integer, ForeignKey("bim_cde_submittals.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    document_id = Column(Integer, ForeignKey("bim_cde_documents.id", ondelete="RESTRICT"), nullable=False, index=True)
    document_revision_id = Column(Integer, ForeignKey("bim_cde_document_revisions.id", ondelete="RESTRICT"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="draft", index=True)
    submission_notes = Column(Text, nullable=True)
    decision_comment = Column(Text, nullable=True)
    submitted_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimCdeSubmittalEvent(Base):
    __tablename__ = "bim_cde_submittal_events"

    id = Column(Integer, primary_key=True, index=True)
    submittal_id = Column(Integer, ForeignKey("bim_cde_submittals.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=False, default=dict)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
