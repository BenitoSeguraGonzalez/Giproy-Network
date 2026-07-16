from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SaasConectaSlotCreate(BaseModel):
    empresa_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    connected_user_id: Optional[int] = None
    invited_email: Optional[str] = Field(default=None, max_length=255)
    source_right_code: Optional[str] = Field(default=None, max_length=80)
    metadata: Optional[dict] = None


class SaasConectaSlotRelease(BaseModel):
    empresa_id: Optional[int] = None
    force: bool = False
    reason: Optional[str] = Field(default=None, max_length=500)


class SaasConectaLimitsResponse(BaseModel):
    empresa_id: int
    enabled: bool
    base_slots: int
    pack_slots: int
    total_slots: int
    used_slots: int
    available_slots: int
    effective_right_codes: list[str] = Field(default_factory=list)
    source: str


class SaasConectaSlotResponse(BaseModel):
    id: int
    empresa_id: int
    owner_user_id: int
    owner_name: Optional[str] = None
    connected_user_id: Optional[int] = None
    connected_user_name: Optional[str] = None
    invited_email: Optional[str] = None
    status: str
    source_right_code: Optional[str] = None
    assigned_at: datetime
    released_at: Optional[datetime] = None
    last_reassignment_at: Optional[datetime] = None
    forced_by_user_id: Optional[int] = None
    audit_reason: Optional[str] = None
    metadata_json: Optional[dict] = None


class SaasConectaListResponse(BaseModel):
    empresa_id: int
    limits: SaasConectaLimitsResponse
    items: list[SaasConectaSlotResponse] = Field(default_factory=list)


class SaasConectaAdminCompanySummary(BaseModel):
    empresa_id: int
    empresa_nombre: str
    enabled: bool
    total_slots: int
    used_slots: int
    available_slots: int
    active_slots: int
    released_slots: int
    locked_active_slots: int
    forced_releases: int


class SaasConectaAdminSummaryResponse(BaseModel):
    totals: dict = Field(default_factory=dict)
    events: dict = Field(default_factory=dict)
    companies: list[SaasConectaAdminCompanySummary] = Field(default_factory=list)
