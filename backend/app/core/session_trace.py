import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import Request

from app.core.config import settings


TRACE_FILE = Path(settings.AUTH_SESSION_TRACE_FILE)


def _sanitize(value: Any) -> Any:
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _sanitize(val) for key, val in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_sanitize(item) for item in value]
    return str(value)


def resolve_client_ip(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    client = getattr(request, "client", None)
    return getattr(client, "host", None)


def resolve_request_id(request: Optional[Request]) -> Optional[str]:
    if request is None:
        return None
    return getattr(request.state, "request_id", None) or request.headers.get("x-request-id")


def log_session_trace(
    event_type: str,
    *,
    request: Optional[Request] = None,
    user: Any = None,
    empresa_id: Optional[int] = None,
    endpoint: Optional[str] = None,
    method: Optional[str] = None,
    session_id: Optional[str] = None,
    db_session_id: Optional[str] = None,
    reason: Optional[str] = None,
    status_code: Optional[int] = None,
    payload: Optional[dict[str, Any]] = None,
) -> None:
    if not settings.AUTH_SESSION_TRACE_ENABLED:
        return

    try:
        TRACE_FILE.parent.mkdir(parents=True, exist_ok=True)
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "request_id": resolve_request_id(request),
            "method": method or (request.method if request else None),
            "endpoint": endpoint or (str(request.url.path) if request else None),
            "user_id": getattr(user, "id", None),
            "user_email": getattr(user, "email", None),
            "empresa_id": empresa_id if empresa_id is not None else getattr(user, "empresa_id", None),
            "role": getattr(user, "rol", None),
            "session_id": session_id,
            "db_session_id": db_session_id,
            "client_ip": resolve_client_ip(request),
            "user_agent": request.headers.get("user-agent") if request else None,
            "reason": reason,
            "status_code": status_code,
            "payload": _sanitize(payload or {}),
        }
        with TRACE_FILE.open("a", encoding="utf-8") as trace_file:
            trace_file.write(json.dumps(record, ensure_ascii=True) + "\n")
    except Exception as exc:
        print(f"Error writing auth session trace: {exc}")
