from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.bim_cde_review import BimCdeReview
from app.models.bim_cde_rfi import BimCdeRfi
from app.models.bim_cde_submittal import BimCdeSubmittal
from app.models.bim_operational_notification import BimOperationalNotification
from app.models.proyecto import Proyecto


UPCOMING_WINDOW = timedelta(hours=72)
ESCALATION_WINDOW = timedelta(hours=48)
ACTIVE_RFI_STATUSES = {"draft", "submitted"}
ACTIVE_SUBMITTAL_STATUSES = {"draft", "submitted", "under_review", "rejected"}
ACTIVE_REVIEW_STATUSES = {"open"}


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _classification(due_at: datetime, now: datetime) -> tuple[str, str, int] | None:
    due = _as_utc(due_at)
    if due > now + UPCOMING_WINDOW:
        return None
    if due >= now:
        return "due_soon", "warning", 0
    if now - due < ESCALATION_WINDOW:
        return "overdue", "high", 1
    return "escalated", "critical", 2


def _serialize(value: BimOperationalNotification) -> dict:
    return {
        "id": value.id,
        "project_id": value.proyecto_id,
        "company_id": value.empresa_id,
        "user_id": value.usuario_id,
        "source_type": value.source_type,
        "source_id": value.source_id,
        "source_number": value.source_number,
        "title": value.title,
        "event_type": value.event_type,
        "severity": value.severity,
        "escalation_level": value.escalation_level,
        "due_at": value.due_at,
        "acknowledged_at": value.acknowledged_at,
        "resolved_at": value.resolved_at,
        "created_at": value.created_at,
    }


def reconcile_operational_notifications(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    now: datetime | None = None,
) -> dict:
    generated_at = _as_utc(now) if now else datetime.now(timezone.utc)
    project = db.query(Proyecto.id).filter(
        Proyecto.id == project_id,
        Proyecto.empresa_id == company_id,
    ).with_for_update().first()
    if project is None:
        raise HTTPException(status_code=404, detail="Proyecto BIM no encontrado para reconciliar alertas.")
    candidates = []
    rfis = db.query(BimCdeRfi).filter(
        BimCdeRfi.proyecto_id == project_id,
        BimCdeRfi.empresa_id == company_id,
        BimCdeRfi.status.in_(ACTIVE_RFI_STATUSES),
        BimCdeRfi.assigned_to.is_not(None),
        BimCdeRfi.due_at.is_not(None),
    ).all()
    candidates.extend(("rfi", row.id, row.rfi_number, row.subject, row.assigned_to, row.due_at) for row in rfis)

    submittals = db.query(BimCdeSubmittal).filter(
        BimCdeSubmittal.proyecto_id == project_id,
        BimCdeSubmittal.empresa_id == company_id,
        BimCdeSubmittal.status.in_(ACTIVE_SUBMITTAL_STATUSES),
        BimCdeSubmittal.reviewer_id.is_not(None),
    ).all()
    candidates.extend(("submittal", row.id, row.submittal_number, row.title, row.reviewer_id, row.required_at) for row in submittals)

    reviews = db.query(BimCdeReview).filter(
        BimCdeReview.proyecto_id == project_id,
        BimCdeReview.empresa_id == company_id,
        BimCdeReview.status.in_(ACTIVE_REVIEW_STATUSES),
    ).all()
    candidates.extend(("review", row.id, row.review_number, row.title, row.assigned_to, row.due_at) for row in reviews)

    current_keys = set()
    generated = 0
    for source_type, source_id, source_number, title, user_id, due_at in candidates:
        classification = _classification(due_at, generated_at)
        if classification is None:
            continue
        event_type, severity, level = classification
        due = _as_utc(due_at)
        key = (
            f"bim-op:{company_id}:{project_id}:{source_type}:{source_id}:"
            f"user:{user_id}:due:{int(due.timestamp())}:level:{level}"
        )
        current_keys.add(key)
        value = db.query(BimOperationalNotification).filter(
            BimOperationalNotification.dedupe_key == key
        ).first()
        if value is None:
            value = BimOperationalNotification(
                empresa_id=company_id,
                proyecto_id=project_id,
                usuario_id=user_id,
                source_type=source_type,
                source_id=source_id,
                source_number=source_number,
                title=title,
                event_type=event_type,
                severity=severity,
                escalation_level=level,
                due_at=due,
                dedupe_key=key,
            )
            db.add(value)
            generated += 1
        else:
            value.source_number = source_number
            value.title = title
            value.event_type = event_type
            value.severity = severity
            value.escalation_level = level
            value.due_at = due
            if value.resolved_at is not None:
                value.resolved_at = None
                value.acknowledged_at = None

    active_rows = db.query(BimOperationalNotification).filter(
        BimOperationalNotification.proyecto_id == project_id,
        BimOperationalNotification.empresa_id == company_id,
        BimOperationalNotification.resolved_at.is_(None),
    ).all()
    resolved = 0
    for value in active_rows:
        if value.dedupe_key not in current_keys:
            value.resolved_at = generated_at
            resolved += 1
    db.commit()
    active = db.query(BimOperationalNotification).filter(
        BimOperationalNotification.proyecto_id == project_id,
        BimOperationalNotification.empresa_id == company_id,
        BimOperationalNotification.resolved_at.is_(None),
    ).count()
    return {
        "generated": generated,
        "active": active,
        "resolved": resolved,
        "generated_at": generated_at,
    }


def list_operational_notifications(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
) -> list[dict]:
    values = db.query(BimOperationalNotification).filter(
        BimOperationalNotification.proyecto_id == project_id,
        BimOperationalNotification.empresa_id == company_id,
        BimOperationalNotification.usuario_id == user_id,
        BimOperationalNotification.resolved_at.is_(None),
    ).order_by(
        BimOperationalNotification.escalation_level.desc(),
        BimOperationalNotification.due_at.asc(),
        BimOperationalNotification.id.desc(),
    ).all()
    return [_serialize(value) for value in values]


def acknowledge_operational_notification(
    db: Session,
    *,
    notification_id: int,
    project_id: int,
    company_id: int,
    user_id: int,
) -> dict:
    value = db.query(BimOperationalNotification).filter(
        BimOperationalNotification.id == notification_id,
        BimOperationalNotification.proyecto_id == project_id,
        BimOperationalNotification.empresa_id == company_id,
        BimOperationalNotification.usuario_id == user_id,
        BimOperationalNotification.resolved_at.is_(None),
    ).first()
    if value is None:
        raise HTTPException(status_code=404, detail="Alerta operacional BIM no encontrada.")
    if value.acknowledged_at is None:
        value.acknowledged_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(value)
    return _serialize(value)
