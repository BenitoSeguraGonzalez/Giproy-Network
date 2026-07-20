from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app.models.bim_artifact import BimArtifact
from app.models.bim_cde_collaboration import BimCdeCollaborationEvent, BimCdeCollaborationPresence
from app.models.bim_import_job import BimImportJob


def _utc(value):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

def get_bim_operational_metrics(db, *, project_id, company_id):
    jobs=db.query(BimImportJob).filter(BimImportJob.proyecto_id==project_id,BimImportJob.empresa_id==company_id).all()
    artifacts=db.query(BimArtifact).filter(BimArtifact.proyecto_id==project_id,BimArtifact.empresa_id==company_id).all()
    durations=[]
    for job in jobs:
        if job.fecha_inicio and job.fecha_finalizacion: durations.append(max(0,(job.fecha_finalizacion-job.fecha_inicio).total_seconds()))
    now = datetime.now(timezone.utc)
    presence_scope = db.query(BimCdeCollaborationPresence).filter(
        BimCdeCollaborationPresence.proyecto_id == project_id,
        BimCdeCollaborationPresence.empresa_id == company_id,
    )
    presence_total = presence_scope.count()
    presence_active = presence_scope.filter(
        BimCdeCollaborationPresence.last_seen_at >= now - timedelta(seconds=45)
    ).count()
    presence_expired = presence_scope.filter(
        BimCdeCollaborationPresence.last_seen_at < now - timedelta(seconds=45)
    ).count()
    event_scope = db.query(BimCdeCollaborationEvent).filter(
        BimCdeCollaborationEvent.proyecto_id == project_id,
        BimCdeCollaborationEvent.empresa_id == company_id,
    )
    event_total, latest_cursor, latest_event_at = event_scope.with_entities(
        func.count(BimCdeCollaborationEvent.id),
        func.max(BimCdeCollaborationEvent.id),
        func.max(BimCdeCollaborationEvent.created_at),
    ).one()
    event_types = dict(
        event_scope.with_entities(
            BimCdeCollaborationEvent.event_type,
            func.count(BimCdeCollaborationEvent.id),
        ).group_by(BimCdeCollaborationEvent.event_type).all()
    )
    latest_event_utc = _utc(latest_event_at)
    return {"contract_version":"giproy_bim_operational_metrics_v1","project_id":project_id,"company_id":company_id,"jobs":{"total":len(jobs),"by_status":dict(Counter(job.status for job in jobs)),"by_stage":dict(Counter(job.stage for job in jobs)),"failed_by_code":dict(Counter(job.error_code or "unknown" for job in jobs if job.status=="failed")),"duration_seconds_avg":round(sum(durations)/len(durations),3) if durations else 0,"input_bytes":sum(job.file_size_bytes for job in jobs)},"artifacts":{"total":len(artifacts),"by_type":dict(Counter(item.artifact_type for item in artifacts)),"by_status":dict(Counter(item.status for item in artifacts)),"bytes":sum(item.file_size_bytes for item in artifacts)},"collaboration":{"presence_total":presence_total,"presence_active":presence_active,"presence_expired":presence_expired,"event_total":event_total,"events_by_type":event_types,"latest_cursor":latest_cursor or 0,"latest_event_at":latest_event_utc,"event_lag_seconds":round(max(0,(now-latest_event_utc).total_seconds()),3) if latest_event_utc else None},"correlation_ids":[job.correlation_id for job in jobs]}
