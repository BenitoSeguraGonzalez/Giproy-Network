from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.personal_todo_item import PersonalTodoItem
from app.models.usuario import Usuario
from app.schemas.personal_todo_item import (
    PersonalTodoItemCreate,
    PersonalTodoItemResponse,
    PersonalTodoItemUpdate,
)
from app.services.audit_event import record_audit_event

router = APIRouter()


def _normalized_role(user: Usuario) -> str:
    return (user.rol or "").strip().lower()


def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    if _normalized_role(current_user) == "superadministrador" and empresa_id:
        return int(empresa_id)
    return int(current_user.empresa_id)


def _ensure_table(db: Session) -> None:
    PersonalTodoItem.__table__.create(bind=db.get_bind(), checkfirst=True)


def _get_owned_todo_or_404(db: Session, todo_id: int, empresa_id: int, user_id: int) -> PersonalTodoItem:
    _ensure_table(db)
    todo = db.query(PersonalTodoItem).filter(
        PersonalTodoItem.id == todo_id,
        PersonalTodoItem.empresa_id == empresa_id,
        PersonalTodoItem.user_id == user_id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Pendiente personal no encontrado.")
    return todo


@router.get("/", response_model=List[PersonalTodoItemResponse])
def read_personal_todos(
    *,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
    include_completed: bool = Query(True),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    _ensure_table(db)

    query = db.query(PersonalTodoItem).filter(
        PersonalTodoItem.empresa_id == target_empresa_id,
        PersonalTodoItem.user_id == current_user.id,
    )
    if not include_completed:
        query = query.filter(PersonalTodoItem.is_completed.is_(False))

    return query.order_by(
        PersonalTodoItem.is_completed.asc(),
        PersonalTodoItem.sort_order.asc(),
        PersonalTodoItem.created_at.desc(),
    ).all()


@router.post("/", response_model=PersonalTodoItemResponse, status_code=status.HTTP_201_CREATED)
def create_personal_todo(
    *,
    db: Session = Depends(deps.get_db),
    payload: PersonalTodoItemCreate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    _ensure_table(db)

    todo = PersonalTodoItem(
        empresa_id=target_empresa_id,
        user_id=current_user.id,
        title=payload.title.strip(),
        notes=(payload.notes or "").strip() or None,
        sort_order=int(payload.sort_order or 0),
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)

    record_audit_event(
        db,
        module="proyectos",
        event_type="personal_todo_created",
        severity="info",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="personal_todo",
        entity_id=todo.id,
        message="Pendiente personal creado desde el calendario del portafolio.",
        payload={"title": todo.title, "is_completed": todo.is_completed},
    )
    return todo


@router.put("/{todo_id}", response_model=PersonalTodoItemResponse)
def update_personal_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_id: int,
    payload: PersonalTodoItemUpdate,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    todo = _get_owned_todo_or_404(db, todo_id, target_empresa_id, current_user.id)

    if payload.title is not None:
        todo.title = payload.title.strip()
    if payload.notes is not None:
        todo.notes = payload.notes.strip() or None
    if payload.sort_order is not None:
        todo.sort_order = int(payload.sort_order)
    if payload.is_completed is not None:
        todo.is_completed = bool(payload.is_completed)
        todo.completed_at = datetime.now(timezone.utc) if todo.is_completed else None

    db.add(todo)
    db.commit()
    db.refresh(todo)

    record_audit_event(
        db,
        module="proyectos",
        event_type="personal_todo_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="personal_todo",
        entity_id=todo.id,
        message="Pendiente personal actualizado.",
        payload={"title": todo.title, "is_completed": todo.is_completed},
    )
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personal_todo(
    *,
    db: Session = Depends(deps.get_db),
    todo_id: int,
    current_user: Usuario = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> None:
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    todo = _get_owned_todo_or_404(db, todo_id, target_empresa_id, current_user.id)

    record_audit_event(
        db,
        module="proyectos",
        event_type="personal_todo_deleted",
        severity="warning",
        actor=current_user,
        target_empresa_id=target_empresa_id,
        entity_type="personal_todo",
        entity_id=todo.id,
        message="Pendiente personal eliminado.",
        payload={"title": todo.title, "is_completed": todo.is_completed},
    )
    db.delete(todo)
    db.commit()
