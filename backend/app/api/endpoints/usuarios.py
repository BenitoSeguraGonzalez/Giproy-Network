from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse, UsuarioCreate, ValidarRucResponse
from app.services.usuario import usuario_service
from app.services.empresa import empresa_service
from app.services.marketplace_profile import evaluate_marketplace_profile, seed_admin_marketplace_profile_from_company
from app.services.marketplace_permissions import resolve_marketplace_permissions

router = APIRouter()

@router.get("/me", response_model=UsuarioResponse)
def get_user_me(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    seed_admin_marketplace_profile_from_company(db, current_user)
    payload = {
        "id": current_user.id,
        "email": current_user.email,
        "nombre_completo": current_user.nombre_completo,
        "rol": current_user.rol,
        "activo": current_user.activo,
        "empresa_id": current_user.empresa_id,
        "ruc": current_user.ruc,
        "nombres": current_user.nombres,
        "apellidos": current_user.apellidos,
        "alias": current_user.alias,
        "nacionalidad": current_user.nacionalidad,
        "profesion": current_user.profesion,
        "ciudad": current_user.ciudad,
        "provincia": current_user.provincia,
        "canton": current_user.canton,
        "pais": current_user.pais,
        "movil": current_user.movil,
        "acepta_politica_privacidad": current_user.acepta_politica_privacidad,
        "acepta_politicas_comunicacion": current_user.acepta_politicas_comunicacion,
        "autoriza_publicidad": current_user.autoriza_publicidad,
        "fecha_creacion": current_user.fecha_creacion,
        "last_active_at": current_user.last_active_at,
        "fecha_expiracion": current_user.fecha_expiracion,
        "ruc_verificado": current_user.ruc_verificado,
        "razon_social_ruc": current_user.razon_social_ruc,
        "estado_contribuyente": current_user.estado_contribuyente,
        "clase_contribuyente": current_user.clase_contribuyente,
        "fecha_inicio_actividades": current_user.fecha_inicio_actividades,
        "actividad_economica": current_user.actividad_economica,
        "fecha_aceptacion_politica_privacidad": current_user.fecha_aceptacion_politica_privacidad,
        "fecha_aceptacion_politicas_comunicacion": current_user.fecha_aceptacion_politicas_comunicacion,
        "fecha_autorizacion_publicidad": current_user.fecha_autorizacion_publicidad,
        "empresa": None,
    }
    if current_user.empresa:
        payload["empresa"] = empresa_service.serialize_empresa(current_user.empresa)
    payload["marketplace_permissions"] = resolve_marketplace_permissions(current_user)
    profile_status = evaluate_marketplace_profile(current_user)
    payload["marketplace_profile_complete"] = profile_status["complete"]
    payload["marketplace_profile_missing_fields"] = profile_status["missing_fields"]
    payload["marketplace_profile_missing_labels"] = profile_status["missing_labels"]
    return payload

@router.get("/validar-ruc", response_model=ValidarRucResponse)
def validar_ruc(
    ruc: str = Query(..., description="Número de RUC a validar (13 dígitos)"),
    token: str = Query("", description="Parámetro legado; ya no se usa"),
    db: Session = Depends(get_db),
) -> Any:
    return usuario_service.validar_ruc(ruc=ruc, token=token, db=db)

@router.get("/", response_model=List[UsuarioResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    return usuario_service.get_users(db=db, current_user=current_user, target_empresa_id=empresa_id)

@router.post("/", response_model=UsuarioResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UsuarioCreate,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    return usuario_service.create_usuario(db=db, user_in=user_in, current_user=current_user, target_empresa_id=empresa_id)

from app.schemas.usuario import UsuarioUpdate

@router.put("/{user_id}", response_model=UsuarioResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    return usuario_service.update_usuario(db=db, user_id=user_id, user_in=user_in, current_user=current_user, target_empresa_id=empresa_id)

@router.delete("/{user_id}", response_model=UsuarioResponse)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    return usuario_service.delete_usuario(db=db, user_id=user_id, current_user=current_user, target_empresa_id=empresa_id)
