import json
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario


def record_audit_event(
    db: Session,
    *,
    module: str,
    event_type: str,
    message: str,
    severity: str = "info",
    actor: Optional[Usuario] = None,
    empresa_id: Optional[int] = None,
    target_user_id: Optional[int] = None,
    target_empresa_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str | int] = None,
    payload: Optional[Any] = None,
) -> None:
    try:
        event = SystemAuditEvent(
            actor_user_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            actor_role=actor.rol if actor else None,
            empresa_id=empresa_id if empresa_id is not None else (actor.empresa_id if actor else None),
            target_user_id=target_user_id,
            target_empresa_id=target_empresa_id,
            module=module,
            event_type=event_type,
            severity=severity,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            message=message,
            payload_json=json.dumps(payload, ensure_ascii=True, default=str) if payload is not None else None,
        )
        db.add(event)
        db.commit()
    except Exception:
        db.rollback()
