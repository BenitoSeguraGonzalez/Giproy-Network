from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_link import BimElementOptionResponse, BimElementPageResponse, BimLinkCreateRequest, BimLinkResponse
from app.services.bim.feature_flags import resolve_bim_feature_access
from app.services.bim.link_registry import (
    create_link_for_project,
    delete_link_for_project,
    list_elements_for_project,
    list_links_for_project,
    search_elements_for_project,
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


def _ensure_bim_access(db: Session, project: Proyecto, current_user: Usuario) -> None:
    access = resolve_bim_feature_access(
        db=db,
        user_id=current_user.id,
        company_id=project.empresa_id,
        role=current_user.rol,
    )
    if not access.enabled:
        raise HTTPException(status_code=403, detail="La capa BIM no está habilitada para este contexto.")


@router.get("/projects/{project_id}/elements", response_model=list[BimElementOptionResponse])
def list_bim_elements(
    project_id: int,
    empresa_id: Optional[int] = None,
    version_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _ensure_bim_access(db, project, current_user)
    return list_elements_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        version_id=version_id,
    )


@router.get("/projects/{project_id}/elements/search", response_model=BimElementPageResponse)
def search_bim_elements(
    project_id: int,
    empresa_id: Optional[int] = None,
    version_id: Optional[int] = None,
    q: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _ensure_bim_access(db, project, current_user)
    return search_elements_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        version_id=version_id,
        query_text=q,
        page=page,
        page_size=page_size,
    )


@router.get("/projects/{project_id}/links", response_model=list[BimLinkResponse])
def list_bim_links(
    project_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _ensure_bim_access(db, project, current_user)
    return list_links_for_project(db, project_id=project.id, company_id=project.empresa_id)


@router.post("/projects/{project_id}/links", response_model=BimLinkResponse)
def create_bim_link(
    project_id: int,
    payload: BimLinkCreateRequest,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _ensure_bim_access(db, project, current_user)
    return create_link_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
        payload=payload,
    )


@router.delete("/projects/{project_id}/links/{target_type}/{link_id}", status_code=204)
def delete_bim_link(
    project_id: int,
    target_type: str,
    link_id: int,
    empresa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    project = _resolve_project(db, project_id, current_user, empresa_id)
    _ensure_bim_access(db, project, current_user)
    delete_link_for_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        target_type=target_type,
        link_id=link_id,
    )
