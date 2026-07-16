import json
from pathlib import Path

from app.models.bim_artifact import BimArtifact
from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.services.bim.import_job_service import _process_bim_import_job, create_bim_import_job


CORPUS_ROOT = Path(__file__).resolve().parent / "fixtures" / "bim" / "real"


def test_gate_a_processes_real_small_medium_large_through_observable_jobs(db, sample_empresa, tmp_path):
    manifest = json.loads((CORPUS_ROOT / "manifest.json").read_text(encoding="utf-8"))
    representatives = {
        scale: next(dataset for dataset in manifest["datasets"] if dataset["scale"] == scale)
        for scale in ("small", "medium", "large")
    }
    project = Proyecto(nombre="Proyecto BIM Gate A", empresa_id=sample_empresa.id)
    db.add(project)
    db.commit()
    db.refresh(project)

    evidence = {}
    for scale, dataset in representatives.items():
        content = (CORPUS_ROOT / dataset["relative_path"]).read_bytes()
        job = create_bim_import_job(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            requested_by=None,
            model_name=dataset["label"],
            version_label="gate-a-v1",
            source_filename=Path(dataset["relative_path"]).name,
            content=content,
            discipline=dataset["discipline"],
            storage_root=tmp_path / "gate-a-storage",
        )
        processed = _process_bim_import_job(db, job_id=job.id)
        assert processed.status == "succeeded"
        assert processed.progress == 100
        assert processed.result_json["created_elements"] == dataset["expected"]["element_count"]
        version = db.query(BimModelVersion).filter(BimModelVersion.id == processed.bim_model_version_id).one()
        assert version.status == "ready_for_review"
        assert version.is_active is False
        report = db.query(BimIfcQualityReport).filter(BimIfcQualityReport.bim_model_version_id == version.id).one()
        assert report.error_count == 0
        source = (
            db.query(BimArtifact)
            .filter(
                BimArtifact.bim_model_version_id == version.id,
                BimArtifact.artifact_type == "source_ifc",
                BimArtifact.status == "active",
            )
            .one()
        )
        assert source.checksum_sha256 == dataset["expected"]["sha256"]
        assert source.file_size_bytes == dataset["expected"]["bytes"]
        evidence[scale] = processed.result_json["created_elements"]

    assert evidence == {"small": 13, "medium": 144, "large": 926}
    assert db.query(BimModelVersion).filter(BimModelVersion.is_active.is_(True)).count() == 0
