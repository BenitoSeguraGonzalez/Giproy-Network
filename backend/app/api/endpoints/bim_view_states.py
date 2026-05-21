from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_view_state import (
    BimViewStateCreateRequest,
    BimViewStateDuplicateRequest,
    BimViewStateResponse,
    BimViewStatePayload,
    BimViewStateUpdateRequest,
    BimWorkspaceContextPayload,
    BimWorkspaceContextResponse,
    BimWorkspaceContextUpsertRequest,
)
from app.services.bim.feature_flags import resolve_bim_feature_access
from app.services.bim.view_state_service import (
    delete_view_state_for_project,
    duplicate_view_state_for_project,
    get_view_state_for_project,
    get_workspace_context_for_project,
    list_view_states_for_project,
    rename_view_state_for_project,
    upsert_named_view_state_for_project,
    upsert_workspace_context_for_project,
)

router = APIRouter()


def _resolve_project(db: Session, project_id: int, current_user: Usuario, empresa_id: Optional[int]) -> Proyecto:
    resolved_company_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        resolved_company_id = empresa_id

    project = (
        db.query(Proyecto)
        .filter(Proyecto.id == project_id, Proyecto.empresa_id == resolved_company_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado para el contexto BIM.")
    return project


def _ensure_view_state_management_allowed(view_state, current_user: Usuario) -> None:
    if view_state.scope == "company" and current_user.rol.lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede gestionar vistas BIM compartidas.")


@router.get("/projects/{project_id}/view-states", response_model=list[BimViewStateResponse])
def list_bim_view_states(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    states = list_view_states_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
    )
    return [BimViewStateResponse.model_validate(state, from_attributes=True) for state in states]


@router.post("/projects/{project_id}/view-states", response_model=BimViewStateResponse)
def create_bim_view_state(
    project_id: int,
    payload: BimViewStateCreateRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    view_name = (payload.nombre or "").strip()
    if not view_name:
        raise HTTPException(status_code=400, detail="El nombre de la vista BIM es obligatorio.")
    normalized_scope = (payload.scope or "personal").strip() or "personal"
    if normalized_scope == "company" and current_user.rol.lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede crear vistas BIM compartidas.")

    state = upsert_named_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        name=view_name,
        scope=normalized_scope,
        bim_model_version_id=payload.active_version_id,
        payload=BimViewStatePayload.model_validate(payload.model_dump()).model_dump(),
    )
    return BimViewStateResponse.model_validate(state, from_attributes=True)


@router.delete("/projects/{project_id}/view-states/{view_state_id}", status_code=204)
def delete_bim_view_state(
    project_id: int,
    view_state_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    state = get_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
    )
    if state is None:
        raise HTTPException(status_code=404, detail="La vista BIM no existe para este usuario y proyecto.")
    _ensure_view_state_management_allowed(state, current_user)

    deleted = delete_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="La vista BIM no existe para este usuario y proyecto.")


@router.get("/projects/{project_id}/view-states/{view_state_id}", response_model=BimViewStateResponse)
def read_bim_view_state(
    project_id: int,
    view_state_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    state = get_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
    )
    if state is None:
        raise HTTPException(status_code=404, detail="La vista BIM no existe para este usuario y proyecto.")
    return BimViewStateResponse.model_validate(state, from_attributes=True)


@router.post("/projects/{project_id}/view-states/{view_state_id}/duplicate", response_model=BimViewStateResponse)
def duplicate_bim_view_state(
    project_id: int,
    view_state_id: int,
    payload: Optional[BimViewStateDuplicateRequest] = None,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    duplicated_state = duplicate_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
        name=payload.nombre if payload else None,
        target_scope=payload.scope if payload else None,
    )
    if duplicated_state is None:
        raise HTTPException(status_code=404, detail="La vista BIM no existe para este usuario y proyecto.")

    return BimViewStateResponse.model_validate(duplicated_state, from_attributes=True)


@router.patch("/projects/{project_id}/view-states/{view_state_id}", response_model=BimViewStateResponse)
def rename_bim_view_state(
    project_id: int,
    view_state_id: int,
    payload: BimViewStateUpdateRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    normalized_name = (payload.nombre or "").strip()
    if not normalized_name:
        raise HTTPException(status_code=400, detail="El nombre de la vista BIM es obligatorio.")

    existing_state = get_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
    )
    if existing_state is None:
        raise HTTPException(status_code=404, detail="La vista BIM no existe para este usuario y proyecto.")
    _ensure_view_state_management_allowed(existing_state, current_user)

    renamed_state = rename_view_state_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        view_state_id=view_state_id,
        name=normalized_name,
    )
    if renamed_state is None:
        raise HTTPException(status_code=400, detail="El nombre de la vista BIM es obligatorio.")
    if renamed_state.id != view_state_id:
        raise HTTPException(status_code=409, detail="Ya existe una vista BIM con ese nombre en este proyecto.")

    return BimViewStateResponse.model_validate(renamed_state, from_attributes=True)


@router.get("/projects/{project_id}/workspace-context", response_model=BimWorkspaceContextResponse)
def read_bim_workspace_context(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    state = get_workspace_context_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
    )
    payload = BimWorkspaceContextPayload.model_validate(state.payload or {}) if state else BimWorkspaceContextPayload()
    return BimWorkspaceContextResponse(
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        payload=payload,
    )


@router.put("/projects/{project_id}/workspace-context", response_model=BimWorkspaceContextResponse)
def upsert_bim_workspace_context(
    project_id: int,
    payload: BimWorkspaceContextUpsertRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")

    state = upsert_workspace_context_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        bim_model_version_id=None,
        payload=payload.model_dump(),
    )
    return BimWorkspaceContextResponse(
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        payload=BimWorkspaceContextPayload.model_validate(state.payload or {}),
    )
