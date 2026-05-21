from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class ProyectoDocumento(Base):
    __tablename__ = "proyecto_documentos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_root = Column(String(50), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)

    file_name = Column(String(255), nullable=False)
    storage_path = Column(String(1024), nullable=False)
    content_type = Column(String(120), nullable=False, default="application/pdf")
    size_bytes = Column(Integer, nullable=False, default=0, server_default="0")

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)
