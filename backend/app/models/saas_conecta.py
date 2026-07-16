from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SaasConectaSlot(Base):
    __tablename__ = "saas_conecta_slots"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    connected_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    invited_email = Column(String(255), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    source_right_code = Column(String(80), nullable=True, index=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    released_at = Column(DateTime(timezone=True), nullable=True)
    last_reassignment_at = Column(DateTime(timezone=True), nullable=True)
    forced_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    audit_reason = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa")
    owner_user = relationship("Usuario", foreign_keys=[owner_user_id])
    connected_user = relationship("Usuario", foreign_keys=[connected_user_id])
    forced_by_user = relationship("Usuario", foreign_keys=[forced_by_user_id])
