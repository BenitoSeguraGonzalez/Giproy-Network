from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Any, Dict, List, Optional, Set

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.edt import EdtNode
from app.models.usuario import Usuario
from app.schemas.edt import EdtNodeResponse, EdtNodeCreate, EdtNodeUpdate, EdtNodeMove, EdtBulkDelete, EdtBulkMove
from app.repositories.edt import edt_repo
from app.services.proyecto import proyecto_service

router = APIRouter()


def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    return target_empresa_id


def _is_admin_role(current_user: Usuario) -> bool:
    return (current_user.rol or "").lower() in {"administrador", "superadministrador"}


def _serialize_edt_node(node: EdtNode, children_by_parent: Dict[Optional[int], List[EdtNode]]) -> Dict[str, Any]:
    return {
        "id": node.id,
        "proyecto_id": node.proyecto_id,
        "parent_id": node.parent_id,
        "tipo_nodo": node.tipo_nodo,
        "orden": node.orden,
        "codigo": node.codigo,
        "nombre": node.nombre,
        "definicion": node.definicion,
        "stakeholder_id": node.stakeholder_id,
        "rol_id": node.rol_id,
        "actividades_claves": node.actividades_claves,
        "stakeholder": node.stakeholder,
        "rol": node.rol,
        "hijos": [
            _serialize_edt_node(child, children_by_parent)
            for child in children_by_parent.get(node.id, [])
        ],
    }


def _get_pruned_tree_for_restricted_user(
    db: Session,
    *,
    proyecto_id: int,
    empresa_id: int,
    allowed_edt_ids: Set[int],
) -> List[Dict[str, Any]]:
    nodes = (
        db.query(EdtNode)
        .options(joinedload(EdtNode.stakeholder), joinedload(EdtNode.rol))
        .filter(EdtNode.proyecto_id == proyecto_id, EdtNode.empresa_id == empresa_id)
        .order_by(EdtNode.orden.asc(), EdtNode.id.asc())
        .all()
    )
    nodes_by_id = {node.id: node for node in nodes}
    children_by_parent_all: Dict[Optional[int], List[EdtNode]] = {}
    for node in nodes:
        children_by_parent_all.setdefault(node.parent_id, []).append(node)

    visible_ids: Set[int] = set()
    for edt_id in allowed_edt_ids:
        if edt_id not in nodes_by_id:
            continue

        current = nodes_by_id[edt_id]
        while current:
            visible_ids.add(current.id)
            current = nodes_by_id.get(current.parent_id)

        stack = list(children_by_parent_all.get(edt_id, []))
        while stack:
            child = stack.pop()
            visible_ids.add(child.id)
            stack.extend(children_by_parent_all.get(child.id, []))

    children_by_parent_visible: Dict[Optional[int], List[EdtNode]] = {}
    for node in nodes:
        if node.id in visible_ids:
            children_by_parent_visible.setdefault(node.parent_id, []).append(node)

    roots = [
        node
        for node in nodes
        if node.id in visible_ids and (node.parent_id is None or node.parent_id not in visible_ids)
    ]
    return [_serialize_edt_node(node, children_by_parent_visible) for node in roots]


def _ensure_edt_read_access(db: Session, proyecto_id: int, current_user: Usuario) -> dict:
    perms = proyecto_service.get_user_permissions(db, proyecto_id, current_user.id)
    if _is_admin_role(current_user):
        return perms
    if not perms["has_assignment"]:
        raise HTTPException(status_code=403, detail="No tiene asignacion para consultar la EDT de este proyecto.")
    return perms


def _ensure_edt_write_access(current_user: Usuario) -> None:
    if not _is_admin_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="El MVP Equipo permite consulta EDT por asignacion; la edicion queda reservada a administradores.",
        )


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
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    perms = _ensure_edt_read_access(db, proyecto_id, current_user)

    if perms["is_restricted"]:
        return _get_pruned_tree_for_restricted_user(
            db,
            proyecto_id=proyecto_id,
            empresa_id=target_empresa_id,
            allowed_edt_ids=set(perms["edt_ids"]),
        )

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

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
    _ensure_edt_write_access(current_user)
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

    success = edt_repo.delete(db=db, id=id, empresa_id=target_empresa_id)
    if not success:
        raise HTTPException(status_code=404, detail="Nodo no encontrado")
    return {"message": "Nodo eliminado correctamente"}
