from app.models.bim_artifact import BimArtifact
from app.models.bim_import_job import BimImportJob
from app.models.proyecto import Proyecto
from app.services.bim.operational_metrics import get_bim_operational_metrics

def test_bim_metrics_are_tenant_scoped_aggregated_and_sanitized(db,sample_empresa):
    project=Proyecto(nombre="Metrics",empresa_id=sample_empresa.id);db.add(project);db.flush()
    job=BimImportJob(proyecto_id=project.id,empresa_id=sample_empresa.id,idempotency_key="a"*64,model_name="Sensitive model",version_label="v1",source_filename="secret.ifc",source_artifact_path="private/path.ifc",checksum_sha256="b"*64,file_size_bytes=123,status="failed",stage="failed",progress=35,attempt_count=1,max_attempts=3,cancellation_requested=False,error_code="source_checksum_mismatch",error_message="private details");db.add(job);db.commit()
    metrics=get_bim_operational_metrics(db,project_id=project.id,company_id=sample_empresa.id)
    assert metrics["jobs"]["failed_by_code"]=={"source_checksum_mismatch":1};assert metrics["jobs"]["input_bytes"]==123;assert metrics["correlation_ids"]==[f"bim-job-{job.id}"]
    serialized=str(metrics);assert "secret.ifc" not in serialized and "private/path" not in serialized and "private details" not in serialized and "Sensitive model" not in serialized
