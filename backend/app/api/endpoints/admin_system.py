from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.debug_logger import log_debug
from app.core.database import get_db
from app.models.dispositivo import Dispositivo
from app.models.empresa import Empresa
from app.models.base_trabajo import BaseTrabajo
from app.models.proyecto import Proyecto
from app.models.presupuesto import Presupuesto
from app.models.system_announcement import SystemAnnouncement
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.services.audit_event import record_audit_event

router = APIRouter()

ROOT_DIR = Path(__file__).resolve().parents[4]
BACKEND_DIR = ROOT_DIR / "backend"
ALEMBIC_DIR = BACKEND_DIR / "alembic"
VERSIONS_DIR = ALEMBIC_DIR / "versions"
AUDIT_FILES = {
    "auth_debug": BACKEND_DIR / "auth_debug.log",
    "fatal_errors": BACKEND_DIR / "fatal_errors.log",
}


def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores",
        )
    return current_user


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


@router.get("/status")
def read_admin_system_status(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    db_now = db.execute(text("SELECT CURRENT_TIMESTAMP")).scalar()
    db.execute(text("SELECT 1"))

    current_revision = db.execute(text("SELECT version_num FROM alembic_version LIMIT 1")).scalar()
    migration_files = sorted(VERSIONS_DIR.glob("*.py"))
    latest_migration_file = max(migration_files, key=lambda item: item.stat().st_mtime) if migration_files else None
    active_sessions = db.query(Usuario).filter(
        Usuario.current_session_id.isnot(None), 
        Usuario.activo.is_(True),
        Usuario.current_session_expires_at > datetime.now(timezone.utc),
        Usuario.last_active_at > datetime.now(timezone.utc) - timedelta(minutes=settings.SESSION_INACTIVITY_TIMEOUT_MINUTES)
    ).count()
    total_users = db.query(Usuario).count()
    active_companies = db.query(Empresa).filter(Empresa.activa.is_(True)).count()
    active_announcements = db.query(SystemAnnouncement).filter(SystemAnnouncement.is_active.is_(True)).count()
    structured_audit_events = db.query(SystemAuditEvent).count()

    return {
        "backend": {
            "status": "operativo",
            "project_name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "api_prefix": settings.API_V1_STR,
        },
        "database": {
            "reachable": True,
            "server_time": db_now.isoformat() if db_now else None,
        },
        "migrations": {
            "current_revision": current_revision,
            "known_files": len(migration_files),
            "latest_file": latest_migration_file.name if latest_migration_file else None,
            "latest_file_updated_at": datetime.fromtimestamp(latest_migration_file.stat().st_mtime).isoformat() if latest_migration_file else None,
        },
        "sessions": {
            "active": active_sessions,
            "users_total": total_users,
        },
        "platform": {
            "companies_active": active_companies,
            "announcements_active": active_announcements,
            "structured_audit_events": structured_audit_events,
        },
        "logs": {
            "auth_debug": _file_stats(AUDIT_FILES["auth_debug"]),
            "fatal_errors": _file_stats(AUDIT_FILES["fatal_errors"]),
        },
    }


@router.get("/sessions")
def read_admin_system_sessions(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    users = (
        db.query(Usuario)
        .options(joinedload(Usuario.empresa))
        .filter(
            Usuario.current_session_id.isnot(None), 
            Usuario.activo.is_(True),
            Usuario.current_session_expires_at > datetime.now(timezone.utc),
            Usuario.last_active_at > datetime.now(timezone.utc) - timedelta(minutes=settings.SESSION_INACTIVITY_TIMEOUT_MINUTES)
        )
        .order_by(Usuario.current_session_started_at.desc().nullslast(), Usuario.email.asc())
        .all()
    )

    device_ids = [user.current_session_device_id for user in users if user.current_session_device_id]
    devices = {}
    if device_ids:
        devices = {
            device.device_id: device
            for device in db.query(Dispositivo).filter(Dispositivo.device_id.in_(device_ids)).all()
        }

    return [
        {
            "user_id": user.id,
            "email": user.email,
            "nombre_completo": user.nombre_completo,
            "rol": user.rol,
            "empresa_id": user.empresa_id,
            "empresa_nombre": user.empresa.nombre if user.empresa else None,
            "session_id": user.current_session_id,
            "session_started_at": user.current_session_started_at.isoformat() if user.current_session_started_at else None,
            "device_id": user.current_session_device_id,
            "device_nombre": devices.get(user.current_session_device_id).nombre if user.current_session_device_id and devices.get(user.current_session_device_id) else None,
            "device_sistema": devices.get(user.current_session_device_id).info_sistema if user.current_session_device_id and devices.get(user.current_session_device_id) else None,
            "device_pantalla": devices.get(user.current_session_device_id).info_pantalla if user.current_session_device_id and devices.get(user.current_session_device_id) else None,
            "device_last_access_at": devices.get(user.current_session_device_id).fecha_ultimo_acceso.isoformat() if user.current_session_device_id and devices.get(user.current_session_device_id) and devices.get(user.current_session_device_id).fecha_ultimo_acceso else None,
        }
        for user in users
    ]


@router.post("/sessions/{user_id}/revoke")
def revoke_admin_system_session(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    target_user = db.query(Usuario).options(joinedload(Usuario.empresa)).filter(Usuario.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if not target_user.current_session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El usuario no tiene una sesión activa")

    previous_session_id = target_user.current_session_id
    target_user.current_session_id = None
    target_user.current_session_started_at = None
    target_user.current_session_device_id = None
    db.add(target_user)
    db.commit()

    log_debug(
        f"ADMIN SESSION REVOKED: actor={current_user.email} target={target_user.email} empresa={target_user.empresa.nombre if target_user.empresa else target_user.empresa_id} sid={previous_session_id}",
        filename="auth_debug.log",
    )

    record_audit_event(
        db,
        module="admin_system",
        event_type="session_revoked",
        severity="warning",
        actor=current_user,
        empresa_id=current_user.empresa_id,
        target_user_id=target_user.id,
        target_empresa_id=target_user.empresa_id,
        entity_type="usuario",
        entity_id=target_user.id,
        message=f"Sesión revocada de {target_user.email}",
        payload={
            "previous_session_id": previous_session_id,
            "target_email": target_user.email,
        },
    )

    return {"message": "Sesión revocada"}


@router.get("/company-console/{empresa_id}")
def read_admin_company_console(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada")

    usuarios = (
        db.query(Usuario)
        .filter(Usuario.empresa_id == empresa.id)
        .order_by(Usuario.current_session_id.is_(None), Usuario.nombre_completo.asc())
        .all()
    )
    bases = (
        db.query(BaseTrabajo)
        .filter(BaseTrabajo.empresa_id == empresa.id)
        .order_by(BaseTrabajo.activa.desc(), BaseTrabajo.nombre.asc())
        .all()
    )
    proyectos = (
        db.query(Proyecto)
        .filter(Proyecto.empresa_id == empresa.id)
        .order_by(Proyecto.revision.asc(), Proyecto.fecha_creacion.desc())
        .all()
    )
    presupuestos = (
        db.query(Presupuesto)
        .filter(Presupuesto.empresa_id == empresa.id)
        .order_by(Presupuesto.ultima_modificacion.desc().nullslast(), Presupuesto.fecha_creacion.desc())
        .all()
    )
    recent_events = (
        db.query(SystemAuditEvent)
        .filter(
            (SystemAuditEvent.empresa_id == empresa.id) | (SystemAuditEvent.target_empresa_id == empresa.id)
        )
        .order_by(SystemAuditEvent.created_at.desc())
        .limit(12)
        .all()
    )

    active_sessions = sum(1 for item in usuarios if item.current_session_id)
    admins = sum(1 for item in usuarios if item.rol.lower() == "administrador")
    standard_users = sum(1 for item in usuarios if item.rol.lower() == "usuario")
    active_bases = [item for item in bases if item.activa]
    root_projects = [item for item in proyectos if (item.revision or 0) == 0]

    record_audit_event(
        db,
        module="admin_support",
        event_type="company_console_opened",
        severity="info",
        actor=current_user,
        target_empresa_id=empresa.id,
        entity_type="empresa",
        entity_id=empresa.id,
        message=f"Consola auditada abierta para {empresa.nombre}",
        payload={"empresa_nombre": empresa.nombre},
    )

    return {
        "empresa": {
            "id": empresa.id,
            "nombre": empresa.nombre,
            "ruc": empresa.ruc,
            "codigo": empresa.codigo,
            "activa": empresa.activa,
            "email": empresa.email,
            "telefono": empresa.telefono,
            "pais": empresa.pais,
            "provincia": empresa.provincia,
            "localidad": empresa.localidad,
            "contacto_nombre": empresa.contacto_nombre,
            "limites": {
                "administradores": empresa.limite_administradores,
                "usuarios": empresa.limite_usuarios,
            },
        },
        "usuarios": {
            "total": len(usuarios),
            "active_sessions": active_sessions,
            "administradores": admins,
            "usuarios": standard_users,
            "items": [
                {
                    "id": item.id,
                    "nombre_completo": item.nombre_completo,
                    "email": item.email,
                    "rol": item.rol,
                    "activo": item.activo,
                    "session_active": bool(item.current_session_id),
                    "session_started_at": item.current_session_started_at.isoformat() if item.current_session_started_at else None,
                }
                for item in usuarios[:12]
            ],
        },
        "bases": {
            "total": len(bases),
            "activas": len(active_bases),
            "items": [
                {
                    "id": item.id,
                    "nombre": item.nombre,
                    "tipo": item.tipo,
                    "activa": item.activa,
                    "codigo_unico": item.codigo_unico,
                }
                for item in bases[:8]
            ],
        },
        "proyectos": {
            "total": len(proyectos),
            "raiz": len(root_projects),
            "items": [
                {
                    "id": item.id,
                    "nombre": item.nombre,
                    "codigo": item.codigo,
                    "codigo_root": item.codigo_root,
                    "revision": item.revision,
                    "estado": item.estado,
                    "presupuesto_estimado": float(item.presupuesto_estimado or 0),
                }
                for item in proyectos[:10]
            ],
        },
        "presupuestos": {
            "total": len(presupuestos),
            "items": [
                {
                    "id": item.id,
                    "descripcion": item.descripcion,
                    "estado": item.estado,
                    "revision": item.revision,
                    "total": float(item.total or 0),
                    "proyecto_id": item.proyecto_id,
                }
                for item in presupuestos[:10]
            ],
        },
        "audit": {
            "events": [
                {
                    "id": item.id,
                    "module": item.module,
                    "event_type": item.event_type,
                    "severity": item.severity,
                    "message": item.message,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                    "actor_email": item.actor_email,
                }
                for item in recent_events
            ]
        },
    }
