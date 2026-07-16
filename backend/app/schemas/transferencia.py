from typing import Literal

from pydantic import BaseModel, Field


TRANSFER_CONTRACT_VERSION = "transfer-v1"

TRANSFER_SHIPMENT_STATES = [
    "borrador_preflight",
    "enviado",
    "recepcionado",
    "bloqueado_marketplace",
    "listo_para_importar",
    "importado",
    "rechazado",
    "cancelado",
    "expirado",
    "fallo_importacion",
]

TRANSFER_ASSET_TYPES = ["proyecto", "base_trabajo"]
TRANSFER_AUTHORIZED_ROLES = ["administrador", "superadministrador"]
TRANSFER_BLOCKED_LICENSES = ["EXPRESS", "TESTER", "ACADEMIC", "TRAINING"]
TRANSFER_RECIPIENT_KINDS = ["fixed", "additional"]
TRANSFER_ALLOWED_LICENSES = ["STANDARD", "PROFESSIONAL"]
TRANSFER_TRAY_DIRECTIONS = ["todos", "entrada", "salida"]

TRANSFER_STATE_PRESENTATION = {
    "borrador_preflight": {"label": "Borrador", "color": "neutral", "recoverable": False},
    "enviado": {"label": "Enviado", "color": "blue", "recoverable": False},
    "recepcionado": {"label": "Recepcionado", "color": "cyan", "recoverable": False},
    "bloqueado_marketplace": {"label": "Bloqueado Marketplace", "color": "amber", "recoverable": True},
    "listo_para_importar": {"label": "Listo para importar", "color": "green", "recoverable": False},
    "importado": {"label": "Importado", "color": "emerald", "recoverable": False},
    "rechazado": {"label": "Rechazado", "color": "rose", "recoverable": False},
    "cancelado": {"label": "Cancelado", "color": "slate", "recoverable": False},
    "expirado": {"label": "Expirado", "color": "orange", "recoverable": False},
    "fallo_importacion": {"label": "Fallo importacion", "color": "red", "recoverable": True},
}


class TransferStateContract(BaseModel):
    code: str
    shared_by_sender_receiver: bool = True
    recoverable: bool = False


class TransferFeatureContract(BaseModel):
    dry_run_preflight: bool = True
    snapshot_hash_required: bool = True
    transfer_adapter_required: bool = True
    marketplace_full_purchase_required: bool = True
    import_idempotency_required: bool = True
    blocked_license_guard_required: bool = True


class TransferContractResponse(BaseModel):
    contract_version: str = TRANSFER_CONTRACT_VERSION
    authorized_roles: list[str] = Field(default_factory=lambda: list(TRANSFER_AUTHORIZED_ROLES))
    allowed_licenses: list[str] = Field(default_factory=lambda: list(TRANSFER_ALLOWED_LICENSES))
    blocked_licenses: list[str] = Field(default_factory=lambda: list(TRANSFER_BLOCKED_LICENSES))
    asset_types: list[Literal["proyecto", "base_trabajo"]] = Field(default_factory=lambda: list(TRANSFER_ASSET_TYPES))
    recipient_kinds: list[Literal["fixed", "additional"]] = Field(default_factory=lambda: list(TRANSFER_RECIPIENT_KINDS))
    states: list[TransferStateContract]
    features: TransferFeatureContract = Field(default_factory=TransferFeatureContract)


class TransferPublicCodeResponse(BaseModel):
    public_code: str
    status: str
    scope: str = "company"
    empresa_id: int | None = None


class TransferResolveCodeRequest(BaseModel):
    public_code: str = Field(..., min_length=3, max_length=20)


class TransferRecipientCompanyPreview(BaseModel):
    company_display_name: str
    company_name: str
    company_alias: str | None = None
    status: str = "resolved"


class TransferRecipientCreateRequest(BaseModel):
    public_code: str = Field(..., min_length=3, max_length=20)
    confirm: bool = False
    confirmed_display_name: str | None = Field(default=None, max_length=255)


class TransferRecipientResponse(BaseModel):
    id: int
    recipient_kind: Literal["fixed", "additional"]
    status: str
    company_display_name: str
    company_name: str
    company_alias: str | None = None
    expires_at: str | None = None


class TransferRecipientsListResponse(BaseModel):
    fixed_limit: int = 3
    fixed_used: int
    fixed_available: int = 0
    additional_limit: int = 0
    additional_used: int = 0
    additional_available: int = 0
    additional_active: int
    items: list[TransferRecipientResponse]


class TransferSanitizeCodesResponse(BaseModel):
    scanned_admin_users: int
    created_codes: int
    existing_codes: int


class TransferCompanySanitizeCodesResponse(BaseModel):
    scanned_companies: int
    created_codes: int
    existing_codes: int


class TransferPreflightRequest(BaseModel):
    recipient_id: int
    asset_type: Literal["proyecto", "base_trabajo"]
    asset_id: int
    description: str | None = Field(default=None, max_length=500)
    dry_run: bool = True
    marketplace_confirmed: bool = False


class TransferMarketplaceRequirementPreview(BaseModel):
    product_id: int | None = None
    product_title: str
    status: str = "pending_purchase"
    required: bool = True
    currency: str = "USD"
    price: str | None = None


class TransferPreflightResponse(BaseModel):
    dry_run: bool
    exportable: bool
    asset_type: Literal["proyecto", "base_trabajo"]
    asset_id: int
    asset_name: str
    description: str
    recipient_id: int
    recipient_company_display_name: str
    contract_version: str
    snapshot_hash: str
    content_summary: dict
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    marketplace_blocked: bool = False
    requires_marketplace_confirmation: bool = False
    marketplace_requirements: list[TransferMarketplaceRequirementPreview] = Field(default_factory=list)
    excluded_sections: list[str] = Field(default_factory=list)
    shipment_id: int | None = None


class TransferShipmentCreateRequest(TransferPreflightRequest):
    dry_run: bool = False


class TransferShipmentResponse(BaseModel):
    id: int
    status: str
    asset_type: str
    asset_id: int
    description: str
    contract_version: str
    snapshot_hash: str | None = None
    marketplace_blocked: bool = False
    recipient_company_display_name: str
    created_at: str | None = None
    sent_at: str | None = None


class TransferCancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500)


class TransferRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


class TransferImportResponse(BaseModel):
    shipment_id: int
    status: str
    import_status: str
    imported_entity_type: str | None = None
    imported_entity_id: int | None = None
    idempotent: bool = False
    attempts_count: int = 0
    last_error: str | None = None


class TransferMarketplaceRequirementStatus(BaseModel):
    requirement_id: int
    product_id: int | None = None
    product_title: str
    required: bool = True
    status: str
    purchased: bool = False
    current_price: str | None = None
    currency: str = "USD"
    purchase_url: str | None = None
    receiver_order_item_id: int | None = None


class TransferMarketplaceRequirementsResponse(BaseModel):
    shipment_id: int
    receiver_empresa_id: int
    all_required_purchased: bool
    can_import_or_use: bool
    total_pending_price: str
    currency: str = "USD"
    requirements: list[TransferMarketplaceRequirementStatus]
    checkout_items: list[dict] = Field(default_factory=list)
    help_context: dict = Field(default_factory=dict)


class TransferStateOptionResponse(BaseModel):
    code: str
    label: str
    color: str
    recoverable: bool = False


class TransferTrayItemResponse(BaseModel):
    id: int
    direction: Literal["entrada", "salida"]
    status: str
    status_label: str
    status_color: str
    status_recoverable: bool = False
    asset_type: str
    asset_id: int
    asset_name: str | None = None
    description: str
    company_display_name: str
    company_name: str
    company_alias: str | None = None
    sender_company_display_name: str
    sender_company_name: str
    sender_company_alias: str | None = None
    receiver_company_display_name: str
    receiver_company_name: str
    receiver_company_alias: str | None = None
    marketplace_blocked: bool = False
    created_at: str | None = None
    sent_at: str | None = None
    received_at: str | None = None
    opened_at: str | None = None
    imported_at: str | None = None
    rejected_at: str | None = None
    cancelled_at: str | None = None
    expires_at: str | None = None
    timeline: list[dict] = Field(default_factory=list)


class TransferTrayMetricsResponse(BaseModel):
    enviados: int = 0
    recibidos: int = 0
    nuevos: int = 0
    bloqueados: int = 0
    listos: int = 0
    importados: int = 0
    rechazados: int = 0
    cancelados: int = 0
    expirados: int = 0
    fallos_importacion: int = 0


class TransferTrayResponse(BaseModel):
    direction: Literal["todos", "entrada", "salida"]
    status: str | None = None
    q: str | None = None
    date_from: str
    date_to: str
    total: int
    limit: int
    offset: int
    states: list[TransferStateOptionResponse]
    metrics: TransferTrayMetricsResponse
    items: list[TransferTrayItemResponse]


class TransferTimelineResponse(BaseModel):
    shipment_id: int
    items: list[dict] = Field(default_factory=list)
