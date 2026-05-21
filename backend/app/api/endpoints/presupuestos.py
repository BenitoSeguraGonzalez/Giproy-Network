from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.api import deps
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, PresupuestoNota, PresupuestoVistaUsuario, PresupuestoLineaVistaUsuario
from app.models.apu import APU
from app.models.edt import EdtNode
from app.models.recurso import Recurso
from app.models.usuario import Usuario
from app.schemas.presupuesto import (
    PresupuestoCreate,
    PresupuestoResponse,
    PresupuestoDetalleCreate,
    PresupuestoDetalleResponse,
    PresupuestoBulkCantidadUpdate,
    PresupuestoMoveMergeInfo,
    PresupuestoMoveResponse,
    PresupuestoDetalleUpdate,
    PresupuestoNotaCreate,
    PresupuestoNotaResponse,
    PresupuestoNotasSummaryResponse,
    PresupuestoParetoResponse,
    PresupuestoIndirectosResponse,
    PresupuestoIndirectosUpdate,
)
from app.services.presupuesto import (
    calculate_presupuesto_totals, 
    enforce_presupuesto_apu_uniqueness,
    ensure_presupuesto_indirectos, 
    propagate_apu_change_to_presupuestos, 
    refresh_presupuesto_prices, 
    recalculate_line_codes,
    create_presupuesto_service,
    get_or_create_operational_presupuesto,
    get_presupuesto_pareto,
    get_notas_summary_service,
    resolve_presupuesto_line_apu,
    is_public_procurement_imported_presupuesto,
)
from app.repositories.presupuesto import presupuesto_repo
from pydantic import BaseModel
from decimal import Decimal
from app.core.calculation_policy import calculate_budget_line_total

class TanteoMutation(BaseModel):
    recurso_id: int
    apu_linea_id: int
    nuevo_rendimiento: float

class TanteoRequest(BaseModel):
    mutaciones: List[TanteoMutation]

router = APIRouter()

def _resolve_target_empresa_id(current_user: Usuario, empresa_id: Optional[int]) -> int:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id
    return target_empresa_id

def _get_presupuesto_or_404(db: Session, presupuesto_id: int, target_empresa_id: int) -> Presupuesto:
    pres = presupuesto_repo.get(db, presupuesto_id, target_empresa_id)
    if not pres:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado")
    return pres

def _get_linea_or_404(db: Session, linea_id: int, target_empresa_id: int) -> PresupuestoDetalle:
    linea = presupuesto_repo.get_linea(db, linea_id, target_empresa_id)
    if not linea:
        raise HTTPException(status_code=404, detail="Línea no encontrada")
    return linea

def _verify_edt_permission(db: Session, proyecto_id: int, usuario_id: int, edt_id: int):
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if perms["is_restricted"] and edt_id not in perms["edt_ids"]:
        raise HTTPException(status_code=403, detail="No tiene permisos para operar en esta rama de la EDT.")

def _verify_module_access(db: Session, proyecto_id: int, usuario_id: int, module: str = "presupuestos"):
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return
    if "todos" in perms["allowed_modules"] or module in perms["allowed_modules"]:
        return
    raise HTTPException(status_code=403, detail=f"Acceso denegado al módulo {module}")

def _verify_presupuesto_module_access(db: Session, presupuesto: Presupuesto, usuario_id: int):
    _verify_module_access(db, presupuesto.proyecto_id, usuario_id, module="presupuestos")

def _verify_linea_module_access(db: Session, linea: PresupuestoDetalle, usuario_id: int):
    _verify_module_access(db, linea.presupuesto.proyecto_id, usuario_id, module="presupuestos")

def _serialize_indirectos(presupuesto: Presupuesto) -> PresupuestoIndirectosResponse:
    from app.schemas.presupuesto import PresupuestoIndirectoItemResponse
    items = sorted(
        presupuesto.indirectos or [],
        key=lambda item: (item.categoria_codigo, item.nombre.lower(), item.id)
    )
    return PresupuestoIndirectosResponse(
        presupuesto_id=presupuesto.id,
        subtotal_directo=Decimal(str(presupuesto.subtotal or 0)),
        indirectos_porcentaje=Decimal(str(presupuesto.indirectos_porcentaje or 0)),
        indirectos_total=Decimal(str(presupuesto.indirectos_total or 0)),
        iva_aplicado=Decimal(str(presupuesto.iva_aplicado or 0)),
        impuestos=Decimal(str(presupuesto.impuestos or 0)),
        total=Decimal(str(presupuesto.total or 0)),
        items=[PresupuestoIndirectoItemResponse.model_validate(item, from_attributes=True) for item in items]
    )

@router.get("/", response_model=List[PresupuestoResponse])
def read_presupuestos(
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    proyecto_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    if proyecto_id:
        _verify_module_access(db, proyecto_id, current_user.id, module="presupuestos")
        presupuesto = get_or_create_operational_presupuesto(db, proyecto_id, target_empresa_id)
        if presupuesto:
            if is_public_procurement_imported_presupuesto(presupuesto):
                calculate_presupuesto_totals(db, presupuesto)
                db.flush()
            else:
                refresh_presupuesto_prices(db, presupuesto.id)
            db.refresh(presupuesto)
        return [presupuesto] if presupuesto else []
    return presupuesto_repo.get_multi(db, target_empresa_id, proyecto_id, skip, limit)

@router.post("/", response_model=PresupuestoResponse)
def create_presupuesto(
    *,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    presupuesto_in: PresupuestoCreate,
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    # For creation, we need to get the project_id from the input to verify module access
    if presupuesto_in.proyecto_id:
        _verify_module_access(db, presupuesto_in.proyecto_id, current_user.id, module="presupuestos")
    return create_presupuesto_service(db, presupuesto_in, target_empresa_id)

@router.get("/{id}", response_model=PresupuestoResponse)
def read_presupuesto(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    refresh_prices: bool = Query(True),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    is_public_procurement_imported = is_public_procurement_imported_presupuesto(pres)
    uniqueness_repairs = {"merged_lines": 0}
    if not is_public_procurement_imported:
        uniqueness_repairs = enforce_presupuesto_apu_uniqueness(db, pres.id, commit=False)
    if refresh_prices and not is_public_procurement_imported:
        refresh_presupuesto_prices(db, pres.id)
        db.refresh(pres)
    elif refresh_prices and is_public_procurement_imported:
        calculate_presupuesto_totals(db, pres)
        db.flush()
    elif int(uniqueness_repairs.get("merged_lines") or 0) > 0:
        db.commit()
        db.refresh(pres)
    
    # CONTROL DE ACCESO MODULO
    _verify_module_access(db, pres.proyecto_id, current_user.id, module="presupuestos")

    # CONTROL DE ACCESO EDT
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, pres.proyecto_id, current_user.id)
    
    detalles_visibles = pres.detalle
    if perms["is_restricted"]:
        allowed_edt_ids = set(perms["edt_ids"])
        detalles_visibles = [l for l in pres.detalle if l.edt_id in allowed_edt_ids]
    
    from app.models.apu import APULinea
    tanteo_apus = db.query(APULinea.apu_id).filter(APULinea.tanteo_activo == True).distinct().all()
    tanteo_apu_ids = {a.apu_id for a in tanteo_apus}

    for linea in detalles_visibles:
        linea.tanteo_activo = linea.apu_id in tanteo_apu_ids

    # Para no alterar el objeto de la sesión si hubiera un flush accidental, 
    # devolvemos una copia con los detalles filtrados si es necesario
    if perms["is_restricted"]:
        # Esto asegura que Pydantic use la lista filtrada
        pres.detalle = detalles_visibles

    return pres

@router.get("/{id}/indirectos", response_model=PresupuestoIndirectosResponse)
def read_presupuesto_indirectos(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    ensure_presupuesto_indirectos(db, pres)
    calculate_presupuesto_totals(db, pres)
    db.commit()
    db.refresh(pres)
    return _serialize_indirectos(pres)

@router.put("/{id}/indirectos", response_model=PresupuestoIndirectosResponse)
def update_presupuesto_indirectos(
    id: int,
    payload: PresupuestoIndirectosUpdate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    ensure_presupuesto_indirectos(db, pres)

    existing_items = presupuesto_repo.get_indirectos(db, pres.id)
    existing_by_code = {item.concepto_codigo: item for item in existing_items}
    submitted_codes = set()

    for item_in in payload.items:
        concepto_codigo = item_in.concepto_codigo.strip()
        if not concepto_codigo:
            continue
        submitted_codes.add(concepto_codigo)
        db_item = existing_by_code.get(concepto_codigo)
        if db_item:
            db_item.categoria_codigo = item_in.categoria_codigo
            db_item.nombre = item_in.nombre.strip()
            db_item.porcentaje = Decimal(str(item_in.porcentaje or 0))
            db_item.observaciones = (item_in.observaciones or "").strip()
            db_item.fijo = bool(item_in.fijo)
            db_item.usuario = bool(item_in.usuario)
            db_item.custom = bool(item_in.custom)
            db_item.concepto_id = item_in.concepto_id
        else:
            db.add(PresupuestoIndirecto(
                presupuesto_id=pres.id,
                empresa_id=pres.empresa_id,
                concepto_codigo=concepto_codigo,
                concepto_id=item_in.concepto_id,
                categoria_codigo=item_in.categoria_codigo,
                nombre=item_in.nombre.strip(),
                porcentaje=Decimal(str(item_in.porcentaje or 0)),
                observaciones=(item_in.observaciones or "").strip(),
                fijo=bool(item_in.fijo),
                usuario=bool(item_in.usuario),
                custom=bool(item_in.custom),
            ))

    for db_item in existing_items:
        if db_item.fijo:
            continue
        if db_item.concepto_codigo not in submitted_codes:
            presupuesto_repo.delete_indirecto(db, db_item)

    if payload.iva_aplicado is not None:
        pres.iva_aplicado = Decimal(str(payload.iva_aplicado))

    db.flush()
    ensure_presupuesto_indirectos(db, pres)
    calculate_presupuesto_totals(db, pres)
    refresh_presupuesto_prices(db, pres.id)
    db.commit()
    db.refresh(pres)
    return _serialize_indirectos(pres)

@router.get("/{id}/pareto", response_model=PresupuestoParetoResponse)
def read_presupuesto_pareto(
    id: int,
    view: str = Query("global"),
    top: int = Query(20, ge=1, le=100),
    cutoff_percent: Optional[float] = Query(None, ge=0, le=100),
    edt_id: Optional[int] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    result = get_presupuesto_pareto(db, pres, view, top, cutoff_percent, edt_id, target_empresa_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Capítulo no encontrado")
    return result

@router.get("/{id}/notas/summary", response_model=PresupuestoNotasSummaryResponse)
def read_presupuesto_notas_summary(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    return get_notas_summary_service(db, id, current_user.id)

@router.post("/{id}/notas/opened")
def mark_presupuesto_opened(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    view_state = presupuesto_repo.get_vista_usuario(db, id, current_user.id)
    if not view_state:
        view_state = PresupuestoVistaUsuario(presupuesto_id=id, usuario_id=current_user.id)
        db.add(view_state)

    view_state.last_opened_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Apertura registrada"}

@router.post("/{id}/notas/generales/opened")
def mark_general_notes_opened(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    view_state = presupuesto_repo.get_vista_usuario(db, id, current_user.id)
    if not view_state:
        view_state = PresupuestoVistaUsuario(presupuesto_id=id, usuario_id=current_user.id)
        db.add(view_state)

    now = datetime.now(timezone.utc)
    view_state.last_seen_general_notes_at = now
    view_state.last_opened_at = now
    db.commit()
    return {"message": "Notas generales marcadas como vistas"}

@router.get("/{id}/notas/generales", response_model=List[PresupuestoNotaResponse])
def read_presupuesto_general_notes(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    return presupuesto_repo.get_notas_query(db, id).filter(PresupuestoNota.tipo == "general").order_by(PresupuestoNota.fecha_creacion.asc()).all()

@router.post("/{id}/notas/generales", response_model=PresupuestoNotaResponse)
def create_presupuesto_general_note(
    id: int,
    note_in: PresupuestoNotaCreate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    texto = note_in.texto.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="La nota no puede estar vacía")

    note = PresupuestoNota(
        presupuesto_id=id,
        linea_presupuesto_id=None,
        autor_usuario_id=current_user.id,
        autor_nombre_snapshot=current_user.nombre_completo,
        tipo="general",
        texto=texto
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/lineas/{linea_id}/notas", response_model=List[PresupuestoNotaResponse])
def read_presupuesto_line_notes(
    linea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)
    return db.query(PresupuestoNota).filter(PresupuestoNota.linea_presupuesto_id == linea_id, PresupuestoNota.tipo == "linea").order_by(PresupuestoNota.fecha_creacion.asc()).all()

@router.post("/lineas/{linea_id}/notas", response_model=PresupuestoNotaResponse)
def create_presupuesto_line_note(
    linea_id: int,
    note_in: PresupuestoNotaCreate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)

    texto = note_in.texto.strip()
    if not texto:
        raise HTTPException(status_code=400, detail="La nota no puede estar vacía")

    note = PresupuestoNota(
        presupuesto_id=linea.presupuesto_id,
        linea_presupuesto_id=linea_id,
        autor_usuario_id=current_user.id,
        autor_nombre_snapshot=current_user.nombre_completo,
        tipo="linea",
        texto=texto
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.post("/lineas/{linea_id}/notas/opened")
def mark_line_notes_opened(
    linea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)

    line_view = presupuesto_repo.get_line_view(db, linea.presupuesto_id, linea_id, current_user.id)
    if not line_view:
        line_view = PresupuestoLineaVistaUsuario(presupuesto_id=linea.presupuesto_id, linea_presupuesto_id=linea_id, usuario_id=current_user.id)
        db.add(line_view)

    line_view.last_seen_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notas de línea marcadas como vistas"}

@router.post("/{id}/tanteo")
def apply_tanteo(
    id: int,
    request: TanteoRequest,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    from app.models.apu import APULinea
    from app.services.apu import update_apu_operational_price
    from app.services.presupuesto import propagate_apu_change_to_presupuestos
    editable_subcategoria_codigos = {1, 4}

    affected_apu_ids = set()

    for mut in request.mutaciones:
        linea = db.query(APULinea).join(APU, APULinea.apu_id == APU.id).filter(
            APULinea.id == mut.apu_linea_id,
            APULinea.recurso_id == mut.recurso_id,
            APU.empresa_id == target_empresa_id
        ).first()
        if not linea:
            continue

        recurso_subcategoria_codigo = getattr(linea.recurso, "subcategoria_codigo", None)
        if recurso_subcategoria_codigo not in editable_subcategoria_codigos:
            raise HTTPException(
                status_code=400,
                detail="Solo se permite tantear recursos de Equipos y herramientas o Mano de obra. Materiales y Transporte mantienen rendimiento fijo = 1."
            )

        if not linea.tanteo_activo:
            linea.rendimiento_original = linea.rendimiento

        linea.rendimiento = mut.nuevo_rendimiento
        linea.tanteo_activo = True
        linea.rendimiento_tanteo = mut.nuevo_rendimiento
        affected_apu_ids.add(linea.apu_id)

    db.flush()

    for apu_id in affected_apu_ids:
        update_apu_operational_price(db, apu_id)
        propagate_apu_change_to_presupuestos(db, apu_id)

    return {"message": "Tanteo aplicado al APU y propagado al presupuesto en cascada."}

@router.delete("/{id}/tanteo/clear-all")
def clear_all_tanteos(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    proyecto_id = pres.proyecto_id
    from app.models.proyecto import Proyecto
    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
    
    if not proyecto or not proyecto.base_trabajo_id:
        raise HTTPException(status_code=400, detail="El proyecto no tiene una Base de Trabajo asignada")

    from app.models.apu import APULinea, APU
    from app.services.apu import update_apu_operational_price
    from app.services.presupuesto import propagate_apu_change_to_presupuestos

    lineas_con_tanteo = db.query(APULinea).join(APU, APULinea.apu_id == APU.id).filter(
        APU.empresa_id == target_empresa_id,
        APU.base_trabajo_id == proyecto.base_trabajo_id,
        APULinea.tanteo_activo == True
    ).all()

    affected_apu_ids = set()
    count = 0
    for linea in lineas_con_tanteo:
        if linea.rendimiento_original is not None:
            linea.rendimiento = linea.rendimiento_original
            linea.tanteo_activo = False
            linea.rendimiento_tanteo = None
            linea.rendimiento_original = None
            affected_apu_ids.add(linea.apu_id)
            count += 1

    db.flush()

    for apu_id in affected_apu_ids:
        update_apu_operational_price(db, apu_id)
        propagate_apu_change_to_presupuestos(db, apu_id)
            
    return {"message": f"Se han revertido y restaurado {count} tanteos de rendimiento en el proyecto."}

@router.delete("/{id}/tanteo/{apu_linea_id}")
def delete_tanteo(
    id: int,
    apu_linea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    from app.models.apu import APULinea, APU
    from app.services.apu import update_apu_operational_price
    from app.services.presupuesto import propagate_apu_change_to_presupuestos

    linea = db.query(APULinea).join(APU, APULinea.apu_id == APU.id).filter(
        APULinea.id == apu_linea_id,
        APU.empresa_id == target_empresa_id
    ).first()
    if not linea:
        raise HTTPException(status_code=404, detail="Línea de APU no encontrada")
        
    if not linea.tanteo_activo or linea.rendimiento_original is None:
        raise HTTPException(status_code=400, detail="La línea no tiene un tanteo activo para deshacer")
        
    linea.rendimiento = linea.rendimiento_original
    linea.tanteo_activo = False
    linea.rendimiento_tanteo = None
    linea.rendimiento_original = None
    db.flush()
    update_apu_operational_price(db, linea.apu_id)
    propagate_apu_change_to_presupuestos(db, linea.apu_id)
    
    return {"message": "Tanteo revertido exitosamente. Rendimientos restaurados en cascada."}

@router.post("/{id}/lineas", response_model=PresupuestoDetalleResponse)
def add_presupuesto_linea(
    id: int,
    linea_in: PresupuestoDetalleCreate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)
    
    # CONTROL DE ACCESO EDT
    _verify_edt_permission(db, pres.proyecto_id, current_user.id, linea_in.edt_id)

    target_apu = None
    if linea_in.apu_id:
        try:
            target_apu = resolve_presupuesto_line_apu(db, pres, linea_in.apu_id)
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc))
    enforce_presupuesto_apu_uniqueness(db, id, edt_id=linea_in.edt_id, commit=False)

    # Calcular precio_unitario con indirecto funcional del presupuesto
    # El precio enviado por el frontend es el costo_directo del APU (referencial de base).
    # En contexto presupuesto, el precio real = CD × (1 + %ind_presupuesto / 100).
    from app.services.presupuesto import _calcular_precio_linea_presupuesto
    from decimal import Decimal as _Decimal
    indirectos_porcentaje = _Decimal(str(pres.indirectos_porcentaje or '0.0'))
    costo_directo_enviado = _Decimal(str(target_apu.costo_directo if target_apu else linea_in.precio_unitario or '0.0'))
    precio_unitario_funcional = _calcular_precio_linea_presupuesto(
        pres, costo_directo_enviado, indirectos_porcentaje
    )
    precio_total_linea = calculate_budget_line_total(
        quantity=linea_in.cantidad or '1.0',
        unit_price=precio_unitario_funcional,
        money_decimals=pres.dec_moneda,
        calc_decimals=pres.dec_calculos,
    )

    existing_line = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == id,
        PresupuestoDetalle.edt_id == linea_in.edt_id,
        PresupuestoDetalle.apu_id == (target_apu.id if target_apu else linea_in.apu_id),
        or_(PresupuestoDetalle.tipo.is_(None), PresupuestoDetalle.tipo != "CUENTA_PAQUETE")
    ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).first()

    if existing_line:
        existing_line.cantidad = Decimal(str(existing_line.cantidad or 0)) + Decimal(str(linea_in.cantidad or 0))
        existing_line.precio_total = calculate_budget_line_total(
            quantity=existing_line.cantidad or 0,
            unit_price=existing_line.precio_unitario or 0,
            money_decimals=pres.dec_moneda,
            calc_decimals=pres.dec_calculos,
        )
        calculate_presupuesto_totals(db, pres)
        db.commit()
        db.refresh(existing_line)
        return existing_line

    ultimo = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == id,
        PresupuestoDetalle.edt_id == linea_in.edt_id
    ).order_by(PresupuestoDetalle.orden.desc()).first()
    nuevo_orden = (ultimo.orden + 1) if ultimo else 0

    edt_node = db.query(EdtNode).filter(EdtNode.id == linea_in.edt_id).first()
    edt_codigo = edt_node.codigo if edt_node else None

    db_linea = PresupuestoDetalle(
        **linea_in.model_dump(
            exclude={
                "precio_total",
                "orden",
                "precio_unitario",
                "after_linea_id",
                "codigo_item",
                "apu_id",
                "descripcion",
                "unidad",
                "omniclass_codigo",
                "omniclass_titulo",
            }
        ),
        presupuesto_id=id,
        apu_id=target_apu.id if target_apu else linea_in.apu_id,
        descripcion=target_apu.descripcion if target_apu else linea_in.descripcion,
        unidad=target_apu.unidad if target_apu else linea_in.unidad,
        omniclass_codigo=target_apu.omniclass_codigo if target_apu else linea_in.omniclass_codigo,
        omniclass_titulo=target_apu.omniclass_titulo if target_apu else linea_in.omniclass_titulo,
        precio_unitario=precio_unitario_funcional,
        precio_total=precio_total_linea,
        orden=nuevo_orden,
        codigo_item=f"{edt_codigo}.{nuevo_orden + 1}" if edt_codigo else linea_in.codigo_item,
    )
    db.add(db_linea)
    db.flush()

    if linea_in.after_linea_id is not None:
        target_line = _get_linea_or_404(db, linea_in.after_linea_id, target_empresa_id)
        if target_line.presupuesto_id == id and target_line.edt_id == linea_in.edt_id and target_line.tipo != "CUENTA_PAQUETE":
            hermanos = db.query(PresupuestoDetalle).filter(
                PresupuestoDetalle.presupuesto_id == id,
                PresupuestoDetalle.edt_id == linea_in.edt_id,
                PresupuestoDetalle.id != db_linea.id,
                or_(PresupuestoDetalle.tipo.is_(None), PresupuestoDetalle.tipo != "CUENTA_PAQUETE")
            ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).all()
            target_index = next((idx for idx, sibling in enumerate(hermanos) if sibling.id == target_line.id), None)
            if target_index is not None:
                insert_index = target_index + 1
                hermanos.insert(insert_index, db_linea)
                for idx, sibling in enumerate(hermanos):
                    sibling.orden = idx
                    if edt_codigo:
                        sibling.codigo_item = f"{edt_codigo}.{idx + 1}"

    from app.models.apu import APULinea
    db_linea.tanteo_activo = db.query(APULinea.id).filter(
        APULinea.apu_id == db_linea.apu_id,
        APULinea.tanteo_activo == True
    ).first() is not None

    calculate_presupuesto_totals(db, pres)
    db.commit()

    db.refresh(db_linea)
    return db_linea


@router.put("/lineas/{linea_id}", response_model=PresupuestoDetalleResponse)
def update_presupuesto_linea(
    linea_id: int,
    linea_in: PresupuestoDetalleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)
    
    # CONTROL DE ACCESO EDT
    _verify_edt_permission(db, linea.presupuesto.proyecto_id, current_user.id, linea.edt_id)
    # Si intenta cambiar de rama, verificar la nueva rama también
    if linea_in.edt_id is not None and linea_in.edt_id != linea.edt_id:
        _verify_edt_permission(db, linea.presupuesto.proyecto_id, current_user.id, linea_in.edt_id)

    presupuesto = linea.presupuesto
    original_edt_id = linea.edt_id
    original_apu_id = linea.apu_id
    target_edt_id = linea_in.edt_id if linea_in.edt_id is not None else linea.edt_id
    target_apu_id = linea_in.apu_id if linea_in.apu_id is not None else linea.apu_id

    update_data = linea_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(linea, field, value)

    if target_apu_id is not None:
        enforce_presupuesto_apu_uniqueness(
            db,
            presupuesto.id,
            edt_id=target_edt_id,
            commit=False,
        )
        existing_line = db.query(PresupuestoDetalle).filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id,
            PresupuestoDetalle.edt_id == target_edt_id,
            PresupuestoDetalle.apu_id == target_apu_id,
            PresupuestoDetalle.id != linea.id,
            or_(
                PresupuestoDetalle.tipo.is_(None),
                PresupuestoDetalle.tipo != "CUENTA_PAQUETE",
            ),
        ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).first()
        if existing_line:
            existing_line.cantidad = Decimal(str(existing_line.cantidad or 0)) + Decimal(str(linea.cantidad or 0))
            existing_line.notas = "\n".join(
                part.strip()
                for part in [existing_line.notas or "", linea.notas or ""]
                if part and part.strip()
            ) or None
            existing_line.precio_total = calculate_budget_line_total(
                quantity=existing_line.cantidad,
                unit_price=existing_line.precio_unitario,
                money_decimals=presupuesto.dec_moneda,
                calc_decimals=presupuesto.dec_calculos,
            )
            db.delete(linea)
            db.flush()
            if original_edt_id != target_edt_id:
                recalculate_line_codes(db, presupuesto.id, original_edt_id, commit=False)
            recalculate_line_codes(db, presupuesto.id, target_edt_id, commit=False)
            calculate_presupuesto_totals(db, presupuesto)
            db.commit()
            db.refresh(existing_line)
            return existing_line
    
    linea.precio_total = calculate_budget_line_total(
        quantity=linea.cantidad,
        unit_price=linea.precio_unitario,
        money_decimals=presupuesto.dec_moneda,
        calc_decimals=presupuesto.dec_calculos,
    )
    db.flush()
    if original_edt_id != linea.edt_id and original_apu_id is not None:
        enforce_presupuesto_apu_uniqueness(db, presupuesto.id, edt_id=original_edt_id, commit=False)
        recalculate_line_codes(db, presupuesto.id, original_edt_id, commit=False)
    if linea.edt_id is not None and linea.apu_id is not None:
        enforce_presupuesto_apu_uniqueness(db, presupuesto.id, edt_id=linea.edt_id, commit=False)
    calculate_presupuesto_totals(db, presupuesto)
    db.commit()
    db.refresh(linea)
    return linea


@router.put("/{id}/lineas/bulk-cantidad", response_model=PresupuestoResponse)
def bulk_update_presupuesto_lineas_cantidad(
    id: int,
    payload: PresupuestoBulkCantidadUpdate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    pres = _get_presupuesto_or_404(db, id, target_empresa_id)
    _verify_presupuesto_module_access(db, pres, current_user.id)

    items = payload.items or []
    if not items:
        return pres

    requested_ids = [item.linea_id for item in items]
    lineas = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == id,
        PresupuestoDetalle.id.in_(requested_ids)
    ).all()
    lineas_by_id = {linea.id: linea for linea in lineas}

    if len(lineas_by_id) != len(set(requested_ids)):
        raise HTTPException(status_code=404, detail="Una o más líneas no pertenecen al presupuesto seleccionado")

    verified_edt_ids = set()
    for item in items:
        linea = lineas_by_id[item.linea_id]
        if linea.edt_id not in verified_edt_ids:
            _verify_edt_permission(db, pres.proyecto_id, current_user.id, linea.edt_id)
            verified_edt_ids.add(linea.edt_id)
        linea.cantidad = item.cantidad
        linea.precio_total = calculate_budget_line_total(
            quantity=linea.cantidad,
            unit_price=linea.precio_unitario,
            money_decimals=pres.dec_moneda,
            calc_decimals=pres.dec_calculos,
        )

    db.flush()
    calculate_presupuesto_totals(db, pres)
    db.commit()
    db.refresh(pres)
    return pres

@router.put("/lineas/{linea_id}/move", response_model=PresupuestoMoveResponse)
def move_presupuesto_linea(
    linea_id: int,
    move_in: PresupuestoDetalleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)
    if linea.tipo == "CUENTA_PAQUETE":
        raise HTTPException(status_code=400, detail="Solo se pueden mover líneas operativas del presupuesto")

    old_edt_id = linea.edt_id
    pres_id = linea.presupuesto_id
    new_edt_id = move_in.edt_id if move_in.edt_id is not None else old_edt_id

    if move_in.after_linea_id is not None:
        target_line = _get_linea_or_404(db, move_in.after_linea_id, target_empresa_id)
        if target_line.presupuesto_id != pres_id:
            raise HTTPException(status_code=400, detail="La línea destino no pertenece al mismo presupuesto")
        if target_line.tipo == "CUENTA_PAQUETE":
            raise HTTPException(status_code=400, detail="La línea destino debe ser una partida operativa")
        new_edt_id = target_line.edt_id

    if old_edt_id != new_edt_id:
        _verify_edt_permission(db, linea.presupuesto.proyecto_id, current_user.id, new_edt_id)
        linea.edt_id = new_edt_id

    enforce_presupuesto_apu_uniqueness(db, pres_id, edt_id=new_edt_id, commit=False)

    existing_line = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == pres_id,
        PresupuestoDetalle.edt_id == new_edt_id,
        PresupuestoDetalle.apu_id == linea.apu_id,
        PresupuestoDetalle.id != linea_id,
        or_(PresupuestoDetalle.tipo.is_(None), PresupuestoDetalle.tipo != "CUENTA_PAQUETE")
    ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).first()

    if existing_line:
        cantidad_inicial = Decimal(str(existing_line.cantidad or 0))
        cantidad_movida = Decimal(str(linea.cantidad or 0))
        existing_line.cantidad = Decimal(str(existing_line.cantidad or 0)) + Decimal(str(linea.cantidad or 0))
        existing_line.precio_total = calculate_budget_line_total(
            quantity=existing_line.cantidad or 0,
            unit_price=existing_line.precio_unitario or 0,
            money_decimals=linea.presupuesto.dec_moneda,
            calc_decimals=linea.presupuesto.dec_calculos,
        )
        db.delete(linea)
        db.flush()

        if old_edt_id != new_edt_id:
            recalculate_line_codes(db, pres_id, old_edt_id, commit=False)
        recalculate_line_codes(db, pres_id, new_edt_id, commit=False)
        calculate_presupuesto_totals(db, linea.presupuesto)
        db.commit()
        db.refresh(existing_line)
        return {
            "linea": existing_line,
            "merged": True,
            "message": "Se sumaron las cantidades porque ese item ya existía en el EDT destino.",
            "merge_info": {
                "apu_codigo": existing_line.apu.codigo if existing_line.apu else None,
                "descripcion": existing_line.descripcion,
                "unidad": existing_line.unidad,
                "cantidad_inicial": cantidad_inicial,
                "cantidad_movida": cantidad_movida,
                "cantidad_total": Decimal(str(existing_line.cantidad or 0)),
            }
        }

    if old_edt_id != new_edt_id:
        recalculate_line_codes(db, pres_id, old_edt_id)

    hermanos = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == pres_id,
        PresupuestoDetalle.edt_id == new_edt_id,
        PresupuestoDetalle.id != linea_id,
        or_(PresupuestoDetalle.tipo.is_(None), PresupuestoDetalle.tipo != "CUENTA_PAQUETE")
    ).order_by(PresupuestoDetalle.orden.asc()).all()

    insert_index = len(hermanos)
    if move_in.after_linea_id is not None:
        target_index = next((idx for idx, sibling in enumerate(hermanos) if sibling.id == move_in.after_linea_id), None)
        if target_index is None:
            raise HTTPException(status_code=400, detail="No se pudo resolver la línea destino del movimiento")
        insert_index = target_index + 1
    elif move_in.orden is not None:
        insert_index = max(0, min(move_in.orden, len(hermanos)))
    else:
        insert_index = max(0, min(linea.orden or 0, len(hermanos)))

    hermanos.insert(insert_index, linea)
    for idx, h in enumerate(hermanos):
        h.orden = idx
    db.commit()

    recalculate_line_codes(db, pres_id, new_edt_id, commit=False)
    calculate_presupuesto_totals(db, linea.presupuesto)
    db.commit()
    db.refresh(linea)
    return {
        "linea": linea,
        "merged": False,
        "message": None,
        "merge_info": None
    }

@router.delete("/lineas/{linea_id}")
def delete_presupuesto_linea(
    linea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Usuario = Depends(deps.get_current_user),
    empresa_id: Optional[int] = Query(None)
):
    target_empresa_id = _resolve_target_empresa_id(current_user, empresa_id)
    linea = _get_linea_or_404(db, linea_id, target_empresa_id)
    _verify_linea_module_access(db, linea, current_user.id)

    # CONTROL DE ACCESO EDT
    _verify_edt_permission(db, linea.presupuesto.proyecto_id, current_user.id, linea.edt_id)

    pres_id = linea.presupuesto_id
    edt_id = linea.edt_id
    db.delete(linea)
    db.flush()

    recalculate_line_codes(db, pres_id, edt_id, commit=False)
    calculate_presupuesto_totals(db, linea.presupuesto)
    db.commit()
    return {"message": "Línea eliminada exitosamente"}
