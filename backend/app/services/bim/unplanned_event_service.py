from datetime import datetime, timezone

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_event import Bim4dUnplannedEvent
from app.models.bim_4d_planning import Bim4dWorkArea


def _response(item):
    return {"id": item.id, "project_id": item.proyecto_id, "company_id": item.empresa_id, "activity_snapshot_id": item.activity_snapshot_id, "work_area_id": item.work_area_id, "event_type": item.event_type, "title": item.title, "description": item.description, "occurred_at": item.occurred_at, "delay_days": item.delay_days, "actual_cost": item.actual_cost, "status": item.status, "decision_reason": item.decision_reason, "created_by": item.created_by, "decided_by": item.decided_by, "created_at": item.created_at, "decided_at": item.decided_at}


def create_event(db, *, project_id, company_id, user_id, payload):
    activity = db.query(Bim4dActivitySnapshot).filter(Bim4dActivitySnapshot.id == payload.activity_snapshot_id, Bim4dActivitySnapshot.proyecto_id == project_id, Bim4dActivitySnapshot.empresa_id == company_id).first()
    if not activity: raise HTTPException(status_code=404, detail="Actividad fuera del proyecto BIM activo.")
    if payload.work_area_id and not db.query(Bim4dWorkArea).filter(Bim4dWorkArea.id == payload.work_area_id, Bim4dWorkArea.proyecto_id == project_id, Bim4dWorkArea.empresa_id == company_id).first(): raise HTTPException(status_code=404, detail="Frente fuera del proyecto BIM activo.")
    item = Bim4dUnplannedEvent(empresa_id=company_id, proyecto_id=project_id, activity_snapshot_id=activity.id, work_area_id=payload.work_area_id, event_type=payload.event_type, title=payload.title, description=payload.description, occurred_at=payload.occurred_at, delay_days=payload.delay_days, actual_cost=payload.actual_cost, status="reported", created_by=user_id)
    db.add(item); db.commit(); db.refresh(item)
    return _response(item)


def list_events(db, *, project_id, company_id):
    rows = db.query(Bim4dUnplannedEvent).filter(Bim4dUnplannedEvent.proyecto_id == project_id, Bim4dUnplannedEvent.empresa_id == company_id).order_by(Bim4dUnplannedEvent.occurred_at.desc(), Bim4dUnplannedEvent.id.desc()).all()
    return [_response(item) for item in rows]


def decide_event(db, *, event_id, project_id, company_id, user_id, payload):
    item = db.query(Bim4dUnplannedEvent).filter(Bim4dUnplannedEvent.id == event_id, Bim4dUnplannedEvent.proyecto_id == project_id, Bim4dUnplannedEvent.empresa_id == company_id).first()
    if not item: raise HTTPException(status_code=404, detail="Evento fuera del proyecto BIM activo.")
    if item.status != "reported": raise HTTPException(status_code=409, detail="El evento BIM ya fue decidido.")
    item.status = "validated" if payload.action == "validate" else "void"
    item.decision_reason = payload.reason; item.decided_by = user_id; item.decided_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(item)
    return _response(item)
