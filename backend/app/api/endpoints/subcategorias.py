from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.models.usuario import Usuario
from app.api.deps import get_db, get_current_active_user
from app.schemas.recurso import CategoriaBase, CategoriaResponse
from app.services.subcategoria import subcategoria_service

router = APIRouter()

def get_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    """Helper para determinar la empresa objetivo según el rol."""
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        return empresa_id
    return current_user.empresa_id

@router.get("/", response_model=List[CategoriaResponse])
def read_subcategorias(
    db: Session = Depends(get_db),
    base_id: int = Query(...),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Listar subcategorías de una base de trabajo específica."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    return subcategoria_service.get_subcategorias(db, base_id=base_id, empresa_id=target_id)

@router.post("/", response_model=CategoriaResponse)
def create_subcategoria(
    *,
    db: Session = Depends(get_db),
    sub_in: CategoriaBase,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Crear nueva subcategoría vinculada a una base."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    return subcategoria_service.create_subcategoria(db, obj_in=sub_in, empresa_id=target_id)

@router.put("/{id}", response_model=CategoriaResponse)
def update_subcategoria(
    *,
    db: Session = Depends(get_db),
    id: int,
    sub_in: CategoriaBase,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Actualizar subcategoría."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.update_subcategoria(db, id=id, obj_in=sub_in, empresa_id=target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{id}", response_model=CategoriaResponse)
def delete_subcategoria(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """Eliminar subcategoría."""
    target_id = get_target_empresa_id(current_user, empresa_id)
    try:
        return subcategoria_service.delete_subcategoria(db, id=id, empresa_id=target_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
