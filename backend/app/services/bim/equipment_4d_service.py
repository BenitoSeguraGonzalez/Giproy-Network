import math

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_equipment import Bim4dEquipment, Bim4dEquipmentMotionPlan


def _equipment_response(item):
    return {"id": item.id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "code": item.code, "name": item.name, "equipment_type": item.equipment_type, "dimensions": item.dimensions_json, "created_by": item.created_by, "created_at": item.created_at}


def _motion_response(item):
    return {"id": item.id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "equipment_id": item.equipment_id, "activity_snapshot_id": item.activity_snapshot_id, "revision": item.revision, "path": item.path_json, "operation_radius": item.operation_radius, "temporary_geometry": item.temporary_geometry_json["kind"], "duration_seconds": item.path_json[-1]["offset_seconds"], "created_by": item.created_by, "created_at": item.created_at}


def create_equipment(db, *, project_id, company_id, user_id, payload):
    if db.query(Bim4dEquipment).filter(Bim4dEquipment.proyecto_id == project_id, Bim4dEquipment.empresa_id == company_id, Bim4dEquipment.code == payload.code).first():
        raise HTTPException(status_code=409, detail="El codigo de equipo BIM 4D ya existe.")
    item = Bim4dEquipment(empresa_id=company_id, proyecto_id=project_id, code=payload.code, name=payload.name, equipment_type=payload.equipment_type, dimensions_json=payload.dimensions.model_dump(), created_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _equipment_response(item)


def list_equipment(db, *, project_id, company_id):
    return [_equipment_response(item) for item in db.query(Bim4dEquipment).filter(Bim4dEquipment.proyecto_id == project_id, Bim4dEquipment.empresa_id == company_id).order_by(Bim4dEquipment.code).all()]


def create_motion_plan(db, *, project_id, company_id, user_id, payload):
    equipment = db.query(Bim4dEquipment).filter(Bim4dEquipment.id == payload.equipment_id, Bim4dEquipment.proyecto_id == project_id, Bim4dEquipment.empresa_id == company_id).first()
    activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id, Bim4dActivitySnapshot.empresa_id == company_id).first()
    if not equipment or not activity:
        raise HTTPException(status_code=404, detail="Equipo o actividad fuera del proyecto BIM activo.")
    if db.query(Bim4dEquipmentMotionPlan).filter(Bim4dEquipmentMotionPlan.equipment_id == equipment.id, Bim4dEquipmentMotionPlan.revision == payload.revision).first():
        raise HTTPException(status_code=409, detail="La revision de trayectoria ya existe.")
    item = Bim4dEquipmentMotionPlan(empresa_id=company_id, proyecto_id=project_id, equipment_id=equipment.id, activity_snapshot_id=activity.id, revision=payload.revision, path_json=[point.model_dump() for point in payload.path], operation_radius=payload.operation_radius, temporary_geometry_json={"kind": payload.temporary_geometry, "dimensions": equipment.dimensions_json}, created_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _motion_response(item)


def list_motion_plans(db, *, project_id, company_id):
    return [_motion_response(item) for item in db.query(Bim4dEquipmentMotionPlan).filter(Bim4dEquipmentMotionPlan.proyecto_id == project_id, Bim4dEquipmentMotionPlan.empresa_id == company_id).order_by(Bim4dEquipmentMotionPlan.created_at.desc()).all()]


def _position(path, offset):
    if offset <= path[0]["offset_seconds"]: return {key: path[0][key] for key in ("x", "y", "z")}
    for start, finish in zip(path, path[1:]):
        if offset <= finish["offset_seconds"]:
            ratio = (offset - start["offset_seconds"]) / (finish["offset_seconds"] - start["offset_seconds"])
            return {key: start[key] + (finish[key] - start[key]) * ratio for key in ("x", "y", "z")}
    return {key: path[-1][key] for key in ("x", "y", "z")}


def playback(db, *, motion_plan_id, project_id, company_id, percent):
    if percent < 0 or percent > 100:
        raise HTTPException(status_code=422, detail="El porcentaje de playback debe estar entre 0 y 100.")
    item = db.query(Bim4dEquipmentMotionPlan).filter(Bim4dEquipmentMotionPlan.id == motion_plan_id, Bim4dEquipmentMotionPlan.proyecto_id == project_id, Bim4dEquipmentMotionPlan.empresa_id == company_id).first()
    if not item: raise HTTPException(status_code=404, detail="Trayectoria fuera del proyecto BIM activo.")
    offset = item.path_json[-1]["offset_seconds"] * percent / 100
    return {"motion_plan_id": item.id, "percent": percent, "offset_seconds": offset, "position": _position(item.path_json, offset), "operation_radius": item.operation_radius, "temporary_geometry": item.temporary_geometry_json["kind"]}


def conflicts(db, *, motion_plan_id, project_id, company_id):
    source = db.query(Bim4dEquipmentMotionPlan).filter(Bim4dEquipmentMotionPlan.id == motion_plan_id, Bim4dEquipmentMotionPlan.proyecto_id == project_id, Bim4dEquipmentMotionPlan.empresa_id == company_id).first()
    if not source: raise HTTPException(status_code=404, detail="Trayectoria fuera del proyecto BIM activo.")
    result = []
    for other in db.query(Bim4dEquipmentMotionPlan).filter(Bim4dEquipmentMotionPlan.proyecto_id == project_id, Bim4dEquipmentMotionPlan.empresa_id == company_id, Bim4dEquipmentMotionPlan.id != source.id).all():
        overlap = min(source.path_json[-1]["offset_seconds"], other.path_json[-1]["offset_seconds"])
        if overlap <= 0: continue
        distances = []
        for step in range(21):
            offset = overlap * step / 20; first = _position(source.path_json, offset); second = _position(other.path_json, offset)
            distances.append(math.dist((first["x"], first["y"], first["z"]), (second["x"], second["y"], second["z"])))
        minimum = min(distances); radius_sum = source.operation_radius + other.operation_radius
        if minimum <= radius_sum:
            result.append({"motion_plan_id": source.id, "conflicting_motion_plan_id": other.id, "temporal_overlap_seconds": overlap, "minimum_path_distance": minimum, "operation_radius_sum": radius_sum})
    return result
