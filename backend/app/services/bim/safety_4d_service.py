import math
from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_equipment import Bim4dEquipmentMotionPlan
from app.models.bim_4d_planning import Bim4dWorkArea
from app.models.bim_4d_safety import Bim4dSafetyInspection, Bim4dSafetyPunchItem, Bim4dSafetyRisk
from app.models.bim_element import BimElement
from app.services.bim.equipment_4d_service import _position


def _risk_response(item):
    return {"id": item.id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "activity_snapshot_id": item.activity_snapshot_id, "element_id": item.bim_element_id, "work_area_id": item.work_area_id, "title": item.title, "hazard_type": item.hazard_type, "severity": item.severity, "likelihood": item.likelihood, "risk_score": item.severity * item.likelihood, "controls": item.controls_json, "zone": item.zone_json, "active_start": item.active_start, "active_finish": item.active_finish, "status": item.status, "created_by": item.created_by, "created_at": item.created_at}


def create_risk(db, *, project_id, company_id, user_id, payload):
    activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id, Bim4dActivitySnapshot.empresa_id == company_id).first()
    if not activity: raise HTTPException(status_code=404, detail="Actividad fuera del proyecto BIM activo.")
    if payload.element_id and not db.query(BimElement).filter(BimElement.id == payload.element_id).first(): raise HTTPException(status_code=404, detail="Elemento BIM no encontrado.")
    if payload.work_area_id and not db.query(Bim4dWorkArea).filter(Bim4dWorkArea.id == payload.work_area_id, Bim4dWorkArea.proyecto_id == project_id, Bim4dWorkArea.empresa_id == company_id).first(): raise HTTPException(status_code=404, detail="Frente BIM no encontrado.")
    item = Bim4dSafetyRisk(empresa_id=company_id, proyecto_id=project_id, activity_snapshot_id=activity.id, bim_element_id=payload.element_id, work_area_id=payload.work_area_id, title=payload.title, hazard_type=payload.hazard_type, severity=payload.severity, likelihood=payload.likelihood, controls_json=payload.controls, zone_json=payload.zone.model_dump(), active_start=payload.active_start, active_finish=payload.active_finish, status="open", created_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _risk_response(item)


def list_risks(db, *, project_id, company_id):
    return [_risk_response(item) for item in db.query(Bim4dSafetyRisk).filter(Bim4dSafetyRisk.proyecto_id == project_id, Bim4dSafetyRisk.empresa_id == company_id).order_by(Bim4dSafetyRisk.created_at.desc()).all()]


def _inspection_response(item):
    return {"id": item.id, "risk_id": item.risk_id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "inspected_at": item.inspected_at, "result": item.result, "note": item.note, "evidence_ref": item.evidence_ref, "checklist": item.checklist_json or [], "inspected_by": item.inspected_by, "created_at": item.created_at}


def _punch_response(item):
    return {"id": item.id, "risk_id": item.risk_id, "inspection_id": item.inspection_id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "title": item.title, "description": item.description, "priority": item.priority, "status": item.status, "due_at": item.due_at, "created_by": item.created_by, "closed_by": item.closed_by, "created_at": item.created_at, "closed_at": item.closed_at}


def list_inspections(db, *, risk_id, project_id, company_id):
    _get_risk(db, risk_id=risk_id, project_id=project_id, company_id=company_id)
    rows = db.query(Bim4dSafetyInspection).filter(Bim4dSafetyInspection.risk_id == risk_id, Bim4dSafetyInspection.proyecto_id == project_id, Bim4dSafetyInspection.empresa_id == company_id).order_by(Bim4dSafetyInspection.inspected_at.desc()).all()
    return [_inspection_response(item) for item in rows]


def add_inspection(db, *, risk_id, project_id, company_id, user_id, payload):
    risk = _get_risk(db, risk_id=risk_id, project_id=project_id, company_id=company_id)
    item = Bim4dSafetyInspection(empresa_id=company_id, proyecto_id=project_id, risk_id=risk.id, inspected_at=payload.inspected_at, result=payload.result, checklist_json=[entry.model_dump() for entry in payload.checklist], note=payload.note, evidence_ref=payload.evidence_ref, inspected_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _inspection_response(item)


def _get_risk(db, *, risk_id, project_id, company_id):
    risk = db.query(Bim4dSafetyRisk).filter(Bim4dSafetyRisk.id == risk_id, Bim4dSafetyRisk.proyecto_id == project_id, Bim4dSafetyRisk.empresa_id == company_id).first()
    if not risk: raise HTTPException(status_code=404, detail="Riesgo fuera del proyecto BIM activo.")
    return risk


def list_punch_items(db, *, risk_id, project_id, company_id):
    _get_risk(db, risk_id=risk_id, project_id=project_id, company_id=company_id)
    rows = db.query(Bim4dSafetyPunchItem).filter(Bim4dSafetyPunchItem.risk_id == risk_id, Bim4dSafetyPunchItem.proyecto_id == project_id, Bim4dSafetyPunchItem.empresa_id == company_id).order_by(Bim4dSafetyPunchItem.created_at.desc()).all()
    return [_punch_response(item) for item in rows]


def create_punch_item(db, *, risk_id, project_id, company_id, user_id, payload):
    _get_risk(db, risk_id=risk_id, project_id=project_id, company_id=company_id)
    inspection = db.query(Bim4dSafetyInspection).filter(Bim4dSafetyInspection.id == payload.inspection_id, Bim4dSafetyInspection.risk_id == risk_id, Bim4dSafetyInspection.proyecto_id == project_id, Bim4dSafetyInspection.empresa_id == company_id).first()
    if not inspection: raise HTTPException(status_code=404, detail="Inspeccion fuera del riesgo BIM activo.")
    if inspection.result == "compliant": raise HTTPException(status_code=409, detail="Una inspeccion conforme no genera punch items.")
    item = Bim4dSafetyPunchItem(empresa_id=company_id, proyecto_id=project_id, risk_id=risk_id, inspection_id=inspection.id, title=payload.title, description=payload.description, priority=payload.priority, status="open", due_at=payload.due_at, created_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _punch_response(item)


def update_punch_item(db, *, punch_id, risk_id, project_id, company_id, user_id, payload):
    item = db.query(Bim4dSafetyPunchItem).filter(Bim4dSafetyPunchItem.id == punch_id, Bim4dSafetyPunchItem.risk_id == risk_id, Bim4dSafetyPunchItem.proyecto_id == project_id, Bim4dSafetyPunchItem.empresa_id == company_id).first()
    if not item: raise HTTPException(status_code=404, detail="Punch item fuera del proyecto BIM activo.")
    if item.status == payload.status: return _punch_response(item)
    allowed = {"open": {"in_progress", "closed"}, "in_progress": {"open", "closed"}, "closed": {"open"}}
    if payload.status not in allowed.get(item.status, set()): raise HTTPException(status_code=409, detail="Transicion de punch item no permitida.")
    item.status = payload.status
    if payload.status == "closed": item.closed_at = datetime.now(timezone.utc); item.closed_by = user_id
    else: item.closed_at = None; item.closed_by = None
    db.commit(); db.refresh(item)
    return _punch_response(item)


def evaluate_exposure(db, *, risk_id, project_id, company_id):
    risk = _get_risk(db, risk_id=risk_id, project_id=project_id, company_id=company_id)
    center = risk.zone_json; results = []
    rows = db.query(Bim4dEquipmentMotionPlan, Bim4dActivitySnapshot).join(Bim4dActivitySnapshot, Bim4dActivitySnapshot.id == Bim4dEquipmentMotionPlan.activity_snapshot_id).filter(Bim4dEquipmentMotionPlan.proyecto_id == project_id, Bim4dEquipmentMotionPlan.empresa_id == company_id).all()
    for motion, activity in rows:
        if activity.planned_finish < risk.active_start or activity.planned_start > risk.active_finish: continue
        distances = []
        duration = motion.path_json[-1]["offset_seconds"]
        for step in range(21):
            point = _position(motion.path_json, duration * step / 20)
            distances.append(math.dist((point["x"], point["y"], point["z"]), (center["x"], center["y"], center["z"])))
        minimum = min(distances); exclusion = center["radius"] + motion.operation_radius
        results.append({"risk_id": risk.id, "motion_plan_id": motion.id, "exposed": minimum <= exclusion, "minimum_distance": minimum, "exclusion_distance": exclusion, "sampled_points": len(distances)})
    return results
