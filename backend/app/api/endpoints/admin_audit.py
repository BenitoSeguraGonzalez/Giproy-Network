from collections import deque
from datetime import datetime
import json
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.system_announcement import SystemAnnouncement
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.schemas.system_audit_event import SystemAuditEventResponse
from app.services.audit_event import AUDIT_RETENTION_POLICY, verify_audit_chain

router = APIRouter()

ROOT_DIR = Path(__file__).resolve().parents[4]
BACKEND_DIR = ROOT_DIR / "backend"
AUDIT_FILES = {
    "auth_debug": BACKEND_DIR / "auth_debug.log",
    "fatal_errors": BACKEND_DIR / "fatal_errors.log",
}
SANITIZE_SCRIPT = BACKEND_DIR / "scripts" / "sanitize_data_integrity.py"
AUDIT_SCRIPT = BACKEND_DIR / "scripts" / "audit_data_integrity.py"


def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores",
        )
    return current_user


def _safe_tail(path: Path, limit: int) -> List[str]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8", errors="ignore") as handle:
        return list(deque(handle, maxlen=limit))


def _file_stats(path: Path):
    if not path.exists():
        return {
            "exists": False,
            "size_bytes": 0,
            "updated_at": None,
        }

    stat = path.stat()
    return {
        "exists": True,
        "size_bytes": stat.st_size,
        "updated_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
    }


def _serialize_structured_event(item: SystemAuditEvent) -> SystemAuditEventResponse:
    payload = None
    if item.payload_json:
        try:
            payload = json.loads(item.payload_json)
        except json.JSONDecodeError:
            payload = item.payload_json

    return SystemAuditEventResponse(
        id=item.id,
        actor_user_id=item.actor_user_id,
        actor_email=item.actor_email,
        actor_role=item.actor_role,
        empresa_id=item.empresa_id,
        empresa_nombre=item.empresa.nombre if item.empresa else None,
        proyecto_id=item.proyecto_id,
        proyecto_codigo_root=item.proyecto_codigo_root,
        proyecto_revision=item.proyecto_revision,
        target_user_id=item.target_user_id,
        target_user_email=item.target_user.email if item.target_user else None,
        target_empresa_id=item.target_empresa_id,
        target_empresa_nombre=item.target_empresa.nombre if item.target_empresa else None,
        module=item.module,
        event_type=item.event_type,
        severity=item.severity,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        capability=item.capability,
        correlation_id=item.correlation_id,
        operation_status=item.operation_status,
        previous_hash=item.previous_hash,
        hash_nonce=item.hash_nonce,
        event_hash=item.event_hash,
        message=item.message,
        payload=payload,
        detail=item.detail_json,
        created_at=item.created_at,
    )


@router.get("/summary")
def read_admin_audit_summary(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    empresas = db.query(Empresa).count()
    empresas_activas = db.query(Empresa).filter(Empresa.activa.is_(True)).count()
    usuarios = db.query(Usuario).count()
    superadmins = db.query(Usuario).filter(Usuario.rol.ilike("superadministrador")).count()
    comunicados_activos = db.query(SystemAnnouncement).filter(SystemAnnouncement.is_active.is_(True)).count()
    structured_total = db.query(SystemAuditEvent).count()
    events_24h = db.query(SystemAuditEvent).filter(SystemAuditEvent.created_at >= func.now() - text("interval '24 hours'")).count()
    critical_7d = db.query(SystemAuditEvent).filter(
        SystemAuditEvent.severity == "critical",
        SystemAuditEvent.created_at >= func.now() - text("interval '7 days'")
    ).count()

    return {
        "metrics": {
            "empresas": empresas,
            "empresas_activas": empresas_activas,
            "usuarios": usuarios,
            "superadministradores": superadmins,
            "comunicados_activos": comunicados_activos,
            "structured_events_total": structured_total,
            "structured_events_24h": events_24h,
            "critical_events_7d": critical_7d,
        },
        "sources": {
            "auth_debug": _file_stats(AUDIT_FILES["auth_debug"]),
            "fatal_errors": _file_stats(AUDIT_FILES["fatal_errors"]),
            "audit_script": {"exists": AUDIT_SCRIPT.exists()},
            "sanitize_script": {"exists": SANITIZE_SCRIPT.exists()},
        },
        "retention_policy": AUDIT_RETENTION_POLICY,
        "backlog": [
            "La auditoría estructurada cubre autenticación, empresas, proyecto, presupuesto, Gantt, EDT, EDO, interesados y fórmula polinómica.",
            "Los logs técnicos legacy pueden incorporarse de forma idempotente, saneada y encadenada mediante el importador controlado.",
        ],
    }


@router.get("/events", response_model=List[SystemAuditEventResponse])
def read_admin_audit_events(
    limit: int = Query(50, ge=1, le=300),
    module: str | None = Query(None),
    severity: str | None = Query(None),
    empresa_id: int | None = Query(None),
    actor_user_id: int | None = Query(None),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    query = db.query(SystemAuditEvent)
    if module:
        query = query.filter(SystemAuditEvent.module == module)
    if severity:
        query = query.filter(SystemAuditEvent.severity == severity)
    if empresa_id:
        query = query.filter(
            (SystemAuditEvent.empresa_id == empresa_id) | (SystemAuditEvent.target_empresa_id == empresa_id)
        )
    if actor_user_id:
        query = query.filter(SystemAuditEvent.actor_user_id == actor_user_id)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            (SystemAuditEvent.message.ilike(like))
            | (SystemAuditEvent.actor_email.ilike(like))
            | (SystemAuditEvent.event_type.ilike(like))
            | (SystemAuditEvent.module.ilike(like))
        )

    items = query.order_by(SystemAuditEvent.created_at.desc()).limit(limit).all()
    return [_serialize_structured_event(item) for item in items]


@router.get("/events/integrity")
def verify_admin_audit_integrity(
    empresa_id: int = Query(..., ge=1),
    proyecto_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    query = db.query(SystemAuditEvent).filter(SystemAuditEvent.empresa_id == empresa_id)
    if proyecto_id is None:
        query = query.filter(SystemAuditEvent.proyecto_id.is_(None))
    else:
        query = query.filter(SystemAuditEvent.proyecto_id == proyecto_id)
    return verify_audit_chain(query.order_by(SystemAuditEvent.id).all())


@router.get("/recent-events")
def read_admin_audit_recent_events(
    limit: int = Query(40, ge=1, le=200),
    current_user: Usuario = Depends(check_superadmin),
):
    items = []
    for source, path in AUDIT_FILES.items():
        for line in _safe_tail(path, limit):
            text = line.strip()
            if not text:
                continue
            items.append({
                "source": source,
                "message": text,
            })

    items.sort(key=lambda item: item["message"], reverse=True)
    return items[:limit]
