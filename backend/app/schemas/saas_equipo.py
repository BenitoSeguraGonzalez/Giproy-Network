from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SaasEquipoLimitsResponse(BaseModel):
    empresa_id: int
    enabled: bool
    base_slots: int
    pack_slots: int
    included_slots: int
    total_slots: int
    used_slots: int
    available_slots: int
    effective_right_codes: list[str] = Field(default_factory=list)
    purchased_right_codes: list[str] = Field(default_factory=list)
    source: str


class SaasEquipoSeatCreate(BaseModel):
    empresa_id: Optional[int] = None
    owner_user_id: Optional[int] = None
    collaborator_user_id: Optional[int] = None
    invited_email: Optional[str] = Field(default=None, max_length=255)
    source_right_code: Optional[str] = Field(default=None, max_length=80)
    metadata: Optional[dict] = None


class SaasEquipoSeatRelease(BaseModel):
    empresa_id: Optional[int] = None
    force: bool = False
    reason: Optional[str] = Field(default=None, max_length=500)


class SaasEquipoSeatResponse(BaseModel):
    id: int
    empresa_id: int
    owner_user_id: int
    owner_name: Optional[str] = None
    collaborator_user_id: Optional[int] = None
    collaborator_name: Optional[str] = None
    invited_email: Optional[str] = None
    status: str
    source_right_code: Optional[str] = None
    assigned_at: datetime
    released_at: Optional[datetime] = None
    forced_by_user_id: Optional[int] = None
    audit_reason: Optional[str] = None
    metadata_json: Optional[dict] = None


class SaasEquipoListResponse(BaseModel):
    empresa_id: int
    limits: SaasEquipoLimitsResponse
    items: list[SaasEquipoSeatResponse] = Field(default_factory=list)


class SaasEquipoEdtAssignmentCreate(BaseModel):
    empresa_id: Optional[int] = None
    seat_id: int
    proyecto_id: int
    edt_id: int
    modulo: str = Field(default="presupuestos", max_length=50)
    metadata: Optional[dict] = None


class SaasEquipoEdtAssignmentResponse(BaseModel):
    id: int
    seat_id: int
    empresa_id: int
    proyecto_id: int
    edt_id: int
    usuario_id: int
    proyecto_asignacion_id: Optional[int] = None
    modulo: str
    status: str
    assigned_by_user_id: Optional[int] = None
    revoked_by_user_id: Optional[int] = None
    assigned_at: datetime
    revoked_at: Optional[datetime] = None
    metadata_json: Optional[dict] = None


class SaasEquipoAssignmentRevoke(BaseModel):
    empresa_id: Optional[int] = None
    reason: Optional[str] = Field(default=None, max_length=500)


class SaasEquipoLockCreate(BaseModel):
    empresa_id: Optional[int] = None
    proyecto_id: int
    edt_id: int
    presupuesto_linea_id: Optional[int] = None
    reason: Optional[str] = Field(default=None, max_length=500)
    metadata: Optional[dict] = None


class SaasEquipoLockRelease(BaseModel):
    empresa_id: Optional[int] = None


class SaasEquipoLockResponse(BaseModel):
    id: int
    empresa_id: int
    proyecto_id: int
    edt_id: int
    presupuesto_linea_id: Optional[int] = None
    locked_by_user_id: int
    status: str
    reason: Optional[str] = None
    locked_at: datetime
    released_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    metadata_json: Optional[dict] = None


class SaasEquipoProposalCreate(BaseModel):
    empresa_id: Optional[int] = None
    proyecto_id: int
    edt_id: int
    presupuesto_linea_id: Optional[int] = None
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    proposed_changes: dict
    metadata: Optional[dict] = None


class SaasEquipoProposalReview(BaseModel):
    empresa_id: Optional[int] = None
    approve: bool
    notes: Optional[str] = None


class SaasEquipoProposalResponse(BaseModel):
    id: int
    empresa_id: int
    proyecto_id: int
    edt_id: int
    presupuesto_id: Optional[int] = None
    presupuesto_linea_id: Optional[int] = None
    submitted_by_user_id: Optional[int] = None
    reviewed_by_user_id: Optional[int] = None
    status: str
    title: str
    description: Optional[str] = None
    proposed_changes: dict
    review_notes: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None
    metadata_json: Optional[dict] = None


class SaasEquipoOperationsResponse(BaseModel):
    empresa_id: int
    limits: SaasEquipoLimitsResponse
    seats: list[SaasEquipoSeatResponse] = Field(default_factory=list)
    assignments: list[SaasEquipoEdtAssignmentResponse] = Field(default_factory=list)
    locks: list[SaasEquipoLockResponse] = Field(default_factory=list)
    proposals: list[SaasEquipoProposalResponse] = Field(default_factory=list)


class SaasEquipoContextUser(BaseModel):
    id: int
    nombre_completo: str
    email: str
    rol: str
    activo: bool


class SaasEquipoContextProject(BaseModel):
    id: int
    nombre: str
    codigo: Optional[str] = None
    estado: Optional[str] = None


class SaasEquipoContextEdtNode(BaseModel):
    id: int
    proyecto_id: int
    parent_id: Optional[int] = None
    codigo: str
    nombre: Optional[str] = None
    tipo_nodo: str


class SaasEquipoContextResponse(BaseModel):
    empresa_id: int
    proyecto_id: Optional[int] = None
    users: list[SaasEquipoContextUser] = Field(default_factory=list)
    projects: list[SaasEquipoContextProject] = Field(default_factory=list)
    edt_nodes: list[SaasEquipoContextEdtNode] = Field(default_factory=list)


class SaasEquipoAdminCompanySummary(BaseModel):
    empresa_id: int
    empresa_nombre: str
    enabled: bool
    total_slots: int
    used_slots: int
    available_slots: int
    active_seats: int
    active_assignments: int
    active_locks: int
    pending_proposals: int


class SaasEquipoAdminSummaryResponse(BaseModel):
    totals: dict = Field(default_factory=dict)
    events: dict = Field(default_factory=dict)
    companies: list[SaasEquipoAdminCompanySummary] = Field(default_factory=list)
