import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.core.database import get_db
from app.api import deps
from app.models.usuario import Usuario
from app.models.system_audit_event import SystemAuditEvent
from app.schemas.base_trabajo import (
    BaseTrabajoCreate,
    BaseTrabajoResponse,
    BaseTrabajoUpdate,
    ProjectBaseSyncOperationRequest,
    ProjectBaseSyncRevertRequest,
)
from app.schemas.usuario import UsuarioResponse
from app.repositories.base_trabajo import base_trabajo_repo
from app.services.marketplace_asset_origin import marketplace_asset_origin_service
from app.services.project_base_reconciliation import project_base_reconciliation_service
from app.services.audit_event import record_audit_event

router = APIRouter()
logger = logging.getLogger(__name__)


def _serialize_sync_audit_event(event: SystemAuditEvent) -> dict:
    payload = None
    if event.payload_json:
        try:
            payload = json.loads(event.payload_json)
        except Exception:
            payload = {"raw": event.payload_json}
    if isinstance(payload, dict) and "undo_snapshot" in payload:
        payload = {**payload, "undo_snapshot": None}
    return {
        "id": event.id,
        "event_type": event.event_type,
        "message": event.message,
        "severity": event.severity,
        "actor_email": event.actor_email,
        "actor_role": event.actor_role,
        "created_at": event.created_at,
        "payload": payload,
    }


def _limit_sync_apu_preview(items: Optional[list], limit: int = 5) -> list:
    preview = []
    for item in (items or [])[:limit]:
        if not isinstance(item, dict):
            continue
        preview.append(
            {
                "codigo": item.get("codigo"),
                "descripcion": item.get("descripcion"),
            }
        )
    return preview


def _load_event_payload(event: SystemAuditEvent) -> dict:
    if not event.payload_json:
        return {}
    try:
        payload = json.loads(event.payload_json)
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def _save_event_payload(db: Session, event: SystemAuditEvent, payload: dict) -> None:
    event.payload_json = json.dumps(payload, ensure_ascii=True, default=str)
    db.add(event)
    db.commit()
    db.refresh(event)


def _clear_previous_sync_undo(db: Session, base_id: int) -> None:
    previous_events = (
        db.query(SystemAuditEvent)
        .filter(
            SystemAuditEvent.module == "bases_trabajo",
            SystemAuditEvent.entity_type == "base_trabajo",
            SystemAuditEvent.entity_id == str(base_id),
            SystemAuditEvent.event_type == "project_base_sync_executed",
        )
        .all()
    )
    updated = False
    for event in previous_events:
        payload = _load_event_payload(event)
        if payload.get("undo_available"):
            payload["undo_available"] = False
            event.payload_json = json.dumps(payload, ensure_ascii=True, default=str)
            db.add(event)
            updated = True
    if updated:
        db.commit()


def _create_sync_event(
    db: Session,
    *,
    current_user: Usuario,
    empresa_id: int,
    base_id: int,
    message: str,
    payload: dict,
) -> SystemAuditEvent:
    event = SystemAuditEvent(
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.rol,
        empresa_id=empresa_id,
        module="bases_trabajo",
        event_type="project_base_sync_executed",
        severity="info",
        entity_type="base_trabajo",
        entity_id=str(base_id),
        message=message,
        payload_json=json.dumps(payload, ensure_ascii=True, default=str),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.get("/generate-base-code", response_model=dict)
def get_next_code(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Obtener el siguiente código autogenerado para la empresa.
    El Superadministrador puede pasar empresa_id para obtener el código de otra empresa.
    """
    try:
        target_empresa_id = current_user.empresa_id
        if current_user.rol.lower() == "superadministrador" and empresa_id:
            target_empresa_id = empresa_id
        code = base_trabajo_repo.get_next_code(db, empresa_id=target_empresa_id)
        return {"next_code": code}
    except Exception as e:
        # Fallback seguro para evitar Error de Red en el frontend
        logger.warning("Error recuperando codigo real de base; usando fallback: %s", e)
        return {"next_code": "BT-2026-001"}

@router.get("/active", response_model=Optional[BaseTrabajoResponse])
def get_active_base(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Obtener la base de trabajo activa de la empresa.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
        
    active_base = base_trabajo_repo.get_active(db, empresa_id=target_empresa_id)
    if active_base:
        marketplace_asset_origin_service.validate_company_ownership(
            db,
            empresa_id=target_empresa_id,
            entity_type="base_trabajo",
            entity_id=active_base.id,
        )
    return active_base

@router.get("/", response_model=List[BaseTrabajoResponse])
def read_bases_trabajo(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Recuperar bases de trabajo.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
        
    # Filtro por asignación para colaboradores
    user_id_filter = None
    if current_user.rol.lower() == "usuario":
        user_id_filter = current_user.id
        
    bases = base_trabajo_repo.get_multi(db, empresa_id=target_empresa_id, skip=skip, limit=limit, user_id=user_id_filter)
    return bases

@router.post("/", response_model=BaseTrabajoResponse)
def create_base_trabajo(
    *,
    db: Session = Depends(get_db),
    base_in: BaseTrabajoCreate,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Crear nueva base de trabajo.
    Solo accesible para Administradores y Superadministradores.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=403,
            detail="Solo los administradores pueden crear bases de trabajo."
        )

    try:
        target_empresa_id = current_user.empresa_id
        if current_user.rol.lower() == "superadministrador" and base_in.empresa_id:
            target_empresa_id = base_in.empresa_id
        
        logger.debug(
            "Create base target resolved user_rol=%s payload_empresa=%s final_target_empresa=%s",
            current_user.rol,
            base_in.empresa_id,
            target_empresa_id,
        )
            
        return base_trabajo_repo.create(db, obj_in=base_in, empresa_id=target_empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=BaseTrabajoResponse)
def read_base_trabajo(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Obtener base de trabajo por ID.
    El Superadministrador puede pasar empresa_id para consultar bases de otras empresas.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    base = base_trabajo_repo.get_by_id(db, id=id, empresa_id=target_empresa_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base de trabajo no encontrada")
    marketplace_asset_origin_service.validate_company_ownership(
        db,
        empresa_id=target_empresa_id,
        entity_type="base_trabajo",
        entity_id=base.id,
    )
    return base

@router.put("/{id}", response_model=BaseTrabajoResponse)
def update_base_trabajo(
    *,
    db: Session = Depends(get_db),
    id: int,
    base_in: BaseTrabajoUpdate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Actualizar base de trabajo.
    El Superadministrador puede pasar empresa_id para actualizar bases de otras empresas.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    base = base_trabajo_repo.get_by_id(db, id=id, empresa_id=target_empresa_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base de trabajo no encontrada")
    try:
        return base_trabajo_repo.update(db, db_obj=base, obj_in=base_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}", response_model=BaseTrabajoResponse)
def delete_base_trabajo(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Eliminar base de trabajo.
    Solo accesible para Administradores y Superadministradores.
    El Superadministrador puede pasar empresa_id para eliminar bases de otras empresas.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(
            status_code=403,
            detail="No tiene permisos para eliminar bases de trabajo."
        )

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    base = base_trabajo_repo.get_by_id(db, id=id, empresa_id=target_empresa_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base de trabajo no encontrada")
    return base_trabajo_repo.delete(db, db_obj=base)

@router.post("/{id}/activate", response_model=BaseTrabajoResponse)
def activate_base_trabajo(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Activa una base de trabajo y desactiva todas las demás de la misma empresa.
    Solo puede haber una base activa por empresa.
    El Superadministrador puede activar bases de otras empresas pasando empresa_id como query param.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    base = base_trabajo_repo.get_by_id(db, id=id, empresa_id=target_empresa_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base de trabajo no encontrada")
    marketplace_asset_origin_service.validate_company_ownership(
        db,
        empresa_id=target_empresa_id,
        entity_type="base_trabajo",
        entity_id=base.id,
    )
    return base_trabajo_repo.activate_base(db, base_id=id, empresa_id=target_empresa_id)

@router.post("/{id}/sync-missing", response_model=dict)
def sync_project_base_missing(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Sincroniza solo faltantes desde la base maestra hacia una base de proyecto.
    Nunca modifica contenido ya existente en la base de proyecto.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para sincronizar bases de proyecto.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        result = project_base_reconciliation_service.sync_missing_only(db, id, target_empresa_id)
        record_audit_event(
            db,
            module="bases_trabajo",
            event_type="project_base_sync_missing_completed",
            message=f"Sincronización de faltantes completada sobre base de proyecto {id}",
            actor=current_user,
            empresa_id=target_empresa_id,
            entity_type="base_trabajo",
            entity_id=id,
            payload={
                "source_base_id": result.get("source_base_id"),
                "added": result.get("added"),
                "repaired": result.get("repaired"),
                "untouched": result.get("untouched"),
                "repaired_apus_preview": _limit_sync_apu_preview((result.get("before") or {}).get("empty_apus")),
                "divergent_apus_preview": _limit_sync_apu_preview((result.get("after") or {}).get("divergent_apus")),
            },
        )
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}/sync-missing/preview", response_model=dict)
def preview_project_base_sync_missing(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Previsualiza qué añadiría la sincronización desde la base maestra
    y qué APUs heredados vacíos podrían repararse sin tocar divergencias.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para previsualizar sincronizaciones.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        result = project_base_reconciliation_service.preview_sync_missing(db, id, target_empresa_id)
        record_audit_event(
            db,
            module="bases_trabajo",
            event_type="project_base_sync_previewed",
            message=f"Previsualización de sincronización para base de proyecto {id}",
            actor=current_user,
            empresa_id=target_empresa_id,
            entity_type="base_trabajo",
            entity_id=id,
            payload={
                "source_base_id": result.get("source_base_id"),
                "summary": result.get("summary"),
                "repairable_empty_apus_preview": _limit_sync_apu_preview(result.get("repairable_empty_apus")),
                "divergent_apus_preview": _limit_sync_apu_preview((result.get("before") or {}).get("divergent_apus")),
            },
        )
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/repair-inherited", response_model=dict)
def repair_project_base_inherited_content(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Repara APUs heredados vacíos o incompletos en una base de proyecto
    sin añadir faltantes ni tocar divergencias válidas.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para reparar bases de proyecto.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        result = project_base_reconciliation_service.repair_inherited_only(db, id, target_empresa_id)
        record_audit_event(
            db,
            module="bases_trabajo",
            event_type="project_base_inherited_repaired",
            message=f"Reparación conservadora de heredados sobre base de proyecto {id}",
            actor=current_user,
            empresa_id=target_empresa_id,
            entity_type="base_trabajo",
            entity_id=id,
            payload={
                "source_base_id": result.get("source_base_id"),
                "repaired": result.get("repaired"),
                "remaining_empty_apus": len((result.get("after") or {}).get("empty_apus") or []),
                "remaining_divergent_apus": len((result.get("after") or {}).get("divergent_apus") or []),
                "remaining_divergent_apus_preview": _limit_sync_apu_preview((result.get("after") or {}).get("divergent_apus")),
            },
        )
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/sync/preview", response_model=dict)
def preview_project_base_sync_operation(
    *,
    db: Session = Depends(get_db),
    id: int,
    payload: ProjectBaseSyncOperationRequest,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para previsualizar sincronizaciones.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        result = project_base_reconciliation_service.preview_sync_operation(db, id, target_empresa_id, payload.mode)
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/sync/execute", response_model=dict)
def execute_project_base_sync_operation(
    *,
    db: Session = Depends(get_db),
    id: int,
    payload: ProjectBaseSyncOperationRequest,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para sincronizar bases de proyecto.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    try:
        result = project_base_reconciliation_service.execute_sync_operation(db, id, target_empresa_id, payload.mode)
        _clear_previous_sync_undo(db, result["target_base_id"])
        event = _create_sync_event(
            db,
            current_user=current_user,
            empresa_id=target_empresa_id,
            base_id=result["target_base_id"],
            message=f"Sincronización {payload.mode} ejecutada sobre base de proyecto {result['target_base_id']}",
            payload={
                "mode": payload.mode,
                "revision": result.get("target_revision"),
                "project_id": result.get("project_id"),
                "source_base_id": result.get("source_base_id"),
                "added": result.get("added"),
                "updated": result.get("updated"),
                "impacts": result.get("impacts"),
                "undo_available": True,
                "undo_snapshot": result.get("undo_snapshot"),
            },
        )
        result["sync_event_id"] = event.id
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/sync/revert", response_model=dict)
def revert_project_base_sync_operation(
    *,
    db: Session = Depends(get_db),
    id: int,
    payload: ProjectBaseSyncRevertRequest,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para revertir sincronizaciones.")

    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    sync_event = (
        db.query(SystemAuditEvent)
        .filter(
            SystemAuditEvent.id == payload.sync_event_id,
            SystemAuditEvent.module == "bases_trabajo",
            SystemAuditEvent.entity_type == "base_trabajo",
            SystemAuditEvent.entity_id == str(id),
            SystemAuditEvent.event_type == "project_base_sync_executed",
        )
        .first()
    )
    if not sync_event:
        raise HTTPException(status_code=404, detail="Sincronización no encontrada.")

    latest_sync_event = (
        db.query(SystemAuditEvent)
        .filter(
            SystemAuditEvent.module == "bases_trabajo",
            SystemAuditEvent.entity_type == "base_trabajo",
            SystemAuditEvent.entity_id == str(id),
            SystemAuditEvent.event_type == "project_base_sync_executed",
        )
        .order_by(SystemAuditEvent.created_at.desc(), SystemAuditEvent.id.desc())
        .first()
    )
    if not latest_sync_event or latest_sync_event.id != sync_event.id:
        raise HTTPException(status_code=400, detail="Solo se puede revertir la última sincronización de esta base.")

    event_payload = _load_event_payload(sync_event)
    if not event_payload.get("undo_available") or not event_payload.get("undo_snapshot"):
        raise HTTPException(status_code=400, detail="Esta sincronización ya no tiene reversión disponible.")

    try:
        result = project_base_reconciliation_service.revert_sync_operation(
            db,
            id,
            target_empresa_id,
            event_payload["undo_snapshot"],
        )
        event_payload["undo_available"] = False
        event_payload["reverted"] = result.get("reverted")
        _save_event_payload(db, sync_event, event_payload)
        record_audit_event(
            db,
            module="bases_trabajo",
            event_type="project_base_sync_reverted",
            message=f"Reversión ejecutada sobre sincronización {sync_event.id} de la base de proyecto {id}",
            actor=current_user,
            empresa_id=target_empresa_id,
            entity_type="base_trabajo",
            entity_id=id,
            payload={
                "sync_event_id": sync_event.id,
                "revision": event_payload.get("revision"),
                "reverted": result.get("reverted"),
            },
        )
        return result
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{id}/sync-history", response_model=dict)
def read_project_base_sync_history(
    *,
    db: Session = Depends(get_db),
    id: int,
    limit: int = Query(8, ge=1, le=50),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Devuelve el histórico reciente de previsualizaciones, sincronizaciones y reparaciones
    sobre una base de proyecto.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    base = base_trabajo_repo.get_by_id(db, id=id, empresa_id=target_empresa_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base de trabajo no encontrada")

    events = (
        db.query(SystemAuditEvent)
        .filter(
            SystemAuditEvent.module == "bases_trabajo",
            SystemAuditEvent.entity_type == "base_trabajo",
            SystemAuditEvent.entity_id == str(id),
            SystemAuditEvent.event_type.in_([
                "project_base_sync_executed",
                "project_base_sync_reverted",
                "project_base_sync_missing_completed",
                "project_base_inherited_repaired",
            ]),
        )
        .order_by(SystemAuditEvent.created_at.desc(), SystemAuditEvent.id.desc())
        .limit(limit)
        .all()
    )
    return {
        "base_id": id,
        "items": [_serialize_sync_audit_event(item) for item in events],
    }

@router.post("/deactivate-all", response_model=dict)
def deactivate_all_bases(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Desactiva todas las bases de trabajo de la empresa actual.
    El Superadministrador puede desactivar bases de otras empresas pasando empresa_id como query param.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    count = base_trabajo_repo.deactivate_all(db, empresa_id=target_empresa_id)
    return {"message": f"Se han desactivado {count} bases de trabajo", "deactivated_count": count}

@router.post("/{id}/assign", response_model=Any)
def assign_user_to_base(
    *,
    db: Session = Depends(get_db),
    id: int,
    usuario_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Asignar un usuario a una base de trabajo.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para asignar personal")
    
    base_trabajo_repo.assign_user(db, base_id=id, usuario_id=usuario_id, asignado_por_id=current_user.id)
    return {"status": "success"}

@router.delete("/{id}/assign/{usuario_id}", response_model=dict)
def unassign_user_from_base(
    *,
    db: Session = Depends(get_db),
    id: int,
    usuario_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Desvincular un usuario de una base de trabajo.
    """
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para desvincular personal")
    
    base_trabajo_repo.unassign_user(db, base_id=id, usuario_id=usuario_id)
    return {"message": "Usuario desvinculado con éxito"}

@router.get("/{id}/assigned-users", response_model=List[UsuarioResponse])
def get_assigned_users_to_base(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(deps.get_current_active_user)
) -> Any:
    """
    Obtener lista de usuarios asignados a una base de trabajo.
    """
    users = base_trabajo_repo.get_assigned_users(db, base_id=id)
    return [UsuarioResponse.model_validate(u) for u in users]
