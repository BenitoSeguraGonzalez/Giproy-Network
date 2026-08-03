from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.usuario import Usuario
from app.schemas.edo import EdoNode, EdoNodeCreate, EdoNodeUpdate, EdoNodeMove, EdoBulkDelete, EdoBulkMove
from app.repositories.edo import edo_repo
from app.models.edo import EdoNode as EdoNodeModel
from app.services.audit_event import record_project_entity_event
from app.services.project_capability import require_project_user_capability

router = APIRouter()

def _ensure_edo_write_access(current_user: Usuario):
    if (current_user.rol or "").lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=403, detail="La edición EDO queda reservada a administradores.")

def _verify_module_access(db: Session, proyecto_id: int, usuario_id: int, module: str = "edo"):
    require_project_user_capability(db, project_id=proyecto_id, user_id=usuario_id, capability="project.view")
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return
    if "todos" in perms["allowed_modules"] or module in perms["allowed_modules"]:
        return
    raise HTTPException(status_code=403, detail=f"Acceso denegado al módulo {module}")

@router.get("/project/{proyecto_id}", response_model=List[EdoNode])
def get_edo_tree(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Obtener el árbol EDO completo para un proyecto.
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    _verify_module_access(db, proyecto_id, current_user.id)
    return edo_repo.get_tree(db=db, proyecto_id=proyecto_id, empresa_id=target_empresa_id)

@router.post("/", response_model=EdoNode)
def create_edo_node(
    node_in: EdoNodeCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Crea un nuevo nodo (Hito o Stakeholder) al final de su rama.
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    node = edo_repo.create(db=db, obj_in=node_in, empresa_id=target_empresa_id)
    record_project_entity_event(db, project_id=node.proyecto_id, actor=current_user, module="edo", event_type="edo_node_created", message="Nodo EDO creado.", entity_type="edo_node", entity_id=node.id)
    return node

@router.post("/bulk-delete")
def bulk_delete_edo_nodes(
    bulk_in: EdoBulkDelete,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Borra múltiples nodos y sus hijos en cascada.
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    project_ids = {row[0] for row in db.query(EdoNodeModel.proyecto_id).filter(EdoNodeModel.id.in_(bulk_in.ids), EdoNodeModel.empresa_id == target_empresa_id).all()}
    edo_repo.delete_multiple(db=db, ids=bulk_in.ids, empresa_id=target_empresa_id)
    for project_id in project_ids:
        record_project_entity_event(db, project_id=project_id, actor=current_user, module="edo", event_type="edo_nodes_deleted", message="Nodos EDO eliminados.", entity_type="edo_node_batch", entity_id=project_id, operation_status="deleted", payload={"node_ids": bulk_in.ids})
    return {"message": f"{len(bulk_in.ids)} nodos eliminados correctamente"}

@router.post("/bulk-move")
def bulk_move_edo_nodes(
    bulk_in: EdoBulkMove,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Mueve múltiples nodos a un nuevo padre.
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    project_ids = {row[0] for row in db.query(EdoNodeModel.proyecto_id).filter(EdoNodeModel.id.in_(bulk_in.ids), EdoNodeModel.empresa_id == target_empresa_id).all()}
    edo_repo.move_multiple(db=db, ids=bulk_in.ids, new_parent_id=bulk_in.new_parent_id, empresa_id=target_empresa_id)
    for project_id in project_ids:
        record_project_entity_event(db, project_id=project_id, actor=current_user, module="edo", event_type="edo_nodes_moved", message="Nodos EDO movidos.", entity_type="edo_node_batch", entity_id=project_id, payload={"node_ids": bulk_in.ids, "new_parent_id": bulk_in.new_parent_id})
    return {"message": f"{len(bulk_in.ids)} nodos movidos correctamente"}

@router.put("/{id}", response_model=EdoNode)
def update_edo_node(
    id: int,
    node_in: EdoNodeUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Actualiza datos básicos de un nodo.
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    node = edo_repo.update(db=db, id=id, obj_in=node_in, empresa_id=target_empresa_id)
    if not node:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    record_project_entity_event(db, project_id=node.proyecto_id, actor=current_user, module="edo", event_type="edo_node_updated", message="Nodo EDO actualizado.", entity_type="edo_node", entity_id=node.id, payload={"changed_fields": sorted(node_in.model_dump(exclude_unset=True).keys())})
    return node

@router.put("/{id}/move", response_model=EdoNode)
def move_edo_node(
    id: int,
    move_in: EdoNodeMove,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Mueve un nodo a otro padre y/o a otra posición (orden).
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    node = edo_repo.move(db=db, id=id, obj_in=move_in, empresa_id=target_empresa_id)
    if not node:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    record_project_entity_event(db, project_id=node.proyecto_id, actor=current_user, module="edo", event_type="edo_node_moved", message="Nodo EDO movido.", entity_type="edo_node", entity_id=node.id, payload={"parent_id": node.parent_id, "order": node.orden})
    return node

@router.delete("/{id}")
def delete_edo_node(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """
    Borra un nodo y todos sus hijos en cascada.
    """
    _ensure_edo_write_access(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    target = db.query(EdoNodeModel).filter(EdoNodeModel.id == id, EdoNodeModel.empresa_id == target_empresa_id).first()
    project_id = target.proyecto_id if target else None
    success = edo_repo.delete(db=db, id=id, empresa_id=target_empresa_id)
    if not success:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    if project_id:
        record_project_entity_event(db, project_id=project_id, actor=current_user, module="edo", event_type="edo_node_deleted", message="Nodo EDO eliminado.", entity_type="edo_node", entity_id=id, operation_status="deleted")
    return {"message": "Nodo eliminado correctamente"}
