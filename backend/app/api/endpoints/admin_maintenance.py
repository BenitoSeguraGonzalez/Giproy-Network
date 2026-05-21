from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.debug_logger import log_debug
from app.models.usuario import Usuario
from app.schemas.system_maintenance import SystemMaintenanceResponse, SystemMaintenanceUpdate
from app.services.audit_event import record_audit_event
from app.services.system_maintenance import get_or_create_system_maintenance, is_system_maintenance_active

router = APIRouter()


def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores"
        )
    return current_user


def _serialize(config):
    return SystemMaintenanceResponse(
        id=config.id,
        titulo=config.titulo,
        mensaje=config.mensaje,
        mode=config.mode,
        is_enabled=config.is_enabled,
        starts_at=config.starts_at,
        ends_at=config.ends_at,
        updated_by=config.updated_by,
        created_at=config.created_at,
        updated_at=config.updated_at,
        is_active_now=is_system_maintenance_active(config),
    )


@router.get("/", response_model=SystemMaintenanceResponse)
def read_admin_maintenance(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    config = get_or_create_system_maintenance(db)
    return _serialize(config)


@router.get("/active", response_model=SystemMaintenanceResponse)
def read_active_admin_maintenance(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    config = get_or_create_system_maintenance(db)
    return _serialize(config)


@router.put("/", response_model=SystemMaintenanceResponse)
def update_admin_maintenance(
    payload: SystemMaintenanceUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    if payload.mode not in {"readonly", "restricted"}:
        raise HTTPException(status_code=400, detail="Modo de mantenimiento no válido.")
    if payload.ends_at and payload.starts_at and payload.ends_at < payload.starts_at:
        raise HTTPException(status_code=400, detail="La fecha fin no puede ser anterior a la fecha inicio.")

    config = get_or_create_system_maintenance(db)
    config.titulo = payload.titulo
    config.mensaje = payload.mensaje
    config.mode = payload.mode
    config.is_enabled = payload.is_enabled
    config.starts_at = payload.starts_at
    config.ends_at = payload.ends_at
    config.updated_by = current_user.id

    db.add(config)
    db.commit()
    db.refresh(config)

    log_debug(
        f"MAINTENANCE UPDATED: actor={current_user.email} enabled={config.is_enabled} mode={config.mode} starts_at={config.starts_at} ends_at={config.ends_at}",
        filename="auth_debug.log",
    )

    record_audit_event(
        db,
        module="maintenance",
        event_type="maintenance_updated",
        severity="critical" if config.is_enabled and config.mode == "restricted" else "warning",
        actor=current_user,
        empresa_id=current_user.empresa_id,
        entity_type="system_maintenance",
        entity_id=config.id,
        message=f"Mantenimiento actualizado a modo {config.mode}",
        payload={
            "is_enabled": config.is_enabled,
            "mode": config.mode,
            "starts_at": config.starts_at,
            "ends_at": config.ends_at,
        },
    )

    return _serialize(config)
