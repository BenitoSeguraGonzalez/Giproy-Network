from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CommunityMentionResponse(BaseModel):
    user_id: int
    handle: str
    display_name: Optional[str] = None


class CommunityAttachmentResponse(BaseModel):
    id: int
    file_name: str
    public_url: str
    content_type: str
    size_bytes: int
    expires_at: Optional[datetime] = None
    created_at: datetime


class CommunityBulkActionResponse(BaseModel):
    updated_count: int


class CommunityBootstrapResponse(BaseModel):
    active_company_id: Optional[int] = None
    active_company_name: Optional[str] = None
    is_superadmin: bool = False
    can_manage_topics: bool = False
    can_moderate_public: bool = False
    can_moderate_internal: bool = False
    available_surfaces: list[str] = Field(default_factory=list)


class CommunityPostCreate(BaseModel):
    scope: str = Field(..., pattern="^(publico|interno_empresa)$")
    topic_id: Optional[int] = None
    title: str = Field(..., min_length=3, max_length=255)
    body: str = Field(..., min_length=3)
    allow_replies: bool = True


class CommunityReplyCreate(BaseModel):
    body: str = Field(..., min_length=1)
    parent_reply_id: Optional[int] = None


class CommunityPostUpdateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    body: str = Field(..., min_length=3)


class CommunityReplyUpdateRequest(BaseModel):
    body: str = Field(..., min_length=1)


class CommunityPostResponse(BaseModel):
    id: int
    scope: str
    topic_id: Optional[int] = None
    topic_name: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    status: str
    title: str
    body: str
    allow_replies: bool
    is_pinned: bool
    author_user_id: int
    author_name: Optional[str] = None
    company_name: Optional[str] = None
    target_company_id: Optional[int] = None
    target_company_name: Optional[str] = None
    replies_count: int = 0
    can_edit: bool = False
    can_delete: bool = False
    mentions: list[CommunityMentionResponse] = Field(default_factory=list)
    attachments: list[CommunityAttachmentResponse] = Field(default_factory=list)
    created_at: datetime
    last_activity_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunityPostModerationRequest(BaseModel):
    action: str = Field(
        ...,
        pattern="^(ocultar|cerrar|publicar|fijar|desfijar|eliminar)$",
    )


class CommunityReplyResponse(BaseModel):
    id: int
    post_id: int
    parent_reply_id: Optional[int] = None
    author_user_id: int
    author_name: Optional[str] = None
    body: str
    status: str
    can_edit: bool = False
    can_delete: bool = False
    mentions: list[CommunityMentionResponse] = Field(default_factory=list)
    attachments: list[CommunityAttachmentResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunityDmSendRequest(BaseModel):
    recipient_user_id: int
    body: str = Field(..., min_length=1)


class CommunityDmMessageResponse(BaseModel):
    id: int
    thread_id: int
    author_user_id: int
    author_name: Optional[str] = None
    body: str
    mentions: list[CommunityMentionResponse] = Field(default_factory=list)
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunityDmThreadResponse(BaseModel):
    id: int
    counterpart_user_id: int
    counterpart_name: Optional[str] = None
    counterpart_company_name: Optional[str] = None
    last_message_preview: Optional[str] = None
    last_message_at: Optional[datetime] = None
    messages_count: int = 0
    blocked_at: Optional[datetime] = None
    blocked_by_user_id: Optional[int] = None
    blocked_by_name: Optional[str] = None
    blocked_by_me: bool = False

    class Config:
        from_attributes = True


class CommunityVisibleUserResponse(BaseModel):
    id: int
    nombre_completo: str
    email: str
    empresa_id: int
    empresa_nombre: Optional[str] = None
    rol: str
    community_handle: str
    last_active_at: Optional[datetime] = None
    community_state: str = "activo"
    active_sanctions: list[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class CommunitySanctionCreateRequest(BaseModel):
    target_user_id: int
    sanction_type: str = Field(
        ...,
        pattern="^(bloqueo_publico|bloqueo_interno|bloqueo_dm|bloqueo_comunidad)$",
    )
    scope: str = Field(
        ...,
        pattern="^(publico|interno_empresa|mensajes_directos|global)$",
    )
    reason: str = Field(..., min_length=3)
    target_empresa_id: Optional[int] = None
    expires_at: Optional[datetime] = None


class CommunitySanctionResponse(BaseModel):
    id: int
    target_user_id: int
    target_user_name: Optional[str] = None
    issued_by_user_id: Optional[int] = None
    issued_by_name: Optional[str] = None
    sanction_type: str
    scope: str
    target_empresa_id: Optional[int] = None
    target_empresa_name: Optional[str] = None
    reason: Optional[str] = None
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunitySanctionAppealCreateRequest(BaseModel):
    sanction_id: int
    reason: str = Field(..., min_length=10)


class CommunitySanctionAppealResolveRequest(BaseModel):
    status: str = Field(..., pattern="^(aceptada|rechazada)$")
    resolution_note: str = Field(..., min_length=3)


class CommunitySanctionAppealResponse(BaseModel):
    id: int
    sanction_id: int
    sanction_type: Optional[str] = None
    sanction_scope: Optional[str] = None
    sanction_target_user_id: Optional[int] = None
    sanction_target_user_name: Optional[str] = None
    appellant_user_id: int
    appellant_user_name: Optional[str] = None
    reviewed_by_user_id: Optional[int] = None
    reviewed_by_user_name: Optional[str] = None
    status: str
    reason: str
    resolution_note: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CommunityTopicCreateRequest(BaseModel):
    scope: str = Field(..., pattern="^(publico|interno_empresa)$")
    category_id: Optional[int] = None
    nombre: str = Field(..., min_length=3, max_length=160)
    descripcion: Optional[str] = None
    is_restricted: bool = False
    user_ids: list[int] = Field(default_factory=list)


class CommunityTopicUpdateRequest(BaseModel):
    category_id: Optional[int] = None
    nombre: Optional[str] = Field(default=None, min_length=3, max_length=160)
    descripcion: Optional[str] = None
    is_restricted: Optional[bool] = None
    is_active: Optional[bool] = None
    user_ids: Optional[list[int]] = None


class CommunityTopicResponse(BaseModel):
    id: int
    scope: str
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    is_restricted: bool
    is_active: bool
    target_empresa_id: Optional[int] = None
    target_empresa_name: Optional[str] = None
    member_count: int = 0
    member_user_ids: list[int] = Field(default_factory=list)
    can_access: bool = True
    is_following: bool = False
    followed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityCategoryCreateRequest(BaseModel):
    scope: str = Field(..., pattern="^(publico|interno_empresa)$")
    nombre: str = Field(..., min_length=3, max_length=160)
    descripcion: Optional[str] = None
    orden: int = 0


class CommunityCategoryUpdateRequest(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=3, max_length=160)
    descripcion: Optional[str] = None
    orden: Optional[int] = None
    is_active: Optional[bool] = None


class CommunityCategoryResponse(BaseModel):
    id: int
    scope: str
    nombre: str
    descripcion: Optional[str] = None
    orden: int = 0
    is_active: bool
    target_empresa_id: Optional[int] = None
    target_empresa_name: Optional[str] = None
    topic_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CommunityInfractionResponse(BaseModel):
    id: int
    target_user_id: int
    target_user_name: Optional[str] = None
    scope: str
    infraction_type: str
    content_type: str
    content_excerpt: Optional[str] = None
    detected_link: Optional[str] = None
    target_empresa_id: Optional[int] = None
    target_empresa_name: Optional[str] = None
    triggered_sanction_id: Optional[int] = None
    created_at: datetime


class CommunityAdminAlertResponse(BaseModel):
    id: int
    alert_type: str
    title: str
    message: str
    target_empresa_id: Optional[int] = None
    target_empresa_name: Optional[str] = None
    target_user_id: Optional[int] = None
    target_user_name: Optional[str] = None
    infraction_id: Optional[int] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
