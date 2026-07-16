from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.sql import func

from app.core.database import Base


class BimCdeDocument(Base):
    __tablename__ = "bim_cde_documents"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "document_code", name="uq_bim_cde_document_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    document_code = Column(String(120), nullable=False)
    title = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active", index=True)
    current_revision = Column(Integer, nullable=False, default=0)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BimCdeDocumentRevision(Base):
    __tablename__ = "bim_cde_document_revisions"
    __table_args__ = (
        UniqueConstraint("document_id", "revision", name="uq_bim_cde_document_revision"),
        Index(
            "uq_bim_cde_document_current_revision",
            "document_id",
            unique=True,
            postgresql_where=text("status = 'current'"),
            sqlite_where=text("status = 'current'"),
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("bim_cde_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    revision = Column(Integer, nullable=False)
    version_label = Column(String(100), nullable=False)
    source_filename = Column(String(255), nullable=False)
    stored_path = Column(String(700), nullable=False)
    media_type = Column(String(150), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="current", index=True)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
