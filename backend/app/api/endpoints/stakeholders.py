from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.stakeholder import Stakeholder, StakeholderCreate, StakeholderUpdate, StakeholderAssignment
from app.repositories.stakeholder import stakeholder_repo
from app.core.phone_normalization import is_valid_phone, normalize_phone
from app.models.proyecto import Proyecto
from app.models.stakeholder import ProyectoStakeholder
from app.services.audit_event import record_project_entity_event
from app.services.project_capability import require_project_user_capability

router = APIRouter()

def _project_for_root(db: Session, codigo_root: str, empresa_id: int):
    return db.query(Proyecto).filter(Proyecto.codigo_root == codigo_root, Proyecto.empresa_id == empresa_id).order_by(Proyecto.revision.asc()).first()

def _require_stakeholder_editor(current_user):
    if (current_user.rol or "").lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=403, detail="La edición de stakeholders queda reservada a administradores del proyecto.")

def _verify_module_access(db: Session, proyecto_id: int, usuario_id: int, module: str = "stakeholders"):
    require_project_user_capability(db, project_id=proyecto_id, user_id=usuario_id, capability="project.view")
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return # Si no hay asignaciones (y no es admin), read_proyectos ya lo filtra, pero por si acaso.
    
    if "todos" in perms["allowed_modules"] or module in perms["allowed_modules"]:
        return
    
    raise HTTPException(status_code=403, detail=f"Acceso denegado al módulo {module}")

@router.get("/project/{codigo_root}", response_model=List[Stakeholder])
def read_stakeholders(
    codigo_root: str,
    proyecto_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    """
    Recuperar stakeholders asociados a un proyecto raíz. 
    """
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    # Verificar permisos de módulo
    if proyecto_id:
        _verify_module_access(db, proyecto_id, current_user.id)
    else:
        # Si no hay proyecto_id, buscamos el raíz o la revisión activa
        from app.models.proyecto import Proyecto
        p = db.query(Proyecto).filter(Proyecto.codigo_root == codigo_root, Proyecto.empresa_id == target_empresa_id).first()
        if p:
            _verify_module_access(db, p.id, current_user.id)

    try:
        return stakeholder_repo.get_by_project_root(
            db, codigo_root=codigo_root, empresa_id=target_empresa_id, proyecto_id=proyecto_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.post("/", response_model=Stakeholder)
def create_stakeholder(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: StakeholderCreate,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    _require_stakeholder_editor(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    if obj_in.movil:
        if not is_valid_phone(obj_in.movil):
            raise HTTPException(status_code=400, detail="El móvil debe tener un formato válido.")
        obj_in.movil = normalize_phone(obj_in.movil, obj_in.pais)

    try:
        stakeholder = stakeholder_repo.create(db, obj_in=obj_in, empresa_id=target_empresa_id)
        project = _project_for_root(db, stakeholder.proyecto_codigo_root, target_empresa_id)
        if project:
            record_project_entity_event(db, project_id=project.id, actor=current_user, module="stakeholders", event_type="stakeholder_created", message="Stakeholder creado.", entity_type="stakeholder", entity_id=stakeholder.id, payload={"code": stakeholder.codigo})
        return stakeholder
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@router.put("/{id}", response_model=Stakeholder)
def update_stakeholder(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    obj_in: StakeholderUpdate,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    _require_stakeholder_editor(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    db_obj = stakeholder_repo.get_by_id(db, id=id)
    if not db_obj or db_obj.empresa_id != target_empresa_id:
        raise HTTPException(status_code=404, detail="Stakeholder no encontrado")

    if obj_in.movil:
        if not is_valid_phone(obj_in.movil):
            raise HTTPException(status_code=400, detail="El móvil debe tener un formato válido.")
        country_name = obj_in.pais if obj_in.pais is not None else db_obj.pais
        obj_in.movil = normalize_phone(obj_in.movil, country_name)

    stakeholder = stakeholder_repo.update(db, db_obj=db_obj, obj_in=obj_in)
    project = _project_for_root(db, stakeholder.proyecto_codigo_root, target_empresa_id)
    if project:
        record_project_entity_event(db, project_id=project.id, actor=current_user, module="stakeholders", event_type="stakeholder_updated", message="Stakeholder actualizado.", entity_type="stakeholder", entity_id=stakeholder.id, payload={"changed_fields": sorted(obj_in.model_dump(exclude_unset=True).keys())})
    return stakeholder

@router.delete("/{id}", response_model=Stakeholder)
def delete_stakeholder(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    user_role = current_user.rol.lower() if current_user.rol else ""
    if user_role not in ["administrador", "superadministrador"]:
        raise HTTPException(status_code=403, detail="No tiene permisos suficientes")

    target_empresa_id = current_user.empresa_id
    if user_role == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    
    db_obj = stakeholder_repo.get_by_id(db, id=id)
    if not db_obj or db_obj.empresa_id != target_empresa_id:
        raise HTTPException(status_code=404, detail="Stakeholder no encontrado")
    project = _project_for_root(db, db_obj.proyecto_codigo_root, target_empresa_id)
    try:
        deleted = stakeholder_repo.delete(db, id=id)
        if project:
            record_project_entity_event(db, project_id=project.id, actor=current_user, module="stakeholders", event_type="stakeholder_deleted", message="Stakeholder eliminado.", entity_type="stakeholder", entity_id=id, operation_status="deleted")
        return deleted
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

# --- ASIGNACIONES ---

@router.post("/assign", status_code=201)
def assign_stakeholder(
    *,
    db: Session = Depends(deps.get_db),
    obj_in: StakeholderAssignment,
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None)
) -> Any:
    _require_stakeholder_editor(current_user)
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    # Verificar que el stakeholder pertenezca a la empresa
    stk = stakeholder_repo.get_by_id(db, id=obj_in.stakeholder_id)
    if not stk or stk.empresa_id != target_empresa_id:
        raise HTTPException(status_code=404, detail="Stakeholder no encontrado")
    
    try:
        stakeholder_repo.assign_to_project(
            db,
            proyecto_id=obj_in.proyecto_id,
            stakeholder_id=obj_in.stakeholder_id,
            rol_id=obj_in.rol_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    record_project_entity_event(db, project_id=obj_in.proyecto_id, actor=current_user, module="stakeholders", event_type="stakeholder_assigned", message="Stakeholder asignado al proyecto.", entity_type="project_stakeholder", entity_id=obj_in.stakeholder_id, payload={"role_id": obj_in.rol_id})
    return {"msg": "Asignado correctamente"}

@router.delete("/unassign/{proyecto_id}/{stakeholder_id}")
def unassign_stakeholder(
    proyecto_id: int,
    stakeholder_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
    empresa_id: Optional[int] = Query(None),
) -> Any:
    _require_stakeholder_editor(current_user)
    target_empresa_id = current_user.empresa_id
    if (current_user.rol or "").lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    project = db.query(Proyecto).filter(Proyecto.id == proyecto_id, Proyecto.empresa_id == target_empresa_id).first()
    assignment = db.query(ProyectoStakeholder).filter(ProyectoStakeholder.proyecto_id == proyecto_id, ProyectoStakeholder.stakeholder_id == stakeholder_id).first()
    if not project or not assignment:
        raise HTTPException(status_code=404, detail="Asignación fuera del proyecto activo.")
    try:
        stakeholder_repo.unassign_from_project(db, proyecto_id=proyecto_id, stakeholder_id=stakeholder_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    record_project_entity_event(db, project_id=proyecto_id, actor=current_user, module="stakeholders", event_type="stakeholder_unassigned", message="Stakeholder retirado del proyecto.", entity_type="project_stakeholder", entity_id=stakeholder_id, operation_status="removed")
    return {"msg": "Desasignado correctamente"}
