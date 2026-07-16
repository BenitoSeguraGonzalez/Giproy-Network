from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class LicenseNotificationEvent(Base):
    __tablename__ = "license_notification_events"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    empresa_licencia_id = Column(Integer, ForeignKey("empresa_licencias.id", ondelete="SET NULL"), nullable=True, index=True)
    licencia_id = Column(Integer, ForeignKey("licencias.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)

    notification_type = Column(String(80), nullable=False, index=True)
    channel = Column(String(30), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=True, index=True)
    status = Column(String(30), nullable=False, default="pending", server_default="pending", index=True)
    dedupe_key = Column(String(255), nullable=False, index=True)
    payload = Column(JSON, nullable=True)
    scheduled_for = Column(DateTime(timezone=True), nullable=True, index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("dedupe_key", name="uq_license_notification_events_dedupe_key"),
    )

    empresa = relationship("Empresa")
    empresa_licencia = relationship("EmpresaLicencia")
    licencia = relationship("Licencia")
    recipient_usuario = relationship("Usuario")
