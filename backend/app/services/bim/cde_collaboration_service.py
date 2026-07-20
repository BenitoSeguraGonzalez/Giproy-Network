from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_cde_collaboration import BimCdeCollaborationEvent, BimCdeCollaborationPresence
from app.models.usuario import Usuario


ACTIVE_WINDOW_SECONDS = 45
MAX_CONTEXT_ITEMS = 12
MAX_CONTEXT_VALUE_LENGTH = 160


def _clean_context(value: dict) -> dict:
    if len(value) > MAX_CONTEXT_ITEMS:
        raise HTTPException(status_code=422, detail="El contexto colaborativo excede el limite permitido.")
    clean = {}
    for key, item in value.items():
        normalized_key = str(key).strip()[:40]
        if not normalized_key:
            continue
        if item is None or isinstance(item, (bool, int, float)):
            clean[normalized_key] = item
        elif isinstance(item, str):
            clean[normalized_key] = item.strip()[:MAX_CONTEXT_VALUE_LENGTH]
        else:
            raise HTTPException(status_code=422, detail="El contexto colaborativo solo admite valores escalares.")
    return clean


def record_collaboration_event(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    actor_id: int | None,
    event_type: str,
    summary: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
    payload: dict | None = None,
) -> BimCdeCollaborationEvent:
    event = BimCdeCollaborationEvent(
        empresa_id=company_id,
        proyecto_id=project_id,
        actor_id=actor_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary.strip()[:500],
        payload_json=payload or {},
    )
    db.add(event)
    db.flush()
    return event


def heartbeat_presence(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    now = datetime.now(timezone.utc)
    context = _clean_context(payload.context)
    db.query(BimCdeCollaborationPresence).filter(
        BimCdeCollaborationPresence.proyecto_id == project_id,
        BimCdeCollaborationPresence.empresa_id == company_id,
        BimCdeCollaborationPresence.last_seen_at < now - timedelta(hours=24),
    ).delete(synchronize_session=False)
    presence = db.query(BimCdeCollaborationPresence).filter(
        BimCdeCollaborationPresence.proyecto_id == project_id,
        BimCdeCollaborationPresence.empresa_id == company_id,
        BimCdeCollaborationPresence.usuario_id == user_id,
        BimCdeCollaborationPresence.session_key == payload.session_key,
    ).first()
    if presence is None:
        presence = BimCdeCollaborationPresence(
            empresa_id=company_id,
            proyecto_id=project_id,
            usuario_id=user_id,
            session_key=payload.session_key,
            workspace=payload.workspace,
            context_json=context,
            last_seen_at=now,
        )
        db.add(presence)
        db.flush()
        record_collaboration_event(
            db,
            project_id=project_id,
            company_id=company_id,
            actor_id=user_id,
            event_type="presence.joined",
            summary="Se conecto al espacio BIM.",
            entity_type="presence",
            entity_id=presence.id,
            payload={"workspace": payload.workspace},
        )
    else:
        context_changed = presence.workspace != payload.workspace or presence.context_json != context
        presence.workspace = payload.workspace
        presence.context_json = context
        presence.last_seen_at = now
        if context_changed:
            record_collaboration_event(
                db,
                project_id=project_id,
                company_id=company_id,
                actor_id=user_id,
                event_type="presence.context_changed",
                summary="Cambio su contexto de trabajo BIM.",
                entity_type="presence",
                entity_id=presence.id,
                payload={"workspace": payload.workspace},
            )
    db.commit()
    db.refresh(presence)
    return _serialize_presence(db, presence, current_user_id=user_id)


def leave_presence(db: Session, *, project_id: int, company_id: int, user_id: int, session_key: str) -> bool:
    presence = db.query(BimCdeCollaborationPresence).filter(
        BimCdeCollaborationPresence.proyecto_id == project_id,
        BimCdeCollaborationPresence.empresa_id == company_id,
        BimCdeCollaborationPresence.usuario_id == user_id,
        BimCdeCollaborationPresence.session_key == session_key,
    ).first()
    if presence is None:
        return False
    presence_id = presence.id
    workspace = presence.workspace
    db.delete(presence)
    record_collaboration_event(
        db,
        project_id=project_id,
        company_id=company_id,
        actor_id=user_id,
        event_type="presence.left",
        summary="Salio del espacio BIM.",
        entity_type="presence",
        entity_id=presence_id,
        payload={"workspace": workspace},
    )
    db.commit()
    return True


def _serialize_presence(db: Session, presence: BimCdeCollaborationPresence, *, current_user_id: int) -> dict:
    user = db.query(Usuario).filter(Usuario.id == presence.usuario_id).first()
    return {
        "id": presence.id,
        "user_id": presence.usuario_id,
        "user_name": (user.nombre_completo or user.email) if user else "Usuario retirado",
        "session_key": presence.session_key,
        "workspace": presence.workspace,
        "context": presence.context_json or {},
        "last_seen_at": presence.last_seen_at,
        "current_user": presence.usuario_id == current_user_id,
    }


def list_active_presences(db: Session, *, project_id: int, company_id: int, current_user_id: int) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=ACTIVE_WINDOW_SECONDS)
    rows = db.query(BimCdeCollaborationPresence).filter(
        BimCdeCollaborationPresence.proyecto_id == project_id,
        BimCdeCollaborationPresence.empresa_id == company_id,
        BimCdeCollaborationPresence.last_seen_at >= cutoff,
    ).order_by(BimCdeCollaborationPresence.last_seen_at.desc(), BimCdeCollaborationPresence.id.desc()).all()
    return [_serialize_presence(db, row, current_user_id=current_user_id) for row in rows]


def list_collaboration_events(db: Session, *, project_id: int, company_id: int, after_id: int, limit: int) -> dict:
    query = db.query(BimCdeCollaborationEvent).filter(
        BimCdeCollaborationEvent.proyecto_id == project_id,
        BimCdeCollaborationEvent.empresa_id == company_id,
    )
    if after_id:
        rows = query.filter(BimCdeCollaborationEvent.id > after_id).order_by(BimCdeCollaborationEvent.id.asc()).limit(limit).all()
    else:
        rows = list(reversed(query.order_by(BimCdeCollaborationEvent.id.desc()).limit(limit).all()))
    actor_ids = {row.actor_id for row in rows if row.actor_id}
    users = {item.id: item for item in db.query(Usuario).filter(Usuario.id.in_(actor_ids)).all()} if actor_ids else {}
    events = [{
        "id": row.id,
        "event_type": row.event_type,
        "entity_type": row.entity_type,
        "entity_id": row.entity_id,
        "actor_id": row.actor_id,
        "actor_name": (users[row.actor_id].nombre_completo or users[row.actor_id].email) if row.actor_id in users else "Sistema BIM",
        "summary": row.summary,
        "payload": row.payload_json or {},
        "created_at": row.created_at,
    } for row in rows]
    return {
        "contract_version": "giproy_bim_cde_collaboration_feed_v1",
        "project_id": project_id,
        "company_id": company_id,
        "cursor": events[-1]["id"] if events else after_id,
        "events": events,
    }
