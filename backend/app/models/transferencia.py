from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TransferAdminPublicCode(Base):
    __tablename__ = "transfer_admin_public_codes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    public_code = Column(String(9), nullable=False, unique=True, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    empresa = relationship("Empresa", foreign_keys=[empresa_id])


class TransferCompanyPublicCode(Base):
    __tablename__ = "transfer_company_public_codes"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    public_code = Column(String(9), nullable=False, unique=True, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    generated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    empresa = relationship("Empresa", foreign_keys=[empresa_id])


class TransferExtraRecipientPack(Base):
    __tablename__ = "transfer_extra_recipient_packs"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    marketplace_order_item_id = Column(Integer, ForeignKey("marketplace_order_items.id", ondelete="SET NULL"), nullable=True, index=True)
    product_code = Column(String(80), nullable=False, default="CONECTA_TRANSFERENCIAS", server_default="CONECTA_TRANSFERENCIAS", index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    slots_total = Column(Integer, nullable=False, default=3, server_default="3")
    slots_used = Column(Integer, nullable=False, default=0, server_default="0")
    purchased_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    marketplace_order_item = relationship("MarketplaceOrderItem", foreign_keys=[marketplace_order_item_id])


class TransferAllowedCompanyRecipient(Base):
    __tablename__ = "transfer_allowed_company_recipients"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_kind = Column(String(30), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="active", server_default="active", index=True)
    source_pack_id = Column(Integer, ForeignKey("transfer_extra_recipient_packs.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    confirmed_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    blocked_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    recipient_empresa = relationship("Empresa", foreign_keys=[recipient_empresa_id])
    source_pack = relationship("TransferExtraRecipientPack", foreign_keys=[source_pack_id])
    created_by_user = relationship("Usuario", foreign_keys=[created_by_user_id])
    confirmed_by_user = relationship("Usuario", foreign_keys=[confirmed_by_user_id])

    __table_args__ = (
        UniqueConstraint("empresa_id", "recipient_empresa_id", name="uq_transfer_recipient_empresa_pair"),
    )


class TransferCodeAttemptGuard(Base):
    __tablename__ = "transfer_code_attempt_guards"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    attempted_code = Column(String(9), nullable=True, index=True)
    consecutive_failures = Column(Integer, nullable=False, default=0, server_default="0")
    window_failures = Column(Integer, nullable=False, default=0, server_default="0")
    window_started_at = Column(DateTime(timezone=True), nullable=True, index=True)
    paused_until = Column(DateTime(timezone=True), nullable=True, index=True)
    banned_until = Column(DateTime(timezone=True), nullable=True, index=True)
    last_attempt_at = Column(DateTime(timezone=True), nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)

    empresa = relationship("Empresa", foreign_keys=[empresa_id])


class TransferShipment(Base):
    __tablename__ = "transfer_shipments"

    id = Column(Integer, primary_key=True, index=True)
    sender_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    sent_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(40), nullable=False, default="borrador_preflight", server_default="borrador_preflight", index=True)
    asset_type = Column(String(40), nullable=False, index=True)
    asset_id = Column(Integer, nullable=False, index=True)
    description = Column(Text, nullable=False)
    contract_version = Column(String(40), nullable=False, default="transfer-v1", server_default="transfer-v1", index=True)
    snapshot_hash = Column(String(128), nullable=True, index=True)
    preflight_payload = Column(JSON, nullable=True)
    marketplace_blocked = Column(Boolean, nullable=False, default=False, server_default="0", index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True, index=True)
    received_at = Column(DateTime(timezone=True), nullable=True, index=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    imported_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    metadata_json = Column(JSON, nullable=True)

    sender_empresa = relationship("Empresa", foreign_keys=[sender_empresa_id])
    receiver_empresa = relationship("Empresa", foreign_keys=[receiver_empresa_id])
    created_by_user = relationship("Usuario", foreign_keys=[created_by_user_id])
    sent_by_user = relationship("Usuario", foreign_keys=[sent_by_user_id])
    items = relationship("TransferShipmentItem", back_populates="shipment", cascade="all, delete-orphan")
    requirements = relationship("TransferMarketplaceRequirement", back_populates="shipment", cascade="all, delete-orphan")
    events = relationship("TransferAuditEvent", back_populates="shipment", cascade="all, delete-orphan")


class TransferShipmentItem(Base):
    __tablename__ = "transfer_shipment_items"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("transfer_shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(40), nullable=False, index=True)
    asset_id = Column(Integer, nullable=False, index=True)
    asset_name_snapshot = Column(String(255), nullable=True)
    contract_version = Column(String(40), nullable=False, default="transfer-v1", server_default="transfer-v1", index=True)
    payload_hash = Column(String(128), nullable=True, index=True)
    payload_json = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    shipment = relationship("TransferShipment", back_populates="items")


class TransferMarketplaceRequirement(Base):
    __tablename__ = "transfer_marketplace_requirements"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("transfer_shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="SET NULL"), nullable=True, index=True)
    product_title_snapshot = Column(String(255), nullable=False)
    status = Column(String(40), nullable=False, default="pending_purchase", server_default="pending_purchase", index=True)
    required = Column(Boolean, nullable=False, default=True, server_default="1")
    price_snapshot = Column(Numeric(15, 2), nullable=True)
    currency = Column(String(10), nullable=False, default="USD", server_default="USD")
    receiver_order_item_id = Column(Integer, ForeignKey("marketplace_order_items.id", ondelete="SET NULL"), nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    shipment = relationship("TransferShipment", back_populates="requirements")
    product = relationship("MarketplaceProduct", foreign_keys=[product_id])
    receiver_order_item = relationship("MarketplaceOrderItem", foreign_keys=[receiver_order_item_id])


class TransferAuditEvent(Base):
    __tablename__ = "transfer_audit_events"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("transfer_shipments.id", ondelete="CASCADE"), nullable=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    actor_scope = Column(String(40), nullable=True, index=True)
    message = Column(Text, nullable=True)
    payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    shipment = relationship("TransferShipment", back_populates="events")
    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    user = relationship("Usuario", foreign_keys=[user_id])


class TransferImportResult(Base):
    __tablename__ = "transfer_import_results"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("transfer_shipments.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    receiver_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(40), nullable=False, default="pending", server_default="pending", index=True)
    attempts_count = Column(Integer, nullable=False, default=0, server_default="0")
    imported_entity_type = Column(String(40), nullable=True, index=True)
    imported_entity_id = Column(Integer, nullable=True, index=True)
    payload_hash = Column(String(128), nullable=True, index=True)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    metadata_json = Column(JSON, nullable=True)

    shipment = relationship("TransferShipment")
    receiver_empresa = relationship("Empresa", foreign_keys=[receiver_empresa_id])


class TransferImportReference(Base):
    __tablename__ = "transfer_import_references"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("transfer_shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    import_result_id = Column(Integer, ForeignKey("transfer_import_results.id", ondelete="CASCADE"), nullable=True, index=True)
    source_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    target_empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    source_entity_type = Column(String(40), nullable=False, index=True)
    source_entity_id = Column(Integer, nullable=False, index=True)
    target_entity_type = Column(String(40), nullable=True, index=True)
    target_entity_id = Column(Integer, nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

    shipment = relationship("TransferShipment")
    import_result = relationship("TransferImportResult")
    source_empresa = relationship("Empresa", foreign_keys=[source_empresa_id])
    target_empresa = relationship("Empresa", foreign_keys=[target_empresa_id])
