import hashlib
from datetime import timezone

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dProgressSnapshot
from app.models.bim_4d_field import Bim4dFieldEvidence, Bim4dFieldReport
from app.models.bim_4d_planning import Bim4dWorkArea


ALLOWED_EVIDENCE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_EVIDENCE_BYTES = 10 * 1024 * 1024


def _utc(value):
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _serialize_evidence(evidence):
    return {
        "id": evidence.id, "field_report_id": evidence.field_report_id,
        "filename": evidence.filename, "content_type": evidence.content_type,
        "byte_size": evidence.byte_size, "checksum_sha256": evidence.checksum_sha256,
        "uploaded_by": evidence.uploaded_by, "uploaded_at": evidence.uploaded_at,
    }


def _serialize_report(db, report):
    evidence = db.query(Bim4dFieldEvidence).filter(Bim4dFieldEvidence.field_report_id == report.id).order_by(Bim4dFieldEvidence.id).all()
    return {
        "id": report.id, "project_id": report.proyecto_id, "company_id": report.empresa_id,
        "activity_snapshot_id": report.activity_snapshot_id,
        "progress_snapshot_id": report.progress_snapshot_id,
        "work_area_id": report.work_area_id, "reported_at": report.reported_at,
        "progress_percent": report.progress_percent,
        "installed_quantity": report.installed_quantity, "installed_unit": report.installed_unit,
        "labor_hours": report.labor_hours, "equipment_hours": report.equipment_hours,
        "budget_at_completion": report.budget_at_completion,
        "planned_value_to_date": report.planned_value_to_date,
        "earned_value": report.earned_value, "actual_cost": report.actual_cost,
        "schedule_performance_index": report.schedule_performance_index,
        "cost_performance_index": report.cost_performance_index,
        "daily_log": report.daily_log, "evidence": [_serialize_evidence(item) for item in evidence],
        "created_by": report.created_by, "created_at": report.created_at,
    }


def create_field_report(db, *, project_id, company_id, user_id, payload):
    activity = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.id == payload.activity_snapshot_id,
        Bim4dActivitySnapshot.proyecto_id == project_id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad de campo fuera del proyecto activo.")
    if payload.work_area_id:
        area = db.query(Bim4dWorkArea).filter(
            Bim4dWorkArea.id == payload.work_area_id,
            Bim4dWorkArea.proyecto_id == project_id,
            Bim4dWorkArea.empresa_id == company_id,
        ).first()
        if not area:
            raise HTTPException(status_code=404, detail="Frente de campo fuera del proyecto activo.")
    latest = db.query(Bim4dProgressSnapshot).filter(
        Bim4dProgressSnapshot.activity_snapshot_id == activity.id,
        Bim4dProgressSnapshot.proyecto_id == project_id,
        Bim4dProgressSnapshot.empresa_id == company_id,
    ).order_by(Bim4dProgressSnapshot.reported_at.desc()).first()
    if latest and _utc(payload.reported_at) <= _utc(latest.reported_at):
        raise HTTPException(status_code=409, detail="El reporte de campo debe ser posterior al ultimo progreso.")
    progress = Bim4dProgressSnapshot(
        empresa_id=company_id, proyecto_id=project_id, activity_snapshot_id=activity.id,
        progress_percent=payload.progress_percent, actual_start=payload.actual_start,
        actual_finish=payload.actual_finish, note=payload.daily_log,
        reported_by=user_id, reported_at=payload.reported_at,
    )
    db.add(progress); db.flush()
    earned_value = round(payload.budget_at_completion * payload.progress_percent / 100, 2)
    spi = round(earned_value / payload.planned_value_to_date, 4) if payload.planned_value_to_date > 0 else None
    cpi = round(earned_value / payload.actual_cost, 4) if payload.actual_cost > 0 else None
    report = Bim4dFieldReport(
        empresa_id=company_id, proyecto_id=project_id, activity_snapshot_id=activity.id,
        progress_snapshot_id=progress.id, work_area_id=payload.work_area_id,
        reported_at=payload.reported_at, progress_percent=payload.progress_percent,
        installed_quantity=payload.installed_quantity, installed_unit=payload.installed_unit,
        labor_hours=payload.labor_hours, equipment_hours=payload.equipment_hours,
        budget_at_completion=payload.budget_at_completion,
        planned_value_to_date=payload.planned_value_to_date, earned_value=earned_value,
        actual_cost=payload.actual_cost, schedule_performance_index=spi,
        cost_performance_index=cpi, daily_log=payload.daily_log, created_by=user_id,
    )
    db.add(report); db.commit(); db.refresh(report)
    return _serialize_report(db, report)


def list_field_reports(db, *, project_id, company_id, activity_snapshot_id=None):
    query = db.query(Bim4dFieldReport).filter(
        Bim4dFieldReport.proyecto_id == project_id,
        Bim4dFieldReport.empresa_id == company_id,
    )
    if activity_snapshot_id:
        query = query.filter(Bim4dFieldReport.activity_snapshot_id == activity_snapshot_id)
    reports = query.order_by(Bim4dFieldReport.reported_at.desc(), Bim4dFieldReport.id.desc()).all()
    return [_serialize_report(db, report) for report in reports]


def add_field_evidence(db, *, report_id, project_id, company_id, user_id, filename, content_type, content):
    report = db.query(Bim4dFieldReport).filter(
        Bim4dFieldReport.id == report_id,
        Bim4dFieldReport.proyecto_id == project_id,
        Bim4dFieldReport.empresa_id == company_id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Reporte de campo fuera del proyecto activo.")
    if content_type not in ALLOWED_EVIDENCE_TYPES:
        raise HTTPException(status_code=415, detail="La evidencia debe ser JPEG, PNG o WebP.")
    if not content or len(content) > MAX_EVIDENCE_BYTES:
        raise HTTPException(status_code=413, detail="La evidencia debe tener entre 1 byte y 10 MB.")
    checksum = hashlib.sha256(content).hexdigest()
    duplicate = db.query(Bim4dFieldEvidence).filter(
        Bim4dFieldEvidence.field_report_id == report.id,
        Bim4dFieldEvidence.checksum_sha256 == checksum,
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="La evidencia ya fue registrada en este reporte.")
    evidence = Bim4dFieldEvidence(
        field_report_id=report.id, filename=(filename or "evidencia")[:255],
        content_type=content_type, byte_size=len(content), checksum_sha256=checksum,
        content=content, uploaded_by=user_id,
    )
    db.add(evidence); db.commit(); db.refresh(evidence)
    return _serialize_evidence(evidence)


def get_field_evidence(db, *, evidence_id, project_id, company_id):
    evidence = db.query(Bim4dFieldEvidence).join(Bim4dFieldReport).filter(
        Bim4dFieldEvidence.id == evidence_id,
        Bim4dFieldReport.proyecto_id == project_id,
        Bim4dFieldReport.empresa_id == company_id,
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidencia de campo fuera del proyecto activo.")
    return evidence
