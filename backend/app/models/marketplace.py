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


class MarketplaceProductCategory(Base):
    __tablename__ = "marketplace_product_categories"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    slug = Column(String(160), nullable=False, unique=True, index=True)
    descripcion = Column(Text, nullable=True)
    visibility_scope = Column(String(20), nullable=False, default="all", index=True)
    parent_id = Column(Integer, ForeignKey("marketplace_product_categories.id", ondelete="SET NULL"), nullable=True)
    activa = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    parent = relationship("MarketplaceProductCategory", remote_side=[id])


class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False, index=True)
    slug = Column(String(280), nullable=False, unique=True, index=True)
    resumen = Column(String(500), nullable=True)
    descripcion = Column(Text, nullable=True)
    incluye = Column(Text, nullable=True)
    no_incluye = Column(Text, nullable=True)
    vista_previa = Column(JSON, nullable=True)
    etiquetas = Column(JSON, nullable=True)
    product_type = Column(String(50), nullable=False, default="adicional", index=True)
    product_kind = Column(String(50), nullable=False, default="manual", index=True)
    source_type = Column(String(50), nullable=True, index=True)
    source_id = Column(Integer, nullable=True, index=True)
    precio = Column(Numeric(15, 2), nullable=False, default=0)
    moneda = Column(String(10), nullable=False, default="USD")
    estado = Column(String(50), nullable=False, default="pending", index=True)
    activo = Column(Boolean, nullable=False, default=True)
    requiere_aprobacion = Column(Boolean, nullable=False, default=True)
    ventas_count = Column(Integer, nullable=False, default=0)
    rating_promedio = Column(Numeric(4, 2), nullable=False, default=0)
    category_id = Column(Integer, ForeignKey("marketplace_product_categories.id", ondelete="SET NULL"), nullable=True)
    seller_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    approved_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True)
    admin_notes = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("MarketplaceProductCategory")
    seller = relationship("Usuario", foreign_keys=[seller_user_id])
    approved_by = relationship("Usuario", foreign_keys=[approved_by_user_id])
    reviews = relationship("MarketplaceReview", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("seller_user_id", "source_type", "source_id", name="uq_marketplace_product_source_owner"),
    )


class MarketplaceOrder(Base):
    __tablename__ = "marketplace_orders"

    id = Column(Integer, primary_key=True, index=True)
    buyer_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    total = Column(Numeric(15, 2), nullable=False, default=0)
    commission_amount = Column(Numeric(15, 2), nullable=False, default=0)
    seller_amount = Column(Numeric(15, 2), nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="USD")
    status = Column(String(50), nullable=False, default="pending", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    buyer = relationship("Usuario", foreign_keys=[buyer_user_id])
    items = relationship("MarketplaceOrderItem", back_populates="order", cascade="all, delete-orphan")
    payment_attempts = relationship("MarketplacePaymentAttempt", back_populates="order")


class MarketplaceOrderItem(Base):
    __tablename__ = "marketplace_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("marketplace_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="SET NULL"), nullable=True, index=True)
    seller_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    product_title_snapshot = Column(String(255), nullable=False)
    product_type_snapshot = Column(String(50), nullable=False)
    source_type_snapshot = Column(String(50), nullable=True)
    source_id_snapshot = Column(Integer, nullable=True)
    delivered_entity_type = Column(String(50), nullable=True)
    delivered_entity_id = Column(Integer, nullable=True)
    price = Column(Numeric(15, 2), nullable=False, default=0)

    order = relationship("MarketplaceOrder", back_populates="items")
    product = relationship("MarketplaceProduct")
    seller = relationship("Usuario", foreign_keys=[seller_user_id])


class MarketplaceReview(Base):
    __tablename__ = "marketplace_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("marketplace_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    buyer_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("MarketplaceProduct", back_populates="reviews")
    buyer = relationship("Usuario", foreign_keys=[buyer_user_id])


class MarketplaceAssetOrigin(Base):
    __tablename__ = "marketplace_asset_origins"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    ownership_kind = Column(String(30), nullable=False, default="owned", index=True)
    origin_kind = Column(String(30), nullable=False, default="native", index=True)
    origin_label = Column(String(255), nullable=True)
    source_entity_type = Column(String(50), nullable=True, index=True)
    source_entity_id = Column(Integer, nullable=True, index=True)
    source_company_id = Column(Integer, ForeignKey("empresas.id", ondelete="SET NULL"), nullable=True, index=True)
    source_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    marketplace_product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="SET NULL"), nullable=True, index=True)
    marketplace_order_id = Column(Integer, ForeignKey("marketplace_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    marketplace_order_item_id = Column(Integer, ForeignKey("marketplace_order_items.id", ondelete="SET NULL"), nullable=True, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    empresa = relationship("Empresa", foreign_keys=[empresa_id])
    source_company = relationship("Empresa", foreign_keys=[source_company_id])
    source_user = relationship("Usuario", foreign_keys=[source_user_id])
    marketplace_product = relationship("MarketplaceProduct", foreign_keys=[marketplace_product_id])
    marketplace_order = relationship("MarketplaceOrder", foreign_keys=[marketplace_order_id])
    marketplace_order_item = relationship("MarketplaceOrderItem", foreign_keys=[marketplace_order_item_id])

    __table_args__ = (
        UniqueConstraint("empresa_id", "entity_type", "entity_id", name="uq_marketplace_asset_origin_entity"),
    )


class MarketplaceCheckoutDraft(Base):
    __tablename__ = "marketplace_checkout_drafts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("empresas.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="open", index=True)
    payment_method = Column(String(40), nullable=True, index=True)
    currency = Column(String(10), nullable=False, default="USD")
    total = Column(Numeric(15, 2), nullable=False, default=0)
    snapshot_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    last_activity_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Empresa", foreign_keys=[company_id])
    user = relationship("Usuario", foreign_keys=[user_id])
    payment_attempts = relationship("MarketplacePaymentAttempt", back_populates="checkout_draft")


class MarketplacePaymentAttempt(Base):
    __tablename__ = "marketplace_payment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("marketplace_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    checkout_draft_id = Column(Integer, ForeignKey("marketplace_checkout_drafts.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_method = Column(String(40), nullable=False, index=True)
    payment_provider = Column(String(40), nullable=True, index=True)
    status = Column(String(40), nullable=False, default="draft", index=True)
    amount = Column(Numeric(15, 2), nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="USD")
    provider_order_id = Column(String(120), nullable=True, index=True)
    provider_transaction_id = Column(String(120), nullable=True, index=True)
    client_transaction_id = Column(String(120), nullable=True, index=True)
    idempotency_key = Column(String(120), nullable=True, index=True)
    config_version = Column(String(40), nullable=True)
    environment_mode = Column(String(20), nullable=True, index=True)
    payload_json = Column(JSON, nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    order = relationship("MarketplaceOrder", back_populates="payment_attempts")
    checkout_draft = relationship("MarketplaceCheckoutDraft", back_populates="payment_attempts")
    events = relationship("MarketplacePaymentEvent", back_populates="payment_attempt", cascade="all, delete-orphan")


class MarketplacePaymentEvent(Base):
    __tablename__ = "marketplace_payment_events"

    id = Column(Integer, primary_key=True, index=True)
    payment_attempt_id = Column(Integer, ForeignKey("marketplace_payment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(String(40), nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    event_origin = Column(String(40), nullable=True, index=True)
    correlation_id = Column(String(120), nullable=True, index=True)
    payload_json = Column(JSON, nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payment_attempt = relationship("MarketplacePaymentAttempt", back_populates="events")


class MarketplacePaymentMethod(Base):
    __tablename__ = "marketplace_payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(40), nullable=False, unique=True, index=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text, nullable=True)
    provider = Column(String(40), nullable=False, index=True)
    is_active = Column(Boolean, nullable=False, default=False, index=True)
    priority = Column(Integer, nullable=False, default=0, index=True)
    environment_mode = Column(String(20), nullable=False, default="sandbox", index=True)
    readiness_status = Column(String(30), nullable=False, default="incomplete", index=True)
    config_version = Column(String(40), nullable=True)
    config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MarketplaceRefund(Base):
    __tablename__ = "marketplace_refunds"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("marketplace_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    reviewed_by_user_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True, index=True)
    refund_mode = Column(String(30), nullable=False, default="automatic", index=True)
    refund_scope = Column(String(20), nullable=False, default="all", index=True)
    refund_method = Column(String(40), nullable=True, index=True)
    status = Column(String(40), nullable=False, default="requested", index=True)
    amount = Column(Numeric(15, 2), nullable=False, default=0)
    currency = Column(String(10), nullable=False, default="USD")
    reason = Column(Text, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("MarketplaceOrder", foreign_keys=[order_id])
    requested_by = relationship("Usuario", foreign_keys=[requested_by_user_id])
    reviewed_by = relationship("Usuario", foreign_keys=[reviewed_by_user_id])
