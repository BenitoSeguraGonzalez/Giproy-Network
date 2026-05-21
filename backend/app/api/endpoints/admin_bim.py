from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.debug_logger import log_debug
from app.models.usuario import Usuario
from app.schemas.system_bim_setting import SystemBimSettingResponse, SystemBimSettingUpdate
from app.services.audit_event import record_audit_event
from app.services.system_bim_setting import (
    get_or_create_system_bim_setting,
)

router = APIRouter()


def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores",
        )
    return current_user


def _parse_company_ids(raw_value: str | None) -> list[int]:
    values: list[int] = []
    for chunk in (raw_value or "").split(","):
        token = chunk.strip()
        if not token:
            continue
        try:
            values.append(int(token))
        except ValueError:
            continue
    return values


def _serialize(config, source: str = "database"):
    return SystemBimSettingResponse(
        id=config.id,
        titulo=config.titulo,
        descripcion=config.descripcion,
        is_enabled=config.is_enabled,
        superadmin_only=config.superadmin_only,
        allowed_company_ids=config.allowed_company_ids,
        allowed_company_ids_list=_parse_company_ids(config.allowed_company_ids),
        updated_by=config.updated_by,
        created_at=config.created_at,
        updated_at=config.updated_at,
        source=source,
    )


@router.get("/", response_model=SystemBimSettingResponse)
def read_admin_bim_config(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    config = get_or_create_system_bim_setting(db)
    return _serialize(config)


@router.put("/", response_model=SystemBimSettingResponse)
def update_admin_bim_config(
    payload: SystemBimSettingUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
):
    config = get_or_create_system_bim_setting(db)
    config.titulo = payload.titulo
    config.descripcion = payload.descripcion
    config.is_enabled = payload.is_enabled
    config.superadmin_only = payload.superadmin_only
    config.allowed_company_ids = payload.allowed_company_ids
    config.updated_by = current_user.id

    db.add(config)
    db.commit()
    db.refresh(config)

    log_debug(
        f"BIM CONFIG UPDATED: actor={current_user.email} enabled={config.is_enabled} superadmin_only={config.superadmin_only} companies={config.allowed_company_ids}",
        filename="auth_debug.log",
    )

    record_audit_event(
        db,
        module="bim",
        event_type="bim_config_updated",
        severity="warning",
        actor=current_user,
        empresa_id=current_user.empresa_id,
        entity_type="system_bim_settings",
        entity_id=config.id,
        message="Configuración BIM actualizada",
        payload={
            "is_enabled": config.is_enabled,
            "superadmin_only": config.superadmin_only,
            "allowed_company_ids": config.allowed_company_ids,
        },
    )

    return _serialize(config)
