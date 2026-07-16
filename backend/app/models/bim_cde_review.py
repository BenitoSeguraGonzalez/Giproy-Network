from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCdeReview(Base):
    __tablename__ = "bim_cde_reviews"
    __table_args__ = (UniqueConstraint("empresa_id", "proyecto_id", "review_number", name="uq_bim_cde_review_number"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    review_number = Column(String(30), nullable=False)
    title = Column(String(500), nullable=False)
    status = Column(String(30), nullable=False, default="open", index=True)
    document_revision_id = Column(Integer, ForeignKey("bim_cde_document_revisions.id", ondelete="RESTRICT"), nullable=False, index=True)
    global_id = Column(String(64), nullable=True, index=True)
    viewpoint_json = Column(JSON, nullable=True)
    assigned_to = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=False, index=True)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    resolved_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    closed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    resolution = Column(Text, nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)


class BimCdeReviewComment(Base):
    __tablename__ = "bim_cde_review_comments"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("bim_cde_reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class BimCdeReviewNotification(Base):
    __tablename__ = "bim_cde_review_notifications"
    __table_args__ = (UniqueConstraint("dedupe_key", name="uq_bim_cde_review_notification_dedupe"),)

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("bim_cde_reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    dedupe_key = Column(String(255), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
