from datetime import date
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api import deps
from app.models.project_calendar_entry import ProjectCalendarEntry
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.project_calendar_entry import (
    ProjectCalendarEntryCreate,
    ProjectCalendarEntryResponse,
    ProjectCalendarEntryUpdate,
)
from app.services.audit_event import record_audit_event

router = APIRouter()

ENTRY_TYPES = {"annotation", "personal", "broadcast"}
ADMIN_ROLES = {"administrador", "superadministrador"}


def _normalized_role(user: Usuario) -> str:
    return (user.rol or "").strip().lower()


def _is_admin(user: Usuario) -> bool:
    return _normalized_role(user) in ADMIN_ROLES


def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    if _normalized_role(current_user) == "superadministrador" and empresa_id:
        return int(empresa_id)
    return int(current_user.empresa_id)


def _validate_project_root(db: Session, empresa_id: int, proyecto_codigo_root: Optional[str]) -> Optional[str]:
    if not proyecto_codigo_root:
        return None

    project_exists = db.query(Proyecto.id).filter(
        Proyecto.empresa_id == empresa_id,
        or_(Proyecto.codigo_root == proyecto_codigo_root, Proyecto.codigo == proyecto_codigo_root),
    ).first()
    if not project_exists:
        raise HTTPException(status_code=404, detail="El proyecto raíz indicado no existe para la empresa activa.")
    return proyecto_codigo_root


def _ensure_entry_type(entry_type: str) -> str:
    normalized = str(entry_type or "").strip().lower()
    if normalized not in ENTRY_TYPES:
        raise HTTPException(status_code=400, detail="Tipo de entrada de calendario no válido.")
    return normalized


def _can_edit_entry(entry: ProjectCalendarEntry, current_user: Usuario) -> bool:
    if entry.entry_type == "annotation":
        return _is_admin(current_user)
    return int(entry.created_by) == int(current_user.id)


def _can_delete_entry(entry: ProjectCalendarEntry, current_user: Usuario) -> bool:
    return _can_edit_entry(entry, current_user)


def _assert_can_create(entry_type: str, current_user: Usuario) -> None:
    if entry_type == "annotation" and not _is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores y superadministradores pueden crear anotaciones compartidas.",
        )


def _assert_can_mutate(entry: ProjectCalendarEntry, current_user: Usuario) -> None:
    if not _can_edit_entry(entry, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para editar esta entrada de calendario.",
        )


def _serialize_entry(entry: ProjectCalendarEntry, current_user: Usuario) -> ProjectCalendarEntryResponse:
    return ProjectCalendarEntryResponse(
        id=entry.id,
        empresa_id=entry.empresa_id,
        calendar_date=entry.calendar_date,
        entry_type=entry.entry_type,
        title=entry.title,
        message=entry.message,
        proyecto_codigo_root=entry.proyecto_codigo_root,
        created_by=entry.created_by,
        updated_by=entry.updated_by,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        author_name=getattr(entry.author, "nombre_completo", None),
        author_email=getattr(entry.author, "email", None),
        can_edit=_can_edit_entry(entry, current_user),
        can_delete=_can_delete_entry(entry, current_user),
    )


@router.get("/", response_model=List[ProjectCalendarEntryResponse])
def read_project_calendar_entries(
    *,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
    start_date: date,
    end_date: date,
    proyecto_codigo_root: Optional[str] = Query(None),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="El rango de fechas no es válido.")

    project_root = _validate_project_root(db, target_empresa_id, proyecto_codigo_root)
    filters = [
        ProjectCalendarEntry.empresa_id == target_empresa_id,
        ProjectCalendarEntry.calendar_date >= start_date,
        ProjectCalendarEntry.calendar_date <= end_date,
    ]
    if project_root:
        filters.append(ProjectCalendarEntry.proyecto_codigo_root == project_root)

    visibility_filter = or_(
        ProjectCalendarEntry.entry_type.in_(["annotation", "broadcast"]),
        and_(
            ProjectCalendarEntry.entry_type == "personal",
            or_(
                ProjectCalendarEntry.created_by == current_user.id,
                _is_admin(current_user),
            ),
        ),
    )

    entries = db.query(ProjectCalendarEntry).filter(*filters, visibility_filter).order_by(
        ProjectCalendarEntry.calendar_date.asc(),
        ProjectCalendarEntry.created_at.desc(),
    ).all()
    return [_serialize_entry(entry, current_user) for entry in entries]


@router.post("/", response_model=ProjectCalendarEntryResponse, status_code=status.HTTP_201_CREATED)
def create_project_calendar_entry(
    *,
    db: Session = Depends(deps.get_db),
    payload: ProjectCalendarEntryCreate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    entry_type = _ensure_entry_type(payload.entry_type)
    _assert_can_create(entry_type, current_user)
    project_root = _validate_project_root(db, target_empresa_id, payload.proyecto_codigo_root)

    db_obj = ProjectCalendarEntry(
        empresa_id=target_empresa_id,
        proyecto_codigo_root=project_root,
        calendar_date=payload.calendar_date,
        entry_type=entry_type,
        title=(payload.title or "").strip() or None,
        message=payload.message.strip(),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    record_audit_event(
        db,
        module="proyectos",
        event_type="calendar_entry_created",
        severity="info",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="project_calendar_entry",
        entity_id=db_obj.id,
        message=f"Entrada de calendario creada ({entry_type}) para {db_obj.calendar_date.isoformat()}",
        payload={
            "entry_type": entry_type,
            "calendar_date": db_obj.calendar_date.isoformat(),
            "proyecto_codigo_root": db_obj.proyecto_codigo_root,
        },
    )
    return _serialize_entry(db_obj, current_user)


@router.put("/{entry_id}", response_model=ProjectCalendarEntryResponse)
def update_project_calendar_entry(
    *,
    db: Session = Depends(deps.get_db),
    entry_id: int,
    payload: ProjectCalendarEntryUpdate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    entry = db.query(ProjectCalendarEntry).filter(
        ProjectCalendarEntry.id == entry_id,
        ProjectCalendarEntry.empresa_id == target_empresa_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada de calendario no encontrada.")

    _assert_can_mutate(entry, current_user)

    if payload.calendar_date is not None:
        entry.calendar_date = payload.calendar_date
    if payload.title is not None:
        entry.title = payload.title.strip() or None
    if payload.message is not None:
        entry.message = payload.message.strip()
    if payload.proyecto_codigo_root is not None:
        entry.proyecto_codigo_root = _validate_project_root(db, target_empresa_id, payload.proyecto_codigo_root)
    entry.updated_by = current_user.id

    db.add(entry)
    db.commit()
    db.refresh(entry)

    record_audit_event(
        db,
        module="proyectos",
        event_type="calendar_entry_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="project_calendar_entry",
        entity_id=entry.id,
        message=f"Entrada de calendario actualizada ({entry.entry_type}) para {entry.calendar_date.isoformat()}",
        payload={
            "entry_type": entry.entry_type,
            "calendar_date": entry.calendar_date.isoformat(),
            "proyecto_codigo_root": entry.proyecto_codigo_root,
        },
    )
    return _serialize_entry(entry, current_user)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_calendar_entry(
    *,
    db: Session = Depends(deps.get_db),
    entry_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> None:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    entry = db.query(ProjectCalendarEntry).filter(
        ProjectCalendarEntry.id == entry_id,
        ProjectCalendarEntry.empresa_id == target_empresa_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada de calendario no encontrada.")

    _assert_can_mutate(entry, current_user)
    entry_type = entry.entry_type
    calendar_date = entry.calendar_date.isoformat()
    project_root = entry.proyecto_codigo_root

    db.delete(entry)
    db.commit()

    record_audit_event(
        db,
        module="proyectos",
        event_type="calendar_entry_deleted",
        severity="warning",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="project_calendar_entry",
        entity_id=entry_id,
        message=f"Entrada de calendario eliminada ({entry_type}) de {calendar_date}",
        payload={
            "entry_type": entry_type,
            "calendar_date": calendar_date,
            "proyecto_codigo_root": project_root,
        },
    )
    return
