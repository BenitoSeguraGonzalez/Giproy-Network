from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.system_announcement import SystemAnnouncement
from app.models.usuario import Usuario
from app.schemas.system_announcement import (
    SystemAnnouncementCreate,
    SystemAnnouncementResponse,
    SystemAnnouncementUpdate,
)
from app.services.audit_event import record_audit_event

router = APIRouter()


def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores"
        )
    return current_user


def _validate_payload(db: Session, payload: SystemAnnouncementCreate | SystemAnnouncementUpdate):
    data = payload.model_dump(exclude_unset=True)
    tipo = data.get("tipo")
    scope = data.get("scope")
    starts_at = data.get("starts_at")
    ends_at = data.get("ends_at")
    empresa_id = data.get("empresa_id")
    target_company_ids = data.get("target_company_ids")
    display_duration_seconds = data.get("display_duration_seconds")

    if tipo and tipo not in {"info", "warning", "critical"}:
        raise HTTPException(status_code=400, detail="Tipo de comunicado no válido.")
    if scope and scope not in {"global", "empresa"}:
        raise HTTPException(status_code=400, detail="Ámbito de comunicado no válido.")
    if starts_at and ends_at and ends_at < starts_at:
        raise HTTPException(status_code=400, detail="La fecha fin no puede ser anterior a la fecha inicio.")
    if display_duration_seconds is not None and display_duration_seconds not in {10, 20, 30, 60}:
        raise HTTPException(status_code=400, detail="La duración del comunicado no es válida.")
    if scope == "empresa":
        normalized_ids = sorted({int(company_id) for company_id in (target_company_ids or []) if company_id})
        if empresa_id and empresa_id not in normalized_ids:
            normalized_ids.append(int(empresa_id))
            normalized_ids = sorted(set(normalized_ids))
        if not normalized_ids:
            raise HTTPException(status_code=400, detail="Debe indicar al menos una empresa destinataria.")
        empresas = db.query(Empresa).filter(Empresa.id.in_(normalized_ids)).all()
        found_ids = {empresa.id for empresa in empresas}
        if found_ids != set(normalized_ids):
            raise HTTPException(status_code=404, detail="Una o varias empresas destinatarias no existen.")
        data["target_company_ids"] = normalized_ids
        data["empresa_id"] = normalized_ids[0]
    if scope == "global":
        data["empresa_id"] = None
        data["target_company_ids"] = []
    return data


def _get_status(item: SystemAnnouncement, now: datetime) -> str:
    if item.ends_at and item.ends_at < now:
        return "expired"
    if item.starts_at and item.starts_at > now:
        return "upcoming"
    return "active"


def _serialize(item: SystemAnnouncement) -> SystemAnnouncementResponse:
    now = datetime.now(timezone.utc)
    company_names = [empresa.nombre for empresa in item.empresas]
    impact_label = "Global"
    if item.scope == "empresa":
        impact_label = f"{len(company_names)} empresa" if len(company_names) == 1 else f"{len(company_names)} empresas"
    return SystemAnnouncementResponse(
        id=item.id,
        titulo=item.titulo,
        mensaje=item.mensaje,
        tipo=item.tipo,
        scope=item.scope,
        empresa_id=item.empresa_id,
        target_company_ids=[empresa.id for empresa in item.empresas],
        display_duration_seconds=item.display_duration_seconds,
        starts_at=item.starts_at,
        ends_at=item.ends_at,
        is_active=item.is_active,
        created_by=item.created_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
        empresa_nombre=item.empresa.nombre if item.empresa else None,
        target_company_names=company_names,
        status=_get_status(item, now),
        impact_label=impact_label,
    )


def _severity_rank(tipo: str) -> int:
    return {"critical": 0, "warning": 1, "info": 2}.get(tipo, 3)


def _sort_active_announcements(items: list[SystemAnnouncement]) -> list[SystemAnnouncement]:
    def sort_key(item: SystemAnnouncement):
        severity = _severity_rank(item.tipo)
        created_at = item.created_at or datetime.min.replace(tzinfo=timezone.utc)
        if item.tipo == "critical":
            return (severity, -created_at.timestamp())
        return (severity, created_at.timestamp())

    return sorted(items, key=sort_key)


@router.get("/active", response_model=List[SystemAnnouncementResponse])
def read_active_system_announcements(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador":
        target_empresa_id = empresa_id

    now = datetime.now(timezone.utc)
    scope_filters = [SystemAnnouncement.scope == "global"]
    if target_empresa_id:
        scope_filters.append(
            and_(
                SystemAnnouncement.scope == "empresa",
                or_(
                    SystemAnnouncement.empresa_id == target_empresa_id,
                    SystemAnnouncement.empresas.any(Empresa.id == target_empresa_id),
                ),
            )
        )

    query = db.query(SystemAnnouncement).filter(
        SystemAnnouncement.is_active.is_(True),
        or_(SystemAnnouncement.starts_at.is_(None), SystemAnnouncement.starts_at <= now),
        or_(SystemAnnouncement.ends_at.is_(None), SystemAnnouncement.ends_at >= now),
        or_(*scope_filters)
    )
    items = _sort_active_announcements(query.all())
    payload = [_serialize(item) for item in items]
    # Esta ruta es estrictamente de lectura. Cerrar explícitamente la
    # transacción antes de serializar la respuesta evita conexiones
    # ``idle in transaction`` cuando el navegador cancela la petición.
    db.rollback()
    return payload


@router.get("/", response_model=List[SystemAnnouncementResponse])
def read_system_announcements(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin),
    empresa_id: Optional[int] = Query(None),
    status_filter: str = Query("all"),
    tipo: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    starts_from: Optional[datetime] = Query(None),
    starts_to: Optional[datetime] = Query(None),
    ends_from: Optional[datetime] = Query(None),
    ends_to: Optional[datetime] = Query(None),
):
    query = db.query(SystemAnnouncement)
    if empresa_id:
        query = query.filter(
            or_(
                SystemAnnouncement.scope == "global",
                SystemAnnouncement.empresa_id == empresa_id,
                SystemAnnouncement.empresas.any(Empresa.id == empresa_id),
            )
        )
    if tipo in {"info", "warning", "critical"}:
        query = query.filter(SystemAnnouncement.tipo == tipo)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(SystemAnnouncement.titulo.ilike(term), SystemAnnouncement.mensaje.ilike(term)))
    if starts_from:
        query = query.filter(SystemAnnouncement.starts_at.is_not(None), SystemAnnouncement.starts_at >= starts_from)
    if starts_to:
        query = query.filter(SystemAnnouncement.starts_at.is_not(None), SystemAnnouncement.starts_at <= starts_to)
    if ends_from:
        query = query.filter(SystemAnnouncement.ends_at.is_not(None), SystemAnnouncement.ends_at >= ends_from)
    if ends_to:
        query = query.filter(SystemAnnouncement.ends_at.is_not(None), SystemAnnouncement.ends_at <= ends_to)

    now = datetime.now(timezone.utc)
    if status_filter == "active":
        query = query.filter(
            or_(SystemAnnouncement.starts_at.is_(None), SystemAnnouncement.starts_at <= now),
            or_(SystemAnnouncement.ends_at.is_(None), SystemAnnouncement.ends_at >= now),
        )
    elif status_filter == "upcoming":
        query = query.filter(SystemAnnouncement.starts_at.is_not(None), SystemAnnouncement.starts_at > now)
    elif status_filter == "expired":
        query = query.filter(SystemAnnouncement.ends_at.is_not(None), SystemAnnouncement.ends_at < now)

    items = query.order_by(SystemAnnouncement.created_at.desc()).all()
    return [_serialize(item) for item in items]


@router.post("/", response_model=SystemAnnouncementResponse)
def create_system_announcement(
    announcement_in: SystemAnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    data = _validate_payload(db, announcement_in)
    target_company_ids = data.pop("target_company_ids", [])
    db_obj = SystemAnnouncement(**data, created_by=current_user.id)
    if target_company_ids:
        db_obj.empresas = db.query(Empresa).filter(Empresa.id.in_(target_company_ids)).all()
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    record_audit_event(
        db,
        module="announcements",
        event_type="announcement_created",
        severity="warning" if db_obj.tipo in {"warning", "critical"} else "info",
        actor=current_user,
        target_empresa_id=db_obj.empresa_id,
        entity_type="system_announcement",
        entity_id=db_obj.id,
        message=f"Comunicado creado: {db_obj.titulo}",
        payload={
            "tipo": db_obj.tipo,
            "scope": db_obj.scope,
            "is_active": db_obj.is_active,
            "duration": db_obj.display_duration_seconds,
            "target_company_ids": [empresa.id for empresa in db_obj.empresas],
        },
    )
    return _serialize(db_obj)


@router.put("/{announcement_id}", response_model=SystemAnnouncementResponse)
def update_system_announcement(
    announcement_id: int,
    announcement_in: SystemAnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    db_obj = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado.")

    data = _validate_payload(db, announcement_in)
    target_company_ids = data.pop("target_company_ids", None)
    for key, value in data.items():
        setattr(db_obj, key, value)
    if target_company_ids is not None:
        db_obj.empresas = db.query(Empresa).filter(Empresa.id.in_(target_company_ids)).all()
    db.commit()
    db.refresh(db_obj)

    record_audit_event(
        db,
        module="announcements",
        event_type="announcement_updated",
        severity="warning" if db_obj.tipo in {"warning", "critical"} else "info",
        actor=current_user,
        target_empresa_id=db_obj.empresa_id,
        entity_type="system_announcement",
        entity_id=db_obj.id,
        message=f"Comunicado actualizado: {db_obj.titulo}",
        payload={
            "fields": sorted(data.keys()),
            "tipo": db_obj.tipo,
            "scope": db_obj.scope,
            "duration": db_obj.display_duration_seconds,
            "target_company_ids": [empresa.id for empresa in db_obj.empresas],
        },
    )
    return _serialize(db_obj)


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_system_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
) -> None:
    db_obj = db.query(SystemAnnouncement).filter(SystemAnnouncement.id == announcement_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Comunicado no encontrado.")
    deleted_title = db_obj.titulo
    deleted_empresa_id = db_obj.empresa_id
    db.delete(db_obj)
    db.commit()

    record_audit_event(
        db,
        module="announcements",
        event_type="announcement_deleted",
        severity="warning",
        actor=current_user,
        target_empresa_id=deleted_empresa_id,
        entity_type="system_announcement",
        entity_id=announcement_id,
        message=f"Comunicado eliminado: {deleted_title}",
        payload={"titulo": deleted_title},
    )
    return None
