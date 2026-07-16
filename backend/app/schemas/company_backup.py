from pydantic import BaseModel, Field


COMPANY_BACKUP_FORMAT_VERSION = "company-full-backup-v1"
COMPANY_BACKUP_SCOPE = "company-full-1to1"
COMPANY_BACKUP_AUTHORIZED_ROLES = ["administrador", "superadministrador"]
COMPANY_BACKUP_INTERNAL_RETENTION_DAYS = 30
COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS = 7
COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE = "CONFIRMO IMPORTACION"


class CompanyBackupFeatureContract(BaseModel):
    dry_run_preflight: bool = True
    full_company_scope_required: bool = True
    same_company_restore_required: bool = True
    encrypted_archive_required: bool = True
    pre_restore_internal_backup_required: bool = True
    final_confirmation_required: bool = True
    triple_confirmation_required: bool = False
    user_email_confirmation_required: bool = False
    referenced_files_must_exist: bool = True
    includes_deleted_items: bool = True
    includes_files: bool = True
    includes_community: bool = True
    marketplace_purchases_preserved: bool = True
    marketplace_orphan_seller_items_audited_only: bool = True


class CompanyBackupContractResponse(BaseModel):
    contract_version: str = COMPANY_BACKUP_FORMAT_VERSION
    scope: str = COMPANY_BACKUP_SCOPE
    authorized_roles: list[str] = Field(default_factory=lambda: list(COMPANY_BACKUP_AUTHORIZED_ROLES))
    internal_retention_days: int = COMPANY_BACKUP_INTERNAL_RETENTION_DAYS
    restored_internal_cleanup_days: int = COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS
    destructive_confirmation_phrase: str = COMPANY_BACKUP_DESTRUCTIVE_CONFIRMATION_PHRASE
    features: CompanyBackupFeatureContract = Field(default_factory=CompanyBackupFeatureContract)


class CompanyBackupPreflightRequest(BaseModel):
    empresa_id: int | None = None
    dry_run: bool = True


class CompanyBackupFileReference(BaseModel):
    entity_type: str
    entity_id: str
    field: str
    path: str
    exists: bool
    size_bytes: int | None = None
    sha256: str | None = None
    blocker: str | None = None


class CompanyBackupCompanyIdentity(BaseModel):
    empresa_id: int
    nombre: str
    alias: str | None = None
    codigo: str | None = None
    ruc: str | None = None
    fiscal_identity: str | None = None
    pais: str | None = None
    fingerprint: str


class CompanyBackupMarketplaceImpact(BaseModel):
    seller_products_current: int = 0
    purchases_preserved: int = 0
    products_not_in_backup_policy: str = "cancel_despublicar_auditoria_superadmin"


class CompanyBackupPreflightResponse(BaseModel):
    dry_run: bool = True
    operation_id: int | None = None
    exportable: bool
    scope: str = COMPANY_BACKUP_SCOPE
    contract_version: str = COMPANY_BACKUP_FORMAT_VERSION
    empresa: CompanyBackupCompanyIdentity
    counts: dict[str, int]
    file_references: list[CompanyBackupFileReference] = Field(default_factory=list)
    marketplace_impact: CompanyBackupMarketplaceImpact
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_allowed_action: str


class CompanyBackupRestorePreflightResponse(BaseModel):
    dry_run: bool = True
    operation_id: int | None = None
    restorable: bool
    destructive_allowed: bool = False
    scope: str = COMPANY_BACKUP_SCOPE
    contract_version: str = COMPANY_BACKUP_FORMAT_VERSION
    same_company: bool
    fiscal_identity_match: bool = False
    empresa: CompanyBackupCompanyIdentity
    backup_empresa: CompanyBackupCompanyIdentity | None = None
    backup_created_at: str | None = None
    backup_created_by_email: str | None = None
    backup_hash: str | None = None
    current_counts: dict[str, int] = Field(default_factory=dict)
    backup_counts: dict[str, int] = Field(default_factory=dict)
    backup_table_counts: dict[str, int] = Field(default_factory=dict)
    file_count: int = 0
    total_file_size: int = 0
    marketplace_impact: CompanyBackupMarketplaceImpact
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    required_confirmations: list[str] = Field(default_factory=list)
    next_allowed_action: str


class CompanyBackupInternalArtifactSummary(BaseModel):
    id: int
    empresa_id: int
    status: str
    reason: str
    backup_hash: str
    backup_format_version: str
    size_bytes: int
    created_by_email: str | None = None
    created_by_role: str | None = None
    created_at: str | None = None
    expires_at: str | None = None
    cleanup_after: str | None = None
    restored_at: str | None = None
    counts: dict[str, int] = Field(default_factory=dict)
    manifest_summary: dict = Field(default_factory=dict)


class CompanyBackupPrepareRestoreResponse(BaseModel):
    restore_preflight: CompanyBackupRestorePreflightResponse
    internal_safety_backup: CompanyBackupInternalArtifactSummary
    destructive_allowed: bool = False
    next_allowed_action: str


class CompanyBackupRestoreExecuteResponse(BaseModel):
    operation_id: int
    empresa: CompanyBackupCompanyIdentity
    backup_hash: str
    internal_safety_backup: CompanyBackupInternalArtifactSummary
    restored_counts: dict[str, int] = Field(default_factory=dict)
    deleted_counts: dict[str, int] = Field(default_factory=dict)
    inserted_counts: dict[str, int] = Field(default_factory=dict)
    updated_counts: dict[str, int] = Field(default_factory=dict)
    marketplace_impact: CompanyBackupMarketplaceImpact
    warnings: list[str] = Field(default_factory=list)
    destructive_completed: bool = True
    next_allowed_action: str = "restore_completed"


class CompanyBackupInternalArtifactListResponse(BaseModel):
    empresa: CompanyBackupCompanyIdentity
    retention_days: int = COMPANY_BACKUP_INTERNAL_RETENTION_DAYS
    restored_cleanup_days: int = COMPANY_BACKUP_RESTORED_INTERNAL_CLEANUP_DAYS
    items: list[CompanyBackupInternalArtifactSummary] = Field(default_factory=list)


class CompanyBackupCrossCompanyRestoreAttemptSummary(BaseModel):
    attempted_empresa: CompanyBackupCompanyIdentity
    backup_empresa: CompanyBackupCompanyIdentity | None = None
    attempts: int
    last_attempt_at: str | None = None
    last_requested_by_email: str | None = None
    last_backup_hash: str | None = None
    operation_ids: list[int] = Field(default_factory=list)


class CompanyBackupCrossCompanyRestoreAttemptsResponse(BaseModel):
    items: list[CompanyBackupCrossCompanyRestoreAttemptSummary] = Field(default_factory=list)


class CompanyBackupOffboardingPreflightResponse(BaseModel):
    empresa: CompanyBackupCompanyIdentity
    exportable: bool
    counts: dict[str, int] = Field(default_factory=dict)
    purge_counts: dict[str, int] = Field(default_factory=dict)
    file_references: list[CompanyBackupFileReference] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    blockers: list[str] = Field(default_factory=list)
    next_allowed_action: str


class CompanyBackupOffboardingExecuteResponse(BaseModel):
    operation_id: int
    empresa: CompanyBackupCompanyIdentity
    backup_hash: str
    purged_counts: dict = Field(default_factory=dict)
    lifecycle_status: str = "baja_purgada"
    warnings: list[str] = Field(default_factory=list)
    next_allowed_action: str = "company_offboarded"
