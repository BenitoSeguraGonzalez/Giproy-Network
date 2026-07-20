from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base


class BimIntegrationSubscription(Base):
    __tablename__ = "bim_integration_subscriptions"
    __table_args__ = (
        UniqueConstraint("empresa_id", "proyecto_id", "target_url", name="uq_bim_integration_subscription_target"),
        CheckConstraint("status IN ('active','disabled')", name="ck_bim_integration_subscription_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(120), nullable=False)
    target_url = Column(String(2048), nullable=False)
    event_types_json = Column(JSON, nullable=False)
    encrypted_secret = Column(Text, nullable=False)
    secret_hint = Column(String(12), nullable=False)
    status = Column(String(20), nullable=False, default="active", index=True)
    lock_version = Column(Integer, nullable=False, default=1)
    created_by = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BimIntegrationDelivery(Base):
    __tablename__ = "bim_integration_deliveries"
    __table_args__ = (
        UniqueConstraint("subscription_id", "event_key", name="uq_bim_integration_delivery_event"),
        CheckConstraint("status IN ('pending','delivering','retry','delivered','dead')", name="ck_bim_integration_delivery_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey("bim_integration_subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    event_key = Column(String(180), nullable=False)
    payload_json = Column(JSON, nullable=False)
    payload_checksum_sha256 = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)
    attempt_count = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=8)
    next_attempt_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_http_status = Column(Integer, nullable=True)
    last_error_code = Column(String(80), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
