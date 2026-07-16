from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Tuple, Dict
from app.models.presupuesto import (
    Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, 
    PresupuestoNota, PresupuestoVistaUsuario, PresupuestoLineaVistaUsuario
)
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.apu import APU, APULinea
from app.constants.indirectos import FIXED_INDIRECTOS
from app.schemas.presupuesto import (
    PresupuestoCreate, PresupuestoIndirectosUpdate, 
    PresupuestoParetoItemResponse, PresupuestoParetoResponse,
    PresupuestoNotasSummaryResponse, PresupuestoLineNoteSummary
)
from decimal import Decimal
from datetime import datetime, timezone
from app.core.rounding import round_decimal
from app.core.calculation_policy import (
    calculate_budget_line_functional_unit_price,
    calculate_budget_line_total,
    round_operational_calc,
)
from app.models.proyecto import Proyecto
from app.core.unit_normalization import canonicalize_unit_symbol


def _is_structural_budget_row(detail: PresupuestoDetalle) -> bool:
    return (detail.tipo or "") == TipoNodoEdt.CUENTA_PAQUETE.value


def _is_desynced_budget_row(detail: PresupuestoDetalle) -> bool:
    return not _is_structural_budget_row(detail) and detail.apu_id is None


def _is_budget_row_countable(detail: PresupuestoDetalle) -> bool:
    return not _is_desynced_budget_row(detail)


def _is_budget_package_row(detail: PresupuestoDetalle) -> bool:
    return detail.apu_id is not None


def _merge_budget_line_notes(*lineas: PresupuestoDetalle) -> Optional[str]:
    merged: List[str] = []
    seen = set()
    for linea in lineas:
        raw = str(getattr(linea, "notas", "") or "").strip()
        if not raw or raw in seen:
            continue
        seen.add(raw)
        merged.append(raw)
    return "\n\n".join(merged) if merged else None


def _get_project_revision(db: Session, proyecto_id: int, empresa_id: int) -> int:
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == proyecto_id,
        Proyecto.empresa_id == empresa_id
    ).first()
    return int(proyecto.revision or 0) if proyecto else 0


def _score_presupuesto_candidato(db: Session, presupuesto: Presupuesto) -> tuple:
    detalle_total = len(presupuesto.detalle or [])
    detalle_con_apu = sum(1 for linea in (presupuesto.detalle or []) if linea.apu_id is not None)
    indirectos_total = len(presupuesto.indirectos or [])
    total = Decimal(str(presupuesto.total or 0))
    return (
        1 if detalle_con_apu > 0 else 0,
        detalle_con_apu,
        1 if total > 0 else 0,
        total,
        detalle_total,
        indirectos_total,
        -presupuesto.id,
    )


def _get_presupuesto_project(db: Session, presupuesto: Presupuesto) -> Proyecto:
    proyecto = getattr(presupuesto, "proyecto", None)
    if proyecto is not None:
        return proyecto
    proyecto = db.query(Proyecto).filter(Proyecto.id == presupuesto.proyecto_id).first()
    if not proyecto:
        raise ValueError(f"Proyecto {presupuesto.proyecto_id} no encontrado para el presupuesto {presupuesto.id}")
    return proyecto


def is_public_procurement_imported_presupuesto(presupuesto: Presupuesto) -> bool:
    proyecto = getattr(presupuesto, "proyecto", None)
    project_config = getattr(proyecto, "plantillas_config", None)
    if not isinstance(project_config, dict):
        return False
    import_trace = project_config.get("public_procurement_import")
    if not isinstance(import_trace, dict):
        return False
    return str(import_trace.get("origin") or "").strip() == "public_procurement_import"


def resolve_apu_for_target_base(
    db: Session,
    apu_id: int,
    target_base_id: int,
    empresa_id: int,
) -> APU:
    apu = db.query(APU).filter(APU.id == apu_id, APU.empresa_id == empresa_id).first()
    if not apu:
        raise ValueError(f"APU {apu_id} no encontrado para la empresa {empresa_id}")

    if not target_base_id:
        raise ValueError(
            f"No se puede resolver el APU {apu.codigo} porque el proyecto no tiene base de trabajo activa"
        )

    if int(apu.base_trabajo_id or 0) == int(target_base_id):
        return apu

    candidate_query = db.query(APU).filter(
        APU.empresa_id == empresa_id,
        APU.base_trabajo_id == target_base_id,
    )

    candidate = None
    if apu.source_apu_id:
        candidate = candidate_query.filter(APU.source_apu_id == apu.source_apu_id).first()
    if candidate is None:
        candidate = candidate_query.filter(APU.source_apu_id == apu.id).first()
    if candidate is None:
        candidate = candidate_query.filter(APU.codigo == apu.codigo).first()

    if candidate is None:
        raise ValueError(
            f"El APU {apu.codigo} ({apu.id}) pertenece a la base {apu.base_trabajo_id} "
            f"y no existe equivalente en la base objetivo {target_base_id}"
        )
    return candidate


def resolve_presupuesto_line_apu(
    db: Session,
    presupuesto: Presupuesto,
    apu_id: int,
) -> APU:
    proyecto = _get_presupuesto_project(db, presupuesto)
    return resolve_apu_for_target_base(db, apu_id, int(proyecto.base_trabajo_id or 0), presupuesto.empresa_id)


def _sync_presupuesto_line_from_apu(
    presupuesto: Presupuesto,
    linea: PresupuestoDetalle,
    apu: APU,
    *,
    indirectos_porcentaje: Optional[Decimal] = None,
) -> None:
    if indirectos_porcentaje is None:
        indirectos_porcentaje = sum(
            (Decimal(str(item.porcentaje or 0)) for item in (presupuesto.indirectos or [])),
            Decimal("0.0"),
        )

    linea.apu_id = apu.id
    linea.descripcion = apu.descripcion
    linea.unidad = canonicalize_unit_symbol(apu.unidad)
    linea.omniclass_codigo = apu.omniclass_codigo
    linea.omniclass_titulo = apu.omniclass_titulo

    costo_directo = Decimal(str(apu.costo_directo or "0.0000"))
    linea.precio_unitario = _calcular_precio_linea_presupuesto(
        presupuesto,
        costo_directo,
        indirectos_porcentaje,
    )
    linea.precio_total = calculate_budget_line_total(
        quantity=linea.cantidad or "1.0",
        unit_price=linea.precio_unitario,
        money_decimals=presupuesto.dec_moneda,
        calc_decimals=presupuesto.dec_calculos,
    )


def find_mixed_presupuesto_apu_lines(
    db: Session,
    *,
    empresa_id: Optional[int] = None,
    proyecto_id: Optional[int] = None,
    presupuesto_id: Optional[int] = None,
) -> List[PresupuestoDetalle]:
    query = (
        db.query(PresupuestoDetalle)
        .join(Presupuesto, PresupuestoDetalle.presupuesto_id == Presupuesto.id)
        .join(Proyecto, Presupuesto.proyecto_id == Proyecto.id)
        .join(APU, PresupuestoDetalle.apu_id == APU.id)
        .filter(
            PresupuestoDetalle.apu_id.isnot(None),
            Proyecto.base_trabajo_id.isnot(None),
            APU.base_trabajo_id != Proyecto.base_trabajo_id,
        )
    )
    if empresa_id is not None:
        query = query.filter(Presupuesto.empresa_id == empresa_id)
    if proyecto_id is not None:
        query = query.filter(Presupuesto.proyecto_id == proyecto_id)
    if presupuesto_id is not None:
        query = query.filter(Presupuesto.id == presupuesto_id)
    return query.order_by(Presupuesto.id.asc(), PresupuestoDetalle.id.asc()).all()


def repair_presupuesto_apu_scope(
    db: Session,
    *,
    empresa_id: Optional[int] = None,
    proyecto_id: Optional[int] = None,
    presupuesto_id: Optional[int] = None,
    commit: bool = True,
) -> Dict[str, object]:
    mixed_lines = find_mixed_presupuesto_apu_lines(
        db,
        empresa_id=empresa_id,
        proyecto_id=proyecto_id,
        presupuesto_id=presupuesto_id,
    )
    if not mixed_lines:
        return {"repaired_lines": 0, "presupuestos": [], "details": []}

    budget_cache: Dict[int, Presupuesto] = {}
    indirectos_cache: Dict[int, Decimal] = {}
    repaired_budget_ids = set()
    details: List[Dict[str, object]] = []

    for linea in mixed_lines:
        presupuesto = budget_cache.get(linea.presupuesto_id)
        if presupuesto is None:
            presupuesto = db.query(Presupuesto).filter(Presupuesto.id == linea.presupuesto_id).first()
            if not presupuesto:
                raise ValueError(f"Presupuesto {linea.presupuesto_id} no encontrado al reparar línea {linea.id}")
            budget_cache[linea.presupuesto_id] = presupuesto

        indirectos_porcentaje = indirectos_cache.get(presupuesto.id)
        if indirectos_porcentaje is None:
            indirectos_porcentaje = sum(
                (Decimal(str(item.porcentaje or 0)) for item in (presupuesto.indirectos or [])),
                Decimal("0.0"),
            )
            indirectos_cache[presupuesto.id] = indirectos_porcentaje

        previous_apu = db.query(APU).filter(APU.id == linea.apu_id).first()
        if previous_apu is None:
            raise ValueError(f"APU {linea.apu_id} no encontrado al reparar línea {linea.id}")

        target_apu = resolve_presupuesto_line_apu(db, presupuesto, previous_apu.id)
        if target_apu.id == previous_apu.id:
            continue

        _sync_presupuesto_line_from_apu(
            presupuesto,
            linea,
            target_apu,
            indirectos_porcentaje=indirectos_porcentaje,
        )
        repaired_budget_ids.add(presupuesto.id)
        details.append(
            {
                "linea_id": linea.id,
                "presupuesto_id": presupuesto.id,
                "from_apu_id": previous_apu.id,
                "from_apu_codigo": previous_apu.codigo,
                "from_base_id": previous_apu.base_trabajo_id,
                "to_apu_id": target_apu.id,
                "to_apu_codigo": target_apu.codigo,
                "to_base_id": target_apu.base_trabajo_id,
            }
        )

    for repaired_budget_id in sorted(repaired_budget_ids):
        refresh_presupuesto_prices(
            db,
            repaired_budget_id,
            commit=False,
            sanitize_scope=False,
        )

    if commit:
        db.commit()
    else:
        db.flush()

    return {
        "repaired_lines": len(details),
        "presupuestos": sorted(repaired_budget_ids),
        "details": details,
    }


def enforce_presupuesto_apu_uniqueness(
    db: Session,
    presupuesto_id: int,
    *,
    edt_id: Optional[int] = None,
    commit: bool = True,
) -> Dict[str, object]:
    """
    Garantiza que no existan dos líneas operativas con el mismo `apu_id`
    dentro del mismo `EDT` de un presupuesto.

    Política imperativa:
    - misma combinación `presupuesto_id + edt_id + apu_id`
    - sumar cantidades
    - recalcular subtotal
    - conservar una sola línea
    """
    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    if not presupuesto:
        return {"merged_groups": 0, "merged_lines": 0, "details": []}

    query = db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == presupuesto_id,
        PresupuestoDetalle.apu_id.isnot(None),
        PresupuestoDetalle.edt_id.isnot(None),
        or_(
            PresupuestoDetalle.tipo.is_(None),
            PresupuestoDetalle.tipo != TipoNodoEdt.CUENTA_PAQUETE.value,
        ),
    )
    if edt_id is not None:
        query = query.filter(PresupuestoDetalle.edt_id == edt_id)

    lineas = query.order_by(
        PresupuestoDetalle.edt_id.asc(),
        PresupuestoDetalle.orden.asc(),
        PresupuestoDetalle.id.asc(),
    ).all()
    if not lineas:
        return {"merged_groups": 0, "merged_lines": 0, "details": []}

    grouped: Dict[Tuple[int, int], List[PresupuestoDetalle]] = {}
    for linea in lineas:
        grouped.setdefault((int(linea.edt_id), int(linea.apu_id)), []).append(linea)

    indirectos_porcentaje = sum(
        (Decimal(str(item.porcentaje or 0)) for item in (presupuesto.indirectos or [])),
        Decimal("0.0"),
    )
    affected_edt_ids = set()
    details: List[Dict[str, object]] = []
    merged_lines = 0

    for (target_edt_id, target_apu_id), candidates in grouped.items():
        if len(candidates) < 2:
            continue

        canonical = candidates[0]
        duplicates = candidates[1:]
        total_quantity = sum((Decimal(str(item.cantidad or 0)) for item in candidates), Decimal("0.0"))
        canonical.cantidad = total_quantity
        canonical.notas = _merge_budget_line_notes(*candidates)

        target_apu = resolve_presupuesto_line_apu(db, presupuesto, target_apu_id)
        _sync_presupuesto_line_from_apu(
            presupuesto,
            canonical,
            target_apu,
            indirectos_porcentaje=indirectos_porcentaje,
        )

        merged_ids = [int(item.id) for item in duplicates]
        merged_quantities = [str(item.cantidad or 0) for item in duplicates]
        for duplicate in duplicates:
            db.delete(duplicate)
        db.flush()

        affected_edt_ids.add(target_edt_id)
        merged_lines += len(duplicates)
        details.append({
            "edt_id": target_edt_id,
            "apu_id": target_apu_id,
            "canonical_linea_id": int(canonical.id),
            "deleted_linea_ids": merged_ids,
            "cantidad_total": str(canonical.cantidad or 0),
            "cantidades_fusionadas": merged_quantities,
            "descripcion": canonical.descripcion,
        })

    if not details:
        return {"merged_groups": 0, "merged_lines": 0, "details": []}

    for affected in sorted(affected_edt_ids):
        recalculate_line_codes(db, presupuesto_id, affected, commit=False)
    calculate_presupuesto_totals(db, presupuesto)

    if commit:
        db.commit()
    else:
        db.flush()

    return {
        "merged_groups": len(details),
        "merged_lines": merged_lines,
        "details": details,
    }


def get_or_create_operational_presupuesto(db: Session, proyecto_id: int, empresa_id: int) -> Presupuesto:
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == proyecto_id,
        Proyecto.empresa_id == empresa_id
    ).first()
    if not proyecto:
        raise ValueError("Proyecto no encontrado para resolver presupuesto operativo")

    target_revision = int(proyecto.revision or 0)
    presupuestos = db.query(Presupuesto).filter(
        Presupuesto.proyecto_id == proyecto_id,
        Presupuesto.empresa_id == empresa_id
    ).order_by(Presupuesto.id.asc()).all()

    if not presupuestos:
        created = initialize_presupuesto_from_edt(db, proyecto_id, empresa_id, revision=target_revision)
        if not created:
            raise ValueError("No se pudo inicializar el presupuesto operativo")
        return created

    canonical = max(presupuestos, key=lambda presupuesto: _score_presupuesto_candidato(db, presupuesto))
    changed = False

    if int(canonical.revision or 0) != target_revision:
        canonical.revision = target_revision
        changed = True

    if canonical.empresa_id != empresa_id:
        canonical.empresa_id = empresa_id
        changed = True

    for presupuesto in presupuestos:
        if presupuesto.id == canonical.id:
            continue
        db.delete(presupuesto)
        changed = True

    sync_changes = sync_presupuesto_codes_with_edt(db, proyecto_id, empresa_id)
    scope_repairs = repair_presupuesto_apu_scope(
        db,
        empresa_id=empresa_id,
        proyecto_id=proyecto_id,
        presupuesto_id=canonical.id,
        commit=False,
    )
    uniqueness_repairs = enforce_presupuesto_apu_uniqueness(
        db,
        canonical.id,
        commit=False,
    )
    ensure_presupuesto_indirectos(db, canonical)
    calculate_presupuesto_totals(db, canonical)

    if changed or sync_changes or int(scope_repairs.get("repaired_lines") or 0) > 0 or int(uniqueness_repairs.get("merged_lines") or 0) > 0:
        db.commit()
        db.refresh(canonical)
    else:
        db.flush()

    return canonical


def ensure_presupuesto_indirectos(db: Session, presupuesto: Presupuesto) -> List[PresupuestoIndirecto]:
    existing = db.query(PresupuestoIndirecto).filter(
        PresupuestoIndirecto.presupuesto_id == presupuesto.id
    ).all()

    existing_codes = {item.concepto_codigo for item in existing}
    created = False

    for item in FIXED_INDIRECTOS:
        if item["concepto_codigo"] in existing_codes:
            continue
        db.add(PresupuestoIndirecto(
            presupuesto_id=presupuesto.id,
            empresa_id=presupuesto.empresa_id,
            concepto_codigo=item["concepto_codigo"],
            concepto_id=item["concepto_id"],
            categoria_codigo=item["categoria_codigo"],
            nombre=item["nombre"],
            porcentaje=Decimal("0.0"),
            observaciones="",
            fijo=item["fijo"],
            usuario=item["usuario"],
            custom=item["custom"],
        ))
        created = True

    if created:
        db.flush()
        existing = db.query(PresupuestoIndirecto).filter(
            PresupuestoIndirecto.presupuesto_id == presupuesto.id
        ).all()

    return existing


def calculate_presupuesto_totals(db: Session, presupuesto: Presupuesto) -> Presupuesto:
    indirectos = ensure_presupuesto_indirectos(db, presupuesto)
    subtotal_directo = sum(
        (Decimal(str(linea.precio_total or 0)) for linea in presupuesto.detalle if _is_budget_row_countable(linea)),
        Decimal("0.0000")
    )
    indirectos_porcentaje = sum(
        (Decimal(str(item.porcentaje or 0)) for item in indirectos),
        Decimal("0.0000")
    )
    indirectos_total = round_decimal(subtotal_directo * (indirectos_porcentaje / Decimal("100.0")), presupuesto.dec_moneda)
    base_imponible = subtotal_directo + indirectos_total

    presupuesto.subtotal = subtotal_directo
    presupuesto.indirectos_total = indirectos_total
    if presupuesto.iva_aplicado:
        presupuesto.impuestos = round_decimal(base_imponible * (Decimal(str(presupuesto.iva_aplicado)) / Decimal("100.0")), presupuesto.dec_moneda)
    else:
        presupuesto.impuestos = Decimal("0.0000")
    presupuesto.total = presupuesto.subtotal + presupuesto.indirectos_total + presupuesto.impuestos
    return presupuesto


def create_presupuesto_service(db: Session, presupuesto_in: PresupuestoCreate, target_empresa_id: int) -> Presupuesto:
    target_revision = _get_project_revision(db, presupuesto_in.proyecto_id, target_empresa_id)
    existing = db.query(Presupuesto).filter(
        Presupuesto.proyecto_id == presupuesto_in.proyecto_id,
        Presupuesto.empresa_id == target_empresa_id
    ).all()
    if existing:
        return get_or_create_operational_presupuesto(db, presupuesto_in.proyecto_id, target_empresa_id)

    # 1. Crear cabecera
    pres_data = presupuesto_in.model_dump(exclude={"lineas"})
    pres_data["revision"] = target_revision
    db_obj = Presupuesto(
        **pres_data,
        empresa_id=target_empresa_id
    )
    db.add(db_obj)
    db.flush()

    # 2. Crear líneas y calcular totales básicos
    subtotal = Decimal("0.0")
    proyecto = db.query(Proyecto).filter(
        Proyecto.id == presupuesto_in.proyecto_id,
        Proyecto.empresa_id == target_empresa_id,
    ).first()
    if not proyecto:
        raise ValueError("Proyecto no encontrado para crear presupuesto")
    for linea_in in presupuesto_in.lineas:
        target_apu = None
        if linea_in.apu_id:
            target_apu = resolve_apu_for_target_base(
                db,
                linea_in.apu_id,
                int(proyecto.base_trabajo_id or 0),
                target_empresa_id,
            )
        precio_unitario = Decimal(str(target_apu.costo_directo if target_apu else linea_in.precio_unitario))
        precio_total_raw = Decimal(str(linea_in.cantidad)) * precio_unitario
        precio_total_linea = round_decimal(precio_total_raw, db_obj.dec_moneda)
        linea = PresupuestoDetalle(
            **linea_in.model_dump(
                exclude={
                    "precio_total",
                    "apu_id",
                    "descripcion",
                    "unidad",
                    "precio_unitario",
                    "omniclass_codigo",
                    "omniclass_titulo",
                }
            ),
            presupuesto_id=db_obj.id,
            apu_id=target_apu.id if target_apu else linea_in.apu_id,
            descripcion=target_apu.descripcion if target_apu else linea_in.descripcion,
            unidad=canonicalize_unit_symbol(target_apu.unidad) if target_apu else canonicalize_unit_symbol(linea_in.unidad),
            omniclass_codigo=target_apu.omniclass_codigo if target_apu else linea_in.omniclass_codigo,
            omniclass_titulo=target_apu.omniclass_titulo if target_apu else linea_in.omniclass_titulo,
            precio_unitario=precio_unitario,
            precio_total=precio_total_linea
        )
        subtotal += precio_total_linea
        db.add(linea)
    
    db_obj.subtotal = subtotal
    ensure_presupuesto_indirectos(db, db_obj)
    calculate_presupuesto_totals(db, db_obj)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_presupuesto_pareto(
    db: Session, 
    pres: Presupuesto, 
    view: str = "global", 
    top: int = 20, 
    cutoff_percent: Optional[float] = None, 
    edt_id: Optional[int] = None,
    target_empresa_id: int = None
) -> PresupuestoParetoResponse:
    
    def _apply_visibility_rules(items: List[PresupuestoParetoItemResponse]) -> Tuple[List[PresupuestoParetoItemResponse], float]:
        visible_items = items[:top]
        if cutoff_percent is not None:
            visible_items = [item for item in visible_items if item.porcentaje_acumulado <= cutoff_percent or item.ranking == 1]
            if items and visible_items and visible_items[-1].porcentaje_acumulado < cutoff_percent:
                next_item = next((item for item in items if item.ranking == visible_items[-1].ranking + 1), None)
                if next_item:
                    visible_items.append(next_item)
        visible_acumulado = visible_items[-1].porcentaje_acumulado if visible_items else 0.0
        return visible_items, visible_acumulado

    total = sum((Decimal(str(linea.precio_total or 0)) for linea in pres.detalle if _is_budget_row_countable(linea)), Decimal("0"))

    if total <= 0:
        return PresupuestoParetoResponse(
            presupuesto_id=pres.id,
            view=view,
            total=Decimal("0"),
            total_items=len([linea for linea in pres.detalle if _is_budget_row_countable(linea)]),
            visible_items=0,
            visible_acumulado=0.0,
            items=[]
        )

    if view == "global":
        detalle_ordenado = sorted(
            [linea for linea in pres.detalle if _is_budget_package_row(linea)],
            key=lambda linea: Decimal(str(linea.precio_total or 0)),
            reverse=True
        )
        package_total = sum((Decimal(str(linea.precio_total or 0)) for linea in detalle_ordenado), Decimal("0"))
        if package_total <= 0:
            return PresupuestoParetoResponse(
                presupuesto_id=pres.id,
                view=view,
                total=Decimal("0"),
                total_items=len(detalle_ordenado),
                visible_items=0,
                visible_acumulado=0.0,
                items=[]
            )
        items: List[PresupuestoParetoItemResponse] = []
        acumulado = Decimal("0")

        for index, linea in enumerate(detalle_ordenado, start=1):
            valor = Decimal(str(linea.precio_total or 0))
            porcentaje = float(round_operational_calc((valor / package_total) * Decimal("100"), pres.dec_calculos))
            acumulado += valor
            porcentaje_acumulado = float(round_operational_calc((acumulado / package_total) * Decimal("100"), pres.dec_calculos))
            items.append(
                PresupuestoParetoItemResponse(
                    id=linea.id,
                    item_type="linea",
                    codigo=linea.codigo_item,
                    descripcion=linea.descripcion,
                    unidad=canonicalize_unit_symbol(linea.unidad),
                    cantidad=Decimal(str(linea.cantidad or 0)),
                    precio_unitario=Decimal(str(linea.precio_unitario or 0)),
                    valor=valor,
                    porcentaje=porcentaje,
                    porcentaje_acumulado=porcentaje_acumulado,
                    ranking=index,
                    apu_id=linea.apu_id,
                    edt_id=linea.edt_id,
                    linea_id=linea.id
                )
            )
    else:
        edt_nodes = db.query(EdtNode).filter(
            EdtNode.proyecto_id == pres.proyecto_id,
            EdtNode.empresa_id == target_empresa_id
        ).all()
        edt_map = {node.id: node for node in edt_nodes}

        if edt_id is not None:
            chapter = edt_map.get(edt_id)
            if not chapter:
                return None # Controller handles 404

            chapter_lines = [linea for linea in pres.detalle if linea.edt_id == edt_id and _is_budget_row_countable(linea)]
            chapter_total = sum((Decimal(str(linea.precio_total or 0)) for linea in chapter_lines), Decimal("0"))

            if chapter_total <= 0:
                return PresupuestoParetoResponse(
                    presupuesto_id=pres.id,
                    view=view,
                    total=Decimal("0"),
                    total_items=len(chapter_lines),
                    visible_items=0,
                    visible_acumulado=0.0,
                    scope_item_type="capitulo",
                    scope_id=chapter.id,
                    scope_codigo=chapter.codigo,
                    scope_descripcion=chapter.nombre or f"Capítulo {chapter.codigo}",
                    items=[]
                )
            ordered_lines = sorted(
                chapter_lines,
                key=lambda linea: Decimal(str(linea.precio_total or 0)),
                reverse=True
            )
            items = []
            acumulado = Decimal("0")
            for index, linea in enumerate(ordered_lines, start=1):
                valor = Decimal(str(linea.precio_total or 0))
                porcentaje = float(round_operational_calc((valor / chapter_total) * Decimal("100"), pres.dec_calculos))
                acumulado += valor
                porcentaje_acumulado = float(round_operational_calc((acumulado / chapter_total) * Decimal("100"), pres.dec_calculos))
                items.append(
                    PresupuestoParetoItemResponse(
                        id=linea.id,
                        item_type="linea",
                        codigo=linea.codigo_item,
                        descripcion=linea.descripcion,
                        unidad=canonicalize_unit_symbol(linea.unidad),
                        cantidad=Decimal(str(linea.cantidad or 0)),
                        precio_unitario=Decimal(str(linea.precio_unitario or 0)),
                        valor=valor,
                        porcentaje=porcentaje,
                        porcentaje_acumulado=porcentaje_acumulado,
                        ranking=index,
                        apu_id=linea.apu_id,
                        edt_id=linea.edt_id,
                        linea_id=linea.id
                    )
                )
            visible_items, visible_acumulado = _apply_visibility_rules(items)
            return PresupuestoParetoResponse(
                presupuesto_id=pres.id,
                view=view,
                total=chapter_total,
                total_items=len(items),
                visible_items=len(visible_items),
                visible_acumulado=visible_acumulado,
                scope_item_type="capitulo",
                scope_id=chapter.id,
                scope_codigo=chapter.codigo,
                scope_descripcion=chapter.nombre or f"Capítulo {chapter.codigo}",
                items=visible_items
            )
        
        grouped: Dict[int, Dict] = {}
        for linea in pres.detalle:
            if not _is_budget_row_countable(linea):
                continue
            node = edt_map.get(linea.edt_id)
            if not node: continue
            current = grouped.setdefault(linea.edt_id, {
                "codigo": node.codigo,
                "descripcion": node.nombre or f"Capítulo {node.codigo}",
                "unidad": "cap",
                "cantidad": Decimal("1"),
                "precio_unitario": Decimal("0"),
                "valor": Decimal("0"),
                "apu_id": None,
                "edt_id": node.id,
                "linea_id": None,
            })
            current["valor"] += Decimal(str(linea.precio_total or 0))

        grouped_items = sorted(grouped.values(), key=lambda x: x["valor"], reverse=True)
        items = []
        acumulado = Decimal("0")
        for index, item in enumerate(grouped_items, start=1):
            valor = item["valor"]
            porcentaje = float(round_operational_calc((valor / total) * Decimal("100"), pres.dec_calculos))
            acumulado += valor
            porcentaje_acumulado = float(round_operational_calc((acumulado / total) * Decimal("100"), pres.dec_calculos))
            items.append(
                PresupuestoParetoItemResponse(
                    id=item["edt_id"],
                    item_type="capitulo",
                    codigo=str(item["codigo"]) if item["codigo"] is not None else None,
                    descripcion=str(item["descripcion"]),
                    unidad=canonicalize_unit_symbol(str(item["unidad"])),
                    cantidad=Decimal(str(item["cantidad"])),
                    precio_unitario=Decimal("0"),
                    valor=valor,
                    porcentaje=porcentaje,
                    porcentaje_acumulado=porcentaje_acumulado,
                    ranking=index,
                    apu_id=None,
                    edt_id=item["edt_id"],
                    linea_id=None
                )
            )

    visible_items, visible_acumulado = _apply_visibility_rules(items)
    return PresupuestoParetoResponse(
        presupuesto_id=pres.id,
        view=view,
        total=package_total if view == "global" else total,
        total_items=len(items),
        visible_items=len(visible_items),
        visible_acumulado=visible_acumulado,
        items=visible_items
    )


def get_notas_summary_service(
    db: Session, 
    id: int, 
    current_user_id: int
) -> PresupuestoNotasSummaryResponse:
    view_state = db.query(PresupuestoVistaUsuario).filter(
        PresupuestoVistaUsuario.presupuesto_id == id,
        PresupuestoVistaUsuario.usuario_id == current_user_id
    ).first()
    
    last_opened_at = view_state.last_opened_at if view_state else None
    last_seen_general_notes_at = view_state.last_seen_general_notes_at if view_state else None
    
    line_views = db.query(PresupuestoLineaVistaUsuario).filter(
        PresupuestoLineaVistaUsuario.presupuesto_id == id,
        PresupuestoLineaVistaUsuario.usuario_id == current_user_id
    ).all()
    line_seen_map = {view.linea_presupuesto_id: view.last_seen_at for view in line_views}

    notes = db.query(PresupuestoNota).filter(
        PresupuestoNota.presupuesto_id == id
    ).order_by(PresupuestoNota.fecha_creacion.asc()).all()

    general_total = 0
    general_nuevas = 0
    lineas: Dict[int, PresupuestoLineNoteSummary] = {}

    for note in notes:
        if note.tipo == "general":
            is_new = (last_seen_general_notes_at is None or note.fecha_creacion > last_seen_general_notes_at) and note.autor_usuario_id != current_user_id
            general_total += 1
            if is_new:
                general_nuevas += 1
            continue

        if note.linea_presupuesto_id is None:
            continue

        line_last_seen = line_seen_map.get(note.linea_presupuesto_id)
        is_new = (line_last_seen is None or note.fecha_creacion > line_last_seen) and note.autor_usuario_id != current_user_id

        if note.linea_presupuesto_id not in lineas:
            lineas[note.linea_presupuesto_id] = PresupuestoLineNoteSummary(total=0, nuevas=0)

        lineas[note.linea_presupuesto_id].total += 1
        if is_new:
            lineas[note.linea_presupuesto_id].nuevas += 1

    return PresupuestoNotasSummaryResponse(
        general_total=general_total,
        general_nuevas=general_nuevas,
        lineas=lineas,
        last_opened_at=last_opened_at
    )


def _calcular_precio_linea_presupuesto(
    pres: Presupuesto,
    costo_directo: Decimal,
    indirectos_porcentaje: Decimal,
) -> Decimal:
    """
    Calcula el precio unitario funcional de una línea de presupuesto.
    En presupuestos el indirecto es FUNCIONAL: se aplica el % del presupuesto
    sobre el costo directo del APU (no el referencial de la base).

    precio_unitario = costo_directo × (1 + indirectos_porcentaje / 100)
    """
    return calculate_budget_line_functional_unit_price(
        direct_cost=costo_directo,
        indirect_percentage=indirectos_porcentaje,
        money_decimals=pres.dec_moneda,
        calc_decimals=pres.dec_calculos,
    )


def _apply_active_functional_price_previews(
    db: Session,
    pres: Presupuesto,
    detalles: list[PresupuestoDetalle],
) -> list[int]:
    """
    Reaplica la modificacion oficial activa sobre el presupuesto recalculado.

    El refresco base puede reconstruir precios desde el APU original; si existe una
    modificacion determinada para proyecto/revision, esa modificacion manda.
    """
    try:
        from app.services.project_functional_modification import project_functional_modification_service
    except Exception:
        return []

    base_trabajo_id = getattr(getattr(pres, "proyecto", None), "base_trabajo_id", None)
    if base_trabajo_id is None:
        base_trabajo_id = next(
            (
                getattr(getattr(linea, "apu", None), "base_trabajo_id", None)
                for linea in detalles
                if getattr(linea, "apu_id", None)
            ),
            None,
        )

    resolved = project_functional_modification_service.resolve_official_source(
        db,
        empresa_id=pres.empresa_id,
        proyecto_id=pres.proyecto_id,
        presupuesto_id=pres.id,
        base_trabajo_id=base_trabajo_id,
        revision=pres.revision,
    )
    summary = resolved.get("summary") if isinstance(resolved, dict) else {}
    price_previews = summary.get("price_previews") if isinstance(summary, dict) else []
    if not isinstance(price_previews, list) or not price_previews:
        return []

    previews_by_line_id: dict[int, dict] = {}
    for preview in price_previews:
        if not isinstance(preview, dict):
            continue
        try:
            line_id = int(preview.get("linea_presupuesto_id") or 0)
        except (TypeError, ValueError):
            continue
        if line_id <= 0:
            continue
        previews_by_line_id[line_id] = preview

    updated_line_ids: list[int] = []
    for linea in detalles:
        preview = previews_by_line_id.get(int(linea.id or 0))
        if not preview:
            continue
        try:
            unit_price = Decimal(str(preview.get("total_unit_price")))
        except Exception:
            continue
        if unit_price < 0:
            continue
        linea.precio_unitario = unit_price
        linea.precio_total = calculate_budget_line_total(
            quantity=linea.cantidad or "0",
            unit_price=unit_price,
            money_decimals=pres.dec_moneda,
            calc_decimals=pres.dec_calculos,
        )
        linea.tanteo_activo = True
        updated_line_ids.append(int(linea.id))

    return sorted(set(updated_line_ids))


def refresh_presupuesto_prices(
    db: Session,
    presupuesto_id: int,
    *,
    commit: bool = True,
    sanitize_scope: bool = True,
    apply_active_functional_overlay: bool = True,
):
    """
    Recalcula los precios unitarios y subtotales de todas las líneas
    del presupuesto consultando los APUs actuales.
    El precio_unitario de cada línea = costo_directo × (1 + %ind_presupuesto / 100).
    """
    pres = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
    if not pres:
        return

    if is_public_procurement_imported_presupuesto(pres):
        calculate_presupuesto_totals(db, pres)
        if commit:
            db.commit()
        else:
            db.flush()
        return pres

    if sanitize_scope:
        repair_presupuesto_apu_scope(db, presupuesto_id=presupuesto_id, commit=False)
    enforce_presupuesto_apu_uniqueness(db, presupuesto_id, commit=False)

    # Obtener el % de indirectos funcional del presupuesto (sumatorio de todos los conceptos)
    indirectos_porcentaje = sum(
        (Decimal(str(item.porcentaje or 0)) for item in pres.indirectos),
        Decimal('0.0')
    )

    detalles = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == pres.id).all()
    apu_ids = {linea.apu_id for linea in detalles if linea.apu_id}
    apus_map = {}
    tanteo_apu_ids = set()

    if apu_ids:
        apus_map = {
            apu.id: apu
            for apu in db.query(APU).filter(APU.id.in_(apu_ids)).all()
        }
        tanteo_apu_ids = {
            apu_id
            for (apu_id,) in db.query(APULinea.apu_id)
            .filter(APULinea.apu_id.in_(apu_ids), APULinea.tanteo_activo == True)
            .distinct()
            .all()
        }

    for linea in detalles:
        if linea.apu_id:
            apu_ref = apus_map.get(linea.apu_id)
            if apu_ref:
                costo_directo = Decimal(str(apu_ref.costo_directo or '0.0000'))
                # precio_unitario = CD × (1 + %ind_presupuesto / 100) — indirecto FUNCIONAL
                linea.precio_unitario = _calcular_precio_linea_presupuesto(
                    pres, costo_directo, indirectos_porcentaje
                )
                linea.precio_total = calculate_budget_line_total(
                    quantity=linea.cantidad or '1.0',
                    unit_price=linea.precio_unitario,
                    money_decimals=pres.dec_moneda,
                    calc_decimals=pres.dec_calculos,
                )

                linea.tanteo_activo = linea.apu_id in tanteo_apu_ids
        else:
            linea.tanteo_activo = False

    if apply_active_functional_overlay:
        _apply_active_functional_price_previews(db, pres, detalles)
    calculate_presupuesto_totals(db, pres)
    if commit:
        db.commit()
    else:
        db.flush()
    return pres



def propagate_apu_change_to_presupuestos(
    db: Session,
    apu_id: int,
    *,
    apply_active_functional_overlay: bool = True,
):
    """
    Encuentra todos los Presupuestos en estado "Borrador" o "En Elaboración" 
    que contengan el APU modificado, y gatilla su recálculo.
    """
    presupuestos_afectados = db.query(Presupuesto.id)\
        .join(PresupuestoDetalle, Presupuesto.id == PresupuestoDetalle.presupuesto_id)\
        .filter(
            PresupuestoDetalle.apu_id == apu_id,
            Presupuesto.estado.in_(["En Elaboración", "Borrador", "Revision"])
        ).distinct().all()

    for (p_id,) in presupuestos_afectados:
        refresh_presupuesto_prices(
            db,
            p_id,
            apply_active_functional_overlay=apply_active_functional_overlay,
        )
        
    return len(presupuestos_afectados)


def recalculate_line_codes(db: Session, presupuesto_id: int, edt_id: Optional[int] = None, *, commit: bool = True):
    """
    Recalcula los códigos de las partidas (APUs) dentro de un capítulo específico
    o en todo el presupuesto si no se proporciona edt_id.
    """
    if edt_id:
        chapters = [db.query(EdtNode).filter(EdtNode.id == edt_id).first()]
    else:
        chapters = db.query(EdtNode).join(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == presupuesto_id).distinct().all()

    for chapter in chapters:
        if not chapter: continue
        
        lineas = db.query(PresupuestoDetalle).filter(
            PresupuestoDetalle.presupuesto_id == presupuesto_id,
            PresupuestoDetalle.edt_id == chapter.id,
            PresupuestoDetalle.apu_id.isnot(None)
        ).order_by(PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc()).all()
        
        for idx, linea in enumerate(lineas):
            linea.orden = idx
            linea.codigo_item = f"{chapter.codigo}.{idx + 1}"
            
    if commit:
        db.commit()
    else:
        db.flush()


def sync_presupuesto_codes_with_edt(db: Session, proyecto_id: int, empresa_id: int) -> int:
    """
    Sincroniza la proyección estructural del presupuesto con la jerarquía EDT vigente.

    - Las filas estructurales (`apu_id is None`) heredan `codigo`, `nombre` y `parent_id`
      desde la EDT actual.
    - Las líneas presupuestarias/APU mantienen su propio `codigo_item`, pero este se
      recalcula con el prefijo EDT actualizado del capítulo al que pertenecen.
    """
    edt_nodes = db.query(EdtNode).filter(
        EdtNode.proyecto_id == proyecto_id,
        EdtNode.empresa_id == empresa_id,
        EdtNode.tipo_nodo == TipoNodoEdt.CUENTA_PAQUETE,
    ).order_by(EdtNode.parent_id.nullsfirst(), EdtNode.orden.asc(), EdtNode.id.asc()).all()
    edt_map = {node.id: node for node in edt_nodes}

    presupuestos = db.query(Presupuesto).filter(
        Presupuesto.proyecto_id == proyecto_id,
        Presupuesto.empresa_id == empresa_id
    ).order_by(Presupuesto.id.asc()).all()

    mutations = 0
    for presupuesto in presupuestos:
        detalle_rows = db.query(PresupuestoDetalle).filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id
        ).order_by(PresupuestoDetalle.id.asc()).all()

        structural_candidates: Dict[int, List[PresupuestoDetalle]] = {}
        for detalle in detalle_rows:
            if _is_structural_budget_row(detalle) and detalle.edt_id in edt_map:
                structural_candidates.setdefault(detalle.edt_id, []).append(detalle)

        structural_by_edt_id: Dict[int, PresupuestoDetalle] = {}
        duplicates_to_delete: List[PresupuestoDetalle] = []
        for edt_id, candidates in structural_candidates.items():
            node = edt_map[edt_id]
            canonical = next(
                (candidate for candidate in sorted(candidates, key=lambda item: item.id) if candidate.descripcion == (node.nombre or f"Item {node.codigo}")),
                sorted(candidates, key=lambda item: item.id)[0]
            )
            structural_by_edt_id[edt_id] = canonical
            duplicates_to_delete.extend(candidate for candidate in candidates if candidate.id != canonical.id)

        for node in edt_nodes:
            structural = structural_by_edt_id.get(node.id)
            if not structural:
                structural = PresupuestoDetalle(
                    presupuesto_id=presupuesto.id,
                    edt_id=node.id,
                    apu_id=None,
                    parent_id=None,
                    tipo=node.tipo_nodo.value if hasattr(node.tipo_nodo, "value") else node.tipo_nodo,
                    codigo_item=node.codigo,
                    descripcion=node.nombre or f"Item {node.codigo}",
                    unidad=None,
                    cantidad=Decimal("1.0"),
                    precio_unitario=Decimal("0.0"),
                    precio_total=Decimal("0.0"),
                    orden=node.orden,
                )
                db.add(structural)
                db.flush()
                structural_by_edt_id[node.id] = structural
                mutations += 1

            node_tipo = node.tipo_nodo.value if hasattr(node.tipo_nodo, "value") else node.tipo_nodo
            node_descripcion = node.nombre or f"Item {node.codigo}"
            if structural.tipo != node_tipo:
                structural.tipo = node_tipo
                mutations += 1
            if structural.codigo_item != node.codigo:
                structural.codigo_item = node.codigo
                mutations += 1
            if structural.descripcion != node_descripcion:
                structural.descripcion = node_descripcion
                mutations += 1
            if structural.orden != node.orden:
                structural.orden = node.orden
                mutations += 1

        for node in edt_nodes:
            structural = structural_by_edt_id.get(node.id)
            if not structural:
                continue
            new_parent_id = structural_by_edt_id.get(node.parent_id).id if node.parent_id and structural_by_edt_id.get(node.parent_id) else None
            if structural.parent_id != new_parent_id:
                structural.parent_id = new_parent_id
                mutations += 1

        stale_structurals = [
            detalle for detalle in detalle_rows
            if _is_structural_budget_row(detalle) and detalle.edt_id not in edt_map
        ]
        for stale in stale_structurals + duplicates_to_delete:
            db.delete(stale)
            mutations += 1

        for detail in db.query(PresupuestoDetalle).filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id
        ).all():
            if _is_structural_budget_row(detail):
                continue
            new_parent_id = structural_by_edt_id.get(detail.edt_id).id if structural_by_edt_id.get(detail.edt_id) else None
            if detail.parent_id != new_parent_id:
                detail.parent_id = new_parent_id
                mutations += 1

        db.flush()
        recalculate_line_codes(db, presupuesto.id)

    return mutations


def initialize_presupuesto_from_edt(db: Session, proyecto_id: int, empresa_id: int, revision: Optional[int] = None) -> Optional[Presupuesto]:
    """
    Inicializa un presupuesto base a partir de la EDT de un proyecto.
    Si ya existe un presupuesto para esa revisión, no hace nada.
    """
    if revision is None:
        revision = _get_project_revision(db, proyecto_id, empresa_id)

    # 1. Verificar si ya existe el presupuesto para esa revisión
    existing_any = db.query(Presupuesto).filter(
        Presupuesto.proyecto_id == proyecto_id,
        Presupuesto.empresa_id == empresa_id
    ).all()

    if existing_any:
        return get_or_create_operational_presupuesto(db, proyecto_id, empresa_id)

    # 2. Crear cabecera de presupuesto base
    nuevo_pres = Presupuesto(
        proyecto_id=proyecto_id,
        empresa_id=empresa_id,
        descripcion=f"Presupuesto Base (Rev {revision})",
        revision=revision,
        estado="En Elaboración",
        moneda="USD"
    )
    db.add(nuevo_pres)
    db.flush()

    # 3. Traer nodos EDT ordenados por profundidad (padres primero)
    # Para simplificar la jerarquía, los traemos todos y usamos un mapa
    from app.models.edt import EdtNode
    nodes = db.query(EdtNode).filter(
        EdtNode.proyecto_id == proyecto_id,
        EdtNode.empresa_id == empresa_id,
        EdtNode.tipo_nodo == TipoNodoEdt.CUENTA_PAQUETE,
    ).order_by(EdtNode.parent_id.nullsfirst(), EdtNode.orden).all()

    # 4. Mapeo de edt_id -> presupuesto_detalle_id
    id_map = {}
    
    for node in nodes:
        nuevo_detalle = PresupuestoDetalle(
            presupuesto_id=nuevo_pres.id,
            edt_id=node.id,
            parent_id=id_map.get(node.parent_id) if node.parent_id else None,
            tipo=node.tipo_nodo.value if hasattr(node.tipo_nodo, "value") else node.tipo_nodo,
            codigo_item=node.codigo,
            descripcion=node.nombre or f"Item {node.codigo}",
            orden=node.orden,
            cantidad=Decimal("1.0"),
            precio_unitario=Decimal("0.0"),
            precio_total=Decimal("0.0")
        )
        db.add(nuevo_detalle)
        db.flush()
        id_map[node.id] = nuevo_detalle.id

    # 5. Asegurar indirectos y totales
    ensure_presupuesto_indirectos(db, nuevo_pres)
    calculate_presupuesto_totals(db, nuevo_pres)
    
    db.commit()
    db.refresh(nuevo_pres)
    return nuevo_pres
