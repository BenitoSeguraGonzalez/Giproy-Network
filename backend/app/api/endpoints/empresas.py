from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
import base64
from app.core.database import get_db
from app.schemas.empresa import EmpresaResponse, EmpresaCreate, EmpresaUpdate
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.models.registration_verification import RegistrationVerificationToken
from app.services.empresa import empresa_service

router = APIRouter()

UPLOAD_DIR = "uploads/logos"

def check_superadmin(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol.lower() != "superadministrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación permitida solo para Superadministradores"
        )
    return current_user


def _attach_registration_status(db: Session, payload: dict) -> dict:
    if payload.get("activa"):
        payload["registration_status"] = "active"
        return payload

    token = (
        db.query(RegistrationVerificationToken)
        .filter(
            RegistrationVerificationToken.empresa_id == payload.get("id"),
            RegistrationVerificationToken.used_at.is_(None),
        )
        .order_by(RegistrationVerificationToken.created_at.desc())
        .first()
    )
    if token and token.is_valid():
        payload["registration_status"] = "pending_email_verification"
    elif token:
        payload["registration_status"] = "pending_email_expired"
    else:
        payload["registration_status"] = "inactive"
    return payload

@router.get("/me", response_model=EmpresaResponse)
def get_empresa_me(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    empresa = empresa_service.get_empresa(db, empresa_id=current_user.empresa_id)
    return _attach_registration_status(db, empresa_service.serialize_empresa(empresa))

@router.get("/", response_model=List[EmpresaResponse])
def get_empresas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    empresas = empresa_service.get_all_empresas(db)
    return [_attach_registration_status(db, item) for item in empresa_service.serialize_empresas(empresas)]

@router.get("/{empresa_id}", response_model=EmpresaResponse)
def get_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.rol.lower() != "superadministrador" and current_user.empresa_id != empresa_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para ver esta empresa"
        )
    empresa = empresa_service.get_empresa(db, empresa_id=empresa_id)
    return _attach_registration_status(db, empresa_service.serialize_empresa(empresa))

@router.post("/", response_model=EmpresaResponse)
def create_empresa(
    empresa_in: EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
):
    empresa = empresa_service.create_empresa(db, empresa_in=empresa_in, current_user=current_user)
    return _attach_registration_status(db, empresa_service.serialize_empresa(empresa))

@router.delete("/{empresa_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_empresa(
    empresa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(check_superadmin)
) -> None:
    empresa_service.delete_empresa(db, empresa_id=empresa_id, current_user=current_user)
    return None

@router.put("/{empresa_id}", response_model=EmpresaResponse)
def update_empresa(
    empresa_id: int,
    empresa_in: EmpresaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    empresa = empresa_service.update_empresa(db, empresa_id=empresa_id, empresa_in=empresa_in, current_user=current_user)
    return _attach_registration_status(db, empresa_service.serialize_empresa(empresa))

@router.post("/upload-logo/{empresa_id}")
async def upload_logo(
    empresa_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Validación previa de permisos antes de procesar el archivo
    if current_user.rol.lower() != "superadministrador":
        if current_user.rol.lower() != "administrador" or current_user.empresa_id != empresa_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para modificar el logo de esta empresa"
            )
    
    # Validar extensión
    extension = file.filename.split(".")[-1].lower()
    if extension not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(status_code=400, detail="Formato de imagen no permitido")

    # Leer archivo y convertir a Base64
    file_content = await file.read()
    base64_content = base64.b64encode(file_content).decode('utf-8')
    logo_url = f"data:{file.content_type};base64,{base64_content}"

    # Actualizar vía servicio
    empresa_service.update_logo(db, empresa_id=empresa_id, logo_url=logo_url, current_user=current_user)
    
    return {"status": "success", "logo_url": logo_url}
