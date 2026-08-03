import hashlib
import json
from uuid import uuid4
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario


SENSITIVE_KEYS = {
    "password", "password_hash", "hashed_password", "token", "access_token",
    "refresh_token", "authorization", "cookie", "secret", "api_key",
    "private_key", "content", "file_content", "binary", "base64",
}
MAX_AUDIT_PAYLOAD_BYTES = 32768
AUDIT_RETENTION_POLICY = {
    "minimum_days": 3650,
    "automatic_purge_enabled": False,
    "legal_hold_supported": True,
    "archive_requires_integrity_verification": True,
}


def sanitize_audit_payload(value: Any, *, depth: int = 0) -> Any:
    if depth > 8:
        return "[TRUNCATED_DEPTH]"
    if isinstance(value, dict):
        return {
            str(key): ("[REDACTED]" if str(key).lower() in SENSITIVE_KEYS else sanitize_audit_payload(item, depth=depth + 1))
            for key, item in value.items()
        }
    if isinstance(value, (list, tuple)):
        return [sanitize_audit_payload(item, depth=depth + 1) for item in value[:200]]
    if isinstance(value, bytes):
        return f"[BINARY {len(value)} bytes]"
    if isinstance(value, str) and len(value) > 4000:
        return value[:4000] + "[TRUNCATED]"
    return value


def _canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=True, default=str, sort_keys=True, separators=(",", ":"))


def verify_audit_chain(events: list[SystemAuditEvent]) -> dict[str, Any]:
    previous_hash = None
    legacy_count = 0
    sealed_events = [item for item in events if item.event_hash and item.hash_nonce]
    legacy_count = len(events) - len(sealed_events)
    for item in sealed_events:
        envelope = {
            "actor_user_id": item.actor_user_id, "empresa_id": item.empresa_id,
            "proyecto_id": item.proyecto_id, "module": item.module,
            "event_type": item.event_type, "entity_type": item.entity_type,
            "entity_id": item.entity_id, "capability": item.capability,
            "correlation_id": item.correlation_id, "operation_status": item.operation_status,
            "message": item.message, "payload": item.detail_json,
            "previous_hash": item.previous_hash, "hash_nonce": item.hash_nonce,
        }
        expected = hashlib.sha256(_canonical_json(envelope).encode("utf-8")).hexdigest()
        if item.previous_hash != previous_hash or item.event_hash != expected:
            return {"valid": False, "broken_event_id": item.id}
        previous_hash = item.event_hash
    return {"valid": True, "broken_event_id": None, "event_count": len(events), "sealed_event_count": len(sealed_events), "legacy_unsealed_count": legacy_count, "head_hash": previous_hash}


def record_project_entity_event(db: Session, *, project_id: int, actor: Usuario, module: str, event_type: str, message: str, entity_type: str, entity_id, operation_status: str = "applied", payload: dict | None = None):
    from app.models.proyecto import Proyecto
    project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == actor.empresa_id).first()
    if not project and (actor.rol or "").lower() == "superadministrador":
        project = db.query(Proyecto).filter(Proyecto.id == project_id).first()
    if not project:
        return None
    return record_audit_event(db, module=module, event_type=event_type, message=message, actor=actor, empresa_id=project.empresa_id, proyecto_id=project.id, proyecto_codigo_root=project.codigo_root, proyecto_revision=project.revision, entity_type=entity_type, entity_id=entity_id, operation_status=operation_status, payload=payload or {})


def record_audit_event(
    db: Session,
    *,
    module: str,
    event_type: str,
    message: str,
    severity: str = "info",
    actor: Optional[Usuario] = None,
    empresa_id: Optional[int] = None,
    proyecto_id: Optional[int] = None,
    proyecto_codigo_root: Optional[str] = None,
    proyecto_revision: Optional[int] = None,
    target_user_id: Optional[int] = None,
    target_empresa_id: Optional[int] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str | int] = None,
    capability: Optional[str] = None,
    correlation_id: Optional[str] = None,
    operation_status: Optional[str] = None,
    payload: Optional[Any] = None,
    commit: bool = True,
) -> SystemAuditEvent | None:
    try:
        safe_payload = sanitize_audit_payload(payload) if payload is not None else None
        serialized_payload = _canonical_json(safe_payload) if safe_payload is not None else None
        if serialized_payload and len(serialized_payload.encode("utf-8")) > MAX_AUDIT_PAYLOAD_BYTES:
            safe_payload = {"truncated": True, "sha256": hashlib.sha256(serialized_payload.encode("utf-8")).hexdigest(), "original_bytes": len(serialized_payload.encode("utf-8"))}
            serialized_payload = _canonical_json(safe_payload)
        previous = db.query(SystemAuditEvent).filter(
            SystemAuditEvent.empresa_id == (empresa_id if empresa_id is not None else (actor.empresa_id if actor else None)),
            SystemAuditEvent.proyecto_id == proyecto_id,
            SystemAuditEvent.event_hash.isnot(None),
        ).order_by(SystemAuditEvent.id.desc()).first()
        hash_nonce = str(uuid4())
        envelope = {
            "actor_user_id": actor.id if actor else None, "empresa_id": empresa_id if empresa_id is not None else (actor.empresa_id if actor else None),
            "proyecto_id": proyecto_id, "module": module, "event_type": event_type,
            "entity_type": entity_type, "entity_id": str(entity_id) if entity_id is not None else None,
            "capability": capability, "correlation_id": correlation_id,
            "operation_status": operation_status, "message": message,
            "payload": safe_payload, "previous_hash": previous.event_hash if previous else None,
            "hash_nonce": hash_nonce,
        }
        event = SystemAuditEvent(
            actor_user_id=actor.id if actor else None,
            actor_email=actor.email if actor else None,
            actor_role=actor.rol if actor else None,
            empresa_id=empresa_id if empresa_id is not None else (actor.empresa_id if actor else None),
            proyecto_id=proyecto_id,
            proyecto_codigo_root=proyecto_codigo_root,
            proyecto_revision=proyecto_revision,
            target_user_id=target_user_id,
            target_empresa_id=target_empresa_id,
            module=module,
            event_type=event_type,
            severity=severity,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            capability=capability,
            correlation_id=correlation_id,
            operation_status=operation_status,
            previous_hash=envelope["previous_hash"],
            hash_nonce=hash_nonce,
            event_hash=hashlib.sha256(_canonical_json(envelope).encode("utf-8")).hexdigest(),
            message=message,
            payload_json=serialized_payload,
            detail_json=safe_payload if isinstance(safe_payload, dict) else None,
        )
        db.add(event)
        if commit:
            db.commit()
            db.refresh(event)
        else:
            db.flush()
        return event
    except Exception:
        db.rollback()
        if not commit:
            raise
        return None


def import_legacy_audit_entries(
    db: Session, *, entries: list[dict], empresa_id: int, proyecto_id: int | None = None,
) -> dict:
    """Seal legacy technical logs into the ledger idempotently, without raw secrets."""
    imported = 0
    duplicates = 0
    for raw in entries:
        safe = sanitize_audit_payload(raw)
        fingerprint = hashlib.sha256(_canonical_json(safe).encode("utf-8")).hexdigest()
        correlation_id = f"legacy:{fingerprint}"
        exists = db.query(SystemAuditEvent.id).filter(
            SystemAuditEvent.empresa_id == empresa_id,
            SystemAuditEvent.proyecto_id == proyecto_id,
            SystemAuditEvent.correlation_id == correlation_id,
        ).first()
        if exists:
            duplicates += 1
            continue
        record_audit_event(
            db, module="legacy_technical", event_type="legacy_log_imported",
            message="Entrada técnica histórica incorporada al ledger.",
            empresa_id=empresa_id, proyecto_id=proyecto_id,
            entity_type="legacy_log", entity_id=fingerprint[:24],
            correlation_id=correlation_id, operation_status="archived",
            payload={"legacy_fingerprint": fingerprint, "entry": safe}, commit=False,
        )
        imported += 1
    db.commit()
    return {"imported": imported, "duplicates": duplicates, "total": len(entries)}
