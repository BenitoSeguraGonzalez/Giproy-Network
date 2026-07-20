from datetime import datetime, timedelta, timezone

from app.models.bim_artifact import BimArtifact
from app.models.bim_cde_collaboration import BimCdeCollaborationEvent, BimCdeCollaborationPresence
from app.models.bim_import_job import BimImportJob
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.operational_metrics import get_bim_operational_metrics

def test_bim_metrics_are_tenant_scoped_aggregated_and_sanitized(db,sample_empresa):
    project=Proyecto(nombre="Metrics",empresa_id=sample_empresa.id);db.add(project);db.flush()
    job=BimImportJob(proyecto_id=project.id,empresa_id=sample_empresa.id,idempotency_key="a"*64,model_name="Sensitive model",version_label="v1",source_filename="secret.ifc",source_artifact_path="private/path.ifc",checksum_sha256="b"*64,file_size_bytes=123,status="failed",stage="failed",progress=35,attempt_count=1,max_attempts=3,cancellation_requested=False,error_code="source_checksum_mismatch",error_message="private details");db.add(job);db.commit()
    metrics=get_bim_operational_metrics(db,project_id=project.id,company_id=sample_empresa.id)
    assert metrics["jobs"]["failed_by_code"]=={"source_checksum_mismatch":1};assert metrics["jobs"]["input_bytes"]==123;assert metrics["correlation_ids"]==[f"bim-job-{job.id}"]
    serialized=str(metrics);assert "secret.ifc" not in serialized and "private/path" not in serialized and "private details" not in serialized and "Sensitive model" not in serialized


def test_bim_metrics_include_sanitized_collaboration_health(db, sample_empresa):
    project = Proyecto(nombre="Collaboration metrics", empresa_id=sample_empresa.id)
    user = Usuario(email="metrics-cde@example.com", hashed_password="x", nombre_completo="Metrics CDE", empresa_id=sample_empresa.id, rol="coordinador", activo=True)
    db.add_all([project, user]); db.flush()
    now = datetime.now(timezone.utc)
    db.add_all([
        BimCdeCollaborationPresence(empresa_id=sample_empresa.id, proyecto_id=project.id, usuario_id=user.id, session_key="metrics-active", workspace="coordination", context_json={"secret": "not-exported"}, last_seen_at=now),
        BimCdeCollaborationPresence(empresa_id=sample_empresa.id, proyecto_id=project.id, usuario_id=user.id, session_key="metrics-expired", workspace="viewer", context_json={}, last_seen_at=now - timedelta(minutes=2)),
        BimCdeCollaborationEvent(empresa_id=sample_empresa.id, proyecto_id=project.id, actor_id=user.id, event_type="review.created", entity_type="review", entity_id=7, summary="Sensitive summary", payload_json={"secret": "not-exported"}),
    ])
    db.commit()

    collaboration = get_bim_operational_metrics(db, project_id=project.id, company_id=sample_empresa.id)["collaboration"]
    assert collaboration["presence_total"] == 2
    assert collaboration["presence_active"] == 1
    assert collaboration["presence_expired"] == 1
    assert collaboration["event_total"] == 1
    assert collaboration["events_by_type"] == {"review.created": 1}
    assert collaboration["latest_cursor"] > 0
    assert collaboration["event_lag_seconds"] >= 0
    assert "Sensitive summary" not in str(collaboration)
    assert "not-exported" not in str(collaboration)
