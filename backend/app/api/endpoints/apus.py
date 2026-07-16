from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal
from app.schemas.apu import (
    APUCreate, APUResponse, APUUpdate, APUImportRequest, 
    APUBulkDeleteRequest, APUBulkDeleteResponse, APUClipboardImportItem, APULineaMoveRequest,
    APUImpactSummaryResponse, APUBatchDetailRequest, ProyectoApuCpcResponse, ProyectoApuCpcUpsertRequest
)
from app.services.apu import apu_service
from app.models.apu import APU
from app.models.codcpc import CodCPC
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_apu_cpc import ProyectoApuCpc
from app.models.usuario import Usuario
from app.api.deps import get_db, get_current_user
from app.services.project_functional_modification import project_functional_modification_service
from app.services.apu import collect_affected_apu_ids

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


def _resolve_project_apu_price_overrides(
    db: Session,
    *,
    empresa_id: int,
    proyecto_id: int | None,
    base_trabajo_id: int | None,
    revision: int | None,
) -> tuple[dict[int, Decimal], dict]:
    return project_functional_modification_service.resolve_project_apu_price_overrides(
        db,
        empresa_id=empresa_id,
        proyecto_id=proyecto_id,
        base_trabajo_id=base_trabajo_id,
        revision=revision,
    )


def _apu_response_with_official_overlay(
    apu: APU,
    *,
    price_overrides: dict[int, Decimal],
    official_source: dict,
) -> APUResponse:
    response = APUResponse.model_validate(apu, from_attributes=True)
    override = price_overrides.get(int(apu.id))
    if override is not None:
        response.precio_unitario_total = override
        response.official_price_overridden = True
        response.official_source = {
            "source": official_source.get("source"),
            "origin": official_source.get("origin"),
            "active_modification_id": official_source.get("active_modification_id"),
        }
    return response


def _apu_summary_response(
    apu: APU,
    *,
    price_overrides: dict[int, Decimal] | None = None,
    official_source: dict | None = None,
) -> APUResponse:
    override = (price_overrides or {}).get(int(apu.id))
    official_price_overridden = override is not None
    return APUResponse(
        id=apu.id,
        codigo=apu.codigo,
        descripcion=apu.descripcion,
        unidad=apu.unidad,
        rendimiento_estandar=apu.rendimiento_estandar,
        moneda=apu.moneda,
        estado_revision=apu.estado_revision,
        categoria_id=apu.categoria_id,
        subcategoria_item_id=apu.subcategoria_item_id,
        base_trabajo_id=apu.base_trabajo_id,
        omniclass_codigo=apu.omniclass_codigo,
        omniclass_titulo=apu.omniclass_titulo,
        costo_directo=apu.costo_directo or Decimal("0"),
        costo_indirecto=apu.costo_indirecto or Decimal("0"),
        precio_unitario_total=override if official_price_overridden else (apu.precio_unitario_total or Decimal("0")),
        empresa_id=apu.empresa_id,
        source_apu_id=apu.source_apu_id,
        content_origin=apu.content_origin,
        sync_status=apu.sync_status,
        last_sync_at=apu.last_sync_at,
        fecha_creacion=apu.fecha_creacion,
        ultima_modificacion=apu.ultima_modificacion,
        lineas=[],
        official_source=(
            {
                "source": (official_source or {}).get("source"),
                "origin": (official_source or {}).get("origin"),
                "active_modification_id": (official_source or {}).get("active_modification_id"),
            }
            if official_price_overridden
            else None
        ),
        official_price_overridden=official_price_overridden,
    )


def _invalidate_active_gantt_drafts_for_apu_change(
    db: Session,
    *,
    presupuesto: Presupuesto,
    affected_apu_ids: set[int],
    reason: str,
    user_id: int,
) -> None:
    from app.models.cronograma_trabajo import CronogramaTrabajo
    from app.services.gantt_workflow import gantt_workflow_service

    schedule = (
        db.query(CronogramaTrabajo)
        .filter(
            CronogramaTrabajo.presupuesto_id == presupuesto.id,
            CronogramaTrabajo.proyecto_id == presupuesto.proyecto_id,
            CronogramaTrabajo.empresa_id == presupuesto.empresa_id,
        )
        .first()
    )
    if not schedule:
        return
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    if not draft:
        return
    for apu_id in sorted(affected_apu_ids):
        gantt_workflow_service.invalidate_related_intentions(
            db,
            draft=draft,
            affected_scope={"apu_id": apu_id},
            reason=reason,
            user_id=user_id,
        )


def _register_apu_functional_modifications(
    db: Session,
    *,
    empresa_id: int,
    apu: APU,
    affected_apu_ids: set[int],
    source_ref: dict,
    user_id: int,
    invalidation_reason: str = "apu_modificado",
) -> None:
    normalized_apu_ids = {int(item) for item in affected_apu_ids if item}
    if not normalized_apu_ids:
        return
    lineas = (
        db.query(PresupuestoDetalle)
        .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
        .filter(
            Presupuesto.empresa_id == int(empresa_id),
            PresupuestoDetalle.apu_id.in_(normalized_apu_ids),
        )
        .all()
    )
    if not lineas:
        return

    lineas_by_presupuesto: dict[int, list[PresupuestoDetalle]] = {}
    for linea in lineas:
        lineas_by_presupuesto.setdefault(int(linea.presupuesto_id), []).append(linea)

    presupuestos = {
        presupuesto.id: presupuesto
        for presupuesto in db.query(Presupuesto)
        .filter(Presupuesto.id.in_(list(lineas_by_presupuesto.keys())))
        .all()
    }
    for presupuesto_id, group in lineas_by_presupuesto.items():
        presupuesto = presupuestos.get(presupuesto_id)
        if not presupuesto:
            continue
        base_trabajo_id = getattr(getattr(presupuesto, "proyecto", None), "base_trabajo_id", None)
        if base_trabajo_id is None:
            base_trabajo_id = getattr(apu, "base_trabajo_id", None)
        price_previews = [
            {
                "linea_presupuesto_id": int(linea.id),
                "apu_id": int(linea.apu_id) if getattr(linea, "apu_id", None) else None,
                "currency": presupuesto.moneda,
                "money_decimals": presupuesto.dec_moneda,
                "total_unit_price": str(linea.precio_unitario or 0),
                "budget_quantity": str(linea.cantidad or 0),
                "budget_line_total_after": str(linea.precio_total or 0),
            }
            for linea in group
        ]
        project_functional_modification_service.create_active(
            db,
            empresa_id=presupuesto.empresa_id,
            proyecto_id=presupuesto.proyecto_id,
            presupuesto_id=presupuesto.id,
            base_trabajo_id=base_trabajo_id,
            revision=presupuesto.revision,
            source="apu",
            source_ref=source_ref,
            patch={
                "affected_line_ids": sorted(int(linea.id) for linea in group),
                "affected_apu_ids": sorted({int(linea.apu_id) for linea in group if getattr(linea, "apu_id", None)}),
                "intentions": [
                    {
                        "type": "apu_direct_update",
                        "linea_presupuesto_id": int(linea.id),
                        "apu_id": int(linea.apu_id) if getattr(linea, "apu_id", None) else None,
                        "price_preview": preview,
                    }
                    for linea, preview in zip(group, price_previews)
                ],
            },
            snapshot={
                "budget_totals": {
                    "subtotal": str(presupuesto.subtotal or 0),
                    "indirectos_total": str(presupuesto.indirectos_total or 0),
                    "impuestos": str(presupuesto.impuestos or 0),
                    "total": str(presupuesto.total or 0),
                },
                "price_previews": price_previews,
            },
            user_id=user_id,
        )
        _invalidate_active_gantt_drafts_for_apu_change(
            db,
            presupuesto=presupuesto,
            affected_apu_ids=normalized_apu_ids,
            reason=invalidation_reason,
            user_id=user_id,
        )

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
    revision: Optional[int] = Query(None),
    proyecto_id: Optional[int] = Query(None),
    summary: bool = Query(False),
):
    """Lista los APUs."""
    effective_base_id = base_id or base_trabajo_id
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    
    from app.repositories.apu import apu_repo
    apus = apu_repo.get_all(
        db, target_empresa_id, effective_base_id, subcategoria_item_id, q, revision
    )[skip : skip + limit]
    price_overrides, official_source = _resolve_project_apu_price_overrides(
        db,
        empresa_id=target_empresa_id,
        proyecto_id=proyecto_id,
        base_trabajo_id=effective_base_id,
        revision=revision,
    )
    if summary:
        return [
            _apu_summary_response(
                apu,
                price_overrides=price_overrides,
                official_source=official_source,
            )
            for apu in apus
        ]
    if price_overrides:
        apus = [
            _apu_response_with_official_overlay(
                apu,
                price_overrides=price_overrides,
                official_source=official_source,
            )
            for apu in apus
        ]
    return apus

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
        affected_apu_ids = collect_affected_apu_ids(db, apu.id) or {apu.id}
        _register_apu_functional_modifications(
            db,
            empresa_id=target_empresa_id,
            apu=apu,
            affected_apu_ids={int(item) for item in affected_apu_ids if item},
            source_ref={"action": "apu_actualizado", "apu_id": apu.id},
            user_id=current_user.id,
        )
        db.commit()
        db.refresh(apu)
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
        apu = apu_service.move_linea(db, id, move_in.linea_id, move_in.target_index, target_empresa_id)
        affected_apu_ids = collect_affected_apu_ids(db, apu.id) or {apu.id}
        _register_apu_functional_modifications(
            db,
            empresa_id=target_empresa_id,
            apu=apu,
            affected_apu_ids={int(item) for item in affected_apu_ids if item},
            source_ref={"action": "apu_linea_movida", "apu_id": apu.id, "linea_id": move_in.linea_id},
            user_id=current_user.id,
        )
        db.commit()
        db.refresh(apu)
        return apu
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
    empresa_id: Optional[int] = Query(None),
    proyecto_id: Optional[int] = Query(None),
    revision: Optional[int] = Query(None)
):
    """Obtener detalle completo de un APU."""
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    
    apu = apu_service.get_apu(db, id, target_empresa_id)
    if not apu:
        raise HTTPException(status_code=404, detail="APU no encontrado")
    price_overrides, official_source = _resolve_project_apu_price_overrides(
        db,
        empresa_id=target_empresa_id,
        proyecto_id=proyecto_id,
        base_trabajo_id=apu.base_trabajo_id,
        revision=revision if revision is not None else apu.revision,
    )
    if not price_overrides:
        return apu
    return _apu_response_with_official_overlay(
        apu,
        price_overrides=price_overrides,
        official_source=official_source,
    )

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
