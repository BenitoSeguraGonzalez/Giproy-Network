from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.edt import EdtNodeResponse, EdtNodeCreate, EdtNodeUpdate, EdtNodeMove, EdtBulkDelete, EdtBulkMove
from app.repositories.edt import edt_repo

router = APIRouter()

@router.get("/project/{proyecto_id}", response_model=List[EdtNodeResponse])
def get_edt_tree(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Obtener el árbol EDT completo para un proyecto.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    return edt_repo.get_tree(db=db, proyecto_id=proyecto_id, empresa_id=target_empresa_id)

@router.post("/", response_model=EdtNodeResponse)
def create_edt_node(
    node_in: EdtNodeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Crea un nuevo nodo (Cuenta Paquete o Stakeholder) al final de su rama.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    return edt_repo.create(db=db, obj_in=node_in, empresa_id=target_empresa_id)

@router.post("/bulk-delete")
def bulk_delete_edt_nodes(
    bulk_in: EdtBulkDelete,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Borra múltiples nodos y sus hijos en cascada.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    edt_repo.delete_multiple(db=db, ids=bulk_in.ids, empresa_id=target_empresa_id)
    return {"message": f"{len(bulk_in.ids)} nodos eliminados correctamente"}

@router.post("/bulk-move")
def bulk_move_edt_nodes(
    bulk_in: EdtBulkMove,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Mueve múltiples nodos a un nuevo padre.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    edt_repo.move_multiple(db=db, ids=bulk_in.ids, new_parent_id=bulk_in.new_parent_id, empresa_id=target_empresa_id)
    return {"message": f"{len(bulk_in.ids)} nodos movidos correctamente"}

@router.put("/{id}", response_model=EdtNodeResponse)
def update_edt_node(
    id: int,
    node_in: EdtNodeUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Actualiza datos básicos de un nodo.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    node = edt_repo.update(db=db, id=id, obj_in=node_in, empresa_id=target_empresa_id)
    if not node:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    return node

@router.put("/{id}/move", response_model=EdtNodeResponse)
def move_edt_node(
    id: int,
    move_in: EdtNodeMove,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Mueve un nodo a otro padre y/o a otra posición (orden).
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    node = edt_repo.move(db=db, id=id, obj_in=move_in, empresa_id=target_empresa_id)
    if not node:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    return node

@router.delete("/{id}")
def delete_edt_node(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Borra un nodo y todos sus hijos en cascada.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    success = edt_repo.delete(db=db, id=id, empresa_id=target_empresa_id)
    if not success:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    return {"message": "Nodo eliminado correctamente"}
