from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SystemAuditEvent(Base):
    __tablename__ = "system_audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_email = Column(String(255), nullable=True, index=True)
    actor_role = Column(String(100), nullable=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="SET NULL"), nullable=True, index=True)
    proyecto_codigo_root = Column(String(80), nullable=True, index=True)
    proyecto_revision = Column(Integer, nullable=True, index=True)
    target_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    module = Column(String(100), nullable=False, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default="info", server_default="info", index=True)
    entity_type = Column(String(100), nullable=True, index=True)
    entity_id = Column(String(100), nullable=True, index=True)
    capability = Column(String(120), nullable=True, index=True)
    correlation_id = Column(String(100), nullable=True, index=True)
    operation_status = Column(String(40), nullable=True, index=True)
    previous_hash = Column(String(64), nullable=True)
    hash_nonce = Column(String(36), nullable=True)
    event_hash = Column(String(64), nullable=True, unique=True, index=True)
    message = Column(Text, nullable=False)
    payload_json = Column(Text, nullable=True)
    detail_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    actor = relationship("Usuario", foreign_keys=[actor_user_id])
    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    target_user = relationship("Usuario", foreign_keys=[target_user_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])


@event.listens_for(SystemAuditEvent, "before_update", propagate=True)
def _reject_audit_event_update(_mapper, _connection, _target):
    raise RuntimeError("Los eventos de auditoria son inmutables.")


@event.listens_for(SystemAuditEvent, "before_delete", propagate=True)
def _reject_audit_event_delete(_mapper, _connection, _target):
    raise RuntimeError("Los eventos de auditoria son inmutables.")
