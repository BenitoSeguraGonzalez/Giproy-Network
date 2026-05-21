from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class MarketplaceCategoryResponse(BaseModel):
    id: int
    nombre: str
    slug: str
    descripcion: Optional[str] = None
    visibility_scope: str = "all"
    parent_id: Optional[int] = None
    activa: bool
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class MarketplaceCategoryCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    visibility_scope: Literal["all", "system", "users"] = "all"
    parent_id: Optional[int] = None
    activa: bool = True
    sort_order: int = 0


class MarketplaceCategoryUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    visibility_scope: Optional[Literal["all", "system", "users"]] = None
    parent_id: Optional[int] = None
    activa: Optional[bool] = None
    sort_order: Optional[int] = None


class MarketplaceSellerSnapshot(BaseModel):
    id: int
    nombre_completo: str
    rol: Optional[str] = None


class MarketplaceProductResponse(BaseModel):
    id: int
    titulo: str
    slug: str
    resumen: Optional[str] = None
    descripcion: Optional[str] = None
    incluye: Optional[str] = None
    no_incluye: Optional[str] = None
    vista_previa: Optional[dict] = None
    etiquetas: list[str] = Field(default_factory=list)
    product_type: str
    product_kind: str
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    precio: Decimal
    moneda: str
    estado: str
    activo: bool
    requiere_aprobacion: bool
    ventas_count: int
    rating_promedio: Decimal
    category_id: Optional[int] = None
    seller_user_id: int
    admin_notes: Optional[str] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    seller: Optional[MarketplaceSellerSnapshot] = None
    category: Optional[MarketplaceCategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplacePermissionSummary(BaseModel):
    marketplace_permissions: list[str] = Field(default_factory=list)


class MarketplaceSourceOptionResponse(BaseModel):
    source_type: Literal["base_trabajo", "apu", "proyecto"]
    source_id: int
    product_type: Literal["base_maestra", "apu", "proyecto"]
    title: str
    subtitle: Optional[str] = None
    detail: Optional[str] = None
    currency: Optional[str] = None
    amount: Optional[Decimal] = None
    is_publishable: bool = True
    blocked_reason: Optional[str] = None
    already_published: bool = False
    existing_product_id: Optional[int] = None


class MarketplaceAssetOriginResponse(BaseModel):
    id: int
    empresa_id: int
    entity_type: str
    entity_id: int
    ownership_kind: str
    origin_kind: str
    origin_label: Optional[str] = None
    source_entity_type: Optional[str] = None
    source_entity_id: Optional[int] = None
    source_company_id: Optional[int] = None
    source_user_id: Optional[int] = None
    marketplace_product_id: Optional[int] = None
    marketplace_order_id: Optional[int] = None
    marketplace_order_item_id: Optional[int] = None
    metadata_json: Optional[dict] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceProductCreate(BaseModel):
    titulo: str
    resumen: Optional[str] = None
    descripcion: Optional[str] = None
    incluye: Optional[str] = None
    no_incluye: Optional[str] = None
    etiquetas: list[str] = Field(default_factory=list)
    product_type: Literal["licencia", "addon", "adicional", "base_maestra", "apu", "proyecto", "portal_compras_publicas"]
    product_kind: Literal["manual", "referenced"]
    source_type: Optional[Literal["base_trabajo", "apu", "proyecto"]] = None
    source_id: Optional[int] = None
    precio: Decimal
    moneda: str = "USD"
    category_id: Optional[int] = None
    requiere_aprobacion: bool = True
    activo: bool = True
    sales_config: Optional[dict] = None
    product_meta: Optional[dict] = None
    portal_meta: Optional[dict] = None


class MarketplaceProductUpdate(BaseModel):
    titulo: Optional[str] = None
    resumen: Optional[str] = None
    descripcion: Optional[str] = None
    incluye: Optional[str] = None
    no_incluye: Optional[str] = None
    etiquetas: Optional[list[str]] = None
    precio: Optional[Decimal] = None
    moneda: Optional[str] = None
    category_id: Optional[int] = None
    activo: Optional[bool] = None
    requiere_aprobacion: Optional[bool] = None
    sales_config: Optional[dict] = None
    product_meta: Optional[dict] = None
    portal_meta: Optional[dict] = None


class MarketplaceCheckoutItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=999)


class MarketplaceModerationAction(BaseModel):
    admin_notes: Optional[str] = None


class MarketplaceManualPaymentAction(BaseModel):
    admin_notes: Optional[str] = None


class MarketplaceRefundRequest(BaseModel):
    reason: Optional[str] = None


class MarketplaceCheckoutRequest(BaseModel):
    product_ids: list[int] = Field(default_factory=list)
    items: list[MarketplaceCheckoutItemRequest] = Field(default_factory=list)
    apu_target_base_id: Optional[int] = None
    notes: Optional[str] = None


class MarketplaceCheckoutDraftCreate(BaseModel):
    product_ids: list[int] = Field(default_factory=list)
    items: list[MarketplaceCheckoutItemRequest] = Field(default_factory=list)
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class MarketplaceBankTransferCheckoutCreate(BaseModel):
    checkout_draft_id: int
    transfer_reference: str
    transfer_date: Optional[str] = None
    notes: Optional[str] = None


class MarketplacePayPhonePrepareRequest(BaseModel):
    checkout_draft_id: int


class MarketplacePayPhonePrepareResponse(BaseModel):
    checkout_draft_id: int
    payment_attempt_id: int
    environment_mode: str
    token: str
    store_id: str
    client_transaction_id: str
    amount: int
    amount_without_tax: int
    currency: str = "USD"
    reference: str
    lang: str = "es"
    default_method: str = "card"
    time_zone: int = -5
    phone_number: Optional[str] = None
    email: Optional[str] = None
    document_id: Optional[str] = None
    identification_type: int = 1
    lat: Optional[str] = None
    lng: Optional[str] = None


class MarketplacePayPhoneConfirmRequest(BaseModel):
    id: int
    client_transaction_id: str


class MarketplacePayPhoneConfirmResponse(BaseModel):
    transaction_status: str
    status_code: Optional[int] = None
    message: Optional[str] = None
    order: Optional["MarketplaceOrderResponse"] = None
    payment_attempt_id: Optional[int] = None
    provider_transaction_id: Optional[str] = None
    authorization_code: Optional[str] = None


class MarketplacePayPalPrepareRequest(BaseModel):
    checkout_draft_id: int


class MarketplacePayPalPrepareResponse(BaseModel):
    checkout_draft_id: int
    payment_attempt_id: int
    environment_mode: str
    client_id: str
    currency: str = "USD"
    intent: str = "CAPTURE"
    sdk_components: str = "buttons"


class MarketplacePayPalCreateOrderRequest(BaseModel):
    checkout_draft_id: int


class MarketplacePayPalCreateOrderResponse(BaseModel):
    paypal_order_id: str
    payment_attempt_id: int
    status: str


class MarketplacePayPalCaptureRequest(BaseModel):
    paypal_order_id: str


class MarketplacePayPalCaptureResponse(BaseModel):
    capture_status: str
    order: Optional["MarketplaceOrderResponse"] = None
    payment_attempt_id: Optional[int] = None
    provider_transaction_id: Optional[str] = None
    authorization_code: Optional[str] = None
    message: Optional[str] = None


class MarketplaceCheckoutDraftResponse(BaseModel):
    id: int
    company_id: int
    user_id: int
    status: str
    payment_method: Optional[str] = None
    currency: str
    total: Decimal
    snapshot_json: Optional[dict] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplacePaymentAttemptResponse(BaseModel):
    id: int
    order_id: Optional[int] = None
    checkout_draft_id: Optional[int] = None
    payment_method: str
    payment_provider: Optional[str] = None
    status: str
    amount: Decimal
    currency: str
    provider_order_id: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    client_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    config_version: Optional[str] = None
    environment_mode: Optional[str] = None
    payload_json: Optional[dict] = None
    retry_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplacePaymentMethodConfigUpdate(BaseModel):
    is_active: Optional[bool] = None
    environment_mode: Optional[str] = None
    description: Optional[str] = None
    public_text: Optional[str] = None
    support_email: Optional[str] = None
    token: Optional[str] = None
    store_id: Optional[str] = None
    return_url: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    webhook_id: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    account_number: Optional[str] = None
    iban_cci: Optional[str] = None
    instructions: Optional[str] = None


class MarketplacePaymentMethodResponse(BaseModel):
    id: int
    slug: str
    nombre: str
    descripcion: Optional[str] = None
    provider: str
    is_active: bool
    priority: int
    environment_mode: str
    readiness_status: str
    config_version: Optional[str] = None
    config_json: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceOrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    seller_user_id: Optional[int] = None
    product_title_snapshot: str
    product_type_snapshot: str
    source_type_snapshot: Optional[str] = None
    source_id_snapshot: Optional[int] = None
    delivered_entity_type: Optional[str] = None
    delivered_entity_id: Optional[int] = None
    price: Decimal

    model_config = ConfigDict(from_attributes=True)


class MarketplacePaymentTimelineEventResponse(BaseModel):
    event_type: str
    provider: Optional[str] = None
    event_origin: Optional[str] = None
    occurred_at: Optional[datetime] = None
    summary: str


class MarketplaceOrderResponse(BaseModel):
    id: int
    buyer_user_id: int
    total: Decimal
    commission_amount: Decimal
    seller_amount: Decimal
    currency: str
    status: str
    notes: Optional[str] = None
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    transfer_reference: Optional[str] = None
    transfer_date: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    authorization_code: Optional[str] = None
    fulfillment_status: Optional[str] = None
    delivered_items_count: int = 0
    pending_items_count: int = 0
    refund_window_open: bool = False
    refund_deadline_at: Optional[datetime] = None
    refundable_items_count: int = 0
    non_refundable_items_count: int = 0
    refund_scope: Optional[str] = None
    refund_status: Optional[str] = None
    refund_mode: Optional[str] = None
    refund_reason: Optional[str] = None
    refunded_at: Optional[str] = None
    refunded_by_user_id: Optional[int] = None
    refund_provider_resolution_status: Optional[str] = None
    refund_provider_resolution_note: Optional[str] = None
    refund_provider_resolution_at: Optional[str] = None
    payment_timeline: list[MarketplacePaymentTimelineEventResponse] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    items: list[MarketplaceOrderItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class MarketplaceAdminOrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int] = None
    seller_user_id: Optional[int] = None
    seller_name: Optional[str] = None
    product_title_snapshot: str
    product_type_snapshot: str
    source_type_snapshot: Optional[str] = None
    source_id_snapshot: Optional[int] = None
    delivered_entity_type: Optional[str] = None
    delivered_entity_id: Optional[int] = None
    price: Decimal


class MarketplaceAdminOrderSummaryResponse(BaseModel):
    id: int
    buyer_user_id: int
    buyer_name: Optional[str] = None
    total: Decimal
    commission_amount: Decimal
    seller_amount: Decimal
    currency: str
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items_count: int = 0


class MarketplaceAdminOrderDetailResponse(BaseModel):
    id: int
    buyer_user_id: int
    buyer_name: Optional[str] = None
    total: Decimal
    commission_amount: Decimal
    seller_amount: Decimal
    currency: str
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items: list[MarketplaceAdminOrderItemResponse] = Field(default_factory=list)


class MarketplaceAdminPaymentOrderSummaryResponse(BaseModel):
    id: int
    buyer_user_id: int
    buyer_name: Optional[str] = None
    buyer_company_name: Optional[str] = None
    total: Decimal
    currency: str
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    items_count: int = 0
    payment_method: Optional[str] = None
    payment_status: Optional[str] = None
    transfer_reference: Optional[str] = None
    transfer_date: Optional[str] = None
    provider_transaction_id: Optional[str] = None
    authorization_code: Optional[str] = None
    payment_reviewed_at: Optional[str] = None
    payment_reviewed_by_user_id: Optional[int] = None
    payment_reviewed_by_name: Optional[str] = None
    admin_notes: Optional[str] = None
    fulfillment_status: Optional[str] = None
    delivered_items_count: int = 0
    pending_items_count: int = 0
    payment_latest_event: Optional[str] = None
    payment_latest_event_at: Optional[datetime] = None
    refund_window_open: bool = False
    refund_deadline_at: Optional[datetime] = None
    refundable_items_count: int = 0
    non_refundable_items_count: int = 0
    refund_scope: Optional[str] = None
    refund_status: Optional[str] = None
    refund_mode: Optional[str] = None
    refund_reason: Optional[str] = None
    refunded_at: Optional[str] = None
    refunded_by_user_id: Optional[int] = None
    refunded_by_name: Optional[str] = None
    refund_provider_resolution_status: Optional[str] = None
    refund_provider_resolution_note: Optional[str] = None
    refund_provider_resolution_at: Optional[str] = None


class MarketplacePaymentHousekeepingSummaryResponse(BaseModel):
    generated_at: datetime
    stale_checkout_drafts_count: int = 0
    stale_bank_transfer_orders_count: int = 0
    expired_checkout_drafts_count: int = 0
    expired_bank_transfer_orders_count: int = 0
    open_checkout_drafts_count: int = 0
    awaiting_manual_validation_count: int = 0
    online_payment_waiting_count: int = 0
    orders_with_open_refund_window_count: int = 0


class MarketplaceOrderDownloadResponse(BaseModel):
    order_item_id: Optional[int] = None
    label: str
    description: Optional[str] = None
    report_type: Literal["apu", "presupuesto", "edt", "portal_excel"]
    entity_id: int
    format: Literal["xlsx", "pdf"] = "xlsx"
    variant: Optional[str] = None
    template_id: Optional[str] = None


class MarketplaceReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class MarketplaceReviewResponse(BaseModel):
    id: int
    product_id: int
    order_id: Optional[int] = None
    buyer_user_id: int
    buyer_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MarketplaceBuyerAssetResponse(BaseModel):
    origin_id: int
    entity_type: str
    entity_id: int
    entity_title: str
    ownership_kind: str
    origin_kind: str
    origin_label: Optional[str] = None
    source_entity_type: Optional[str] = None
    source_entity_id: Optional[int] = None
    source_entity_title: Optional[str] = None
    marketplace_product_id: Optional[int] = None
    marketplace_order_id: Optional[int] = None
    marketplace_order_item_id: Optional[int] = None
    metadata_json: Optional[dict] = None
    usage_policy: dict = Field(default_factory=dict)
    created_at: Optional[datetime] = None


MarketplacePayPhoneConfirmResponse.model_rebuild()
MarketplacePayPalCaptureResponse.model_rebuild()
