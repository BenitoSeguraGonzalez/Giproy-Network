from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.services.dispositivo import dispositivo_service
from app.schemas.dispositivo import (
    DispositivoResponse,
    DispositivoListResponse,
    DispositivoUpdate,
    ValidacionDispositivoResponse
)

router = APIRouter()

@router.get("/validar", response_model=ValidacionDispositivoResponse)
def validar_dispositivo(
    device_id: str = Query(..., description="Identificador del dispositivo"),
    empresa_id: int = Query(..., description="ID de la empresa"),
    db: Session = Depends(get_db)
):
    """
    Valida si un dispositivo está autorizado para acceder al sistema.
    """
    return dispositivo_service.validar_dispositivo(db, device_id, empresa_id)

@router.get("/", response_model=DispositivoListResponse)
def listar_dispositivos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    empresa_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos los dispositivos de la empresa actual.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador":
        if empresa_id:
            target_empresa_id = empresa_id
    elif current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="No tiene permisos para ver dispositivos")
    
    from app.repositories.dispositivo import dispositivo_repo
    dispositivos = dispositivo_repo.get_by_empresa(db, target_empresa_id, skip, limit)
    total = dispositivo_repo.get_count_by_empresa(db, target_empresa_id)
    
    return DispositivoListResponse(
        dispositivos=dispositivos,
        total=total
    )

@router.get("/{dispositivo_id}", response_model=DispositivoResponse)
def obtener_dispositivo(
    dispositivo_id: int,
    empresa_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene los detalles de un dispositivo específico"""
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    if current_user.rol.lower() == "superadministrador":
        if empresa_id and dispositivo.empresa_id != empresa_id:
             raise HTTPException(status_code=403, detail="Empresa mismatch")
    elif current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    elif dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return dispositivo

@router.patch("/{dispositivo_id}", response_model=DispositivoResponse)
def actualizar_dispositivo(
    dispositivo_id: int,
    update_data: DispositivoUpdate,
    empresa_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza un dispositivo"""
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    if current_user.rol.lower() == "superadministrador":
        if empresa_id and dispositivo.empresa_id != empresa_id:
             raise HTTPException(status_code=403, detail="Empresa mismatch")
    elif current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    elif dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return dispositivo_service.update_dispositivo(db, dispositivo_id, update_data)

@router.post("/{dispositivo_id}/aprobar", response_model=DispositivoResponse)
def aprobar_dispositivo(
    dispositivo_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo or dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return dispositivo_service.set_status(db, dispositivo_id, "es_confiable", True)

@router.post("/{dispositivo_id}/bloquear", response_model=DispositivoResponse)
def bloquear_dispositivo(
    dispositivo_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo or dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return dispositivo_service.set_status(db, dispositivo_id, "bloqueado", True)

@router.post("/{dispositivo_id}/desbloquear", response_model=DispositivoResponse)
def desbloquear_dispositivo(
    dispositivo_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo or dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    return dispositivo_service.set_status(db, dispositivo_id, "bloqueado", False)

@router.delete("/{dispositivo_id}")
def eliminar_dispositivo(
    dispositivo_id: int,
    empresa_id: Optional[int] = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dispositivo = dispositivo_service.get_dispositivo(db, dispositivo_id)
    if not dispositivo:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    
    if current_user.rol.lower() == "superadministrador":
        if empresa_id and dispositivo.empresa_id != empresa_id:
             raise HTTPException(status_code=403, detail="Empresa mismatch")
    elif current_user.rol.lower() != "administrador":
        raise HTTPException(status_code=403, detail="Sin permisos")
    elif dispositivo.empresa_id != current_user.empresa_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    from app.repositories.dispositivo import dispositivo_repo
    dispositivo_repo.delete(db, dispositivo_id)
    return {"message": "Dispositivo eliminado correctamente"}
