from collections import defaultdict
from datetime import timedelta

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_planning import Bim4dWorkArea
from app.models.bim_4d_resources import Bim4dCrew, Bim4dFieldResourceMovement, Bim4dResource, Bim4dResourceAssignment, Bim4dTimecard


def _resource_dict(resource):
    return {
        "id": resource.id, "project_id": resource.proyecto_id, "company_id": resource.empresa_id,
        "code": resource.code, "name": resource.name, "resource_type": resource.resource_type,
        "unit": resource.unit, "capacity_per_day": resource.capacity_per_day,
        "source_kind": resource.source_kind, "source_ref": resource.source_ref,
        "created_by": resource.created_by, "created_at": resource.created_at,
    }


def _assignment_dict(assignment):
    return {
        "id": assignment.id, "project_id": assignment.proyecto_id, "company_id": assignment.empresa_id,
        "resource_id": assignment.resource_id, "activity_snapshot_id": assignment.activity_snapshot_id,
        "demand_per_day": assignment.demand_per_day, "created_by": assignment.created_by,
        "created_at": assignment.created_at,
    }


def _resource(db, resource_id, project_id, company_id):
    value = db.query(Bim4dResource).filter(Bim4dResource.id == resource_id, Bim4dResource.proyecto_id == project_id, Bim4dResource.empresa_id == company_id).first()
    if not value:
        raise HTTPException(status_code=404, detail="Recurso BIM 4D fuera del proyecto activo.")
    return value


def create_resource(db, *, project_id, company_id, user_id, payload):
    duplicate = db.query(Bim4dResource).filter(Bim4dResource.proyecto_id == project_id, Bim4dResource.empresa_id == company_id, Bim4dResource.code == payload.code).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El codigo de recurso BIM 4D ya existe.")
    value = Bim4dResource(empresa_id=company_id, proyecto_id=project_id, created_by=user_id, **payload.model_dump())
    db.add(value); db.commit(); db.refresh(value)
    return _resource_dict(value)


def list_resources(db, *, project_id, company_id):
    values = db.query(Bim4dResource).filter(Bim4dResource.proyecto_id == project_id, Bim4dResource.empresa_id == company_id).order_by(Bim4dResource.code).all()
    return [_resource_dict(value) for value in values]


def create_assignment(db, *, project_id, company_id, user_id, payload):
    _resource(db, payload.resource_id, project_id, company_id)
    activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id, Bim4dActivitySnapshot.empresa_id == company_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad BIM 4D fuera del proyecto activo.")
    duplicate = db.query(Bim4dResourceAssignment).filter(Bim4dResourceAssignment.resource_id == payload.resource_id, Bim4dResourceAssignment.activity_snapshot_id == payload.activity_snapshot_id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El recurso ya esta asignado a la actividad.")
    value = Bim4dResourceAssignment(empresa_id=company_id, proyecto_id=project_id, created_by=user_id, **payload.model_dump())
    db.add(value); db.commit(); db.refresh(value)
    return _assignment_dict(value)


def build_histogram(db, *, resource_id, project_id, company_id):
    resource = _resource(db, resource_id, project_id, company_id)
    rows = db.query(Bim4dResourceAssignment, Bim4dActivitySnapshot).join(Bim4dActivitySnapshot, Bim4dActivitySnapshot.id == Bim4dResourceAssignment.activity_snapshot_id).filter(Bim4dResourceAssignment.resource_id == resource_id, Bim4dResourceAssignment.proyecto_id == project_id, Bim4dResourceAssignment.empresa_id == company_id).all()
    demand = defaultdict(float)
    for assignment, activity in rows:
        current, finish = activity.planned_start.date(), activity.planned_finish.date()
        while current <= finish:
            demand[current] += assignment.demand_per_day
            current += timedelta(days=1)
    points = []
    for day in sorted(demand):
        daily = round(demand[day], 4); capacity = resource.capacity_per_day
        points.append({"date": day, "demand": daily, "capacity": capacity, "utilization_percent": round(daily / capacity * 100, 2), "overloaded": daily > capacity})
    return {"project_id": project_id, "company_id": company_id, "resource": _resource_dict(resource), "range_start": points[0]["date"] if points else None, "range_finish": points[-1]["date"] if points else None, "overloaded_days": sum(point["overloaded"] for point in points), "peak_demand": max((point["demand"] for point in points), default=0), "points": points}


def _movement_delta(movement_type, quantity):
    return quantity if movement_type in {"receipt", "return"} else -quantity


def _movement_dict(movement, balance_after):
    return {
        "id": movement.id, "project_id": movement.proyecto_id, "company_id": movement.empresa_id,
        "resource_id": movement.resource_id, "activity_snapshot_id": movement.activity_snapshot_id,
        "work_area_id": movement.work_area_id, "movement_type": movement.movement_type,
        "quantity": movement.quantity, "occurred_at": movement.occurred_at,
        "reference": movement.reference, "note": movement.note, "balance_after": round(balance_after, 4),
        "created_by": movement.created_by, "created_at": movement.created_at,
    }


def list_field_resource_movements(db, *, project_id, company_id, resource_id=None):
    query = db.query(Bim4dFieldResourceMovement).filter(
        Bim4dFieldResourceMovement.proyecto_id == project_id,
        Bim4dFieldResourceMovement.empresa_id == company_id,
    )
    if resource_id is not None:
        _resource(db, resource_id, project_id, company_id)
        query = query.filter(Bim4dFieldResourceMovement.resource_id == resource_id)
    values = query.order_by(Bim4dFieldResourceMovement.occurred_at, Bim4dFieldResourceMovement.id).all()
    balances = defaultdict(float)
    result = []
    for value in values:
        balances[value.resource_id] += _movement_delta(value.movement_type, value.quantity)
        result.append(_movement_dict(value, balances[value.resource_id]))
    return result


def create_field_resource_movement(db, *, project_id, company_id, user_id, payload):
    resource = db.query(Bim4dResource).filter(
        Bim4dResource.id == payload.resource_id,
        Bim4dResource.proyecto_id == project_id,
        Bim4dResource.empresa_id == company_id,
    ).with_for_update().first()
    if not resource:
        raise HTTPException(status_code=404, detail="Recurso BIM fuera del proyecto activo.")
    if resource.resource_type not in {"material", "equipment"}:
        raise HTTPException(status_code=422, detail="Campo solo admite movimientos de materiales y equipos.")
    if payload.activity_snapshot_id is not None:
        activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id, Bim4dActivitySnapshot.empresa_id == company_id).first()
        if not activity:
            raise HTTPException(status_code=404, detail="Actividad BIM 4D fuera del proyecto activo.")
    if payload.work_area_id is not None:
        area = db.query(Bim4dWorkArea).filter(Bim4dWorkArea.id == payload.work_area_id, Bim4dWorkArea.proyecto_id == project_id, Bim4dWorkArea.empresa_id == company_id).first()
        if not area:
            raise HTTPException(status_code=404, detail="Frente BIM fuera del proyecto activo.")
    existing = list_field_resource_movements(db, project_id=project_id, company_id=company_id, resource_id=resource.id)
    balance = existing[-1]["balance_after"] if existing else 0
    next_balance = balance + _movement_delta(payload.movement_type, payload.quantity)
    if next_balance < -0.0001:
        raise HTTPException(status_code=409, detail="El movimiento dejaría saldo BIM negativo.")
    movement = Bim4dFieldResourceMovement(empresa_id=company_id, proyecto_id=project_id, created_by=user_id, **payload.model_dump())
    db.add(movement); db.commit(); db.refresh(movement)
    return _movement_dict(movement, next_balance)


def _crew_dict(crew):
    return {
        "id": crew.id, "project_id": crew.proyecto_id, "company_id": crew.empresa_id,
        "code": crew.code, "name": crew.name, "trade": crew.trade,
        "member_count": crew.member_count, "active": crew.active, "note": crew.note,
        "created_by": crew.created_by, "created_at": crew.created_at,
    }


def _crew(db, crew_id, project_id, company_id):
    value = db.query(Bim4dCrew).filter(
        Bim4dCrew.id == crew_id,
        Bim4dCrew.proyecto_id == project_id,
        Bim4dCrew.empresa_id == company_id,
    ).first()
    if not value:
        raise HTTPException(status_code=404, detail="Cuadrilla BIM fuera del proyecto activo.")
    return value


def create_crew(db, *, project_id, company_id, user_id, payload):
    duplicate = db.query(Bim4dCrew).filter(
        Bim4dCrew.proyecto_id == project_id,
        Bim4dCrew.empresa_id == company_id,
        Bim4dCrew.code == payload.code,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El codigo de cuadrilla BIM ya existe.")
    value = Bim4dCrew(
        empresa_id=company_id, proyecto_id=project_id, created_by=user_id,
        **payload.model_dump(),
    )
    db.add(value); db.commit(); db.refresh(value)
    return _crew_dict(value)


def list_crews(db, *, project_id, company_id, active_only=False):
    query = db.query(Bim4dCrew).filter(
        Bim4dCrew.proyecto_id == project_id,
        Bim4dCrew.empresa_id == company_id,
    )
    if active_only:
        query = query.filter(Bim4dCrew.active.is_(True))
    return [_crew_dict(value) for value in query.order_by(Bim4dCrew.code).all()]


def _timecard_dict(timecard, crew):
    return {
        "id": timecard.id, "project_id": timecard.proyecto_id,
        "company_id": timecard.empresa_id, "crew_id": timecard.crew_id,
        "crew_code": crew.code, "crew_name": crew.name,
        "activity_snapshot_id": timecard.activity_snapshot_id,
        "work_area_id": timecard.work_area_id, "work_date": timecard.work_date,
        "regular_hours": timecard.regular_hours, "overtime_hours": timecard.overtime_hours,
        "total_hours": round(timecard.regular_hours + timecard.overtime_hours, 2),
        "installed_quantity": timecard.installed_quantity,
        "installed_unit": timecard.installed_unit, "note": timecard.note,
        "created_by": timecard.created_by, "created_at": timecard.created_at,
    }


def create_timecard(db, *, project_id, company_id, user_id, payload):
    crew = _crew(db, payload.crew_id, project_id, company_id)
    if not crew.active:
        raise HTTPException(status_code=409, detail="La cuadrilla BIM esta inactiva.")
    activity = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id == payload.activity_snapshot_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad BIM 4D fuera del proyecto activo.")
    if payload.work_area_id is not None:
        area = db.query(Bim4dWorkArea).filter(
            Bim4dWorkArea.id == payload.work_area_id,
            Bim4dWorkArea.proyecto_id == project_id,
            Bim4dWorkArea.empresa_id == company_id,
        ).first()
        if not area:
            raise HTTPException(status_code=404, detail="Frente BIM fuera del proyecto activo.")
    duplicate = db.query(Bim4dTimecard).filter(
        Bim4dTimecard.crew_id == payload.crew_id,
        Bim4dTimecard.activity_snapshot_id == payload.activity_snapshot_id,
        Bim4dTimecard.work_date == payload.work_date,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Ya existe un parte para la cuadrilla, actividad y fecha.")
    value = Bim4dTimecard(
        empresa_id=company_id, proyecto_id=project_id, created_by=user_id,
        **payload.model_dump(),
    )
    db.add(value); db.commit(); db.refresh(value)
    return _timecard_dict(value, crew)


def list_timecards(db, *, project_id, company_id, crew_id=None):
    query = db.query(Bim4dTimecard, Bim4dCrew).join(
        Bim4dCrew, Bim4dCrew.id == Bim4dTimecard.crew_id,
    ).filter(
        Bim4dTimecard.proyecto_id == project_id,
        Bim4dTimecard.empresa_id == company_id,
    )
    if crew_id is not None:
        _crew(db, crew_id, project_id, company_id)
        query = query.filter(Bim4dTimecard.crew_id == crew_id)
    values = query.order_by(Bim4dTimecard.work_date.desc(), Bim4dTimecard.id.desc()).all()
    return [_timecard_dict(timecard, crew) for timecard, crew in values]
