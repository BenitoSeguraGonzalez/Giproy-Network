import re
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.community import (
    CommunityAdminAlert,
    CommunityAttachment,
    CommunityCategory,
    CommunityDmMessage,
    CommunityDmThread,
    CommunityInfraction,
    CommunityPost,
    CommunityPostReply,
    CommunitySanction,
    CommunitySanctionAppeal,
    CommunityTopic,
    CommunityTopicFollow,
    CommunityTopicMember,
)
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.community import (
    CommunityAttachmentResponse,
    CommunityBootstrapResponse,
    CommunityBulkActionResponse,
    CommunityAdminAlertResponse,
    CommunityCategoryCreateRequest,
    CommunityCategoryResponse,
    CommunityCategoryUpdateRequest,
    CommunityDmMessageResponse,
    CommunityDmSendRequest,
    CommunityDmThreadResponse,
    CommunityInfractionResponse,
    CommunityMentionResponse,
    CommunityPostCreate,
    CommunityPostUpdateRequest,
    CommunityPostModerationRequest,
    CommunityPostResponse,
    CommunityReplyCreate,
    CommunityReplyUpdateRequest,
    CommunityReplyResponse,
    CommunitySanctionCreateRequest,
    CommunitySanctionAppealCreateRequest,
    CommunitySanctionAppealResolveRequest,
    CommunitySanctionAppealResponse,
    CommunitySanctionResponse,
    CommunityTopicCreateRequest,
    CommunityTopicResponse,
    CommunityTopicUpdateRequest,
    CommunityVisibleUserResponse,
)
from app.services.license import license_service
from app.services.audit_event import record_audit_event

router = APIRouter()
LINK_PATTERN = re.compile(r"((https?://|www\.)\S+)", re.IGNORECASE)
OBFUSCATED_PROTOCOL_PATTERN = re.compile(r"\b(?:https?|hxxps?|hxxp|hpps?|ttps?)\s*[:;]?\s*(?:\\\\|//|/|\\)\s*(?:\\\\|//|/|\\)?\s*\S+", re.IGNORECASE)
OBFUSCATED_DOMAIN_PATTERN = re.compile(
    r"\b(?:www\s*(?:\.|\[\.\]|\(dot\)|\sdot\s)|[a-z0-9-]+\s*(?:\.|\[\.\]|\(dot\)|\sdot\s))+[a-z]{2,24}\b",
    re.IGNORECASE,
)
MENTION_PATTERN = re.compile(r"(?<![\w])@([a-z0-9._-]{2,50})", re.IGNORECASE)
COMMUNITY_ONLY_ROLE = "usuario_comunidad"
AUTHOR_EDIT_WINDOW_MINUTES = 30
COMMUNITY_INTERNAL_ATTACHMENT_RETENTION_DAYS = 30
COMMUNITY_UPLOAD_DIR = os.path.join("uploads", "community")


def _is_superadmin(user: Usuario) -> bool:
    return (user.rol or "").lower() == "superadministrador"


def _is_company_admin(user: Usuario) -> bool:
    return (user.rol or "").lower() == "administrador"


def _is_company_moderator(user: Usuario) -> bool:
    return (user.rol or "").lower() in {"administrador", "superadministrador"}


def _resolve_active_company_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    if _is_superadmin(current_user) and empresa_id:
        return int(empresa_id)
    return int(current_user.empresa_id)


def _normalize_role(role: Optional[str]) -> str:
    return (role or "").strip().lower()


def _detect_first_link(text: str) -> Optional[str]:
    raw_text = text or ""
    match = LINK_PATTERN.search(raw_text)
    if not match:
        normalized_text = raw_text.lower()
        normalized_text = normalized_text.replace("[.]", ".").replace("(dot)", ".")
        normalized_text = re.sub(r"\sdot\s", ".", normalized_text, flags=re.IGNORECASE)
        normalized_text = normalized_text.replace("\\\\", "//").replace("\\", "/")

        match = OBFUSCATED_PROTOCOL_PATTERN.search(normalized_text)
        if match:
            return match.group(0).strip()

        match = OBFUSCATED_DOMAIN_PATTERN.search(normalized_text)
        if match and ("." in match.group(0) or "www" in match.group(0)):
            return match.group(0).strip()
        return None
    return match.group(1)


def _sanitize_handle_seed(value: Optional[str]) -> str:
    normalized = re.sub(r"[^a-z0-9._-]+", "", (value or "").strip().lower())
    return normalized.strip("._-")


def _community_user_handle(user: Usuario) -> str:
    candidates = [
        user.alias,
        (user.email or "").split("@", 1)[0],
        user.nombre_completo,
        f"usuario-{user.id}",
    ]
    for candidate in candidates:
        handle = _sanitize_handle_seed(candidate)
        if handle:
            return handle
    return f"usuario-{user.id}"


def _serialize_mention(user: Usuario):
    return CommunityMentionResponse(
        user_id=user.id,
        handle=_community_user_handle(user),
        display_name=user.nombre_completo,
    )


def _extract_mention_handles(*texts: Optional[str]) -> list[str]:
    handles: list[str] = []
    seen: set[str] = set()
    for text in texts:
        for match in MENTION_PATTERN.findall(text or ""):
            handle = _sanitize_handle_seed(match)
            if handle and handle not in seen:
                seen.add(handle)
                handles.append(handle)
    return handles


def _resolve_contextual_mentions(
    db: Session,
    *,
    company_id: Optional[int],
    scope: str,
    topic: Optional[CommunityTopic] = None,
    title: Optional[str] = None,
    body: Optional[str] = None,
) -> list:
    handles = _extract_mention_handles(title, body)
    if not handles:
        return []
    if not company_id:
        raise HTTPException(status_code=400, detail="Las menciones requieren contexto de empresa.")

    candidates = db.query(Usuario).filter(
        Usuario.activo.is_(True),
        Usuario.empresa_id == company_id,
    ).all()
    allowed_users = candidates
    if scope == "interno_empresa" and topic and topic.is_restricted:
        allowed_users = [candidate for candidate in candidates if _can_access_topic(topic, candidate)]
    handle_map = {_community_user_handle(candidate): candidate for candidate in allowed_users}
    unknown_handles = [handle for handle in handles if handle not in handle_map]
    if unknown_handles:
        handles_label = ", ".join(f"@{handle}" for handle in unknown_handles)
        raise HTTPException(
            status_code=400,
            detail=f"Las siguientes menciones no son válidas en este contexto: {handles_label}.",
        )
    return [_serialize_mention(handle_map[handle]) for handle in handles]


def _is_within_author_edit_window(created_at: Optional[datetime]) -> bool:
    if not created_at:
        return False
    normalized = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
    return normalized >= datetime.now(timezone.utc) - timedelta(minutes=AUTHOR_EDIT_WINDOW_MINUTES)


def _normalize_community_datetime(value: Optional[datetime], fallback: Optional[datetime] = None) -> Optional[datetime]:
    resolved = value or fallback
    if resolved is None:
        return None
    return resolved if resolved.tzinfo else resolved.replace(tzinfo=timezone.utc)


def _raise_community_schema_sync_error(exc: Exception) -> None:
    raise HTTPException(
        status_code=503,
        detail="La base de datos de Comunidad no está alineada con las migraciones requeridas. Actualice el esquema y reintente.",
    ) from exc


def _ensure_community_upload_dir() -> None:
    if not os.path.exists(COMMUNITY_UPLOAD_DIR):
        os.makedirs(COMMUNITY_UPLOAD_DIR, exist_ok=True)


def _normalize_filename(filename: Optional[str]) -> str:
    raw_name = (filename or "archivo").strip()
    safe_name = re.sub(r"[^A-Za-z0-9._-]+", "_", raw_name).strip("._")
    return safe_name or "archivo"


def _serialize_attachment(attachment: CommunityAttachment) -> CommunityAttachmentResponse:
    created_at = _normalize_community_datetime(attachment.created_at, datetime.now(timezone.utc))
    return CommunityAttachmentResponse(
        id=attachment.id,
        file_name=attachment.file_name,
        public_url=attachment.public_url,
        content_type=attachment.content_type,
        size_bytes=attachment.size_bytes,
        expires_at=_normalize_community_datetime(attachment.expires_at),
        created_at=created_at,
    )


def _attachment_list(items: list[CommunityAttachment]) -> list[CommunityAttachmentResponse]:
    return [
        _serialize_attachment(item)
        for item in items
        if item.deleted_at is None
    ]


def _attachment_expiration_for_scope(scope: str) -> Optional[datetime]:
    if scope == "interno_empresa":
        return datetime.now(timezone.utc) + timedelta(days=COMMUNITY_INTERNAL_ATTACHMENT_RETENTION_DAYS)
    return None


def _validate_attachment_policy(scope: str, content_type: Optional[str]) -> None:
    normalized_type = (content_type or "").lower()
    if scope == "publico":
        raise HTTPException(status_code=400, detail="En Público no se permiten adjuntos de ningún tipo.")
    if scope == "interno_empresa":
        if not normalized_type:
            raise HTTPException(status_code=400, detail="No se pudo determinar el tipo del archivo adjunto.")
        return
    raise HTTPException(status_code=400, detail="Ámbito de adjunto no soportado.")


async def _save_upload_file(db: Session, upload: UploadFile, *, scope: str, target_empresa_id: int) -> tuple[str, str, int]:
    _ensure_community_upload_dir()
    _validate_attachment_policy(scope, upload.content_type)
    license_service.check_limit(db=db, empresa_id=target_empresa_id, resource_type="almacenamiento")
    file_extension = os.path.splitext(upload.filename or "")[1]
    unique_name = f"{uuid.uuid4()}{file_extension}"
    storage_path = os.path.join(COMMUNITY_UPLOAD_DIR, unique_name)
    content = await upload.read()
    with open(storage_path, "wb") as buffer:
        buffer.write(content)
    return storage_path, f"/uploads/community/{unique_name}", len(content)


def _can_author_edit_post(post: CommunityPost, current_user: Optional[Usuario]) -> bool:
    if not current_user or post.author_user_id != current_user.id or post.deleted_at is not None:
        return False
    return _is_within_author_edit_window(post.created_at)


def _can_author_delete_post(post: CommunityPost, current_user: Optional[Usuario]) -> bool:
    if not _can_author_edit_post(post, current_user):
        return False
    return all(reply.deleted_at is not None for reply in (post.replies or []))


def _can_author_edit_reply(reply: CommunityPostReply, current_user: Optional[Usuario]) -> bool:
    if not current_user or reply.author_user_id != current_user.id or reply.deleted_at is not None:
        return False
    return _is_within_author_edit_window(reply.created_at)


def _can_author_delete_reply(reply: CommunityPostReply, current_user: Optional[Usuario], sibling_replies: list[CommunityPostReply]) -> bool:
    if not _can_author_edit_reply(reply, current_user):
        return False
    return all(
        child.deleted_at is not None
        for child in sibling_replies
        if child.parent_reply_id == reply.id
    )


def _serialize_post(post: CommunityPost, current_user: Optional[Usuario] = None) -> CommunityPostResponse:
    created_at = _normalize_community_datetime(post.created_at, datetime.now(timezone.utc))
    replies_count = len([reply for reply in post.replies if reply.deleted_at is None])
    mentions = []
    if post.empresa_id:
        mentions = _resolve_contextual_mentions(
            Session.object_session(post),
            company_id=post.target_empresa_id or post.empresa_id,
            scope=post.scope,
            topic=post.topic,
            title=post.title,
            body=post.body,
        )
    return CommunityPostResponse(
        id=post.id,
        scope=post.scope,
        topic_id=post.topic_id,
        topic_name=post.topic.nombre if post.topic else None,
        category_id=post.topic.category_id if post.topic else None,
        category_name=post.topic.category.nombre if post.topic and post.topic.category else None,
        status=post.status,
        title=post.title,
        body=post.body,
        allow_replies=post.allow_replies,
        is_pinned=post.is_pinned,
        author_user_id=post.author_user_id,
        author_name=post.author.nombre_completo if post.author else None,
        company_name=post.empresa.nombre if post.empresa else None,
        target_company_id=post.target_empresa_id,
        target_company_name=post.target_empresa.nombre if post.target_empresa else None,
        replies_count=replies_count,
        can_edit=_can_author_edit_post(post, current_user),
        can_delete=_can_author_delete_post(post, current_user),
        mentions=mentions,
        attachments=_attachment_list(post.attachments or []),
        created_at=created_at,
        last_activity_at=_post_last_activity_at(post),
        updated_at=_normalize_community_datetime(post.updated_at),
    )


def _serialize_reply(
    reply: CommunityPostReply,
    current_user: Optional[Usuario] = None,
    sibling_replies: Optional[list[CommunityPostReply]] = None,
) -> CommunityReplyResponse:
    created_at = _normalize_community_datetime(reply.created_at, datetime.now(timezone.utc))
    siblings = sibling_replies or []
    company_id = None
    if reply.post:
        company_id = reply.post.target_empresa_id or reply.post.empresa_id
    mentions = []
    if company_id and reply.post:
        mentions = _resolve_contextual_mentions(
            Session.object_session(reply),
            company_id=company_id,
            scope=reply.post.scope,
            topic=reply.post.topic,
            body=reply.body,
        )
    return CommunityReplyResponse(
        id=reply.id,
        post_id=reply.post_id,
        parent_reply_id=reply.parent_reply_id,
        author_user_id=reply.author_user_id,
        author_name=reply.author.nombre_completo if reply.author else None,
        body=reply.body,
        status=reply.status,
        can_edit=_can_author_edit_reply(reply, current_user),
        can_delete=_can_author_delete_reply(reply, current_user, siblings),
        mentions=mentions,
        attachments=_attachment_list(reply.attachments or []),
        created_at=created_at,
        updated_at=_normalize_community_datetime(reply.updated_at),
    )


def _serialize_sanction(sanction: CommunitySanction) -> CommunitySanctionResponse:
    created_at = _normalize_community_datetime(sanction.created_at, datetime.now(timezone.utc))
    return CommunitySanctionResponse(
        id=sanction.id,
        target_user_id=sanction.target_user_id,
        target_user_name=sanction.target_user.nombre_completo if sanction.target_user else None,
        issued_by_user_id=sanction.issued_by_user_id,
        issued_by_name=sanction.issued_by.nombre_completo if sanction.issued_by else None,
        sanction_type=sanction.sanction_type,
        scope=sanction.scope,
        target_empresa_id=sanction.target_empresa_id,
        target_empresa_name=sanction.target_empresa.nombre if sanction.target_empresa else None,
        reason=sanction.reason,
        is_active=sanction.is_active,
        created_at=created_at,
        expires_at=_normalize_community_datetime(sanction.expires_at),
    )


def _serialize_sanction_appeal(appeal: CommunitySanctionAppeal) -> CommunitySanctionAppealResponse:
    created_at = _normalize_community_datetime(appeal.created_at, datetime.now(timezone.utc))
    return CommunitySanctionAppealResponse(
        id=appeal.id,
        sanction_id=appeal.sanction_id,
        sanction_type=appeal.sanction.sanction_type if appeal.sanction else None,
        sanction_scope=appeal.sanction.scope if appeal.sanction else None,
        sanction_target_user_id=appeal.sanction.target_user_id if appeal.sanction else None,
        sanction_target_user_name=appeal.sanction.target_user.nombre_completo if appeal.sanction and appeal.sanction.target_user else None,
        appellant_user_id=appeal.appellant_user_id,
        appellant_user_name=appeal.appellant_user.nombre_completo if appeal.appellant_user else None,
        reviewed_by_user_id=appeal.reviewed_by_user_id,
        reviewed_by_user_name=appeal.reviewed_by_user.nombre_completo if appeal.reviewed_by_user else None,
        status=appeal.status,
        reason=appeal.reason,
        resolution_note=appeal.resolution_note,
        created_at=created_at,
        reviewed_at=_normalize_community_datetime(appeal.reviewed_at),
    )


def _serialize_category(category: CommunityCategory) -> CommunityCategoryResponse:
    created_at = _normalize_community_datetime(category.created_at, datetime.now(timezone.utc))
    return CommunityCategoryResponse(
        id=category.id,
        scope=category.scope,
        nombre=category.nombre,
        descripcion=category.descripcion,
        orden=category.orden,
        is_active=category.is_active,
        target_empresa_id=category.target_empresa_id,
        target_empresa_name=category.target_empresa.nombre if category.target_empresa else None,
        topic_count=len([topic for topic in category.topics if topic.is_active]),
        created_at=created_at,
    )


def _serialize_topic(topic: CommunityTopic, current_user: Usuario) -> CommunityTopicResponse:
    created_at = _normalize_community_datetime(topic.created_at, datetime.now(timezone.utc))
    follow = next((item for item in topic.followers if item.user_id == current_user.id), None)
    return CommunityTopicResponse(
        id=topic.id,
        scope=topic.scope,
        category_id=topic.category_id,
        category_name=topic.category.nombre if topic.category else None,
        nombre=topic.nombre,
        descripcion=topic.descripcion,
        is_restricted=topic.is_restricted,
        is_active=topic.is_active,
        target_empresa_id=topic.target_empresa_id,
        target_empresa_name=topic.target_empresa.nombre if topic.target_empresa else None,
        member_count=len(topic.members),
        member_user_ids=[member.user_id for member in topic.members],
        can_access=_can_access_topic(topic, current_user),
        is_following=follow is not None,
        followed_at=_normalize_community_datetime(follow.created_at, datetime.now(timezone.utc)) if follow and follow.created_at else None,
        created_at=created_at,
    )


def _serialize_infraction(infraction: CommunityInfraction) -> CommunityInfractionResponse:
    created_at = _normalize_community_datetime(infraction.created_at, datetime.now(timezone.utc))
    return CommunityInfractionResponse(
        id=infraction.id,
        target_user_id=infraction.target_user_id,
        target_user_name=infraction.target_user.nombre_completo if infraction.target_user else None,
        scope=infraction.scope,
        infraction_type=infraction.infraction_type,
        content_type=infraction.content_type,
        content_excerpt=infraction.content_excerpt,
        detected_link=infraction.detected_link,
        target_empresa_id=infraction.target_empresa_id,
        target_empresa_name=infraction.target_empresa.nombre if infraction.target_empresa else None,
        triggered_sanction_id=infraction.triggered_sanction_id,
        created_at=created_at,
    )


def _serialize_admin_alert(alert: CommunityAdminAlert) -> CommunityAdminAlertResponse:
    created_at = _normalize_community_datetime(alert.created_at, datetime.now(timezone.utc))
    return CommunityAdminAlertResponse(
        id=alert.id,
        alert_type=alert.alert_type,
        title=alert.title,
        message=alert.message,
        target_empresa_id=alert.target_empresa_id,
        target_empresa_name=alert.target_empresa.nombre if alert.target_empresa else None,
        target_user_id=alert.target_user_id,
        target_user_name=alert.target_user.nombre_completo if alert.target_user else None,
        infraction_id=alert.infraction_id,
        is_read=alert.is_read,
        created_at=created_at,
        read_at=_normalize_community_datetime(alert.read_at),
    )


def _serialize_dm_thread(thread: CommunityDmThread, current_user: Usuario) -> CommunityDmThreadResponse:
    counterpart = thread.user_b if thread.user_a_id == current_user.id else thread.user_a
    visible_messages = [message for message in thread.messages if message.deleted_at is None]
    last_message = visible_messages[-1] if visible_messages else None
    return CommunityDmThreadResponse(
        id=thread.id,
        counterpart_user_id=counterpart.id if counterpart else 0,
        counterpart_name=counterpart.nombre_completo if counterpart else None,
        counterpart_company_name=counterpart.empresa.nombre if counterpart and counterpart.empresa else None,
        last_message_preview=last_message.body[:120] if last_message else None,
        last_message_at=_normalize_community_datetime(last_message.created_at) if last_message else None,
        messages_count=len(visible_messages),
        blocked_at=_normalize_community_datetime(thread.blocked_at),
        blocked_by_user_id=thread.blocked_by_user_id,
        blocked_by_name=thread.blocked_by.nombre_completo if thread.blocked_by else None,
        blocked_by_me=thread.blocked_by_user_id == current_user.id if thread.blocked_by_user_id else False,
    )


def _serialize_dm_message(message: CommunityDmMessage, thread: CommunityDmThread) -> CommunityDmMessageResponse:
    mentions = _resolve_contextual_mentions(
        Session.object_session(message),
        company_id=thread.empresa_context_id,
        scope="mensajes_directos",
        body=message.body,
    ) if thread.empresa_context_id else []
    return CommunityDmMessageResponse(
        id=message.id,
        thread_id=thread.id,
        author_user_id=message.author_user_id,
        author_name=message.author.nombre_completo if message.author else None,
        body=message.body,
        mentions=mentions,
        created_at=_normalize_community_datetime(message.created_at, datetime.now(timezone.utc)),
        read_at=_normalize_community_datetime(message.read_at),
    )


def _post_last_activity_at(post: CommunityPost) -> datetime:
    timestamps = [
        value
        for value in [
            _normalize_community_datetime(post.created_at),
            _normalize_community_datetime(post.updated_at),
        ]
        if value is not None
    ]
    timestamps.extend(
        _normalize_community_datetime(reply.updated_at or reply.created_at)
        for reply in (post.replies or [])
        if reply.deleted_at is None and _normalize_community_datetime(reply.updated_at or reply.created_at) is not None
    )
    return max(timestamps) if timestamps else datetime.now(timezone.utc)


def _sort_posts(posts: list[CommunityPost], order: str) -> list[CommunityPost]:
    normalized_order = (order or "recent_activity").strip().lower()
    fallback_dt = datetime(1970, 1, 1, tzinfo=timezone.utc)
    if normalized_order == "created_at":
        return sorted(
            posts,
            key=lambda post: (post.is_pinned, _normalize_community_datetime(post.created_at, fallback_dt)),
            reverse=True,
        )
    return sorted(
        posts,
        key=lambda post: (
            post.is_pinned,
            _post_last_activity_at(post),
            _normalize_community_datetime(post.created_at, fallback_dt),
        ),
        reverse=True,
    )


def _ensure_post_visibility(post: CommunityPost, current_user: Usuario, active_company_id: int) -> None:
    if post.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    if post.scope == "publico" or _is_superadmin(current_user):
        return
    if post.target_empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="No tiene acceso a esta publicación interna.")


def _remove_attachment_file(storage_path: Optional[str]) -> None:
    if storage_path and os.path.exists(storage_path):
        os.remove(storage_path)


def _load_active_attachment_or_404(db: Session, attachment_id: int) -> CommunityAttachment:
    attachment = db.query(CommunityAttachment).filter(CommunityAttachment.id == attachment_id).first()
    if not attachment or attachment.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado.")
    return attachment


def _ensure_can_manage_attachment(
    attachment: CommunityAttachment,
    current_user: Usuario,
    active_company_id: int,
    db: Session,
) -> tuple[Optional[CommunityPost], Optional[CommunityPostReply], list[CommunityPostReply]]:
    post = attachment.post
    reply = attachment.reply
    sibling_replies: list[CommunityPostReply] = []
    if post:
        _ensure_post_visibility(post, current_user, active_company_id)
        if post.topic:
            _ensure_can_access_topic(post.topic, current_user)
        _ensure_can_manage_own_post(post, current_user, delete=False)
        return post, None, sibling_replies
    if reply:
        post = db.query(CommunityPost).filter(CommunityPost.id == reply.post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Publicación no encontrada.")
        _ensure_post_visibility(post, current_user, active_company_id)
        if post.topic:
            _ensure_can_access_topic(post.topic, current_user)
        sibling_replies = db.query(CommunityPostReply).filter(CommunityPostReply.post_id == reply.post_id).all()
        _ensure_can_manage_own_reply(reply, current_user, sibling_replies, delete=False)
        return post, reply, sibling_replies
    raise HTTPException(status_code=400, detail="Adjunto sin contenido asociado.")


def _ensure_can_moderate_attachment(
    attachment: CommunityAttachment,
    current_user: Usuario,
    active_company_id: int,
    db: Session,
) -> tuple[CommunityPost, Optional[CommunityPostReply], list[CommunityPostReply]]:
    post = attachment.post
    reply = attachment.reply
    sibling_replies: list[CommunityPostReply] = []
    if not post and reply:
        post = db.query(CommunityPost).filter(CommunityPost.id == reply.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    if not _can_moderate_post(post, current_user, active_company_id):
        raise HTTPException(status_code=403, detail="No tiene permisos para moderar este adjunto.")
    if reply:
        sibling_replies = db.query(CommunityPostReply).filter(CommunityPostReply.post_id == reply.post_id).all()
    return post, reply, sibling_replies


def purge_expired_community_attachments(db: Session) -> int:
    now = datetime.now(timezone.utc)
    expired_items = db.query(CommunityAttachment).filter(
        CommunityAttachment.deleted_at.is_(None),
        CommunityAttachment.expires_at.is_not(None),
        CommunityAttachment.expires_at <= now,
    ).all()
    for item in expired_items:
        _remove_attachment_file(item.storage_path)
        item.deleted_at = now
    if expired_items:
        db.commit()
    return len(expired_items)


def _ensure_can_manage_own_post(post: CommunityPost, current_user: Usuario, *, delete: bool = False) -> None:
    allowed = _can_author_delete_post(post, current_user) if delete else _can_author_edit_post(post, current_user)
    if not allowed:
        if post.author_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Solo el autor puede gestionar esta publicación.")
        raise HTTPException(
            status_code=403,
            detail="La publicación ya no puede gestionarse por autor bajo la política vigente.",
        )


def _ensure_can_manage_own_reply(
    reply: CommunityPostReply,
    current_user: Usuario,
    sibling_replies: list[CommunityPostReply],
    *,
    delete: bool = False,
) -> None:
    allowed = _can_author_delete_reply(reply, current_user, sibling_replies) if delete else _can_author_edit_reply(reply, current_user)
    if not allowed:
        if reply.author_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Solo el autor puede gestionar esta respuesta.")
        raise HTTPException(
            status_code=403,
            detail="La respuesta ya no puede gestionarse por autor bajo la política vigente.",
        )


def _can_moderate_post(post: CommunityPost, current_user: Usuario, active_company_id: int) -> bool:
    if _is_superadmin(current_user):
        return True
    if not _is_company_admin(current_user):
        return False
    return post.scope == "interno_empresa" and post.target_empresa_id == active_company_id and current_user.empresa_id == active_company_id


def _is_sanction_active(sanction: CommunitySanction) -> bool:
    if not sanction.is_active:
        return False
    if sanction.expires_at:
        expires_at = sanction.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            return False
    return True


def _get_active_user_sanctions(db: Session, user_id: int, active_company_id: int) -> list[CommunitySanction]:
    sanctions = db.query(CommunitySanction).filter(
        CommunitySanction.target_user_id == user_id,
        CommunitySanction.is_active.is_(True),
    ).all()
    return [
        sanction
        for sanction in sanctions
        if _is_sanction_active(sanction)
        and (
            sanction.scope != "interno_empresa"
            or sanction.target_empresa_id in (None, active_company_id)
        )
    ]


def _community_state_from_sanctions(sanctions: list[CommunitySanction]) -> str:
    sanction_types = {sanction.sanction_type for sanction in sanctions}
    if "bloqueo_comunidad" in sanction_types:
        return "baneado_comunidad"
    if "bloqueo_publico" in sanction_types:
        return "bloqueado_publico"
    if "bloqueo_interno" in sanction_types:
        return "bloqueado_interno"
    if "bloqueo_dm" in sanction_types:
        return "bloqueado_dm"
    return "activo"


def _can_manage_topics(current_user: Usuario) -> bool:
    return _normalize_role(current_user.rol) in {"administrador", "superadministrador"}


def _can_access_topic(topic: CommunityTopic, current_user: Usuario) -> bool:
    if not topic.is_active:
        return False
    if _is_superadmin(current_user):
        return True
    if topic.scope == "interno_empresa" and topic.target_empresa_id != current_user.empresa_id:
        return False
    if not topic.is_restricted:
        return True
    return any(member.user_id == current_user.id for member in topic.members)


def _load_category_or_404(db: Session, category_id: Optional[int]) -> Optional[CommunityCategory]:
    if not category_id:
        return None
    category = db.query(CommunityCategory).filter(CommunityCategory.id == category_id).first()
    if not category or not category.is_active:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    return category


def _ensure_category_scope(category: CommunityCategory, scope: str, active_company_id: int) -> None:
    if category.scope != scope:
        raise HTTPException(status_code=400, detail="La categoría no pertenece al ámbito seleccionado.")
    if scope == "interno_empresa" and category.target_empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="La categoría no pertenece a la empresa activa.")


def _load_topic_or_404(db: Session, topic_id: Optional[int]) -> Optional[CommunityTopic]:
    if not topic_id:
        return None
    topic = db.query(CommunityTopic).filter(CommunityTopic.id == topic_id).first()
    if not topic or not topic.is_active:
        raise HTTPException(status_code=404, detail="Tema no encontrado.")
    return topic


def _ensure_topic_scope(topic: CommunityTopic, scope: str, active_company_id: int) -> None:
    if topic.scope != scope:
        raise HTTPException(status_code=400, detail="El tema no pertenece al ámbito seleccionado.")
    if scope == "interno_empresa" and topic.target_empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="El tema no pertenece a la empresa activa.")


def _ensure_can_access_topic(topic: CommunityTopic, current_user: Usuario) -> None:
    if not _can_access_topic(topic, current_user):
        raise HTTPException(status_code=403, detail="No tiene acceso a este tema de Comunidad.")


def _ensure_not_sanctioned(
    db: Session,
    current_user: Usuario,
    active_company_id: int,
    target_surface: str,
) -> None:
    sanctions = db.query(CommunitySanction).filter(
        CommunitySanction.target_user_id == current_user.id,
        CommunitySanction.is_active.is_(True),
    ).all()
    for sanction in sanctions:
        if not _is_sanction_active(sanction):
            continue
        if sanction.sanction_type == "bloqueo_comunidad":
            raise HTTPException(status_code=403, detail="Su usuario tiene suspendida la participación en Comunidad.")
        if target_surface == "publico" and sanction.sanction_type == "bloqueo_publico":
            raise HTTPException(status_code=403, detail="Su usuario tiene bloqueada la publicación en el foro público.")
        if target_surface == "interno_empresa" and sanction.sanction_type == "bloqueo_interno":
            if sanction.target_empresa_id in (None, active_company_id):
                raise HTTPException(status_code=403, detail="Su usuario tiene bloqueada la participación interna en esta empresa.")
        if target_surface == "mensajes_directos" and sanction.sanction_type == "bloqueo_dm":
            raise HTTPException(status_code=403, detail="Su usuario tiene bloqueada la mensajería directa.")


def _ensure_dm_thread_access(thread: CommunityDmThread, current_user: Usuario, active_company_id: int) -> None:
    if current_user.id not in (thread.user_a_id, thread.user_b_id):
        raise HTTPException(status_code=403, detail="No tiene acceso a esta conversación.")
    if thread.empresa_context_id not in (None, active_company_id):
        raise HTTPException(status_code=403, detail="La conversación no pertenece al contexto activo.")


def _ensure_can_unblock_dm_thread(thread: CommunityDmThread, current_user: Usuario) -> None:
    if thread.blocked_by_user_id and thread.blocked_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el usuario que bloqueó la conversación puede reactivarla.")


def _ensure_can_review_sanction_appeal(
    appeal: CommunitySanctionAppeal,
    current_user: Usuario,
    active_company_id: int,
) -> None:
    if _is_superadmin(current_user):
        return
    if not _is_company_admin(current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para resolver apelaciones de Comunidad.")
    sanction = appeal.sanction
    if not sanction or sanction.scope != "interno_empresa":
        raise HTTPException(status_code=403, detail="El administrador de empresa solo puede resolver apelaciones internas de su empresa.")
    if sanction.target_empresa_id != active_company_id or current_user.empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="Solo puede resolver apelaciones internas de su empresa activa.")


def _ensure_can_issue_sanction(
    current_user: Usuario,
    target_user: Usuario,
    payload: CommunitySanctionCreateRequest,
    active_company_id: int,
) -> None:
    expected_pairs = {
        "bloqueo_publico": "publico",
        "bloqueo_interno": "interno_empresa",
        "bloqueo_dm": "mensajes_directos",
        "bloqueo_comunidad": "global",
    }
    if expected_pairs.get(payload.sanction_type) != payload.scope:
        raise HTTPException(status_code=400, detail="La combinación de tipo y ámbito de sanción no es válida.")
    if _is_superadmin(current_user):
        return
    if not _is_company_admin(current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para sancionar usuarios en Comunidad.")
    if payload.scope != "interno_empresa":
        raise HTTPException(status_code=403, detail="El administrador de empresa solo puede sancionar el foro interno de su empresa.")
    if target_user.empresa_id != current_user.empresa_id or current_user.empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="Solo puede sancionar usuarios de su empresa activa.")
    if payload.target_empresa_id not in (None, current_user.empresa_id):
        raise HTTPException(status_code=403, detail="La sanción interna debe apuntar a su propia empresa.")


def _create_superadmin_alert_for_infraction(
    db: Session,
    *,
    target_user: Usuario,
    active_company_id: int,
    infraction: CommunityInfraction,
    sanction: CommunitySanction,
) -> None:
    company_name = target_user.empresa.nombre if target_user.empresa else f"Empresa {active_company_id}"
    alert = CommunityAdminAlert(
        alert_type="infraction_public_link",
        title="Infracción automática en Comunidad Pública",
        message=(
            f"Usuario: {target_user.nombre_completo} <{target_user.email}> | "
            f"Empresa: {company_name} | "
            f"Fecha: {datetime.now(timezone.utc).isoformat()} | "
            f"Infracción: intento de publicar link en Público | "
            f"Sanción: {sanction.sanction_type}"
        ),
        target_empresa_id=active_company_id,
        target_user_id=target_user.id,
        infraction_id=infraction.id,
        is_read=False,
    )
    db.add(alert)


def _apply_public_link_infraction(
    db: Session,
    *,
    current_user: Usuario,
    active_company_id: int,
    body_text: str,
    content_type: str,
) -> None:
    detected_link = _detect_first_link(body_text)
    if not detected_link:
        return

    prior_count = db.query(CommunityInfraction).filter(
        CommunityInfraction.target_user_id == current_user.id,
        CommunityInfraction.scope == "publico",
        CommunityInfraction.infraction_type == "public_link_attempt",
    ).count()

    now = datetime.now(timezone.utc)
    if prior_count == 0:
        sanction_type = "bloqueo_publico"
        expires_at = now + timedelta(days=7)
        reason = "Primera infracción automática por intento de publicar links en Comunidad Pública."
    elif prior_count == 1:
        sanction_type = "bloqueo_publico"
        expires_at = now + timedelta(days=15)
        reason = "Segunda infracción automática por intento de publicar links en Comunidad Pública."
    else:
        sanction_type = "bloqueo_comunidad"
        expires_at = None
        reason = "Baneo automático de Comunidad por reincidencia en publicación de links en Público."

    sanction = CommunitySanction(
        target_user_id=current_user.id,
        issued_by_user_id=None,
        sanction_type=sanction_type,
        scope="global" if sanction_type == "bloqueo_comunidad" else "publico",
        target_empresa_id=None,
        reason=reason,
        is_active=True,
        expires_at=expires_at,
    )
    db.add(sanction)
    db.flush()

    infraction = CommunityInfraction(
        target_user_id=current_user.id,
        scope="publico",
        infraction_type="public_link_attempt",
        content_type=content_type,
        content_excerpt=(body_text or "").strip()[:400],
        detected_link=detected_link,
        target_empresa_id=active_company_id,
        triggered_sanction_id=sanction.id,
    )
    db.add(infraction)
    db.flush()

    _create_superadmin_alert_for_infraction(
        db,
        target_user=current_user,
        active_company_id=active_company_id,
        infraction=infraction,
        sanction=sanction,
    )

    record_audit_event(
        db,
        module="community",
        event_type="community_public_link_infraction",
        severity="warning",
        actor=current_user,
        target_user_id=current_user.id,
        target_empresa_id=active_company_id,
        entity_type="community_infraction",
        entity_id=infraction.id,
        message=f"Infracción automática por intento de publicar link en Público: {current_user.email}",
        payload={
            "content_type": content_type,
            "detected_link": detected_link,
            "sanction_type": sanction_type,
            "prior_count": prior_count,
        },
    )
    db.commit()
    raise HTTPException(
        status_code=403,
        detail="No se permiten links en la Comunidad Pública. Se ha aplicado una sanción automática según la política vigente.",
    )


@router.get("/bootstrap", response_model=CommunityBootstrapResponse)
def read_community_bootstrap(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    active_company = db.query(Empresa).filter(Empresa.id == active_company_id).first()
    return CommunityBootstrapResponse(
        active_company_id=active_company_id,
        active_company_name=active_company.nombre if active_company else None,
        is_superadmin=_is_superadmin(current_user),
        can_manage_topics=_can_manage_topics(current_user),
        can_moderate_public=_is_superadmin(current_user),
        can_moderate_internal=_is_superadmin(current_user) or _is_company_admin(current_user),
        available_surfaces=["publico", "interno_empresa", "mensajes_directos"],
    )


@router.get("/posts", response_model=List[CommunityPostResponse])
def read_community_posts(
    scope: str = Query("publico", pattern="^(publico|interno_empresa)$"),
    topic_id: Optional[int] = Query(None),
    order: str = Query("recent_activity", pattern="^(recent_activity|created_at)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    try:
        active_company_id = _resolve_active_company_id(current_user, empresa_id)
        topic = _load_topic_or_404(db, topic_id)
        if topic:
            _ensure_topic_scope(topic, scope, active_company_id)
            _ensure_can_access_topic(topic, current_user)
        query = db.query(CommunityPost).filter(CommunityPost.deleted_at.is_(None))
        if scope == "publico":
            query = query.filter(CommunityPost.scope == "publico")
        else:
            query = query.filter(
                CommunityPost.scope == "interno_empresa",
                CommunityPost.target_empresa_id == active_company_id,
            )
        if topic_id:
            query = query.filter(CommunityPost.topic_id == topic_id)
        posts = query.all()
        posts = _sort_posts(posts, order)
        visible_posts = []
        for post in posts:
            if post.topic and not _can_access_topic(post.topic, current_user):
                continue
            visible_posts.append(_serialize_post(post, current_user))
        return visible_posts
    except SQLAlchemyError as exc:
        _raise_community_schema_sync_error(exc)


@router.post("/posts", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
def create_community_post(
    payload: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    _ensure_not_sanctioned(db, current_user, active_company_id, payload.scope)
    if payload.scope == "publico":
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=f"{payload.title}\n{payload.body}",
            content_type="post",
        )
    topic = _load_topic_or_404(db, payload.topic_id)
    if topic:
        _ensure_topic_scope(topic, payload.scope, active_company_id)
        _ensure_can_access_topic(topic, current_user)
    _resolve_contextual_mentions(
        db,
        company_id=active_company_id,
        scope=payload.scope,
        topic=topic,
        title=payload.title,
        body=payload.body,
    )
    target_empresa_id = active_company_id if payload.scope == "interno_empresa" else None
    post = CommunityPost(
        scope=payload.scope,
        status="publicado",
        title=payload.title.strip(),
        body=payload.body.strip(),
        allow_replies=payload.allow_replies,
        topic_id=topic.id if topic else None,
        author_user_id=current_user.id,
        empresa_id=current_user.empresa_id,
        target_empresa_id=target_empresa_id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    record_audit_event(
        db,
        module="community",
        event_type="community_post_created",
        message=f"Publicación creada en {payload.scope}: {post.title}",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="community_post",
        entity_id=post.id,
        payload={"scope": payload.scope, "title": post.title, "topic_id": post.topic_id},
    )
    return _serialize_post(post, current_user)


@router.get("/posts/{post_id}/replies", response_model=List[CommunityReplyResponse])
def read_community_replies(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    replies = (
        db.query(CommunityPostReply)
        .filter(CommunityPostReply.post_id == post_id, CommunityPostReply.deleted_at.is_(None))
        .order_by(CommunityPostReply.created_at.asc())
        .all()
    )
    return [_serialize_reply(reply, current_user, replies) for reply in replies]


@router.post("/posts/{post_id}/replies", response_model=CommunityReplyResponse, status_code=status.HTTP_201_CREATED)
def create_community_reply(
    post_id: int,
    payload: CommunityReplyCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    _ensure_not_sanctioned(db, current_user, active_company_id, post.scope)
    if post.scope == "publico":
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=payload.body,
            content_type="reply",
        )
    if not post.allow_replies:
        raise HTTPException(status_code=400, detail="Esta publicación no acepta respuestas.")

    if payload.parent_reply_id:
        parent_reply = db.query(CommunityPostReply).filter(
            CommunityPostReply.id == payload.parent_reply_id,
            CommunityPostReply.post_id == post_id,
            CommunityPostReply.deleted_at.is_(None),
        ).first()
        if not parent_reply:
            raise HTTPException(status_code=404, detail="Respuesta padre no encontrada.")
    _resolve_contextual_mentions(
        db,
        company_id=post.target_empresa_id or post.empresa_id,
        scope=post.scope,
        topic=post.topic,
        body=payload.body,
    )

    reply = CommunityPostReply(
        post_id=post_id,
        parent_reply_id=payload.parent_reply_id,
        author_user_id=current_user.id,
        body=payload.body.strip(),
        status="publicado",
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return _serialize_reply(reply, current_user, [reply])


@router.put("/posts/{post_id}", response_model=CommunityPostResponse)
def update_community_post(
    post_id: int,
    payload: CommunityPostUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    _ensure_can_manage_own_post(post, current_user, delete=False)
    if post.scope == "publico":
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=f"{payload.title}\n{payload.body}",
            content_type="post_edit",
        )
    _resolve_contextual_mentions(
        db,
        company_id=post.target_empresa_id or post.empresa_id,
        scope=post.scope,
        topic=post.topic,
        title=payload.title,
        body=payload.body,
    )
    post.title = payload.title.strip()
    post.body = payload.body.strip()
    db.commit()
    db.refresh(post)
    record_audit_event(
        db,
        module="community",
        event_type="community_post_updated_by_author",
        message=f"Autor actualizó su publicación {post.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_post",
        entity_id=post.id,
    )
    return _serialize_post(post, current_user)


@router.delete("/posts/{post_id}", response_model=CommunityPostResponse)
def delete_community_post_by_author(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    _ensure_can_manage_own_post(post, current_user, delete=True)
    post.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    record_audit_event(
        db,
        module="community",
        event_type="community_post_deleted_by_author",
        message=f"Autor eliminó su publicación {post.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_post",
        entity_id=post.id,
    )
    return _serialize_post(post, current_user)


@router.put("/replies/{reply_id}", response_model=CommunityReplyResponse)
def update_community_reply(
    reply_id: int,
    payload: CommunityReplyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    reply = db.query(CommunityPostReply).filter(CommunityPostReply.id == reply_id).first()
    if not reply or reply.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada.")
    post = db.query(CommunityPost).filter(CommunityPost.id == reply.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    sibling_replies = db.query(CommunityPostReply).filter(CommunityPostReply.post_id == reply.post_id).all()
    _ensure_can_manage_own_reply(reply, current_user, sibling_replies, delete=False)
    if post.scope == "publico":
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=payload.body,
            content_type="reply_edit",
        )
    _resolve_contextual_mentions(
        db,
        company_id=post.target_empresa_id or post.empresa_id,
        scope=post.scope,
        topic=post.topic,
        body=payload.body,
    )
    reply.body = payload.body.strip()
    db.commit()
    db.refresh(reply)
    record_audit_event(
        db,
        module="community",
        event_type="community_reply_updated_by_author",
        message=f"Autor actualizó su respuesta {reply.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_reply",
        entity_id=reply.id,
    )
    return _serialize_reply(reply, current_user, sibling_replies)


@router.delete("/replies/{reply_id}", response_model=CommunityReplyResponse)
def delete_community_reply_by_author(
    reply_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    reply = db.query(CommunityPostReply).filter(CommunityPostReply.id == reply_id).first()
    if not reply or reply.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada.")
    post = db.query(CommunityPost).filter(CommunityPost.id == reply.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    sibling_replies = db.query(CommunityPostReply).filter(CommunityPostReply.post_id == reply.post_id).all()
    _ensure_can_manage_own_reply(reply, current_user, sibling_replies, delete=True)
    reply.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reply)
    record_audit_event(
        db,
        module="community",
        event_type="community_reply_deleted_by_author",
        message=f"Autor eliminó su respuesta {reply.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_reply",
        entity_id=reply.id,
    )
    return _serialize_reply(reply, current_user, sibling_replies)


@router.post("/posts/{post_id}/attachments", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
async def upload_community_post_attachment(
    post_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    _ensure_can_manage_own_post(post, current_user, delete=False)
    storage_path, public_url, size_bytes = await _save_upload_file(
        db,
        file,
        scope=post.scope,
        target_empresa_id=post.target_empresa_id or post.empresa_id,
    )
    attachment = CommunityAttachment(
        post_id=post.id,
        created_by_user_id=current_user.id,
        target_empresa_id=post.target_empresa_id or post.empresa_id,
        scope=post.scope,
        file_name=_normalize_filename(file.filename),
        storage_path=storage_path,
        public_url=public_url,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        expires_at=_attachment_expiration_for_scope(post.scope),
    )
    db.add(attachment)
    db.commit()
    db.refresh(post)
    record_audit_event(
        db,
        module="community",
        event_type="community_post_attachment_uploaded",
        message=f"Adjunto cargado en publicación {post.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_post",
        entity_id=post.id,
        payload={"file_name": attachment.file_name, "scope": post.scope, "size_bytes": attachment.size_bytes},
    )
    return _serialize_post(post, current_user)


@router.post("/replies/{reply_id}/attachments", response_model=CommunityReplyResponse, status_code=status.HTTP_201_CREATED)
async def upload_community_reply_attachment(
    reply_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    reply = db.query(CommunityPostReply).filter(CommunityPostReply.id == reply_id).first()
    if not reply or reply.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Respuesta no encontrada.")
    post = db.query(CommunityPost).filter(CommunityPost.id == reply.post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    _ensure_post_visibility(post, current_user, active_company_id)
    if post.topic:
        _ensure_can_access_topic(post.topic, current_user)
    sibling_replies = db.query(CommunityPostReply).filter(CommunityPostReply.post_id == reply.post_id).all()
    _ensure_can_manage_own_reply(reply, current_user, sibling_replies, delete=False)
    storage_path, public_url, size_bytes = await _save_upload_file(
        db,
        file,
        scope=post.scope,
        target_empresa_id=post.target_empresa_id or post.empresa_id,
    )
    attachment = CommunityAttachment(
        reply_id=reply.id,
        created_by_user_id=current_user.id,
        target_empresa_id=post.target_empresa_id or post.empresa_id,
        scope=post.scope,
        file_name=_normalize_filename(file.filename),
        storage_path=storage_path,
        public_url=public_url,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        expires_at=_attachment_expiration_for_scope(post.scope),
    )
    db.add(attachment)
    db.commit()
    db.refresh(reply)
    record_audit_event(
        db,
        module="community",
        event_type="community_reply_attachment_uploaded",
        message=f"Adjunto cargado en respuesta {reply.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_reply",
        entity_id=reply.id,
        payload={"file_name": attachment.file_name, "scope": post.scope, "size_bytes": attachment.size_bytes},
    )
    return _serialize_reply(reply, current_user, sibling_replies)


@router.delete("/attachments/{attachment_id}/post", response_model=CommunityPostResponse)
def delete_community_post_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    attachment = _load_active_attachment_or_404(db, attachment_id)
    post, _, _ = _ensure_can_manage_attachment(attachment, current_user, active_company_id, db)
    if not post:
        raise HTTPException(status_code=400, detail="El adjunto no pertenece a una publicación.")
    _remove_attachment_file(attachment.storage_path)
    attachment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(post)
    record_audit_event(
        db,
        module="community",
        event_type="community_post_attachment_deleted",
        message=f"Adjunto eliminado de publicación {post.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_attachment",
        entity_id=attachment.id,
        payload={"file_name": attachment.file_name, "scope": post.scope},
    )
    return _serialize_post(post, current_user)


@router.delete("/attachments/{attachment_id}/reply", response_model=CommunityReplyResponse)
def delete_community_reply_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    attachment = _load_active_attachment_or_404(db, attachment_id)
    post, reply, sibling_replies = _ensure_can_manage_attachment(attachment, current_user, active_company_id, db)
    if not reply or not post:
        raise HTTPException(status_code=400, detail="El adjunto no pertenece a una respuesta.")
    _remove_attachment_file(attachment.storage_path)
    attachment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(reply)
    record_audit_event(
        db,
        module="community",
        event_type="community_reply_attachment_deleted",
        message=f"Adjunto eliminado de respuesta {reply.id}",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_attachment",
        entity_id=attachment.id,
        payload={"file_name": attachment.file_name, "scope": post.scope},
    )
    return _serialize_reply(reply, current_user, sibling_replies)


@router.delete("/attachments/{attachment_id}/moderate", status_code=status.HTTP_204_NO_CONTENT)
def moderate_community_attachment_delete(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    attachment = _load_active_attachment_or_404(db, attachment_id)
    post, reply, _ = _ensure_can_moderate_attachment(attachment, current_user, active_company_id, db)
    _remove_attachment_file(attachment.storage_path)
    attachment.deleted_at = datetime.now(timezone.utc)
    db.commit()
    record_audit_event(
        db,
        module="community",
        event_type="community_attachment_moderated",
        message=f"Adjunto moderado y retirado ({attachment.id})",
        actor=current_user,
        target_empresa_id=post.target_empresa_id,
        entity_type="community_attachment",
        entity_id=attachment.id,
        payload={
            "file_name": attachment.file_name,
            "scope": post.scope,
            "post_id": post.id,
            "reply_id": reply.id if reply else None,
        },
    )
    return None


@router.post("/posts/{post_id}/moderate", response_model=CommunityPostResponse)
def moderate_community_post(
    post_id: int,
    payload: CommunityPostModerationRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post or post.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Publicación no encontrada.")
    if not _can_moderate_post(post, current_user, active_company_id):
        raise HTTPException(status_code=403, detail="No tiene permisos para moderar esta publicación.")

    if payload.action == "ocultar":
        post.status = "oculto"
    elif payload.action == "cerrar":
        post.status = "cerrado"
        post.allow_replies = False
    elif payload.action == "publicar":
        post.status = "publicado"
        post.allow_replies = True
    elif payload.action == "fijar":
        post.is_pinned = True
    elif payload.action == "desfijar":
        post.is_pinned = False
    elif payload.action == "eliminar":
        post.deleted_at = datetime.now(timezone.utc)
        post.status = "eliminado"

    db.commit()
    db.refresh(post)
    return _serialize_post(post, current_user)


@router.get("/users", response_model=List[CommunityVisibleUserResponse])
def read_community_visible_users(
    q: str = Query("", max_length=120),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    query = db.query(Usuario).filter(
        Usuario.activo.is_(True),
        Usuario.id != current_user.id,
        Usuario.empresa_id == active_company_id,
    )
    term = (q or "").strip()
    if term:
        like_term = f"%{term}%"
        query = query.filter(
            or_(
                Usuario.nombre_completo.ilike(like_term),
                Usuario.email.ilike(like_term),
                Usuario.alias.ilike(like_term),
            )
        )
    users = query.order_by(Usuario.nombre_completo.asc()).limit(25).all()
    return [
        CommunityVisibleUserResponse(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            empresa_id=user.empresa_id,
            empresa_nombre=user.empresa.nombre if user.empresa else None,
            rol=user.rol,
            community_handle=_community_user_handle(user),
            last_active_at=user.last_active_at,
            community_state=_community_state_from_sanctions(_get_active_user_sanctions(db, user.id, active_company_id)),
            active_sanctions=[sanction.sanction_type for sanction in _get_active_user_sanctions(db, user.id, active_company_id)],
        )
        for user in users
    ]


@router.get("/admin/users", response_model=List[CommunityVisibleUserResponse])
def read_community_admin_users(
    q: str = Query("", max_length=120),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    if not _can_manage_topics(current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para administrar usuarios de Comunidad.")

    query = db.query(Usuario).filter(
        Usuario.activo.is_(True),
        Usuario.empresa_id == active_company_id,
    )
    term = (q or "").strip()
    if term:
        like_term = f"%{term}%"
        query = query.filter(
            or_(
                Usuario.nombre_completo.ilike(like_term),
                Usuario.email.ilike(like_term),
                Usuario.alias.ilike(like_term),
            )
        )
    users = query.order_by(Usuario.last_active_at.desc().nullslast(), Usuario.nombre_completo.asc()).all()
    return [
        CommunityVisibleUserResponse(
            id=user.id,
            nombre_completo=user.nombre_completo,
            email=user.email,
            empresa_id=user.empresa_id,
            empresa_nombre=user.empresa.nombre if user.empresa else None,
            rol=user.rol,
            community_handle=_community_user_handle(user),
            last_active_at=user.last_active_at,
            community_state=_community_state_from_sanctions(_get_active_user_sanctions(db, user.id, active_company_id)),
            active_sanctions=[sanction.sanction_type for sanction in _get_active_user_sanctions(db, user.id, active_company_id)],
        )
        for user in users
    ]


@router.get("/topics", response_model=List[CommunityTopicResponse])
def read_community_topics(
    scope: str = Query(..., pattern="^(publico|interno_empresa)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    query = db.query(CommunityTopic).filter(
        CommunityTopic.scope == scope,
        CommunityTopic.is_active.is_(True),
    )
    if scope == "interno_empresa":
        query = query.filter(CommunityTopic.target_empresa_id == active_company_id)
    topics = query.outerjoin(CommunityCategory, CommunityTopic.category_id == CommunityCategory.id).order_by(
        CommunityCategory.orden.asc().nullslast(),
        CommunityCategory.nombre.asc().nullslast(),
        CommunityTopic.nombre.asc(),
    ).all()
    return [
        _serialize_topic(topic, current_user)
        for topic in topics
        if _can_access_topic(topic, current_user)
    ]


@router.get("/categories", response_model=List[CommunityCategoryResponse])
def read_community_categories(
    scope: str = Query(..., pattern="^(publico|interno_empresa)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    query = db.query(CommunityCategory).filter(
        CommunityCategory.scope == scope,
        CommunityCategory.is_active.is_(True),
    )
    if scope == "interno_empresa":
        query = query.filter(CommunityCategory.target_empresa_id == active_company_id)
    categories = query.order_by(CommunityCategory.orden.asc(), CommunityCategory.nombre.asc()).all()
    return [_serialize_category(category) for category in categories]


@router.post("/categories", response_model=CommunityCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_community_category(
    payload: CommunityCategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    _ensure_not_sanctioned(db, current_user, active_company_id, payload.scope)
    category = CommunityCategory(
        scope=payload.scope,
        nombre=payload.nombre.strip(),
        descripcion=(payload.descripcion or "").strip() or None,
        orden=payload.orden or 0,
        is_active=True,
        target_empresa_id=active_company_id if payload.scope == "interno_empresa" else None,
        created_by_user_id=current_user.id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return _serialize_category(category)


@router.put("/categories/{category_id}", response_model=CommunityCategoryResponse)
def update_community_category(
    category_id: int,
    payload: CommunityCategoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    category = _load_category_or_404(db, category_id)
    if not _can_manage_topics(current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para actualizar categorías.")
    if category.scope == "publico" and not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede administrar categorías públicas.")
    if category.scope == "interno_empresa" and category.target_empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="Solo puede administrar categorías internas de su empresa activa.")
    data = payload.model_dump(exclude_unset=True)
    for key in ("nombre", "descripcion", "orden", "is_active"):
        if key in data:
            value = data[key]
            if isinstance(value, str):
                value = value.strip() or None
            setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return _serialize_category(category)


@router.post("/topics", response_model=CommunityTopicResponse, status_code=status.HTTP_201_CREATED)
def create_community_topic(
    payload: CommunityTopicCreateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    _ensure_not_sanctioned(db, current_user, active_company_id, payload.scope)
    if payload.scope == "publico":
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=f"{payload.nombre or ''}\n{payload.descripcion or ''}",
            content_type="topic",
        )

    category = _load_category_or_404(db, payload.category_id)
    if category:
        _ensure_category_scope(category, payload.scope, active_company_id)
    target_empresa_id = active_company_id if payload.scope == "interno_empresa" else None
    topic = CommunityTopic(
        scope=payload.scope,
        category_id=category.id if category else None,
        nombre=payload.nombre.strip(),
        descripcion=(payload.descripcion or "").strip() or None,
        is_restricted=payload.is_restricted,
        is_active=True,
        target_empresa_id=target_empresa_id,
        created_by_user_id=current_user.id,
    )
    db.add(topic)
    db.flush()

    if payload.is_restricted:
        candidate_users = (
            db.query(Usuario)
            .filter(Usuario.id.in_(payload.user_ids), Usuario.activo.is_(True))
            .all()
        ) if payload.user_ids else []
        for candidate in candidate_users:
            if payload.scope == "interno_empresa" and candidate.empresa_id != active_company_id:
                continue
            db.add(CommunityTopicMember(topic_id=topic.id, user_id=candidate.id, added_by_user_id=current_user.id))

    db.commit()
    db.refresh(topic)
    return _serialize_topic(topic, current_user)


@router.put("/topics/{topic_id}", response_model=CommunityTopicResponse)
def update_community_topic(
    topic_id: int,
    payload: CommunityTopicUpdateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    topic = _load_topic_or_404(db, topic_id)
    if not _can_manage_topics(current_user):
        raise HTTPException(status_code=403, detail="No tiene permisos para actualizar temas.")
    if topic.scope == "publico" and not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede administrar temas públicos.")
    if topic.scope == "interno_empresa" and topic.target_empresa_id != active_company_id:
        raise HTTPException(status_code=403, detail="Solo puede administrar temas internos de su empresa activa.")

    data = payload.model_dump(exclude_unset=True)
    if topic.scope == "publico":
        proposed_name = data["nombre"] if "nombre" in data else topic.nombre
        proposed_description = data["descripcion"] if "descripcion" in data else topic.descripcion
        _apply_public_link_infraction(
            db,
            current_user=current_user,
            active_company_id=active_company_id,
            body_text=f"{proposed_name or ''}\n{proposed_description or ''}",
            content_type="topic",
        )
    if "category_id" in data:
        category = _load_category_or_404(db, data["category_id"])
        if category:
            _ensure_category_scope(category, topic.scope, active_company_id)
        topic.category_id = category.id if category else None
    for key in ("nombre", "descripcion", "is_restricted", "is_active"):
        if key in data:
            value = data[key]
            if isinstance(value, str):
                value = value.strip() or None
            setattr(topic, key, value)
    if "user_ids" in data:
        new_user_ids = set(data["user_ids"] or [])
        for member in list(topic.members):
            if member.user_id not in new_user_ids:
                db.delete(member)
        if new_user_ids:
            candidates = db.query(Usuario).filter(Usuario.id.in_(new_user_ids), Usuario.activo.is_(True)).all()
            existing_user_ids = {member.user_id for member in topic.members}
            for candidate in candidates:
                if topic.scope == "interno_empresa" and candidate.empresa_id != active_company_id:
                    continue
                if candidate.id not in existing_user_ids:
                    db.add(CommunityTopicMember(topic_id=topic.id, user_id=candidate.id, added_by_user_id=current_user.id))
    db.commit()
    db.refresh(topic)
    return _serialize_topic(topic, current_user)


@router.post("/topics/{topic_id}/follow", response_model=CommunityTopicResponse)
def follow_community_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    topic = _load_topic_or_404(db, topic_id)
    _ensure_topic_scope(topic, topic.scope, active_company_id)
    _ensure_can_access_topic(topic, current_user)
    existing_follow = db.query(CommunityTopicFollow).filter(
        CommunityTopicFollow.topic_id == topic.id,
        CommunityTopicFollow.user_id == current_user.id,
    ).first()
    if not existing_follow:
        db.add(CommunityTopicFollow(topic_id=topic.id, user_id=current_user.id))
        db.commit()
        db.refresh(topic)
    return _serialize_topic(topic, current_user)


@router.delete("/topics/{topic_id}/follow", response_model=CommunityTopicResponse)
def unfollow_community_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    topic = _load_topic_or_404(db, topic_id)
    _ensure_topic_scope(topic, topic.scope, active_company_id)
    _ensure_can_access_topic(topic, current_user)
    existing_follow = db.query(CommunityTopicFollow).filter(
        CommunityTopicFollow.topic_id == topic.id,
        CommunityTopicFollow.user_id == current_user.id,
    ).first()
    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        db.refresh(topic)
    return _serialize_topic(topic, current_user)


@router.get("/dm/threads", response_model=List[CommunityDmThreadResponse])
def read_dm_threads(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    try:
        active_company_id = _resolve_active_company_id(current_user, empresa_id)
        threads = (
            db.query(CommunityDmThread)
            .filter(
                or_(CommunityDmThread.user_a_id == current_user.id, CommunityDmThread.user_b_id == current_user.id),
                or_(CommunityDmThread.empresa_context_id == active_company_id, CommunityDmThread.empresa_context_id.is_(None)),
            )
            .order_by(CommunityDmThread.updated_at.desc())
            .all()
        )
        return [_serialize_dm_thread(thread, current_user) for thread in threads]
    except SQLAlchemyError as exc:
        _raise_community_schema_sync_error(exc)


@router.get("/dm/threads/{thread_id}/messages", response_model=List[CommunityDmMessageResponse])
def read_dm_thread_messages(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    thread = db.query(CommunityDmThread).filter(CommunityDmThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversación no encontrada.")
    _ensure_dm_thread_access(thread, current_user, active_company_id)

    messages = (
        db.query(CommunityDmMessage)
        .filter(
            CommunityDmMessage.thread_id == thread.id,
            CommunityDmMessage.deleted_at.is_(None),
        )
        .order_by(CommunityDmMessage.created_at.asc())
        .all()
    )
    return [
        _serialize_dm_message(message, thread)
        for message in messages
    ]


@router.post("/dm/messages", response_model=CommunityDmMessageResponse, status_code=status.HTTP_201_CREATED)
def send_dm_message(
    payload: CommunityDmSendRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    _ensure_not_sanctioned(db, current_user, active_company_id, "mensajes_directos")
    if payload.recipient_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puede enviarse mensajes a sí mismo.")

    recipient = db.query(Usuario).filter(
        Usuario.id == payload.recipient_user_id,
        Usuario.activo.is_(True),
        Usuario.empresa_id == active_company_id,
    ).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Usuario destinatario no encontrado.")
    _resolve_contextual_mentions(
        db,
        company_id=active_company_id,
        scope="mensajes_directos",
        body=payload.body,
    )

    user_a_id, user_b_id = sorted([current_user.id, recipient.id])
    thread = db.query(CommunityDmThread).filter(
        CommunityDmThread.user_a_id == user_a_id,
        CommunityDmThread.user_b_id == user_b_id,
    ).first()
    if not thread:
        thread = CommunityDmThread(
            user_a_id=user_a_id,
            user_b_id=user_b_id,
            empresa_context_id=active_company_id,
        )
        db.add(thread)
        db.flush()

    if thread.blocked_at is not None:
        blocked_by_name = thread.blocked_by.nombre_completo if thread.blocked_by else "otro usuario"
        raise HTTPException(status_code=403, detail=f"Este canal directo está bloqueado por {blocked_by_name}.")

    message = CommunityDmMessage(
        thread_id=thread.id,
        author_user_id=current_user.id,
        body=payload.body.strip(),
    )
    db.add(message)
    thread.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return _serialize_dm_message(message, thread)


@router.post("/dm/threads/{thread_id}/block", response_model=CommunityDmThreadResponse)
def block_dm_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    thread = db.query(CommunityDmThread).filter(CommunityDmThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversación no encontrada.")
    _ensure_dm_thread_access(thread, current_user, active_company_id)
    thread.blocked_at = datetime.now(timezone.utc)
    thread.blocked_by_user_id = current_user.id
    counterpart = thread.user_b if thread.user_a_id == current_user.id else thread.user_a
    record_audit_event(
        db,
        module="community",
        event_type="community_dm_thread_blocked",
        severity="info",
        actor=current_user,
        target_user_id=counterpart.id if counterpart else None,
        target_empresa_id=active_company_id,
        entity_type="community_dm_thread",
        entity_id=thread.id,
        message=f"Bloqueo directo del hilo DM {thread.id}",
        payload={"counterpart_user_id": counterpart.id if counterpart else None},
    )
    db.commit()
    db.refresh(thread)
    return _serialize_dm_thread(thread, current_user)


@router.post("/dm/threads/{thread_id}/unblock", response_model=CommunityDmThreadResponse)
def unblock_dm_thread(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    thread = db.query(CommunityDmThread).filter(CommunityDmThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversación no encontrada.")
    _ensure_dm_thread_access(thread, current_user, active_company_id)
    if thread.blocked_by_user_id and thread.blocked_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el usuario que bloqueó la conversación puede reactivarla.")
    thread.blocked_at = None
    thread.blocked_by_user_id = None
    counterpart = thread.user_b if thread.user_a_id == current_user.id else thread.user_a
    record_audit_event(
        db,
        module="community",
        event_type="community_dm_thread_unblocked",
        severity="info",
        actor=current_user,
        target_user_id=counterpart.id if counterpart else None,
        target_empresa_id=active_company_id,
        entity_type="community_dm_thread",
        entity_id=thread.id,
        message=f"Reactivación directa del hilo DM {thread.id}",
        payload={"counterpart_user_id": counterpart.id if counterpart else None},
    )
    db.commit()
    db.refresh(thread)
    return _serialize_dm_thread(thread, current_user)


@router.get("/sanctions", response_model=List[CommunitySanctionResponse])
def read_community_sanctions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    query = db.query(CommunitySanction)
    if _is_superadmin(current_user):
        query = query.filter(
            or_(
                CommunitySanction.scope != "interno_empresa",
                CommunitySanction.target_empresa_id == active_company_id,
                CommunitySanction.target_empresa_id.is_(None),
            )
        )
    elif _is_company_admin(current_user):
        query = query.filter(
            CommunitySanction.scope == "interno_empresa",
            CommunitySanction.target_empresa_id == active_company_id,
        )
    else:
        query = query.filter(CommunitySanction.target_user_id == current_user.id)

    sanctions = query.order_by(CommunitySanction.created_at.desc()).all()
    return [_serialize_sanction(sanction) for sanction in sanctions]


@router.post("/sanctions", response_model=CommunitySanctionResponse, status_code=status.HTTP_201_CREATED)
def create_community_sanction(
    payload: CommunitySanctionCreateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    target_user = db.query(Usuario).filter(Usuario.id == payload.target_user_id, Usuario.activo.is_(True)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario objetivo no encontrado.")
    _ensure_can_issue_sanction(current_user, target_user, payload, active_company_id)

    target_empresa_id = payload.target_empresa_id
    if payload.scope == "interno_empresa":
        target_empresa_id = target_empresa_id or target_user.empresa_id
    elif payload.scope != "interno_empresa":
        target_empresa_id = None

    sanction = CommunitySanction(
        target_user_id=target_user.id,
        issued_by_user_id=current_user.id,
        sanction_type=payload.sanction_type,
        scope=payload.scope,
        target_empresa_id=target_empresa_id,
        reason=payload.reason.strip(),
        is_active=True,
        expires_at=payload.expires_at,
    )
    db.add(sanction)
    db.commit()
    db.refresh(sanction)
    return _serialize_sanction(sanction)


@router.get("/sanction-appeals", response_model=List[CommunitySanctionAppealResponse])
def read_community_sanction_appeals(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    try:
        active_company_id = _resolve_active_company_id(current_user, empresa_id)
        query = db.query(CommunitySanctionAppeal).join(CommunitySanction, CommunitySanctionAppeal.sanction_id == CommunitySanction.id)
        if _is_superadmin(current_user):
            query = query.filter(
                or_(
                    CommunitySanction.scope != "interno_empresa",
                    CommunitySanction.target_empresa_id == active_company_id,
                    CommunitySanction.target_empresa_id.is_(None),
                )
            )
        elif _is_company_admin(current_user):
            query = query.filter(
                CommunitySanction.scope == "interno_empresa",
                CommunitySanction.target_empresa_id == active_company_id,
            )
        else:
            query = query.filter(CommunitySanctionAppeal.appellant_user_id == current_user.id)
        appeals = query.order_by(CommunitySanctionAppeal.created_at.desc()).all()
        return [_serialize_sanction_appeal(appeal) for appeal in appeals]
    except SQLAlchemyError as exc:
        _raise_community_schema_sync_error(exc)


@router.post("/sanction-appeals", response_model=CommunitySanctionAppealResponse, status_code=status.HTTP_201_CREATED)
def create_community_sanction_appeal(
    payload: CommunitySanctionAppealCreateRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    sanction = db.query(CommunitySanction).filter(CommunitySanction.id == payload.sanction_id).first()
    if not sanction:
        raise HTTPException(status_code=404, detail="Sanción no encontrada.")
    if sanction.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo puede apelar sanciones propias.")
    if not _is_sanction_active(sanction):
        raise HTTPException(status_code=400, detail="Solo se pueden apelar sanciones activas.")
    if sanction.scope == "interno_empresa" and sanction.target_empresa_id not in (None, active_company_id):
        raise HTTPException(status_code=403, detail="La sanción no pertenece al contexto activo.")
    existing_open = db.query(CommunitySanctionAppeal).filter(
        CommunitySanctionAppeal.sanction_id == sanction.id,
        CommunitySanctionAppeal.appellant_user_id == current_user.id,
        CommunitySanctionAppeal.status == "abierta",
    ).first()
    if existing_open:
        raise HTTPException(status_code=409, detail="Ya existe una apelación abierta para esta sanción.")

    appeal = CommunitySanctionAppeal(
        sanction_id=sanction.id,
        appellant_user_id=current_user.id,
        status="abierta",
        reason=payload.reason.strip(),
    )
    db.add(appeal)
    db.commit()
    db.refresh(appeal)
    record_audit_event(
        db,
        module="community",
        event_type="community_sanction_appeal_created",
        severity="info",
        actor=current_user,
        target_user_id=current_user.id,
        target_empresa_id=active_company_id,
        entity_type="community_sanction_appeal",
        entity_id=appeal.id,
        message=f"Apelación creada para la sanción {sanction.id}",
        payload={"sanction_id": sanction.id},
    )
    db.refresh(appeal)
    return _serialize_sanction_appeal(appeal)


@router.post("/sanction-appeals/{appeal_id}/resolve", response_model=CommunitySanctionAppealResponse)
def resolve_community_sanction_appeal(
    appeal_id: int,
    payload: CommunitySanctionAppealResolveRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    appeal = db.query(CommunitySanctionAppeal).filter(CommunitySanctionAppeal.id == appeal_id).first()
    if not appeal:
        raise HTTPException(status_code=404, detail="Apelación no encontrada.")
    _ensure_can_review_sanction_appeal(appeal, current_user, active_company_id)
    if appeal.status != "abierta":
        raise HTTPException(status_code=409, detail="La apelación ya fue resuelta.")

    appeal.status = payload.status
    appeal.resolution_note = payload.resolution_note.strip()
    appeal.reviewed_by_user_id = current_user.id
    appeal.reviewed_at = datetime.now(timezone.utc)

    sanction = appeal.sanction
    if payload.status == "aceptada" and sanction:
        sanction.is_active = False
        sanction.expires_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(appeal)
    record_audit_event(
        db,
        module="community",
        event_type="community_sanction_appeal_resolved",
        severity="info",
        actor=current_user,
        target_user_id=appeal.appellant_user_id,
        target_empresa_id=active_company_id,
        entity_type="community_sanction_appeal",
        entity_id=appeal.id,
        message=f"Apelación {appeal.id} resuelta como {appeal.status}",
        payload={"sanction_id": appeal.sanction_id, "status": appeal.status},
    )
    db.refresh(appeal)
    return _serialize_sanction_appeal(appeal)


@router.get("/infractions", response_model=List[CommunityInfractionResponse])
def read_community_infractions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede consultar infracciones globales.")
    infractions = db.query(CommunityInfraction).filter(
        CommunityInfraction.target_empresa_id == active_company_id,
    ).order_by(CommunityInfraction.created_at.desc()).all()
    return [_serialize_infraction(item) for item in infractions]


@router.get("/admin-alerts", response_model=List[CommunityAdminAlertResponse])
def read_community_admin_alerts(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede consultar alertas administrativas.")
    alerts = db.query(CommunityAdminAlert).filter(
        CommunityAdminAlert.target_empresa_id == active_company_id,
    ).order_by(CommunityAdminAlert.created_at.desc()).all()
    return [_serialize_admin_alert(item) for item in alerts]


@router.post("/admin-alerts/{alert_id}/read", response_model=CommunityAdminAlertResponse)
def mark_community_admin_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede gestionar alertas administrativas.")
    alert = db.query(CommunityAdminAlert).filter(
        CommunityAdminAlert.id == alert_id,
        CommunityAdminAlert.target_empresa_id == active_company_id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada.")
    alert.is_read = True
    alert.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return _serialize_admin_alert(alert)


@router.post("/admin-alerts/mark-all-read", response_model=CommunityBulkActionResponse)
def mark_all_community_admin_alerts_as_read(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    active_company_id = _resolve_active_company_id(current_user, empresa_id)
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadmin puede gestionar alertas administrativas.")
    alerts = db.query(CommunityAdminAlert).filter(
        CommunityAdminAlert.target_empresa_id == active_company_id,
        CommunityAdminAlert.is_read.is_(False),
    ).all()
    now = datetime.now(timezone.utc)
    for alert in alerts:
        alert.is_read = True
        alert.read_at = now
    if alerts:
        db.commit()
    return CommunityBulkActionResponse(updated_count=len(alerts))
