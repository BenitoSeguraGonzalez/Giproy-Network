from collections import Counter
from app.models.bim_artifact import BimArtifact
from app.models.bim_import_job import BimImportJob

def get_bim_operational_metrics(db, *, project_id, company_id):
    jobs=db.query(BimImportJob).filter(BimImportJob.proyecto_id==project_id,BimImportJob.empresa_id==company_id).all()
    artifacts=db.query(BimArtifact).filter(BimArtifact.proyecto_id==project_id,BimArtifact.empresa_id==company_id).all()
    durations=[]
    for job in jobs:
        if job.fecha_inicio and job.fecha_finalizacion: durations.append(max(0,(job.fecha_finalizacion-job.fecha_inicio).total_seconds()))
    return {"contract_version":"giproy_bim_operational_metrics_v1","project_id":project_id,"company_id":company_id,"jobs":{"total":len(jobs),"by_status":dict(Counter(job.status for job in jobs)),"by_stage":dict(Counter(job.stage for job in jobs)),"failed_by_code":dict(Counter(job.error_code or "unknown" for job in jobs if job.status=="failed")),"duration_seconds_avg":round(sum(durations)/len(durations),3) if durations else 0,"input_bytes":sum(job.file_size_bytes for job in jobs)},"artifacts":{"total":len(artifacts),"by_type":dict(Counter(item.artifact_type for item in artifacts)),"by_status":dict(Counter(item.status for item in artifacts)),"bytes":sum(item.file_size_bytes for item in artifacts)},"correlation_ids":[job.correlation_id for job in jobs]}
