from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.bim_import_job import BimImportJob
from app.models.bim_model_version import BimModelVersion
from app.schemas.bim_model import BimImportJobResponse
from app.services.bim.ifc_parser import parse_ifc_text_to_bim_package
from app.services.bim.ifc_quality_service import analyze_ifc_quality, stage_ifc_quality_report
from app.services.bim.ifc_storage import remove_stored_ifc_file, store_ifc_bytes
from app.services.bim.import_service import stage_json_bim_package
from app.services.bim.artifact_registry import stage_artifact_file
from app.services.bim.model_registry import ensure_bim_domain_tables


TERMINAL_JOB_STATUSES = {"succeeded", "failed", "cancelled"}


def ensure_bim_import_jobs_table(db: Session) -> None:
    if "bim_import_jobs" not in set(inspect(db.bind).get_table_names()):
        raise RuntimeError(
            "El esquema de jobs BIM no esta disponible. Ejecuta la migracion Alembic de BIM import jobs."
        )


def create_bim_import_job(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    requested_by: int | None,
    model_name: str,
    version_label: str,
    source_filename: str,
    content: bytes,
    discipline: str | None = None,
    description: str | None = None,
    notes: str | None = None,
    storage_root: Path | None = None,
) -> BimImportJob:
    ensure_bim_domain_tables(db)
    ensure_bim_import_jobs_table(db)
    normalized_name = model_name.strip()
    normalized_version = version_label.strip()
    normalized_discipline = (discipline or "").strip() or None
    if not normalized_name or not normalized_version:
        raise ValueError("El job BIM requiere modelo y etiqueta de version.")

    stored_file = store_ifc_bytes(
        content=content,
        source_filename=source_filename,
        company_id=company_id,
        project_id=project_id,
        storage_root=storage_root,
    )
    idempotency_key = _build_idempotency_key(
        project_id=project_id,
        company_id=company_id,
        model_name=normalized_name,
        version_label=normalized_version,
        discipline=normalized_discipline,
        checksum=stored_file.checksum_sha256,
    )
    existing = db.query(BimImportJob).filter(BimImportJob.idempotency_key == idempotency_key).first()
    if existing is not None:
        remove_stored_ifc_file(stored_file.artifact_path)
        return existing

    job = BimImportJob(
        proyecto_id=project_id,
        empresa_id=company_id,
        requested_by=requested_by,
        idempotency_key=idempotency_key,
        model_name=normalized_name,
        version_label=normalized_version,
        discipline=normalized_discipline,
        description=description,
        notes=notes,
        source_filename=stored_file.source_filename,
        source_artifact_path=stored_file.artifact_path,
        checksum_sha256=stored_file.checksum_sha256,
        file_size_bytes=stored_file.file_size_bytes,
        status="queued",
        stage="queued",
        progress=0,
        attempt_count=0,
        max_attempts=3,
        cancellation_requested=False,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def list_bim_import_jobs(db: Session, *, project_id: int, company_id: int) -> list[BimImportJob]:
    ensure_bim_import_jobs_table(db)
    return (
        db.query(BimImportJob)
        .filter(BimImportJob.proyecto_id == project_id, BimImportJob.empresa_id == company_id)
        .order_by(BimImportJob.fecha_creacion.desc(), BimImportJob.id.desc())
        .all()
    )


def get_bim_import_job(db: Session, *, job_id: int, project_id: int, company_id: int) -> BimImportJob:
    ensure_bim_import_jobs_table(db)
    job = (
        db.query(BimImportJob)
        .filter(
            BimImportJob.id == job_id,
            BimImportJob.proyecto_id == project_id,
            BimImportJob.empresa_id == company_id,
        )
        .first()
    )
    if job is None:
        raise ValueError("Job BIM no encontrado para este proyecto y empresa.")
    return job


def request_bim_import_job_cancellation(
    db: Session,
    *,
    job_id: int,
    project_id: int,
    company_id: int,
) -> BimImportJob:
    job = get_bim_import_job(db, job_id=job_id, project_id=project_id, company_id=company_id)
    if job.status in TERMINAL_JOB_STATUSES:
        return job
    job.cancellation_requested = True
    if job.status == "queued":
        job.status = "cancelled"
        job.stage = "cancelled"
        job.fecha_finalizacion = _utcnow()
    db.commit()
    db.refresh(job)
    return job


def retry_bim_import_job(
    db: Session,
    *,
    job_id: int,
    project_id: int,
    company_id: int,
) -> BimImportJob:
    job = get_bim_import_job(db, job_id=job_id, project_id=project_id, company_id=company_id)
    if job.status == "succeeded":
        return job
    if job.status == "running":
        raise ValueError("El job BIM ya esta en ejecucion.")
    if job.attempt_count >= job.max_attempts:
        raise ValueError("El job BIM alcanzo el maximo de reintentos.")
    job.status = "queued"
    job.stage = "queued"
    job.progress = 0
    job.cancellation_requested = False
    job.error_code = None
    job.error_message = None
    job.fecha_inicio = None
    job.fecha_finalizacion = None
    db.commit()
    db.refresh(job)
    return job


def process_bim_import_job(job_id: int, *, session_factory=SessionLocal) -> None:
    db = session_factory()
    try:
        _process_bim_import_job(db, job_id=job_id)
    finally:
        db.close()


def _process_bim_import_job(db: Session, *, job_id: int) -> BimImportJob:
    ensure_bim_import_jobs_table(db)
    job = db.query(BimImportJob).filter(BimImportJob.id == job_id).first()
    if job is None or job.status == "succeeded":
        return job
    if job.status == "cancelled" or job.cancellation_requested:
        return _mark_cancelled(db, job)
    if job.status == "running":
        return job
    if job.attempt_count >= job.max_attempts:
        raise ValueError("El job BIM alcanzo el maximo de reintentos.")

    try:
        job.status = "running"
        job.stage = "validating"
        job.progress = 10
        job.attempt_count += 1
        job.fecha_inicio = _utcnow()
        db.commit()

        source_path = Path(job.source_artifact_path)
        source_bytes = source_path.read_bytes()
        if len(source_bytes) != job.file_size_bytes:
            raise ValueError("El archivo fuente BIM cambio de tamano.")
        if hashlib.sha256(source_bytes).hexdigest() != job.checksum_sha256:
            raise ValueError("El checksum del archivo fuente BIM no coincide.")
        if job.cancellation_requested:
            return _mark_cancelled(db, job)

        job.stage = "parsing"
        job.progress = 35
        db.commit()
        ifc_text = _decode_ifc_bytes(source_bytes)
        quality_analysis = analyze_ifc_quality(
            ifc_text,
            source_checksum_sha256=job.checksum_sha256,
        )
        if quality_analysis.overall_status == "failed":
            job.result_json = {
                "quality_analysis": {
                    "contract_version": quality_analysis.contract_version,
                    "schema_identifier": quality_analysis.schema_identifier,
                    "step_status": quality_analysis.step_status,
                    "schema_status": quality_analysis.schema_status,
                    "semantic_status": quality_analysis.semantic_status,
                    "overall_status": quality_analysis.overall_status,
                    "error_count": quality_analysis.error_count,
                    "warning_count": quality_analysis.warning_count,
                    "findings": quality_analysis.findings,
                    "summary": quality_analysis.summary,
                }
            }
            db.commit()
            raise ValueError("El IFC no supera la validacion estructural STEP/schema.")
        parsed = parse_ifc_text_to_bim_package(
            ifc_text=ifc_text,
            model_name=job.model_name,
            version_label=job.version_label,
            source_filename=job.source_filename,
            discipline=job.discipline,
            description=job.description,
            notes=job.notes,
            activate=False,
        )
        if parsed.summary.element_count <= 0:
            raise ValueError("El IFC no contiene elementos BIM soportados para importar.")

        db.refresh(job)
        if job.cancellation_requested:
            return _mark_cancelled(db, job)
        job.stage = "persisting"
        job.progress = 75
        db.commit()

        with db.begin_nested():
            imported = stage_json_bim_package(
                db,
                project_id=job.proyecto_id,
                company_id=job.empresa_id,
                payload=parsed.payload,
            )
            version = db.query(BimModelVersion).filter(BimModelVersion.id == imported.version_id).one()
            version.artifact_path = job.source_artifact_path
            version.status = "ready_for_review"
            version.is_active = False
            source_artifact = stage_artifact_file(
                db,
                version_id=version.id,
                project_id=job.proyecto_id,
                company_id=job.empresa_id,
                artifact_type="source_ifc",
                artifact_path=job.source_artifact_path,
                source_checksum_sha256=job.checksum_sha256,
                metadata={"correlation_id": job.correlation_id},
            )
            quality_report = stage_ifc_quality_report(
                db,
                version_id=version.id,
                project_id=job.proyecto_id,
                company_id=job.empresa_id,
                analysis=quality_analysis,
            )
            db.flush()

        job = db.query(BimImportJob).filter(BimImportJob.id == job_id).one()
        job.bim_model_version_id = version.id
        job.status = "succeeded"
        job.stage = "ready_for_review"
        job.progress = 100
        job.result_json = {
            "model_id": imported.model_id,
            "version_id": version.id,
            "created_storeys": imported.created_storeys,
            "created_elements": imported.created_elements,
            "parsed_entity_count": parsed.summary.entity_count,
            "parsed_ifc_classes": sorted(parsed.summary.ifc_class_counts),
            "quality_report_id": quality_report.id,
            "source_artifact_id": source_artifact.id,
            "quality_status": quality_report.overall_status,
            "quality_error_count": quality_report.error_count,
            "quality_warning_count": quality_report.warning_count,
            "activated": False,
        }
        job.error_code = None
        job.error_message = None
        job.fecha_finalizacion = _utcnow()
        db.commit()
        db.refresh(job)
        return job
    except Exception as exc:
        failed_job = db.query(BimImportJob).filter(BimImportJob.id == job_id).one()
        failed_job.status = "failed"
        failed_job.stage = "failed"
        failed_job.error_code = _normalize_error_code(exc)
        failed_job.error_message = str(exc)[:2000]
        failed_job.fecha_finalizacion = _utcnow()
        db.commit()
        db.refresh(failed_job)
        return failed_job


def serialize_bim_import_job(job: BimImportJob) -> BimImportJobResponse:
    return BimImportJobResponse.model_validate(job, from_attributes=True)


def _mark_cancelled(db: Session, job: BimImportJob) -> BimImportJob:
    job.status = "cancelled"
    job.stage = "cancelled"
    job.fecha_finalizacion = _utcnow()
    db.commit()
    db.refresh(job)
    return job


def _build_idempotency_key(
    *,
    project_id: int,
    company_id: int,
    model_name: str,
    version_label: str,
    discipline: str | None,
    checksum: str,
) -> str:
    raw = "|".join(
        [
            str(company_id),
            str(project_id),
            model_name.casefold(),
            (discipline or "").casefold(),
            version_label.casefold(),
            checksum,
        ]
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _decode_ifc_bytes(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1")


def _normalize_error_code(exc: Exception) -> str:
    message = str(exc).casefold()
    if "checksum" in message:
        return "source_checksum_mismatch"
    if "elementos bim" in message:
        return "unsupported_ifc_content"
    if "validacion estructural" in message:
        return "invalid_ifc_structure"
    if "version bim" in message:
        return "duplicate_version"
    if isinstance(exc, FileNotFoundError):
        return "source_file_missing"
    return "import_failed"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)
