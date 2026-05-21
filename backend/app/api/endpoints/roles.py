from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.stakeholder import Rol, RolCreate, RolUpdate
from app.repositories.stakeholder import stakeholder_repo

router = APIRouter()

@router.get("/", response_model=List[Rol])
def read_roles(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    # Determinar empresa_id objetivo
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
        
    return stakeholder_repo.get_roles(db, empresa_id=target_empresa_id)

@router.post("/", response_model=Rol)
def create_rol(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: RolCreate,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
        
    return stakeholder_repo.create_rol(db, obj_in=obj_in, empresa_id=target_empresa_id)

@router.put("/{id}", response_model=Rol)
def update_rol(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    obj_in: RolUpdate,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    db_obj = stakeholder_repo.get_rol_by_id(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
        
    # Verificar scoping
    if current_user.rol.lower() != "superadministrador":
        if db_obj.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No tiene permisos para modificar este rol")
    elif empresa_id and db_obj.empresa_id != empresa_id:
         raise HTTPException(status_code=403, detail="El rol no pertenece a la empresa especificada")
            
    return stakeholder_repo.update_rol(db, db_obj=db_obj, obj_in=obj_in)

@router.delete("/{id}", response_model=Rol)
def delete_rol(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: int = Query(None)
) -> Any:
    if current_user.rol.lower() not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
        
    db_obj = stakeholder_repo.get_rol_by_id(db, id=id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
        
    # Verificar scoping
    if current_user.rol.lower() != "superadministrador":
        if db_obj.empresa_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este rol")
    elif empresa_id and db_obj.empresa_id != empresa_id:
         raise HTTPException(status_code=403, detail="El rol no pertenece a la empresa especificada")
            
    return stakeholder_repo.delete_rol(db, id=id)
