from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dBaseline, Bim4dBaselineActivity, Bim4dDependencySnapshot
from app.models.bim_4d_leveling import Bim4dResourceLevelingScenario
from app.models.bim_4d_resources import Bim4dResource, Bim4dResourceAssignment
from app.models.proyecto import Proyecto


def _iso(value):
    return value.isoformat() if value else None


def _checksum(payload):
    value = json.dumps(payload, ensure_ascii=True, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _serialize(value):
    return {
        "id": value.id,
        "project_id": value.proyecto_id,
        "company_id": value.empresa_id,
        "baseline_id": value.baseline_id,
        "project_revision": value.project_revision,
        "revision": value.revision,
        "inputs": dict(value.input_json or {}),
        "result": dict(value.result_json or {}),
        "checksum_sha256": value.checksum_sha256,
        "status": value.status,
        "decision_reason": value.decision_reason,
        "lock_version": value.lock_version,
        "created_by": value.created_by,
        "decided_by": value.decided_by,
        "created_at": value.created_at,
        "decided_at": value.decided_at,
    }


def _days(start, finish):
    day = start.date()
    while day <= finish.date():
        yield day
        day += timedelta(days=1)


def _dependency_start(dependency, predecessor, duration):
    lag = timedelta(days=float(dependency.lag_days or 0))
    if dependency.dependency_type == "FS":
        return predecessor["finish"] + lag
    if dependency.dependency_type == "SS":
        return predecessor["start"] + lag
    if dependency.dependency_type == "FF":
        return predecessor["finish"] + lag - duration
    if dependency.dependency_type == "SF":
        return predecessor["start"] + lag - duration
    raise HTTPException(status_code=409, detail=f"Dependencia 4D no soportada: {dependency.dependency_type}")


def create_leveling_scenario(db, *, project_id, company_id, user_id, payload):
    project = db.query(Proyecto).filter(
        Proyecto.id == project_id,
        Proyecto.empresa_id == company_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Revision de proyecto fuera de la empresa activa.")
    baseline = db.query(Bim4dBaseline).filter(
        Bim4dBaseline.id == payload.baseline_id,
        Bim4dBaseline.proyecto_id == project_id,
        Bim4dBaseline.empresa_id == company_id,
    ).first()
    if not baseline:
        raise HTTPException(status_code=404, detail="Linea base BIM 4D fuera del proyecto activo.")
    duplicate = db.query(Bim4dResourceLevelingScenario.id).filter(
        Bim4dResourceLevelingScenario.empresa_id == company_id,
        Bim4dResourceLevelingScenario.proyecto_id == project_id,
        Bim4dResourceLevelingScenario.baseline_id == baseline.id,
        Bim4dResourceLevelingScenario.revision == payload.revision,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La revision de nivelacion BIM ya existe.")

    links = db.query(Bim4dBaselineActivity).filter(Bim4dBaselineActivity.baseline_id == baseline.id).all()
    activity_ids = [item.activity_snapshot_id for item in links]
    activities = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id.in_(activity_ids)).all()
    by_id = {item.id: item for item in activities}
    if len(by_id) != len(activity_ids) or not activities:
        raise HTTPException(status_code=409, detail="La linea base BIM no contiene actividades nivelables.")

    resources_query = db.query(Bim4dResource).filter(
        Bim4dResource.proyecto_id == project_id,
        Bim4dResource.empresa_id == company_id,
    )
    if payload.resource_ids:
        resources_query = resources_query.filter(Bim4dResource.id.in_(set(payload.resource_ids)))
    resources = resources_query.all()
    if payload.resource_ids and len(resources) != len(set(payload.resource_ids)):
        raise HTTPException(status_code=404, detail="La nivelacion contiene recursos fuera del proyecto activo.")
    resources_by_id = {item.id: item for item in resources}
    if not resources:
        raise HTTPException(status_code=409, detail="La linea base no tiene recursos seleccionados para nivelar.")

    assignment_rows = db.query(Bim4dResourceAssignment).filter(
        Bim4dResourceAssignment.proyecto_id == project_id,
        Bim4dResourceAssignment.empresa_id == company_id,
        Bim4dResourceAssignment.activity_snapshot_id.in_(activity_ids),
        Bim4dResourceAssignment.resource_id.in_(resources_by_id),
    ).all()
    assignments = defaultdict(list)
    for item in assignment_rows:
        resource = resources_by_id[item.resource_id]
        if item.demand_per_day > resource.capacity_per_day:
            raise HTTPException(status_code=409, detail=f"{resource.code}: demanda individual supera capacidad diaria.")
        assignments[item.activity_snapshot_id].append(item)
    if not assignment_rows:
        raise HTTPException(status_code=409, detail="No existen asignaciones de recurso para la linea base.")

    dependencies = db.query(Bim4dDependencySnapshot).filter(Bim4dDependencySnapshot.baseline_id == baseline.id).all()
    incoming = defaultdict(list)
    successors = defaultdict(list)
    indegree = {activity_id: 0 for activity_id in activity_ids}
    for item in dependencies:
        if item.predecessor_activity_id not in indegree or item.successor_activity_id not in indegree:
            raise HTTPException(status_code=409, detail="Dependencia fuera de la linea base BIM.")
        incoming[item.successor_activity_id].append(item)
        successors[item.predecessor_activity_id].append(item.successor_activity_id)
        indegree[item.successor_activity_id] += 1
    queue = sorted((item for item in activity_ids if indegree[item] == 0), key=lambda item: (by_id[item].planned_start, by_id[item].activity_code, item))
    order = []
    while queue:
        activity_id = queue.pop(0)
        order.append(activity_id)
        for successor_id in successors[activity_id]:
            indegree[successor_id] -= 1
            if indegree[successor_id] == 0:
                queue.append(successor_id)
                queue.sort(key=lambda item: (by_id[item].planned_start, by_id[item].activity_code, item))
    if len(order) != len(activity_ids):
        raise HTTPException(status_code=409, detail="La linea base contiene un ciclo de dependencias.")

    before_demand = defaultdict(float)
    for assignment in assignment_rows:
        activity = by_id[assignment.activity_snapshot_id]
        for day in _days(activity.planned_start, activity.planned_finish):
            before_demand[(assignment.resource_id, day)] += assignment.demand_per_day
    before_overload = sum(
        demand > resources_by_id[resource_id].capacity_per_day
        for (resource_id, _day), demand in before_demand.items()
    )

    occupancy = defaultdict(float)
    scheduled = {}
    result_rows = []
    for activity_id in order:
        activity = by_id[activity_id]
        duration = activity.planned_finish - activity.planned_start
        candidate = activity.planned_start
        for dependency in incoming[activity_id]:
            candidate = max(candidate, _dependency_start(dependency, scheduled[dependency.predecessor_activity_id], duration))
        while True:
            finish = candidate + duration
            conflict = any(
                occupancy[(assignment.resource_id, day)] + assignment.demand_per_day > resources_by_id[assignment.resource_id].capacity_per_day
                for assignment in assignments[activity_id]
                for day in _days(candidate, finish)
            )
            if not conflict:
                break
            candidate += timedelta(days=1)
            shift = (candidate - activity.planned_start).total_seconds() / 86400
            if shift > payload.max_shift_days:
                raise HTTPException(status_code=409, detail=f"{activity.activity_code}: excede el desplazamiento maximo permitido.")
        finish = candidate + duration
        for assignment in assignments[activity_id]:
            for day in _days(candidate, finish):
                occupancy[(assignment.resource_id, day)] += assignment.demand_per_day
        scheduled[activity_id] = {"start": candidate, "finish": finish}
        result_rows.append({
            "activity_snapshot_id": activity.id,
            "activity_code": activity.activity_code,
            "original_start": _iso(activity.planned_start),
            "original_finish": _iso(activity.planned_finish),
            "leveled_start": _iso(candidate),
            "leveled_finish": _iso(finish),
            "shift_days": round((candidate - activity.planned_start).total_seconds() / 86400, 4),
            "resource_ids": sorted(item.resource_id for item in assignments[activity_id]),
        })
    result = {
        "methodology": "deterministic_cpm_daily_capacity_v1",
        "source_immutable": True,
        "before_overloaded_resource_days": before_overload,
        "after_overloaded_resource_days": 0,
        "shifted_activities": sum(item["shift_days"] > 0 for item in result_rows),
        "max_shift_days": max((item["shift_days"] for item in result_rows), default=0),
        "activities": result_rows,
    }
    inputs = {
        "baseline_id": baseline.id,
        "project_id": project.id,
        "project_revision": int(project.revision or 0),
        "project_root_code": project.codigo_root or project.codigo,
        "resource_ids": sorted(resources_by_id),
        "max_shift_days": payload.max_shift_days,
        "source_activity_ids": sorted(activity_ids),
    }
    scenario = Bim4dResourceLevelingScenario(
        empresa_id=company_id,
        proyecto_id=project_id,
        baseline_id=baseline.id,
        project_revision=int(project.revision or 0),
        revision=payload.revision,
        input_json=inputs,
        result_json=result,
        checksum_sha256=_checksum({"inputs": inputs, "result": result}),
        created_by=user_id,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return _serialize(scenario)


def list_leveling_scenarios(db, *, project_id, company_id, baseline_id=None):
    query = db.query(Bim4dResourceLevelingScenario).filter(
        Bim4dResourceLevelingScenario.proyecto_id == project_id,
        Bim4dResourceLevelingScenario.empresa_id == company_id,
    )
    if baseline_id:
        query = query.filter(Bim4dResourceLevelingScenario.baseline_id == baseline_id)
    return [_serialize(item) for item in query.order_by(Bim4dResourceLevelingScenario.created_at.desc(), Bim4dResourceLevelingScenario.id.desc()).all()]


def decide_leveling_scenario(db, *, scenario_id, project_id, company_id, user_id, decision, reason, expected_lock_version):
    scenario = db.query(Bim4dResourceLevelingScenario).filter(
        Bim4dResourceLevelingScenario.id == scenario_id,
        Bim4dResourceLevelingScenario.proyecto_id == project_id,
        Bim4dResourceLevelingScenario.empresa_id == company_id,
    ).with_for_update().first()
    if not scenario or scenario.status != "proposed":
        raise HTTPException(status_code=404, detail="Escenario de nivelacion propuesto no encontrado.")
    if scenario.lock_version != expected_lock_version:
        raise HTTPException(status_code=409, detail="El escenario cambio; recargue antes de decidir.")
    if decision == "approved":
        active = db.query(Bim4dResourceLevelingScenario).filter(
            Bim4dResourceLevelingScenario.empresa_id == company_id,
            Bim4dResourceLevelingScenario.proyecto_id == project_id,
            Bim4dResourceLevelingScenario.baseline_id == scenario.baseline_id,
            Bim4dResourceLevelingScenario.status == "approved",
        ).with_for_update().all()
        for item in active:
            item.status = "superseded"
            item.lock_version += 1
    scenario.status = decision
    scenario.decision_reason = reason.strip()
    scenario.decided_by = user_id
    scenario.decided_at = datetime.now(timezone.utc)
    scenario.lock_version += 1
    db.commit()
    db.refresh(scenario)
    return _serialize(scenario)
