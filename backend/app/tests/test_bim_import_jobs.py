from pathlib import Path

from app.models.bim_import_job import BimImportJob
from app.models.bim_ifc_quality_report import BimIfcQualityReport
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.schemas.bim_model import BimImportElementPayload, BimJsonImportRequest
from app.services.bim.import_job_service import (
    _process_bim_import_job,
    create_bim_import_job,
    request_bim_import_job_cancellation,
    retry_bim_import_job,
    serialize_bim_import_job,
)
from app.services.bim.import_service import import_json_bim_package


VALID_IFC = b"""ISO-10303-21;
HEADER;
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
#20=IFCWALL('JOB-W001',$,'Muro job',$,$,$,$,$);
ENDSEC;
END-ISO-10303-21;
"""


def _project(db, company_id: int, name: str = "Proyecto BIM jobs") -> Proyecto:
    project = Proyecto(nombre=name, empresa_id=company_id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def _create_job(db, tmp_path: Path, project: Proyecto, *, content: bytes = VALID_IFC, version="v1"):
    return create_bim_import_job(
        db,
        project_id=project.id,
        company_id=project.empresa_id,
        requested_by=None,
        model_name="Modelo observable",
        version_label=version,
        source_filename="observable.ifc",
        content=content,
        discipline="Arquitectura",
        storage_root=tmp_path,
    )


def test_bim_import_job_creation_is_idempotent(db, sample_empresa, tmp_path):
    project = _project(db, sample_empresa.id)

    first = _create_job(db, tmp_path, project)
    second = _create_job(db, tmp_path, project)

    assert first.id == second.id
    assert first.status == "queued"
    assert db.query(BimImportJob).filter(BimImportJob.proyecto_id == project.id).count() == 1
    payload = serialize_bim_import_job(first).model_dump()
    assert payload["project_id"] == project.id
    assert payload["progress"] == 0


def test_bim_import_job_processes_to_inactive_review_version(db, sample_empresa, tmp_path):
    project = _project(db, sample_empresa.id)
    job = _create_job(db, tmp_path, project)

    processed = _process_bim_import_job(db, job_id=job.id)

    assert processed.status == "succeeded"
    assert processed.stage == "ready_for_review"
    assert processed.progress == 100
    assert processed.attempt_count == 1
    assert processed.result_json["created_elements"] == 1
    assert processed.result_json["quality_report_id"]
    version = db.query(BimModelVersion).filter(BimModelVersion.id == processed.bim_model_version_id).one()
    assert version.status == "ready_for_review"
    assert version.is_active is False
    report = db.query(BimIfcQualityReport).filter(BimIfcQualityReport.bim_model_version_id == version.id).one()
    assert report.contract_version == "giproy_bim_ifc_quality_v1"
    assert report.overall_status in {"passed", "warnings"}


def test_failed_bim_import_job_preserves_previous_active_version(db, sample_empresa, tmp_path):
    project = _project(db, sample_empresa.id)
    active = import_json_bim_package(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        payload=BimJsonImportRequest(
            model_name="Modelo observable",
            version_label="base",
            activate=True,
            elements=[BimImportElementPayload(global_id="ACTIVE-001", ifc_class="IFCWALL")],
        ),
    )
    job = _create_job(db, tmp_path, project, content=b"not-an-ifc", version="fallida")

    processed = _process_bim_import_job(db, job_id=job.id)

    assert processed.status == "failed"
    assert processed.error_code == "invalid_ifc_structure"
    assert processed.result_json["quality_analysis"]["overall_status"] == "failed"
    assert processed.result_json["quality_analysis"]["findings"]
    assert processed.bim_model_version_id is None
    active_version = db.query(BimModelVersion).filter(BimModelVersion.id == active.version_id).one()
    assert active_version.is_active is True


def test_queued_bim_import_job_can_be_cancelled_without_creating_version(db, sample_empresa, tmp_path):
    project = _project(db, sample_empresa.id)
    job = _create_job(db, tmp_path, project)

    cancelled = request_bim_import_job_cancellation(
        db,
        job_id=job.id,
        project_id=project.id,
        company_id=sample_empresa.id,
    )
    processed = _process_bim_import_job(db, job_id=job.id)

    assert cancelled.status == "cancelled"
    assert processed.status == "cancelled"
    assert processed.bim_model_version_id is None


def test_failed_bim_import_job_can_be_retried(db, sample_empresa, tmp_path):
    project = _project(db, sample_empresa.id)
    job = _create_job(db, tmp_path, project, content=b"not-an-ifc")
    failed = _process_bim_import_job(db, job_id=job.id)

    retried = retry_bim_import_job(
        db,
        job_id=failed.id,
        project_id=project.id,
        company_id=sample_empresa.id,
    )

    assert retried.status == "queued"
    assert retried.progress == 0
    assert retried.attempt_count == 1
    assert retried.error_code is None
    assert retried.error_message is None
