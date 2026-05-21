from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.schemas.apu import (
    APUCreate, APUResponse, APUUpdate, APUImportRequest, 
    APUBulkDeleteRequest, APUBulkDeleteResponse, APUClipboardImportItem, APULineaMoveRequest,
    APUImpactSummaryResponse, APUBatchDetailRequest, ProyectoApuCpcResponse, ProyectoApuCpcUpsertRequest
)
from app.services.apu import apu_service
from app.models.apu import APU
from app.models.codcpc import CodCPC
from app.models.proyecto import Proyecto
from app.models.proyecto_apu_cpc import ProyectoApuCpc
from app.models.usuario import Usuario
from app.api.deps import get_db, get_current_user

router = APIRouter()


def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    return target_empresa_id


def _verify_project_access(db: Session, proyecto_id: int, usuario_id: int, module: str = "presupuestos") -> Proyecto:
    from app.services.proyecto import proyecto_service

    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return proyecto
    if "todos" in perms["allowed_modules"] or module in perms["allowed_modules"]:
        return proyecto
    raise HTTPException(status_code=403, detail=f"Acceso denegado al módulo {module}")


def _resolve_project_root(proyecto: Proyecto) -> str:
    return str(proyecto.codigo_root or proyecto.codigo or proyecto.id).strip()


def _get_apu_project_cpc_or_404(db: Session, *, apu_id: int, empresa_id: int) -> APU:
    apu = db.query(APU).filter(APU.id == apu_id, APU.empresa_id == empresa_id).first()
    if not apu:
        raise HTTPException(status_code=404, detail="APU no encontrado")
    return apu

@router.get("/", response_model=List[APUResponse])
def read_apus(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = Query(None),
    empresa_id: Optional[int] = Query(None),
    base_trabajo_id: Optional[int] = Query(None),
    base_id: Optional[int] = Query(None),
    subcategoria_item_id: Optional[int] = Query(None),
    revision: Optional[int] = Query(None)
):
    """Lista los APUs."""
    effective_base_id = base_id or base_trabajo_id
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    
    from app.repositories.apu import apu_repo
    return apu_repo.get_all(
        db, target_empresa_id, effective_base_id, subcategoria_item_id, q, revision
    )[skip : skip + limit]

@router.post("/", response_model=APUResponse)
def create_apu(
    *,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    apu_in: APUCreate,
    revision: Optional[int] = Query(0),
    empresa_id: Optional[int] = Query(None)
):
    """Crea un nuevo APU."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

    try:
        return apu_service.create_apu(db, apu_in, target_empresa_id, revision=revision)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id}", response_model=APUResponse)
def update_apu(
    *,
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    apu_in: APUUpdate,
    empresa_id: Optional[int] = Query(None)
):
    """Actualiza un APU."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

    try:
        apu = apu_service.update_apu(db, id, apu_in, target_empresa_id)
        if not apu:
            raise HTTPException(status_code=404, detail="APU no encontrado")
        return apu
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id}/lineas/move", response_model=APUResponse)
def move_apu_linea(
    *,
    id: int,
    move_in: APULineaMoveRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)

    try:
        return apu_service.move_linea(db, id, move_in.linea_id, move_in.target_index, target_empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
def delete_apu(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Elimina un APU con validación de integridad."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    
    try:
        if not apu_service.delete_apu(db, id, target_empresa_id):
            raise HTTPException(status_code=404, detail="APU no encontrado")
        return {"message": "APU eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk-delete", response_model=APUBulkDeleteResponse)
def bulk_delete_apus(
    delete_in: APUBulkDeleteRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Elimina múltiples APUs de forma atómica."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    try:
        deleted_ids = apu_service.bulk_delete(db, delete_in.apu_ids, target_empresa_id)
        return {
            "deleted_ids": deleted_ids,
            "deleted_count": len(deleted_ids),
            "message": f"Se eliminaron {len(deleted_ids)} APUs correctamente."
        }
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/duplicate", response_model=APUResponse)
def duplicate_apu(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Duplica un APU con sus líneas."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    try:
        return apu_service.duplicate_apu(db, id, target_empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/import-clipboard")
def import_clipboard(
    items: List[APUClipboardImportItem],
    base_id: int = Query(...),
    subcat_id: int = Query(...),
    revision: Optional[int] = Query(0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Importa APUs desde portapapeles."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    try:
        return apu_service.import_clipboard(db, items, target_empresa_id, base_id, subcat_id, revision=revision)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="No se pudo completar la importación por conflicto de códigos o duplicados en la base activa.")

@router.post("/batch/details", response_model=List[APUResponse])
def read_apus_batch_details(
    payload: APUBatchDetailRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Obtiene detalles completos de APUs en lote, incluyendo recursos y CPC."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    return apu_service.get_apus_by_ids(db, payload.apu_ids, target_empresa_id)


@router.get("/project-cpc", response_model=List[ProyectoApuCpcResponse])
def read_project_apu_cpc(
    proyecto_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Lista los CPC de APU asignados al proyecto raiz."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    proyecto = _verify_project_access(db, proyecto_id, current_user.id, module="presupuestos")
    if int(proyecto.empresa_id) != int(target_empresa_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    project_root = _resolve_project_root(proyecto)
    return (
        db.query(ProyectoApuCpc)
        .filter(
            ProyectoApuCpc.empresa_id == target_empresa_id,
            ProyectoApuCpc.proyecto_root_codigo == project_root,
        )
        .all()
    )


@router.put("/{id}/project-cpc", response_model=ProyectoApuCpcResponse)
def upsert_project_apu_cpc(
    id: int,
    payload: ProyectoApuCpcUpsertRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None),
):
    """Asigna el Codigo CPC de un APU dentro del proyecto raiz."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    proyecto = _verify_project_access(db, payload.proyecto_id, current_user.id, module="presupuestos")
    if int(proyecto.empresa_id) != int(target_empresa_id):
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    _get_apu_project_cpc_or_404(db, apu_id=id, empresa_id=target_empresa_id)
    cpc = db.query(CodCPC).filter(CodCPC.id == payload.cod_cpc_id).first()
    if not cpc:
        raise HTTPException(status_code=404, detail="Codigo CPC no encontrado")

    project_root = _resolve_project_root(proyecto)
    assignment = (
        db.query(ProyectoApuCpc)
        .filter(
            ProyectoApuCpc.empresa_id == target_empresa_id,
            ProyectoApuCpc.proyecto_root_codigo == project_root,
            ProyectoApuCpc.apu_id == id,
        )
        .first()
    )
    if assignment:
        assignment.cod_cpc_id = cpc.id
        assignment.updated_by_usuario_id = current_user.id
    else:
        assignment = ProyectoApuCpc(
            empresa_id=target_empresa_id,
            proyecto_root_codigo=project_root,
            apu_id=id,
            cod_cpc_id=cpc.id,
            updated_by_usuario_id=current_user.id,
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/{id}", response_model=APUResponse)
def read_apu(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Obtener detalle completo de un APU."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    
    apu = apu_service.get_apu(db, id, target_empresa_id)
    if not apu:
        raise HTTPException(status_code=404, detail="APU no encontrado")
    return apu

@router.get("/{id}/impact-summary", response_model=APUImpactSummaryResponse)
def read_apu_impact_summary(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    try:
        return apu_service.get_apu_impact_summary(db, id, target_empresa_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/import-from-base")
def import_from_base(
    request: APUImportRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    """Importa APUs y sus dependencias desde otra base de trabajo."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    try:
        return apu_service.import_from_other_base(
            db=db,
            source_base_id=request.source_base_id,
            target_base_id=request.target_base_id,
            source_revision=request.source_revision or 0,
            target_revision=request.target_revision or 0,
            apu_ids=request.apu_ids,
            empresa_id=target_empresa_id,
            dry_run=request.dry_run,
            resolutions=request.resolutions,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
