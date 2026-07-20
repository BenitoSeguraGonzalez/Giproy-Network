import hashlib
import json
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dProgressSnapshot
from app.models.bim_4d_resources import Bim4dCrew, Bim4dTimecard
from app.models.bim_erp_exchange import BimErpExchangePackage
from app.schemas.bim_erp_exchange import BimErpExchangeContent, BimErpExchangeCreate, BimErpExchangeResponse, BimErpExchangeTransition
from app.services.bim.integration_gateway_service import enqueue_integration_event


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _serialize(value: BimErpExchangePackage) -> BimErpExchangeResponse:
    return BimErpExchangeResponse(
        id=value.id, project_id=value.proyecto_id, company_id=value.empresa_id,
        revision=value.revision, status=value.status, project_root_code=value.project_root_code,
        project_revision=value.project_revision, cutoff_at=value.cutoff_at,
        checksum_sha256=value.checksum_sha256, activity_count=value.activity_count,
        timecard_count=value.timecard_count, regular_hours=value.regular_hours,
        overtime_hours=value.overtime_hours, justification=value.justification,
        lock_version=value.lock_version, created_by=value.created_by,
        published_by=value.published_by, created_at=value.created_at,
        published_at=value.published_at,
    )


def list_erp_exchange_packages(db: Session, *, project_id: int, company_id: int) -> list[BimErpExchangeResponse]:
    values = db.query(BimErpExchangePackage).filter(
        BimErpExchangePackage.proyecto_id == project_id,
        BimErpExchangePackage.empresa_id == company_id,
    ).order_by(BimErpExchangePackage.revision.desc()).all()
    return [_serialize(value) for value in values]


def create_erp_exchange_package(db: Session, *, project, company_id: int, user_id: int, payload: BimErpExchangeCreate) -> BimErpExchangeResponse:
    cutoff = _utc(payload.cutoff_at)
    activities = db.query(Bim4dActivitySnapshot).filter(
        Bim4dActivitySnapshot.proyecto_id == project.id,
        Bim4dActivitySnapshot.empresa_id == company_id,
    ).order_by(Bim4dActivitySnapshot.activity_code, Bim4dActivitySnapshot.id).all()
    progress_rows = []
    for activity in activities:
        progress = db.query(Bim4dProgressSnapshot).filter(
            Bim4dProgressSnapshot.proyecto_id == project.id,
            Bim4dProgressSnapshot.empresa_id == company_id,
            Bim4dProgressSnapshot.activity_snapshot_id == activity.id,
            Bim4dProgressSnapshot.reported_at <= cutoff,
        ).order_by(Bim4dProgressSnapshot.reported_at.desc(), Bim4dProgressSnapshot.id.desc()).first()
        progress_rows.append({
            "activity_snapshot_id": activity.id, "source_kind": activity.source_kind,
            "source_ref": activity.source_ref, "snapshot_revision": activity.snapshot_revision,
            "activity_code": activity.activity_code, "activity_name": activity.activity_name,
            "progress_percent": float(progress.progress_percent) if progress else 0.0,
            "actual_start": progress.actual_start.isoformat() if progress and progress.actual_start else None,
            "actual_finish": progress.actual_finish.isoformat() if progress and progress.actual_finish else None,
            "reported_at": progress.reported_at.isoformat() if progress else None,
        })
    timecards = db.query(Bim4dTimecard, Bim4dCrew, Bim4dActivitySnapshot).join(
        Bim4dCrew, Bim4dCrew.id == Bim4dTimecard.crew_id,
    ).join(Bim4dActivitySnapshot, Bim4dActivitySnapshot.id == Bim4dTimecard.activity_snapshot_id).filter(
        Bim4dTimecard.proyecto_id == project.id,
        Bim4dTimecard.empresa_id == company_id,
        Bim4dTimecard.work_date <= cutoff.date(),
    ).order_by(Bim4dTimecard.work_date, Bim4dTimecard.id).all()
    timecard_rows = [{
        "timecard_id": card.id, "work_date": card.work_date.isoformat(),
        "activity_snapshot_id": activity.id, "source_kind": activity.source_kind,
        "source_ref": activity.source_ref, "activity_code": activity.activity_code,
        "crew_code": crew.code, "crew_name": crew.name,
        "regular_hours": float(card.regular_hours), "overtime_hours": float(card.overtime_hours),
        "installed_quantity": float(card.installed_quantity), "installed_unit": card.installed_unit,
    } for card, crew, activity in timecards]
    regular_hours = round(sum(row["regular_hours"] for row in timecard_rows), 2)
    overtime_hours = round(sum(row["overtime_hours"] for row in timecard_rows), 2)
    package_payload = {
        "contract_version": "giproy_bim_erp_progress_time_v1",
        "project": {"id": project.id, "root_code": project.codigo_root, "revision": project.revision or 0, "company_id": company_id},
        "cutoff_at": cutoff.isoformat(),
        "summary": {"activity_count": len(progress_rows), "timecard_count": len(timecard_rows), "regular_hours": regular_hours, "overtime_hours": overtime_hours},
        "progress": progress_rows,
        "timecards": timecard_rows,
    }
    canonical = json.dumps(package_payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    checksum = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    current = db.query(BimErpExchangePackage).filter(
        BimErpExchangePackage.proyecto_id == project.id,
        BimErpExchangePackage.empresa_id == company_id,
    ).order_by(BimErpExchangePackage.revision.desc()).with_for_update().first()
    value = BimErpExchangePackage(
        empresa_id=company_id, proyecto_id=project.id, revision=(current.revision if current else 0) + 1,
        status="draft", project_root_code=project.codigo_root, project_revision=project.revision or 0,
        cutoff_at=cutoff, payload_json=package_payload, checksum_sha256=checksum,
        activity_count=len(progress_rows), timecard_count=len(timecard_rows),
        regular_hours=regular_hours, overtime_hours=overtime_hours,
        justification=payload.justification.strip(), created_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value)


def transition_erp_exchange_package(db: Session, *, package_id: int, project_id: int, company_id: int, user_id: int, payload: BimErpExchangeTransition) -> BimErpExchangeResponse:
    value = db.query(BimErpExchangePackage).filter(
        BimErpExchangePackage.id == package_id,
        BimErpExchangePackage.proyecto_id == project_id,
        BimErpExchangePackage.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Paquete ERP BIM no encontrado.")
    if value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El paquete ERP BIM fue modificado por otro usuario.")
    if payload.action == "publish":
        if value.status != "draft":
            raise HTTPException(status_code=409, detail="Solo un paquete borrador puede publicarse.")
        db.query(BimErpExchangePackage).filter(
            BimErpExchangePackage.proyecto_id == project_id,
            BimErpExchangePackage.empresa_id == company_id,
            BimErpExchangePackage.status == "published",
            BimErpExchangePackage.id != value.id,
        ).update({"status": "superseded", "lock_version": BimErpExchangePackage.lock_version + 1}, synchronize_session=False)
        value.status = "published"; value.published_by = user_id; value.published_at = datetime.now(timezone.utc)
        enqueue_integration_event(
            db,
            project_id=project_id,
            company_id=company_id,
            event_type="erp.package.published",
            event_key=f"erp.package.published:{value.id}:{value.lock_version + 1}",
            data={
                "package_id": value.id,
                "revision": value.revision,
                "project_revision": value.project_revision,
                "cutoff_at": value.cutoff_at.isoformat(),
                "checksum_sha256": value.checksum_sha256,
                "activity_count": value.activity_count,
                "timecard_count": value.timecard_count,
                "regular_hours": value.regular_hours,
                "overtime_hours": value.overtime_hours,
                "content_path": f"/api/v1/bim/projects/{project_id}/erp-exchange/packages/{value.id}/content",
            },
        )
    else:
        if value.status != "published":
            raise HTTPException(status_code=409, detail="Solo un paquete publicado puede revocarse.")
        value.status = "revoked"
    value.justification = f"{value.justification}\n{payload.action}: {payload.reason.strip()}"
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value)


def get_published_erp_exchange_content(db: Session, *, package_id: int, project_id: int, company_id: int) -> BimErpExchangeContent:
    value = db.query(BimErpExchangePackage).filter(
        BimErpExchangePackage.id == package_id,
        BimErpExchangePackage.proyecto_id == project_id,
        BimErpExchangePackage.empresa_id == company_id,
        BimErpExchangePackage.status == "published",
    ).first()
    if not value:
        raise HTTPException(status_code=404, detail="Paquete ERP BIM publicado no encontrado.")
    canonical = json.dumps(value.payload_json, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
    if hashlib.sha256(canonical.encode("utf-8")).hexdigest() != value.checksum_sha256:
        raise HTTPException(status_code=409, detail="La integridad del paquete ERP BIM no es valida.")
    return BimErpExchangeContent(package=_serialize(value), payload=value.payload_json)
