from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class LegalAcceptance(Base):
    """Append-only evidence of the exact legal choice presented to a user."""

    __tablename__ = "legal_acceptances"

    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(String(32), nullable=False)
    document_version = Column(String(32), nullable=False)
    document_sha256 = Column(String(64), nullable=False)
    accepted = Column(Boolean, nullable=False)
    purpose = Column(String(64), nullable=False)
    origin = Column(String(32), nullable=False)
    request_ip_hmac = Column(String(64), nullable=True)
    user_agent_sha256 = Column(String(64), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
