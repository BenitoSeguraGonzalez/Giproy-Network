from datetime import date, datetime
from typing import Literal, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import urllib.parse

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.usuario import Usuario
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.schemas.cronograma_trabajo import (
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
from app.services.project_calendar import project_calendar_service
from app.services.license import license_service
from app.services.audit_event import record_audit_event
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

@router.get("/{presupuesto_id}", response_model=CronogramaTrabajoResponse)
def read_cronograma_trabajo(
    presupuesto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
    empresa_id: Optional[int] = Query(None),
):
    presupuesto = _resolve_budget(db, presupuesto_id, current_user, empresa_id)
    _verify_module_access(db, presupuesto.proyecto_id, current_user.id)
    return cronograma_trabajo_service.get_schedule(
        db, 
        presupuesto_id=presupuesto.id, 
        proyecto_id=presupuesto.proyecto_id, 
        empresa_id=presupuesto.empresa_id
    )

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
