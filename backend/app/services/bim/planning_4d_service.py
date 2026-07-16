from datetime import timedelta

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dBaseline, Bim4dBaselineActivity, Bim4dDependencySnapshot
from app.models.bim_4d_planning import Bim4dConstructibleComponent, Bim4dScenario, Bim4dWorkArea
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion


def _serialize_area(db, area):
    count = db.query(Bim4dConstructibleComponent).filter(Bim4dConstructibleComponent.work_area_id == area.id).count()
    return {
        "id": area.id, "project_id": area.proyecto_id, "company_id": area.empresa_id,
        "code": area.code, "name": area.name, "description": area.description,
        "component_count": count, "created_by": area.created_by, "created_at": area.created_at,
    }


def create_work_area(db, *, project_id, company_id, user_id, payload):
    duplicate = db.query(Bim4dWorkArea).filter(
        Bim4dWorkArea.proyecto_id == project_id,
        Bim4dWorkArea.empresa_id == company_id,
        Bim4dWorkArea.code == payload.code,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El codigo de frente BIM ya existe.")
    area = Bim4dWorkArea(proyecto_id=project_id, empresa_id=company_id, created_by=user_id, **payload.model_dump())
    db.add(area); db.commit(); db.refresh(area)
    return _serialize_area(db, area)


def list_work_areas(db, *, project_id, company_id):
    areas = db.query(Bim4dWorkArea).filter(
        Bim4dWorkArea.proyecto_id == project_id,
        Bim4dWorkArea.empresa_id == company_id,
    ).order_by(Bim4dWorkArea.code).all()
    return [_serialize_area(db, area) for area in areas]


def _serialize_component(db, component):
    elements = db.query(BimElement).filter(BimElement.id.in_(component.element_ids_json or [])).all()
    return {
        "id": component.id, "project_id": component.proyecto_id, "company_id": component.empresa_id,
        "work_area_id": component.work_area_id, "version_id": component.bim_model_version_id,
        "code": component.code, "name": component.name,
        "element_ids": component.element_ids_json or [],
        "activity_snapshot_ids": component.activity_snapshot_ids_json or [],
        "global_ids": [element.global_id for element in elements],
        "created_by": component.created_by, "created_at": component.created_at,
    }


def create_constructible_component(db, *, project_id, company_id, user_id, payload):
    area = db.query(Bim4dWorkArea).filter(
        Bim4dWorkArea.id == payload.work_area_id,
        Bim4dWorkArea.proyecto_id == project_id,
        Bim4dWorkArea.empresa_id == company_id,
    ).first()
    if not area:
        raise HTTPException(status_code=404, detail="Frente BIM fuera del proyecto activo.")
    version = db.query(BimModelVersion).join(BimModel).filter(
        BimModelVersion.id == payload.version_id,
        BimModel.proyecto_id == project_id,
        BimModel.empresa_id == company_id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version BIM fuera del proyecto activo.")
    element_ids = list(dict.fromkeys(payload.element_ids))
    element_count = db.query(BimElement).filter(
        BimElement.id.in_(element_ids), BimElement.bim_model_version_id == version.id,
    ).count()
    if element_count != len(element_ids):
        raise HTTPException(status_code=404, detail="El componente contiene elementos fuera de la version BIM.")
    activity_ids = list(dict.fromkeys(payload.activity_snapshot_ids))
    activity_count = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id.in_(activity_ids),
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).count()
    if activity_count != len(activity_ids):
        raise HTTPException(status_code=404, detail="El componente contiene actividades fuera del proyecto.")
    component = Bim4dConstructibleComponent(
        empresa_id=company_id, proyecto_id=project_id, work_area_id=area.id,
        bim_model_version_id=version.id, code=payload.code, name=payload.name,
        element_ids_json=element_ids, activity_snapshot_ids_json=activity_ids, created_by=user_id,
    )
    db.add(component); db.commit(); db.refresh(component)
    return _serialize_component(db, component)


def list_constructible_components(db, *, project_id, company_id, work_area_id=None):
    query = db.query(Bim4dConstructibleComponent).filter(
        Bim4dConstructibleComponent.proyecto_id == project_id,
        Bim4dConstructibleComponent.empresa_id == company_id,
    )
    if work_area_id:
        query = query.filter(Bim4dConstructibleComponent.work_area_id == work_area_id)
    return [_serialize_component(db, item) for item in query.order_by(Bim4dConstructibleComponent.code).all()]


def _dependency_satisfied(dependency, dates):
    predecessor = dates[dependency.predecessor_activity_id]
    successor = dates[dependency.successor_activity_id]
    lag = timedelta(days=dependency.lag_days)
    checks = {
        "FS": successor[0] >= predecessor[1] + lag,
        "SS": successor[0] >= predecessor[0] + lag,
        "FF": successor[1] >= predecessor[1] + lag,
        "SF": successor[1] >= predecessor[0] + lag,
    }
    return checks[dependency.dependency_type]


def create_scenario(db, *, project_id, company_id, user_id, payload):
    baseline = db.query(Bim4dBaseline).filter(
        Bim4dBaseline.id == payload.baseline_id,
        Bim4dBaseline.proyecto_id == project_id,
        Bim4dBaseline.empresa_id == company_id,
    ).first()
    if not baseline:
        raise HTTPException(status_code=404, detail="Linea base fuera del proyecto activo.")
    baseline_ids = {item.activity_snapshot_id for item in db.query(Bim4dBaselineActivity).filter(Bim4dBaselineActivity.baseline_id == baseline.id).all()}
    if any(shift.activity_snapshot_id not in baseline_ids for shift in payload.shifts):
        raise HTTPException(status_code=400, detail="El escenario desplaza actividades fuera de la linea base.")
    duplicate = db.query(Bim4dScenario).filter(
        Bim4dScenario.empresa_id == company_id,
        Bim4dScenario.proyecto_id == project_id,
        Bim4dScenario.revision == payload.revision,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La revision de escenario ya existe.")
    activities = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id.in_(baseline_ids)).all()
    offsets = {shift.activity_snapshot_id: shift.offset_days for shift in payload.shifts}
    original_dates = {activity.id: (activity.planned_start, activity.planned_finish) for activity in activities}
    scenario_dates = {
        activity.id: (
            activity.planned_start + timedelta(days=offsets.get(activity.id, 0)),
            activity.planned_finish + timedelta(days=offsets.get(activity.id, 0)),
        )
        for activity in activities
    }
    dependencies = db.query(Bim4dDependencySnapshot).filter(Bim4dDependencySnapshot.baseline_id == baseline.id).all()
    original_start, original_finish = min(value[0] for value in original_dates.values()), max(value[1] for value in original_dates.values())
    scenario_start, scenario_finish = min(value[0] for value in scenario_dates.values()), max(value[1] for value in scenario_dates.values())
    original_span = (original_finish - original_start).total_seconds() / 86400
    scenario_span = (scenario_finish - scenario_start).total_seconds() / 86400
    metrics = {
        "original_span_days": round(original_span, 2),
        "scenario_span_days": round(scenario_span, 2),
        "duration_delta_days": round(scenario_span - original_span, 2),
        "dependency_violations": sum(1 for dependency in dependencies if not _dependency_satisfied(dependency, scenario_dates)),
        "shifted_activities": len(offsets),
        "earliest_start": scenario_start.isoformat(),
        "latest_finish": scenario_finish.isoformat(),
    }
    scenario = Bim4dScenario(
        empresa_id=company_id, proyecto_id=project_id, baseline_id=baseline.id,
        name=payload.name, revision=payload.revision,
        shifts_json=[shift.model_dump() for shift in payload.shifts], metrics_json=metrics,
        created_by=user_id,
    )
    db.add(scenario); db.commit(); db.refresh(scenario)
    return serialize_scenario(scenario)


def serialize_scenario(scenario):
    return {
        "id": scenario.id, "project_id": scenario.proyecto_id, "company_id": scenario.empresa_id,
        "baseline_id": scenario.baseline_id, "name": scenario.name, "revision": scenario.revision,
        "shifts": scenario.shifts_json or [], "metrics": scenario.metrics_json or {},
        "created_by": scenario.created_by, "created_at": scenario.created_at,
    }


def list_scenarios(db, *, project_id, company_id):
    scenarios = db.query(Bim4dScenario).filter(
        Bim4dScenario.proyecto_id == project_id,
        Bim4dScenario.empresa_id == company_id,
    ).order_by(Bim4dScenario.created_at.desc(), Bim4dScenario.id.desc()).all()
    return [serialize_scenario(scenario) for scenario in scenarios]


def analyze_space_time_conflicts(db, *, project_id, company_id):
    components = db.query(Bim4dConstructibleComponent).filter(Bim4dConstructibleComponent.proyecto_id == project_id, Bim4dConstructibleComponent.empresa_id == company_id).all()
    activity_ids = {activity_id for component in components for activity_id in (component.activity_snapshot_ids_json or [])}
    activities = {activity.id: activity for activity in db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id.in_(activity_ids)).all()} if activity_ids else {}
    scope = {}
    for component in components:
        for activity_id in component.activity_snapshot_ids_json or []:
            item = scope.setdefault(activity_id, {"areas": set(), "components": set(), "elements": set()})
            item["areas"].add(component.work_area_id); item["components"].add(component.id); item["elements"].update(component.element_ids_json or [])
    conflicts = []
    ordered_ids = sorted(activities)
    for index, first_id in enumerate(ordered_ids):
        for second_id in ordered_ids[index + 1:]:
            first, second = activities[first_id], activities[second_id]
            overlap_start, overlap_finish = max(first.planned_start, second.planned_start), min(first.planned_finish, second.planned_finish)
            if overlap_finish < overlap_start:
                continue
            shared_elements = scope[first_id]["elements"] & scope[second_id]["elements"]
            shared_components = scope[first_id]["components"] & scope[second_id]["components"]
            shared_areas = scope[first_id]["areas"] & scope[second_id]["areas"]
            if not (shared_elements or shared_components or shared_areas):
                continue
            severity = "critical" if shared_elements else "high" if shared_components else "medium"
            reason = "element_geometry" if shared_elements else "constructible_component" if shared_components else "work_area"
            element_ids = sorted(shared_elements or (scope[first_id]["elements"] | scope[second_id]["elements"]))
            elements = db.query(BimElement).filter(BimElement.id.in_(element_ids)).all() if element_ids else []
            conflicts.append({"conflict_key": f"{first_id}:{second_id}:{reason}", "severity": severity, "reason": reason, "activity_ids": [first_id, second_id], "activity_codes": [first.activity_code, second.activity_code], "work_area_ids": sorted(shared_areas), "component_ids": sorted(shared_components), "element_ids": element_ids, "global_ids": sorted({element.global_id for element in elements}), "overlap_start": overlap_start, "overlap_finish": overlap_finish})
    counts = {level: sum(item["severity"] == level for item in conflicts) for level in ("critical", "high", "medium")}
    counts["total"] = len(conflicts)
    return {"project_id": project_id, "company_id": company_id, "counts": counts, "conflicts": conflicts}
