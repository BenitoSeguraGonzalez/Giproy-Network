from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BimIssue(Base):
    __tablename__ = "bim_issues"
    __table_args__ = (UniqueConstraint("proyecto_id", "topic_guid", name="uq_bim_issue_project_topic_guid"),)

    id = Column(Integer, primary_key=True, index=True)
    topic_guid = Column(String(36), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    bim_model_version_id = Column(Integer, ForeignKey("bim_model_versions.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(30), nullable=False, default="normal")
    status = Column(String(30), nullable=False, default="open", index=True)
    assigned_to = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    viewpoint_json = Column(JSON, nullable=False, default=dict)
    snapshot_path = Column(String(500), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    comments = relationship("BimIssueComment", back_populates="issue", cascade="all, delete-orphan")
    events = relationship("BimIssueEvent", back_populates="issue", cascade="all, delete-orphan")
    attachments = relationship("BimIssueAttachment", back_populates="issue", cascade="all, delete-orphan")


class BimIssueComment(Base):
    __tablename__ = "bim_issue_comments"
    id = Column(Integer, primary_key=True, index=True)
    bim_issue_id = Column(Integer, ForeignKey("bim_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    issue = relationship("BimIssue", back_populates="comments")


class BimIssueEvent(Base):
    __tablename__ = "bim_issue_events"
    id = Column(Integer, primary_key=True, index=True)
    bim_issue_id = Column(Integer, ForeignKey("bim_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=False, default=dict)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    issue = relationship("BimIssue", back_populates="events")


class BimIssueAttachment(Base):
    __tablename__ = "bim_issue_attachments"
    __table_args__ = (UniqueConstraint("bim_issue_id", "checksum_sha256", name="uq_bim_issue_attachment_checksum"),)

    id = Column(Integer, primary_key=True, index=True)
    bim_issue_id = Column(Integer, ForeignKey("bim_issues.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    content_type = Column(String(100), nullable=False)
    byte_size = Column(Integer, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    content = Column(LargeBinary, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    issue = relationship("BimIssue", back_populates="attachments")
