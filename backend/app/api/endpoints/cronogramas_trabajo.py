from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import urllib.parse

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.cronograma_gantt_control import CronogramaGanttEditLock
from app.models.apu import APU, APULinea
from app.schemas.cronograma_trabajo import (
    CronogramaGanttDraftApplyRequest,
    CronogramaGanttDraftPreflightResponse,
    CronogramaGanttDraftResponse,
    CronogramaGanttIntentionCreate,
    CronogramaGanttLockRequest,
    CronogramaGanttLockReleaseRequest,
    CronogramaGanttLockResponse,
    CronogramaTrabajoFullResetResponse,
    CronogramaTrabajoDeltaResponse,
    CronogramaTrabajoInterparentMergeRequest,
    CronogramaTrabajoInterparentMergeResponse,
    CronogramaTrabajoParetoItem,
    CronogramaTrabajoParetoResponse,
    CronogramaTrabajoResponse,
    CronogramaTrabajoUpdate,
)
from app.schemas.project_calendar import ProjectHolidayManualAdd, ProjectHolidayRemoveRequest
from app.services.cronograma_trabajo import cronograma_trabajo_service
from app.services.gantt_workflow import GanttWorkflowError, gantt_workflow_service
from app.services.project_functional_modification import project_functional_modification_service
from app.services.apu_resource_readiness import apu_resource_readiness_service
from app.services.project_calendar import project_calendar_service
from app.services.presupuesto import calculate_presupuesto_totals
from app.services.apu import calculate_apu_price
from app.services.apu_explosion import (
    PERFORMANCE_RESOURCE_CATEGORY_IDS,
    resolve_resource_category_id,
)
from app.services.license import license_service
from app.services.audit_event import record_audit_event
from app.core.calculation_policy import calculate_budget_line_total
from app.api.endpoints.cronogramas import _get_or_create_cronograma, _serialize_cronograma, _validate_distribution

router = APIRouter()
PARETO_TOP_OPTIONS = {10, 20, 50}


def _build_cronograma_trabajo_pareto_response(
    presupuesto_id: int,
    rows,
    price_map: dict[int, float],
    view: Literal["cost", "time", "integrated"] = "integrated",
    top: int = 20,
    cutoff_percent: float | None = None,
    edt_id: int | None = None,
    critical_only: bool = False,
    start_from: date | None = None,
    end_to: date | None = None,
):
    calculable_rows = [
        row for row in (rows or [])
        if getattr(row, "apu_id", None) and getattr(row, "presupuesto_linea_id", None)
    ]

    enriched = []
    cost_total = 0.0
    time_total = 0.0
    for row in calculable_rows:
        row_edt_id = int(getattr(row, "edt_id", 0) or 0)
        if edt_id is not None and row_edt_id != int(edt_id):
            continue
        metadata = getattr(row, "metadata", {}) or {}
        is_critical = bool(metadata.get("is_critical") or metadata.get("critical"))
        if critical_only and not is_critical:
            continue
        row_start = getattr(row, "start_date", None)
        row_end = getattr(row, "end_date", None) or row_start
        if start_from and row_end and row_end.date() < start_from:
            continue
        if end_to and row_start and row_start.date() > end_to:
            continue
        line_id = int(getattr(row, "presupuesto_linea_id"))
        cost_value = float(price_map.get(line_id, 0.0) or 0.0)
        duration_hours = float(getattr(row, "duracion_horas", 0.0) or 0.0)
        if duration_hours <= 0:
            duration_hours = float(getattr(row, "dias_calendario", 0.0) or getattr(row, "dias_utiles", 0.0) or 0.0) * 8.0
        work_hours = float(getattr(row, "trabajo_total", 0.0) or getattr(row, "horas_total", 0.0) or 0.0)
        time_value = max(duration_hours, work_hours, 0.0)
        cost_total += cost_value
        time_total += time_value
        enriched.append({
            "row": row,
            "cost_value": cost_value,
            "time_value": time_value,
            "work_hours": work_hours,
            "duration_hours": duration_hours,
        })

    if not enriched:
        return CronogramaTrabajoParetoResponse(
            presupuesto_id=presupuesto_id,
            view=view,
            metric_label="Índice integrado" if view == "integrated" else ("Costo" if view == "cost" else "Tiempo"),
            total=0.0,
            total_items=0,
            visible_items=0,
            visible_acumulado=0.0,
            items=[],
        )

    items = []
    for entry in enriched:
        row = entry["row"]
        cost_pct = (entry["cost_value"] / cost_total * 100.0) if cost_total > 0 else 0.0
        time_pct = (entry["time_value"] / time_total * 100.0) if time_total > 0 else 0.0
        integrated_value = (cost_pct + time_pct) / 2.0
        metric_value = {
            "cost": entry["cost_value"],
            "time": entry["time_value"],
            "integrated": integrated_value,
        }[view]
        porcentaje = {
            "cost": cost_pct,
            "time": time_pct,
            "integrated": integrated_value,
        }[view]
        items.append(CronogramaTrabajoParetoItem(
            id=int(getattr(row, "linea_id", getattr(row, "presupuesto_linea_id"))),
            codigo=getattr(row, "codigo_item", None),
            descripcion=str(getattr(row, "descripcion", "")),
            edt_id=int(getattr(row, "edt_id")),
            linea_id=int(getattr(row, "presupuesto_linea_id")),
            apu_id=getattr(row, "apu_id", None),
            start_date=getattr(row, "start_date", None),
            end_date=getattr(row, "end_date", None),
            duration_days=float(getattr(row, "dias_calendario", 0.0) or getattr(row, "dias_utiles", 0.0) or 0.0),
            duration_hours=entry["duration_hours"],
            work_hours=entry["work_hours"],
            cost_value=entry["cost_value"],
            cost_pct=round(cost_pct, 4),
            time_value=entry["time_value"],
            time_pct=round(time_pct, 4),
            integrated_value=round(integrated_value, 4),
            integrated_pct=round(integrated_value, 4),
            metric_value=round(metric_value, 4),
            porcentaje=round(porcentaje, 4),
            is_critical=is_critical,
        ))

    items.sort(key=lambda item: item.metric_value, reverse=True)
    acumulado = 0.0
    for index, item in enumerate(items, start=1):
        acumulado += item.porcentaje
        item.ranking = index
        item.porcentaje_acumulado = round(acumulado, 4)

    visible_items = items[:top]
    if cutoff_percent is not None:
        visible_items = [item for item in visible_items if item.porcentaje_acumulado <= cutoff_percent or item.ranking == 1]
        if items and visible_items and visible_items[-1].porcentaje_acumulado < cutoff_percent:
            next_item = next((item for item in items if item.ranking == visible_items[-1].ranking + 1), None)
            if next_item:
                visible_items.append(next_item)

    return CronogramaTrabajoParetoResponse(
        presupuesto_id=presupuesto_id,
        view=view,
        metric_label="Índice integrado" if view == "integrated" else ("Costo" if view == "cost" else "Tiempo"),
        total=round(sum(item.metric_value for item in items), 4),
        total_items=len(items),
        visible_items=len(visible_items),
        visible_acumulado=round(visible_items[-1].porcentaje_acumulado if visible_items else 0.0, 4),
        items=visible_items,
    )

def _verify_module_access(db: Session, proyecto_id: int, usuario_id: int):
    from app.services.proyecto import proyecto_service
    perms = proyecto_service.get_user_permissions(db, proyecto_id, usuario_id)
    if not perms["has_assignment"]:
        return
    if "todos" in perms["allowed_modules"] or "cronogramas" in perms["allowed_modules"]:
        return
    raise HTTPException(status_code=403, detail="Acceso denegado al módulo cronogramas")

def _resolve_budget(db: Session, presupuesto_id: int, current_user: Usuario, empresa_id: Optional[int]) -> Presupuesto:
    target_empresa_id = current_user.empresa_id
    if current_user.rol.lower() == "superadministrador" and empresa_id:
        target_empresa_id = empresa_id

    query = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id)
    presupuesto = None

    if current_user.rol.lower() == "superadministrador" and not empresa_id:
        presupuesto = query.first()
    else:
        presupuesto = query.filter(Presupuesto.empresa_id == target_empresa_id).first()

    if not presupuesto:
        raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    return presupuesto


def _require_gantt_editor(current_user: Usuario) -> None:
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para editar el cronograma.",
        )


def _resolve_work_schedule(
    db: Session,
    *,
    presupuesto: Presupuesto,
) -> CronogramaTrabajo:
    apu_resource_readiness_service.ensure_budget_ready(
        db,
        presupuesto,
        presupuesto.empresa_id,
    )
    cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )
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
        raise HTTPException(status_code=404, detail="Cronograma de trabajo no encontrado.")
    return schedule


def _resolve_budget_base_trabajo_id(
    db: Session,
    *,
    presupuesto_id: int,
) -> int | None:
    line = (
        db.query(PresupuestoDetalle)
        .filter(
            PresupuestoDetalle.presupuesto_id == int(presupuesto_id),
            PresupuestoDetalle.apu_id.isnot(None),
        )
        .order_by(PresupuestoDetalle.id.asc())
        .first()
    )
    if not line or not line.apu:
        return None
    return getattr(line.apu, "base_trabajo_id", None)


def _apply_gantt_price_previews_to_budget(
    db: Session,
    *,
    presupuesto: Presupuesto,
    intentions: list[dict],
) -> dict:
    price_previews = []
    for intention in intentions or []:
        if not isinstance(intention, dict):
            continue
        preview = intention.get("price_preview")
        if not isinstance(preview, dict):
            continue
        try:
            line_id = int(intention.get("linea_presupuesto_id") or 0)
        except (TypeError, ValueError):
            line_id = 0
        if line_id <= 0:
            continue
        price_previews.append((line_id, preview))

    if not price_previews:
        return {"updated_line_ids": [], "count": 0}

    line_ids = sorted({line_id for line_id, _ in price_previews})
    lines = (
        db.query(PresupuestoDetalle)
        .filter(
            PresupuestoDetalle.presupuesto_id == presupuesto.id,
            PresupuestoDetalle.id.in_(line_ids),
        )
        .all()
    )
    lines_by_id = {int(line.id): line for line in lines}
    updated_line_ids: list[int] = []
    details: list[dict] = []

    for line_id, preview in price_previews:
        line = lines_by_id.get(line_id)
        if not line:
            continue
        try:
            unit_price = Decimal(str(preview.get("total_unit_price")))
        except Exception:
            continue
        if unit_price < 0:
            continue
        previous_unit_price = Decimal(str(line.precio_unitario or 0))
        previous_total = Decimal(str(line.precio_total or 0))
        next_total = calculate_budget_line_total(
            quantity=line.cantidad or 0,
            unit_price=unit_price,
            money_decimals=presupuesto.dec_moneda,
            calc_decimals=presupuesto.dec_calculos,
        )
        line.precio_unitario = unit_price
        line.precio_total = next_total
        line.tanteo_activo = True
        updated_line_ids.append(line_id)
        details.append(
            {
                "linea_presupuesto_id": line_id,
                "previous_unit_price": str(previous_unit_price),
                "next_unit_price": str(unit_price),
                "previous_total": str(previous_total),
                "next_total": str(next_total),
            }
        )

    if updated_line_ids:
        calculate_presupuesto_totals(db, presupuesto)
        db.flush()

    return {
        "updated_line_ids": sorted(set(updated_line_ids)),
        "count": len(set(updated_line_ids)),
        "details": details,
    }


def _decimal_from(value, default: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(default)


def _recalculate_apu_and_parents(
    db: Session,
    *,
    apu_id: int,
    empresa_id: int,
    visited: set[int] | None = None,
) -> set[int]:
    if visited is None:
        visited = set()
    normalized_apu_id = int(apu_id or 0)
    if normalized_apu_id <= 0 or normalized_apu_id in visited:
        return visited
    visited.add(normalized_apu_id)
    apu = (
        db.query(APU)
        .filter(APU.id == normalized_apu_id, APU.empresa_id == int(empresa_id))
        .first()
    )
    if not apu:
        return visited
    calculate_apu_price(db, apu)
    parent_lines = db.query(APULinea).filter(APULinea.apu_hijo_id == normalized_apu_id).all()
    for parent_line in parent_lines:
        _recalculate_apu_and_parents(
            db,
            apu_id=int(parent_line.apu_id or 0),
            empresa_id=empresa_id,
            visited=visited,
        )
    return visited


def _build_apu_line_inherited_factor_map(
    db: Session,
    *,
    root_apu_id: int,
    empresa_id: int,
) -> dict[int, Decimal]:
    factors: dict[int, Decimal] = {}
    visited_apu_ids: set[int] = set()

    def visit(apu_id: int, inherited_factor: Decimal) -> None:
        normalized_apu_id = int(apu_id or 0)
        if normalized_apu_id <= 0 or normalized_apu_id in visited_apu_ids:
            return
        apu = (
            db.query(APU)
            .filter(APU.id == normalized_apu_id, APU.empresa_id == int(empresa_id))
            .first()
        )
        if not apu:
            return
        visited_apu_ids.add(normalized_apu_id)
        lines = (
            db.query(APULinea)
            .filter(APULinea.apu_id == normalized_apu_id)
            .order_by(APULinea.orden.asc(), APULinea.id.asc())
            .all()
        )
        for line in lines:
            factors[int(line.id)] = inherited_factor
            if line.apu_hijo_id:
                child_quantity = _decimal_from(line.cantidad, "0")
                child_rendimiento = _decimal_from(line.rendimiento, "1")
                child_factor = inherited_factor * child_quantity * child_rendimiento
                visit(int(line.apu_hijo_id), child_factor)

    visit(int(root_apu_id or 0), Decimal("1"))
    return factors


def _apply_gantt_operational_snapshots_to_apu_lines(
    db: Session,
    *,
    presupuesto: Presupuesto,
    intentions: list[dict],
) -> dict:
    """
    Materializa en APULinea los aportes trazables aceptados desde el editor light.

    Los recursos consolidados de materiales/transporte se editan en cantidad
    equivalente al APU padre. Los recursos de rendimiento anidados
    (equipos/herramientas y mano de obra) se editan en cantidad nativa del APU
    origen para evitar cuadrillas fraccionadas.
    """
    candidate_line_ids: set[int] = set()
    for intention in intentions or []:
        if not isinstance(intention, dict):
            continue
        operational_snapshot = intention.get("operational_snapshot")
        if not isinstance(operational_snapshot, dict):
            continue
        for resource in operational_snapshot.get("resources") or []:
            if not isinstance(resource, dict):
                continue
            for source_line in resource.get("source_lines") or []:
                if not isinstance(source_line, dict):
                    continue
                try:
                    line_id = int(source_line.get("linea_id") or 0)
                except (TypeError, ValueError):
                    line_id = 0
                if line_id > 0:
                    candidate_line_ids.add(line_id)

    if not candidate_line_ids:
        return {"updated_line_ids": [], "updated_apu_ids": [], "count": 0}

    apu_lines = (
        db.query(APULinea)
        .join(APU, APULinea.apu_id == APU.id)
        .filter(
            APULinea.id.in_(sorted(candidate_line_ids)),
            APU.empresa_id == int(presupuesto.empresa_id),
        )
        .all()
    )
    lines_by_id = {int(line.id): line for line in apu_lines}
    updated_line_ids: set[int] = set()
    directly_affected_apu_ids: set[int] = set()
    root_factor_maps: dict[int, dict[int, Decimal]] = {}

    for intention in intentions or []:
        if not isinstance(intention, dict):
            continue
        operational_snapshot = intention.get("operational_snapshot")
        if not isinstance(operational_snapshot, dict):
            continue
        try:
            budget_line_id = int(intention.get("linea_presupuesto_id") or 0)
        except (TypeError, ValueError):
            budget_line_id = 0
        root_apu_id = 0
        if budget_line_id > 0:
            budget_line = (
                db.query(PresupuestoDetalle)
                .filter(
                    PresupuestoDetalle.presupuesto_id == presupuesto.id,
                    PresupuestoDetalle.id == budget_line_id,
                )
                .first()
            )
            root_apu_id = int(getattr(budget_line, "apu_id", None) or 0) if budget_line else 0
        if root_apu_id <= 0:
            try:
                root_apu_id = int(intention.get("apu_id") or operational_snapshot.get("apu_id") or 0)
            except (TypeError, ValueError):
                root_apu_id = 0
        inherited_factor_map = root_factor_maps.get(root_apu_id)
        if inherited_factor_map is None:
            inherited_factor_map = (
                _build_apu_line_inherited_factor_map(
                    db,
                    root_apu_id=root_apu_id,
                    empresa_id=presupuesto.empresa_id,
                )
                if root_apu_id > 0
                else {}
            )
            root_factor_maps[root_apu_id] = inherited_factor_map
        for resource in operational_snapshot.get("resources") or []:
            if not isinstance(resource, dict):
                continue
            for source_line in resource.get("source_lines") or []:
                if not isinstance(source_line, dict):
                    continue
                try:
                    line_id = int(source_line.get("linea_id") or 0)
                except (TypeError, ValueError):
                    continue
                line = lines_by_id.get(line_id)
                if not line:
                    continue
                equivalent_quantity = _decimal_from(source_line.get("cantidad"), "0")
                inherited_factor = _decimal_from(source_line.get("inherited_factor"), "0")
                if inherited_factor <= 0:
                    inherited_factor = inherited_factor_map.get(line_id, Decimal("0"))
                if inherited_factor <= 0:
                    native_quantity = _decimal_from(source_line.get("native_cantidad"), "0")
                    original_equivalent = _decimal_from(source_line.get("original_cantidad"), "0")
                    inherited_factor = (
                        original_equivalent / native_quantity
                        if native_quantity > 0 and original_equivalent > 0
                        else Decimal("1")
                    )
                category_id = resolve_resource_category_id(line, getattr(line, "recurso", None))
                native_contract_quantity = _decimal_from(source_line.get("native_cantidad"), "0")
                original_contract_quantity = _decimal_from(source_line.get("original_cantidad"), "0")
                has_native_quantity_contract = (
                    native_contract_quantity > 0
                    and original_contract_quantity > 0
                    and native_contract_quantity == original_contract_quantity
                )
                preserves_native_quantity = (
                    bool(source_line.get("nested"))
                    and int(category_id) in PERFORMANCE_RESOURCE_CATEGORY_IDS
                    and has_native_quantity_contract
                )
                native_quantity = (
                    equivalent_quantity
                    if preserves_native_quantity
                    else (
                        equivalent_quantity / inherited_factor
                        if inherited_factor > 0
                        else equivalent_quantity
                    )
                )
                rendimiento = _decimal_from(source_line.get("rendimiento"), "0")
                if native_quantity < 0 or rendimiento < 0:
                    continue

                next_quantity = native_quantity.quantize(Decimal("0.000001"))
                next_rendimiento = rendimiento.quantize(Decimal("0.000001"))
                changed = (
                    _decimal_from(line.cantidad, "0") != next_quantity
                    or _decimal_from(line.rendimiento, "0") != next_rendimiento
                )
                if not changed:
                    continue
                line.cantidad = next_quantity
                line.rendimiento = next_rendimiento
                line.tanteo_activo = True
                updated_line_ids.add(line_id)
                directly_affected_apu_ids.add(int(line.apu_id))

    recalculated_apu_ids: set[int] = set()
    for apu_id in sorted(directly_affected_apu_ids):
        recalculated_apu_ids.update(
            _recalculate_apu_and_parents(
                db,
                apu_id=apu_id,
                empresa_id=presupuesto.empresa_id,
            )
        )

    if updated_line_ids:
        db.flush()

    return {
        "updated_line_ids": sorted(updated_line_ids),
        "updated_apu_ids": sorted(recalculated_apu_ids or directly_affected_apu_ids),
        "count": len(updated_line_ids),
    }


def _serialize_gantt_draft(draft) -> CronogramaGanttDraftResponse:
    if draft is None:
        return CronogramaGanttDraftResponse(status="none", version=0)
    base_snapshot = draft.base_snapshot or {}
    work_origin = base_snapshot.get("work_origin") if isinstance(base_snapshot, dict) else "gantt"
    if work_origin not in {"gantt", "valorados"}:
        work_origin = "gantt"
    return CronogramaGanttDraftResponse(
        id=draft.id,
        status=draft.status,
        version=draft.version or 0,
        work_origin=work_origin,
        empresa_id=draft.empresa_id,
        proyecto_id=draft.proyecto_id,
        presupuesto_id=draft.presupuesto_id,
        cronograma_id=draft.cronograma_id,
        base_snapshot=draft.base_snapshot or {},
        intentions=draft.intentions or [],
        preview_snapshot=draft.preview_snapshot or {},
        invalidations=draft.invalidations or [],
        audit_log=draft.audit_log or [],
        updated_by_id=draft.updated_by_id,
        updated_at=draft.updated_at,
    )


def _serialize_gantt_lock(lock) -> CronogramaGanttLockResponse:
    if lock is None:
        return CronogramaGanttLockResponse(status="none")
    return CronogramaGanttLockResponse(
        id=lock.id,
        status=lock.status,
        empresa_id=lock.empresa_id,
        proyecto_id=lock.proyecto_id,
        presupuesto_id=lock.presupuesto_id,
        cronograma_id=lock.cronograma_id,
        locked_by_user_id=lock.locked_by_user_id,
        locked_by_name=lock.locked_by_name,
        requested_release_by_user_id=lock.requested_release_by_user_id,
        requested_release_by_name=lock.requested_release_by_name,
        request_message=lock.request_message,
        last_heartbeat_at=lock.last_heartbeat_at,
        expires_at=lock.expires_at,
        released_at=lock.released_at,
        audit_log=lock.audit_log or [],
    )


def _translate_gantt_workflow_error(exc: GanttWorkflowError) -> HTTPException:
    status_code = status.HTTP_409_CONFLICT
    if exc.code in {"gantt_edit_lock_not_owned", "gantt_draft_not_editable"}:
        status_code = status.HTTP_403_FORBIDDEN
    return HTTPException(
        status_code=status_code,
        detail={"code": exc.code, "message": exc.message},
    )


GANTT_SUMMARY_METADATA_KEYS = {
    "gantt_session",
    "gantt_subbars",
    "gantt_operational",
    "cpm",
    "cpm_network",
    "cpm_schedule_alignment",
    "cpm_available",
    "is_critical",
    "critical",
    "has_negative_float",
    "manual_milestone",
    "manualMilestone",
    "milestone_kind",
    "temporal_source",
    "manual_temporal_window",
}


def _summarize_gantt_row_metadata(row):
    metadata = getattr(row, "metadata", None) or {}
    if not isinstance(metadata, dict):
        return row
    summary_metadata = {
        key: metadata.get(key)
        for key in GANTT_SUMMARY_METADATA_KEYS
        if key in metadata
    }
    summary_metadata["metadata_lazy"] = True
    return row.model_copy(update={"metadata": summary_metadata})


def _summarize_cronograma_trabajo_response(response: CronogramaTrabajoResponse) -> CronogramaTrabajoResponse:
    return response.model_copy(
        update={
            "schedule_data": {},
            "rows": [_summarize_gantt_row_metadata(row) for row in (response.rows or [])],
        }
    )


@router.get("/{presupuesto_id}", response_model=CronogramaTrabajoResponse)
def read_cronograma_trabajo(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
    compact: bool = Query(False),
    metadata_mode: Literal["full", "summary"] = Query("full"),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    apu_resource_readiness_service.ensure_budget_ready(
        db,
        presupuesto,
        presupuesto.empresa_id,
    )
    response = cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id, 
        empresa_id=presupuesto.empresa_id
    )
    if compact and metadata_mode == "summary":
        return _summarize_cronograma_trabajo_response(response)
    if compact:
        return response.model_copy(update={"schedule_data": {}})
    return response


@router.get("/{presupuesto_id}/lineas/{linea_id}/metadata")
def read_cronograma_trabajo_line_metadata(
    presupuesto_id: int,
    linea_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    apu_resource_readiness_service.ensure_budget_ready(
        db,
        presupuesto,
        presupuesto.empresa_id,
    )
    response = cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )
    target_id = str(linea_id)
    for row in response.rows or []:
        row_id = str(getattr(row, "presupuesto_linea_id", None) or getattr(row, "linea_id", None) or "")
        if row_id == target_id:
            return {
                "linea_id": getattr(row, "linea_id", None),
                "presupuesto_linea_id": getattr(row, "presupuesto_linea_id", None),
                "metadata": getattr(row, "metadata", {}) or {},
            }
    raise HTTPException(status_code=404, detail="Linea de cronograma no encontrada.")


@router.get("/{presupuesto_id}/gantt-draft", response_model=CronogramaGanttDraftResponse)
def read_gantt_draft(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    return _serialize_gantt_draft(draft)


@router.post(
    "/{presupuesto_id}/gantt-draft/intentions",
    response_model=CronogramaGanttDraftResponse,
)
def save_gantt_draft_intention(
    presupuesto_id: int,
    payload: CronogramaGanttIntentionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    try:
        draft = gantt_workflow_service.get_or_create_active_draft(
            db,
            cronograma=schedule,
            user_id=current_user.id,
            work_origin="gantt",
            base_snapshot={
                "cronograma_id": schedule.id,
                "presupuesto_id": presupuesto.id,
                "schedule_data": schedule.schedule_data or {},
            },
        )
        draft = gantt_workflow_service.save_editor_intention(
            db,
            draft=draft,
            intention=payload.intention,
            user_id=current_user.id,
            expected_version=payload.expected_version,
            preview_snapshot=payload.preview_snapshot,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(draft)
    return _serialize_gantt_draft(draft)


@router.post(
    "/{presupuesto_id}/gantt-draft/preflight",
    response_model=CronogramaGanttDraftPreflightResponse,
)
def preflight_gantt_draft_apply(
    presupuesto_id: int,
    payload: CronogramaGanttDraftApplyRequest = CronogramaGanttDraftApplyRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    if draft and payload.expected_version is not None and int(payload.expected_version) != int(draft.version or 0):
        raise _translate_gantt_workflow_error(
            GanttWorkflowError(
                "gantt_draft_version_conflict",
                "El borrador Gantt fue actualizado por otra operacion.",
            )
        )
    return gantt_workflow_service.build_apply_preflight(draft)


@router.post(
    "/{presupuesto_id}/gantt-draft/apply",
    response_model=CronogramaGanttDraftResponse,
)
def mark_gantt_draft_applied(
    presupuesto_id: int,
    payload: CronogramaGanttDraftApplyRequest = CronogramaGanttDraftApplyRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    if draft is None:
        return _serialize_gantt_draft(None)
    try:
        application_result = dict(payload.application_result or {})
        draft = gantt_workflow_service.mark_draft_applied(
            db,
            draft=draft,
            user_id=current_user.id,
            expected_version=payload.expected_version,
            application_result=application_result,
        )
        operational_apu_application = _apply_gantt_operational_snapshots_to_apu_lines(
            db,
            presupuesto=presupuesto,
            intentions=draft.intentions or [],
        )
        budget_price_application = _apply_gantt_price_previews_to_budget(
            db,
            presupuesto=presupuesto,
            intentions=draft.intentions or [],
        )
        functional_modification = project_functional_modification_service.create_active(
            db,
            empresa_id=presupuesto.empresa_id,
            proyecto_id=presupuesto.proyecto_id,
            presupuesto_id=presupuesto.id,
            base_trabajo_id=_resolve_budget_base_trabajo_id(db, presupuesto_id=presupuesto.id),
            revision=presupuesto.revision or 0,
            source="gantt",
            source_ref={
                "gantt_draft_id": draft.id,
                "cronograma_id": schedule.id,
                "work_origin": application_result.get("work_origin"),
            },
            patch={
                "intentions": draft.intentions or [],
                "persisted_line_ids": application_result.get("persisted_line_ids") or [],
                "operational_apu_application": operational_apu_application,
                "budget_price_application": budget_price_application,
            },
            snapshot={
                "preview_snapshot": draft.preview_snapshot or {},
                "application_result": application_result,
                "budget_totals": {
                    "subtotal": str(presupuesto.subtotal or 0),
                    "indirectos_total": str(presupuesto.indirectos_total or 0),
                    "impuestos": str(presupuesto.impuestos or 0),
                    "total": str(presupuesto.total or 0),
                },
            },
            user_id=current_user.id,
        )
        audit_log = draft.audit_log if isinstance(draft.audit_log, list) else []
        if audit_log:
            audit_log[-1] = dict(audit_log[-1])
            audit_log[-1]["active_modification_id"] = functional_modification.id
            draft.audit_log = audit_log
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(draft)
    return _serialize_gantt_draft(draft)


@router.post(
    "/{presupuesto_id}/gantt-draft/discard-invalidated",
    response_model=CronogramaGanttDraftResponse,
)
def discard_invalidated_gantt_draft_intentions(
    presupuesto_id: int,
    payload: CronogramaGanttDraftApplyRequest = CronogramaGanttDraftApplyRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    if draft is None:
        return _serialize_gantt_draft(None)
    try:
        draft = gantt_workflow_service.discard_invalidated_intentions(
            db,
            draft=draft,
            user_id=current_user.id,
            expected_version=payload.expected_version,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(draft)
    return _serialize_gantt_draft(draft)


@router.post(
    "/{presupuesto_id}/gantt-draft/prepare-adjustment",
    response_model=CronogramaGanttDraftResponse,
)
def prepare_invalidated_gantt_draft_intentions_for_adjustment(
    presupuesto_id: int,
    payload: CronogramaGanttDraftApplyRequest = CronogramaGanttDraftApplyRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    draft = gantt_workflow_service.get_active_draft(db, cronograma_id=schedule.id)
    if draft is None:
        return _serialize_gantt_draft(None)
    try:
        draft = gantt_workflow_service.prepare_invalidated_intentions_for_adjustment(
            db,
            draft=draft,
            user_id=current_user.id,
            expected_version=payload.expected_version,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(draft)
    return _serialize_gantt_draft(draft)


@router.post("/{presupuesto_id}/gantt-lock/acquire", response_model=CronogramaGanttLockResponse)
def acquire_gantt_edit_lock(
    presupuesto_id: int,
    payload: CronogramaGanttLockRequest = CronogramaGanttLockRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    user_name = current_user.nombre_completo or current_user.email
    try:
        lock = gantt_workflow_service.acquire_edit_lock(
            db,
            cronograma=schedule,
            user_id=current_user.id,
            user_name=user_name,
            ttl_minutes=payload.ttl_minutes,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(lock)
    return _serialize_gantt_lock(lock)


@router.post("/{presupuesto_id}/gantt-lock/request-release", response_model=CronogramaGanttLockResponse)
def request_gantt_edit_lock_release(
    presupuesto_id: int,
    payload: CronogramaGanttLockReleaseRequest = CronogramaGanttLockReleaseRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    lock = (
        db.query(CronogramaGanttEditLock)
        .filter(CronogramaGanttEditLock.cronograma_id == schedule.id)
        .first()
    )
    if not lock:
        return CronogramaGanttLockResponse(status="none")
    user_name = current_user.nombre_completo or current_user.email
    try:
        lock = gantt_workflow_service.request_edit_lock_release(
            db,
            lock=lock,
            user_id=current_user.id,
            user_name=user_name,
            message=payload.message,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(lock)
    return _serialize_gantt_lock(lock)


@router.post("/{presupuesto_id}/gantt-lock/heartbeat", response_model=CronogramaGanttLockResponse)
def heartbeat_gantt_edit_lock(
    presupuesto_id: int,
    payload: CronogramaGanttLockRequest = CronogramaGanttLockRequest(),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    lock = (
        db.query(CronogramaGanttEditLock)
        .filter(CronogramaGanttEditLock.cronograma_id == schedule.id)
        .first()
    )
    if not lock:
        raise HTTPException(status_code=404, detail="Lock Gantt no encontrado.")
    try:
        lock = gantt_workflow_service.heartbeat_edit_lock(
            db,
            lock=lock,
            user_id=current_user.id,
            ttl_minutes=payload.ttl_minutes,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(lock)
    return _serialize_gantt_lock(lock)


@router.post("/{presupuesto_id}/gantt-lock/release", response_model=CronogramaGanttLockResponse)
def release_gantt_edit_lock(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    _require_gantt_editor(current_user)
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = _resolve_work_schedule(db, presupuesto=presupuesto)
    lock = (
        db.query(CronogramaGanttEditLock)
        .filter(CronogramaGanttEditLock.cronograma_id == schedule.id)
        .first()
    )
    if not lock:
        return CronogramaGanttLockResponse(status="none")
    try:
        lock = gantt_workflow_service.release_edit_lock(
            db,
            lock=lock,
            user_id=current_user.id,
        )
    except GanttWorkflowError as exc:
        raise _translate_gantt_workflow_error(exc) from exc
    db.commit()
    db.refresh(lock)
    return _serialize_gantt_lock(lock)


@router.put("/{presupuesto_id}", response_model=CronogramaTrabajoResponse)
def update_cronograma_trabajo(
    presupuesto_id: int,
    payload: CronogramaTrabajoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para editar el cronograma.")
        
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    try:
        schedule = cronograma_trabajo_service.update_schedule(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
            obj_in=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Cronograma de trabajo no encontrado.")

    record_audit_event(
        db,
        module="cronogramas_trabajo",
        event_type="work_schedule_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto",
        entity_id=presupuesto.id,
        message=f"Cronograma de trabajo actualizado para presupuesto {presupuesto.id}",
        payload={"line_count": len(payload.schedule_data or {}), "has_config": bool(payload.config)}
    )
    
    return schedule


@router.put("/{presupuesto_id}/commit-delta", response_model=CronogramaTrabajoDeltaResponse)
def update_cronograma_trabajo_delta(
    presupuesto_id: int,
    payload: CronogramaTrabajoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para editar el cronograma.")

    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    try:
        schedule = cronograma_trabajo_service.update_schedule_delta(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
            obj_in=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    if not schedule:
        raise HTTPException(status_code=404, detail="Cronograma de trabajo no encontrado.")

    record_audit_event(
        db,
        module="cronogramas_trabajo",
        event_type="work_schedule_delta_updated",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto",
        entity_id=presupuesto.id,
        message=f"Delta de cronograma de trabajo actualizado para presupuesto {presupuesto.id}",
        payload={"line_count": len(payload.schedule_data or {}), "response_mode": "delta"},
    )

    return schedule


@router.post(
    "/{presupuesto_id}/reset-integral",
    response_model=CronogramaTrabajoFullResetResponse,
)
def reset_cronograma_integral(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para resetear el cronograma.",
        )

    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)

    cronograma = _get_or_create_cronograma(db, presupuesto)
    cronograma.period_type = "mensual"
    cronograma.distribution_mode = "gantt"
    cronograma.global_distribution = []
    cronograma.line_distribution_overrides = {}
    db.add(cronograma)

    schedule = cronograma_trabajo_service._ensure_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )
    schedule.schedule_data = cronograma_trabajo_service.build_factory_reset_schedule_data(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )
    db.add(schedule)

    proyecto = (
        presupuesto.proyecto
        or db.query(Proyecto)
        .filter(
            Proyecto.id == presupuesto.proyecto_id,
            Proyecto.empresa_id == presupuesto.empresa_id,
        )
        .first()
    )
    if proyecto:
        project_calendar_service.reset_project_calendar(db, proyecto=proyecto)

    db.commit()
    db.refresh(cronograma)
    db.refresh(schedule)

    updated_cronograma = _serialize_cronograma(db, presupuesto, cronograma)
    updated_schedule = cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )

    record_audit_event(
        db,
        module="cronogramas",
        event_type="cronograma_full_reset",
        severity="warning",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto",
        entity_id=presupuesto.id,
        message=f"Reset integral de cronogramas ejecutado para presupuesto {presupuesto.id}",
        payload={
            "period_type": getattr(updated_cronograma, "period_type", None)
            or (updated_cronograma.get("period_type") if isinstance(updated_cronograma, dict) else None),
            "distribution_mode": getattr(updated_cronograma, "distribution_mode", None)
            or (updated_cronograma.get("distribution_mode") if isinstance(updated_cronograma, dict) else None),
            "schedule_rows": len(
                getattr(updated_schedule, "rows", None)
                or (updated_schedule.get("rows") if isinstance(updated_schedule, dict) else [])
                or []
            ),
            "holiday_calendar_reset": bool(proyecto),
        },
    )

    return CronogramaTrabajoFullResetResponse(
        cronograma=updated_cronograma,
        trabajo=updated_schedule,
    )


@router.post(
    "/{presupuesto_id}/merge-interparent-subbars",
    response_model=CronogramaTrabajoInterparentMergeResponse,
)
def merge_cronograma_trabajo_interparent_subbars(
    presupuesto_id: int,
    payload: CronogramaTrabajoInterparentMergeRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para editar el cronograma.")

    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)

    if str(payload.source_parent_initial_id).strip() == str(payload.target_parent_initial_id).strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="La fusión interpadre requiere tramos de distinto origen.")
    if str(payload.source_period_id).strip() == str(payload.target_period_id).strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="La fusión interpadre requiere periodos origen y destino distintos.")
    if float(payload.percent_to_move or 0) <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="El porcentaje a trasladar debe ser mayor que cero.")
    if not payload.merged_subbars:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="La operación requiere subbarras fusionadas para persistir el borrador operativo.")

    cronograma = _get_or_create_cronograma(db, presupuesto)
    serialized = _serialize_cronograma(db, presupuesto, cronograma)
    valuado_row = next((row for row in serialized.rows if int(getattr(row, "linea_id", 0) or 0) == int(payload.linea_id)), None)
    if not valuado_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La línea no existe en el cronograma valorado activo.")

    periods = list(serialized.periods or [])
    source_index = next((index for index, period in enumerate(periods) if str(getattr(period, "id", None) or f"P{index + 1}") == str(payload.source_period_id).strip()), -1)
    target_index = next((index for index, period in enumerate(periods) if str(getattr(period, "id", None) or f"P{index + 1}") == str(payload.target_period_id).strip()), -1)
    if source_index < 0 or target_index < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fue posible localizar los periodos origen/destino en el cronograma valorado.")

    authoritative_initial_segments = cronograma_trabajo_service._derive_initial_valued_segments(
        db,
        presupuesto.id,
        presupuesto.empresa_id,
    ).get(str(payload.linea_id), [])
    authoritative_parent_percent_map = {
        str(segment.get("parent_initial_id") or "").strip(): round(
            max(float(segment.get("percent") or 0.0), 0.0), 4
        )
        for segment in authoritative_initial_segments
        if str(segment.get("parent_initial_id") or "").strip()
    }
    if payload.source_parent_initial_id not in authoritative_parent_percent_map:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El tramo inicial origen ya no coincide con el cronograma valorado vigente.",
        )
    if payload.target_parent_initial_id not in authoritative_parent_percent_map:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El tramo inicial destino ya no coincide con el cronograma valorado vigente.",
        )
    source_available_percent = authoritative_parent_percent_map.get(
        payload.source_parent_initial_id, 0.0
    )
    if float(payload.percent_to_move or 0) > source_available_percent:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El porcentaje a trasladar supera el cupo disponible del tramo inicial origen.",
        )

    next_distribution = [float(value or 0) for value in list(getattr(valuado_row, "distribution", []) or [])]
    next_distribution[source_index] = round(max(0.0, next_distribution[source_index] - float(payload.percent_to_move or 0)), 4)
    next_distribution[target_index] = round(next_distribution[target_index] + float(payload.percent_to_move or 0), 4)
    distribution = _validate_distribution(
        next_distribution,
        len(serialized.periods),
        detail="La distribución resultante de la fusión interpadre no coincide con el número de periodos.",
    )

    expected_parent_percent_map = dict(authoritative_parent_percent_map)
    expected_parent_percent_map[payload.source_parent_initial_id] = round(
        max(
            0.0,
            expected_parent_percent_map.get(payload.source_parent_initial_id, 0.0)
            - float(payload.percent_to_move or 0),
        ),
        4,
    )
    expected_parent_percent_map[payload.target_parent_initial_id] = round(
        expected_parent_percent_map.get(payload.target_parent_initial_id, 0.0)
        + float(payload.percent_to_move or 0),
        4,
    )
    try:
        normalized_merged_subbars = (
            cronograma_trabajo_service.validate_interparent_merge_subbars(
                budget_line_id=str(payload.linea_id),
                merged_subbars=payload.merged_subbars,
                expected_parent_percent_map=expected_parent_percent_map,
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    current_overrides = dict(cronograma.line_distribution_overrides or {})
    current_overrides[str(payload.linea_id)] = distribution
    cronograma.line_distribution_overrides = current_overrides
    db.add(cronograma)
    db.commit()
    db.refresh(cronograma)

    updated_schedule = cronograma_trabajo_service.persist_interparent_merge_schedule_data(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
        linea_id=payload.linea_id,
        merged_subbars=normalized_merged_subbars,
    )
    updated_cronograma = _serialize_cronograma(db, presupuesto, cronograma)

    record_audit_event(
        db,
        module="cronogramas_trabajo",
        event_type="work_schedule_interparent_merge",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto_detalle",
        entity_id=payload.linea_id,
        message=f"Fusión interpadre aplicada sobre línea {payload.linea_id}",
        payload={
            "presupuesto_id": presupuesto.id,
            "linea_id": payload.linea_id,
            "source_parent_initial_id": payload.source_parent_initial_id,
            "target_parent_initial_id": payload.target_parent_initial_id,
            "source_period_id": payload.source_period_id,
            "target_period_id": payload.target_period_id,
            "percent_to_move": payload.percent_to_move,
        },
    )

    return CronogramaTrabajoInterparentMergeResponse(
        cronograma=updated_cronograma,
        trabajo=updated_schedule,
    )


@router.post("/{presupuesto_id}/holiday-calendar/reload", response_model=CronogramaTrabajoResponse)
def reload_cronograma_trabajo_holiday_calendar(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    proyecto_model = (
        presupuesto.proyecto
        or db.query(Proyecto).filter(Proyecto.id == presupuesto.proyecto_id, Proyecto.empresa_id == presupuesto.empresa_id).first()
    )
    if proyecto_model:
        response = cronograma_trabajo_service.get_schedule(db, presupuesto.id, presupuesto.proyecto_id, presupuesto.empresa_id)
        if response.holiday_calendar:
            project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=proyecto_model,
                start_date=response.holiday_calendar.start_date,
                end_date=response.holiday_calendar.end_date,
                force_refresh=True,
            )
    return cronograma_trabajo_service.get_schedule(db, presupuesto.id, presupuesto.proyecto_id, presupuesto.empresa_id)


@router.post("/{presupuesto_id}/holiday-calendar/reset", response_model=CronogramaTrabajoResponse)
def reset_cronograma_trabajo_holiday_calendar(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    proyecto = (
        presupuesto.proyecto
        or db.query(Proyecto).filter(Proyecto.id == presupuesto.proyecto_id, Proyecto.empresa_id == presupuesto.empresa_id).first()
    )
    if proyecto:
        project_calendar_service.reset_project_calendar(db, proyecto=proyecto)
    return cronograma_trabajo_service.get_schedule(db, presupuesto.id, presupuesto.proyecto_id, presupuesto.empresa_id)


@router.post("/{presupuesto_id}/holiday-calendar/manual", response_model=CronogramaTrabajoResponse)
def add_cronograma_trabajo_holiday_manual(
    presupuesto_id: int,
    payload: ProjectHolidayManualAdd,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    proyecto = (
        presupuesto.proyecto
        or db.query(Proyecto).filter(Proyecto.id == presupuesto.proyecto_id, Proyecto.empresa_id == presupuesto.empresa_id).first()
    )
    if proyecto:
        project_calendar_service.add_manual_holiday(
            db,
            proyecto=proyecto,
            holiday_date=payload.date,
            holiday_name=payload.name,
            created_by=current_user.id,
            notes=payload.notes,
        )
    return cronograma_trabajo_service.get_schedule(db, presupuesto.id, presupuesto.proyecto_id, presupuesto.empresa_id)


@router.post("/{presupuesto_id}/holiday-calendar/remove", response_model=CronogramaTrabajoResponse)
def remove_cronograma_trabajo_holiday_day(
    presupuesto_id: int,
    payload: ProjectHolidayRemoveRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    proyecto = (
        presupuesto.proyecto
        or db.query(Proyecto).filter(Proyecto.id == presupuesto.proyecto_id, Proyecto.empresa_id == presupuesto.empresa_id).first()
    )
    if proyecto:
        project_calendar_service.remove_holiday(
            db,
            proyecto=proyecto,
            holiday_date=payload.date,
            holiday_name=payload.name,
            created_by=current_user.id,
        )
    return cronograma_trabajo_service.get_schedule(db, presupuesto.id, presupuesto.proyecto_id, presupuesto.empresa_id)


@router.get("/{presupuesto_id}/pareto", response_model=CronogramaTrabajoParetoResponse)
def read_cronograma_trabajo_pareto(
    presupuesto_id: int,
    view: Literal["cost", "time", "integrated"] = Query("integrated"),
    top: int = Query(20, ge=1, le=50),
    cutoff_percent: Optional[float] = Query(None, ge=1, le=100),
    edt_id: Optional[int] = Query(None),
    critical_only: bool = Query(False),
    start_from: Optional[date] = Query(None),
    end_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    schedule = cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=presupuesto.empresa_id,
    )
    top = top if top in PARETO_TOP_OPTIONS else 20
    price_map = {
        int(linea.id): float(linea.precio_total or 0.0)
        for linea in (presupuesto.detalle or [])
    }
    return _build_cronograma_trabajo_pareto_response(
        presupuesto_id=presupuesto.id,
        rows=schedule.rows,
        price_map=price_map,
        view=view,
        top=top,
        cutoff_percent=cutoff_percent,
        edt_id=edt_id,
        critical_only=critical_only,
        start_from=start_from,
        end_to=end_to,
    )


@router.get("/{presupuesto_id}/export/ms-project")
def export_cronograma_trabajo_ms_project(
    presupuesto_id: int,
    format: Literal["xml", "mpp"] = Query("xml"),
    open_after_export: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    license_service.ensure_commercial_exports_allowed(db, presupuesto.empresa_id)
    export_capabilities = cronograma_trabajo_service.get_export_capabilities()
    if format == "mpp" and not export_capabilities.direct_mpp_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=export_capabilities.direct_export_reason or "La exportación .mpp no está disponible en este entorno.",
        )

    if format == "mpp":
        try:
            file_buffer = cronograma_trabajo_service.export_ms_project_mpp(
                db,
                presupuesto_id=presupuesto.id,
                proyecto_id=presupuesto.proyecto_id,
                empresa_id=presupuesto.empresa_id,
                open_after_export=open_after_export,
            )
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=str(exc),
            ) from exc
        extension = "mpp"
        media_type = "application/vnd.ms-project"
    else:
        file_buffer = cronograma_trabajo_service.export_ms_project_xml(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
        )
        extension = "xml"
        media_type = "application/xml"
    filename = f"Cronograma_Trabajo_Project_{presupuesto.id}.{extension}"
    return StreamingResponse(
        file_buffer,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={urllib.parse.quote(filename)}"},
    )


@router.post("/{presupuesto_id}/import/ms-project", response_model=CronogramaTrabajoResponse)
async def import_cronograma_trabajo_ms_project(
    presupuesto_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    if current_user.rol.lower() not in {"administrador", "superadministrador"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos para importar el cronograma.")

    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    license_service.ensure_commercial_exports_allowed(db, presupuesto.empresa_id)

    filename = file.filename or ""
    if filename and not filename.lower().endswith(".xml"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Solo se admite importación XML de Microsoft Project.")

    payload = await file.read()
    try:
        schedule = cronograma_trabajo_service.import_ms_project_xml(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=presupuesto.empresa_id,
            xml_payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    record_audit_event(
        db,
        module="cronogramas_trabajo",
        event_type="work_schedule_ms_project_imported",
        severity="info",
        actor=current_user,
        target_empresa_id=presupuesto.empresa_id,
        entity_type="presupuesto",
        entity_id=presupuesto.id,
        message=f"Cronograma de trabajo importado desde XML MS Project para presupuesto {presupuesto.id}",
        payload={"filename": filename, "content_type": file.content_type},
    )
    return schedule
