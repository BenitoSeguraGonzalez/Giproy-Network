from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimCdeRfi(Base):
    __tablename__ = "bim_cde_rfis"
    __table_args__ = (UniqueConstraint("empresa_id", "proyecto_id", "rfi_number", name="uq_bim_cde_rfi_number"),)

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    rfi_number = Column(String(30), nullable=False)
    subject = Column(String(500), nullable=False)
    question = Column(Text, nullable=False)
    priority = Column(String(30), nullable=False, default="normal")
    status = Column(String(30), nullable=False, default="draft", index=True)
    due_at = Column(DateTime(timezone=True), nullable=True, index=True)
    document_id = Column(Integer, ForeignKey("bim_cde_documents.id", ondelete="SET NULL"), nullable=True, index=True)
    global_id = Column(String(64), nullable=True, index=True)
    assigned_to = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    answer = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    answered_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    closed_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    answered_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BimCdeRfiEvent(Base):
    __tablename__ = "bim_cde_rfi_events"

    id = Column(Integer, primary_key=True, index=True)
    rfi_id = Column(Integer, ForeignKey("bim_cde_rfis.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=False, default=dict)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
