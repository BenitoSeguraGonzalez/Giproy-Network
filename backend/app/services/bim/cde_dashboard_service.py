from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.bim_cde import BimCdeDocumentRevision
from app.models.bim_cde_review import BimCdeReview, BimCdeReviewNotification
from app.models.bim_cde_rfi import BimCdeRfi
from app.models.bim_cde_submittal import BimCdeSubmittal
from app.models.bim_operational_notification import BimOperationalNotification
from app.models.usuario import Usuario
from app.services.bim.cde_document_service import list_documents


RFI_OPEN_STATUSES = {"draft", "submitted", "answered"}
RFI_OVERDUE_STATUSES = {"draft", "submitted"}
SUBMITTAL_PENDING_STATUSES = {"submitted", "under_review"}
SUBMITTAL_ACTIVE_STATUSES = {"draft", "submitted", "under_review", "rejected"}
REVIEW_OPEN_STATUSES = {"open"}


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _is_overdue(value: datetime | None, *, status: str, active_statuses: set[str], now: datetime) -> bool:
    due_at = _as_utc(value)
    return due_at is not None and status in active_statuses and due_at < now


def _status_counts(rows) -> dict[str, int]:
    return dict(sorted(Counter(item.status for item in rows).items()))


def get_cde_dashboard(
    db: Session,
    *,
    project_id: int,
    company_id: int,
    user_id: int,
    requester_role: str,
    can_override: bool,
    now: datetime | None = None,
) -> dict:
    generated_at = _as_utc(now) or datetime.now(timezone.utc)
    documents = list_documents(
        db,
        project_id=project_id,
        company_id=company_id,
        requester_id=user_id,
        requester_role=requester_role,
    )
    document_ids = [item["id"] for item in documents]
    revision_count = 0
    if document_ids:
        revision_count = (
            db.query(BimCdeDocumentRevision)
            .filter(
                BimCdeDocumentRevision.proyecto_id == project_id,
                BimCdeDocumentRevision.empresa_id == company_id,
                BimCdeDocumentRevision.document_id.in_(document_ids),
            )
            .count()
        )

    rfi_query = db.query(BimCdeRfi).filter(
        BimCdeRfi.proyecto_id == project_id,
        BimCdeRfi.empresa_id == company_id,
    )
    submittal_query = db.query(BimCdeSubmittal).filter(
        BimCdeSubmittal.proyecto_id == project_id,
        BimCdeSubmittal.empresa_id == company_id,
    )
    review_query = db.query(BimCdeReview).filter(
        BimCdeReview.proyecto_id == project_id,
        BimCdeReview.empresa_id == company_id,
    )
    if not can_override:
        rfi_query = rfi_query.filter(or_(BimCdeRfi.created_by == user_id, BimCdeRfi.assigned_to == user_id))
        submittal_query = submittal_query.filter(
            or_(BimCdeSubmittal.created_by == user_id, BimCdeSubmittal.reviewer_id == user_id)
        )
        review_query = review_query.filter(
            or_(BimCdeReview.created_by == user_id, BimCdeReview.assigned_to == user_id)
        )
    rfis = rfi_query.order_by(BimCdeRfi.id.desc()).all()
    submittals = submittal_query.order_by(BimCdeSubmittal.id.desc()).all()
    reviews = review_query.order_by(BimCdeReview.id.desc()).all()

    user_ids = {
        item
        for item in [
            *(row.assigned_to for row in rfis),
            *(row.reviewer_id for row in submittals),
            *(row.assigned_to for row in reviews),
        ]
        if item is not None
    }
    users = {}
    if user_ids:
        users = {
            row.id: row.nombre_completo or row.email
            for row in db.query(Usuario).filter(Usuario.empresa_id == company_id, Usuario.id.in_(user_ids)).all()
        }

    workload: dict[int, dict] = {}

    def register(user: int | None, kind: str, overdue: bool) -> None:
        if user is None:
            return
        entry = workload.setdefault(
            user,
            {"user_id": user, "name": users.get(user, f"Usuario {user}"), "rfis": 0, "submittals": 0, "reviews": 0, "overdue": 0},
        )
        entry[kind] += 1
        if overdue:
            entry["overdue"] += 1

    queue = []
    overdue_rfis = 0
    for row in rfis:
        overdue = _is_overdue(row.due_at, status=row.status, active_statuses=RFI_OVERDUE_STATUSES, now=generated_at)
        overdue_rfis += int(overdue)
        if row.status in RFI_OPEN_STATUSES:
            register(row.assigned_to, "rfis", overdue)
            queue.append({
                "item_type": "rfi", "item_id": row.id, "number": row.rfi_number,
                "title": row.subject, "status": row.status, "due_at": row.due_at,
                "responsible_id": row.assigned_to, "responsible_name": users.get(row.assigned_to), "overdue": overdue,
            })

    overdue_submittals = 0
    for row in submittals:
        overdue = _is_overdue(row.required_at, status=row.status, active_statuses=SUBMITTAL_ACTIVE_STATUSES, now=generated_at)
        overdue_submittals += int(overdue)
        if row.status in SUBMITTAL_ACTIVE_STATUSES:
            register(row.reviewer_id, "submittals", overdue)
            queue.append({
                "item_type": "submittal", "item_id": row.id, "number": row.submittal_number,
                "title": row.title, "status": row.status, "due_at": row.required_at,
                "responsible_id": row.reviewer_id, "responsible_name": users.get(row.reviewer_id), "overdue": overdue,
            })

    overdue_reviews = 0
    for row in reviews:
        overdue = _is_overdue(row.due_at, status=row.status, active_statuses=REVIEW_OPEN_STATUSES, now=generated_at)
        overdue_reviews += int(overdue)
        if row.status in REVIEW_OPEN_STATUSES:
            register(row.assigned_to, "reviews", overdue)
            queue.append({
                "item_type": "review", "item_id": row.id, "number": row.review_number,
                "title": row.title, "status": row.status, "due_at": row.due_at,
                "responsible_id": row.assigned_to, "responsible_name": users.get(row.assigned_to), "overdue": overdue,
            })

    for entry in workload.values():
        entry["total"] = entry["rfis"] + entry["submittals"] + entry["reviews"]
    responsible_workload = sorted(workload.values(), key=lambda item: (-item["overdue"], -item["total"], item["name"]))
    priority_queue = sorted(
        queue,
        key=lambda item: (
            not item["overdue"],
            _as_utc(item["due_at"]) or datetime.max.replace(tzinfo=timezone.utc),
            item["item_type"],
            item["item_id"],
        ),
    )[:50]
    unread_notifications = db.query(BimCdeReviewNotification).filter(
        BimCdeReviewNotification.proyecto_id == project_id,
        BimCdeReviewNotification.empresa_id == company_id,
        BimCdeReviewNotification.usuario_id == user_id,
        BimCdeReviewNotification.read_at.is_(None),
    ).count()
    unread_notifications += db.query(BimOperationalNotification).filter(
        BimOperationalNotification.proyecto_id == project_id,
        BimOperationalNotification.empresa_id == company_id,
        BimOperationalNotification.usuario_id == user_id,
        BimOperationalNotification.acknowledged_at.is_(None),
        BimOperationalNotification.resolved_at.is_(None),
    ).count()

    return {
        "project_id": project_id,
        "company_id": company_id,
        "generated_at": generated_at,
        "scope": "project" if can_override else "participant",
        "totals": {
            "documents": len(documents),
            "document_revisions": revision_count,
            "open_rfis": sum(item.status in RFI_OPEN_STATUSES for item in rfis),
            "overdue_rfis": overdue_rfis,
            "pending_submittals": sum(item.status in SUBMITTAL_PENDING_STATUSES for item in submittals),
            "overdue_submittals": overdue_submittals,
            "open_reviews": sum(item.status in REVIEW_OPEN_STATUSES for item in reviews),
            "overdue_reviews": overdue_reviews,
            "unread_notifications": unread_notifications,
        },
        "document_statuses": dict(sorted(Counter(item["status"] for item in documents).items())),
        "rfi_statuses": _status_counts(rfis),
        "submittal_statuses": _status_counts(submittals),
        "review_statuses": _status_counts(reviews),
        "responsible_workload": responsible_workload,
        "priority_queue": priority_queue,
    }
