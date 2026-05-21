from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_model import (
    BimJsonImportBatchRequest,
    BimJsonImportBatchResponse,
    BimJsonImportRequest,
    BimJsonImportResponse,
    BimJsonValidationBatchResponse,
    BimModelResponse,
    BimWorkspaceSummaryResponse,
)
from app.services.bim.demo_bootstrap import bootstrap_demo_bim_project
from app.services.bim.feature_flags import resolve_bim_feature_access
from app.services.bim.import_service import import_json_bim_batch, import_json_bim_package, validate_json_bim_batch
from app.services.bim.model_registry import get_workspace_summary, list_models_for_project

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


@router.get("/projects/{project_id}/workspace", response_model=BimWorkspaceSummaryResponse)
def get_bim_workspace(
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

    return get_workspace_summary(db, project_id=project.id, company_id=project.empresa_id)


@router.get("/projects/{project_id}/models", response_model=list[BimModelResponse])
def list_bim_models(
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

    models = list_models_for_project(db, project_id=project.id, company_id=project.empresa_id)
    return [BimModelResponse.model_validate(model, from_attributes=True) for model in models]


@router.post("/projects/{project_id}/bootstrap-demo")
def bootstrap_demo_workspace(
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
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede bootstrapear el workspace BIM.")

    result = bootstrap_demo_bim_project(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        user_id=current_user.id,
    )
    return {
        "message": "Bootstrap BIM demo materializado.",
        **result,
    }


@router.post("/projects/{project_id}/imports/json-package", response_model=BimJsonImportResponse)
def import_json_package(
    project_id: int,
    payload: BimJsonImportRequest,
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
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar paquetes BIM.")

    return import_json_bim_package(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        payload=payload,
    )


@router.post("/projects/{project_id}/imports/json-batch", response_model=BimJsonImportBatchResponse)
def import_json_batch(
    project_id: int,
    payload: BimJsonImportBatchRequest,
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
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede importar paquetes BIM.")
    if not payload.packages:
        raise HTTPException(status_code=400, detail="No se recibieron paquetes BIM para importar.")

    return import_json_bim_batch(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        packages=payload.packages,
    )


@router.post("/projects/{project_id}/imports/json-validate", response_model=BimJsonValidationBatchResponse)
def validate_json_batch(
    project_id: int,
    payload: BimJsonImportBatchRequest,
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
    if (current_user.rol or "").lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador puede validar paquetes BIM.")
    if not payload.packages:
        raise HTTPException(status_code=400, detail="No se recibieron paquetes BIM para validar.")

    return validate_json_bim_batch(payload.packages)
