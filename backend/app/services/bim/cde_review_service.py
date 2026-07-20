from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_cde_review import BimCdeReview, BimCdeReviewComment, BimCdeReviewNotification
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.usuario import Usuario
from app.services.bim.cde_collaboration_service import record_collaboration_event


def _get_review(db: Session, *, review_id: int, project_id: int, company_id: int) -> BimCdeReview:
    review = db.query(BimCdeReview).filter(BimCdeReview.id == review_id, BimCdeReview.proyecto_id == project_id, BimCdeReview.empresa_id == company_id).first()
    if review is None:
        raise HTTPException(status_code=404, detail="Revision CDE BIM no encontrada.")
    return review


def _require_participant(review: BimCdeReview, *, user_id: int, can_override: bool) -> None:
    if not can_override and user_id not in {review.created_by, review.assigned_to}:
        raise HTTPException(status_code=403, detail="Solo los participantes pueden operar esta revision CDE.")


def _notify(db: Session, review: BimCdeReview, *, user_id: int | None, event_type: str, key: str) -> None:
    if not user_id:
        return
    db.add(BimCdeReviewNotification(
        review_id=review.id,
        empresa_id=review.empresa_id,
        proyecto_id=review.proyecto_id,
        usuario_id=user_id,
        event_type=event_type,
        dedupe_key=f"review:{review.id}:{key}:user:{user_id}",
    ))


def _validate_context(db: Session, *, project_id: int, company_id: int, document_revision_id: int, global_id: str | None, assigned_to: int):
    revision = (
        db.query(BimCdeDocumentRevision)
        .join(BimCdeDocument, BimCdeDocument.id == BimCdeDocumentRevision.document_id)
        .filter(
            BimCdeDocumentRevision.id == document_revision_id,
            BimCdeDocument.proyecto_id == project_id,
            BimCdeDocument.empresa_id == company_id,
        )
        .first()
    )
    if revision is None:
        raise HTTPException(status_code=404, detail="Revision documental fuera del proyecto BIM activo.")
    assignee = db.query(Usuario).filter(Usuario.id == assigned_to, Usuario.empresa_id == company_id, Usuario.activo.is_(True)).first()
    if assignee is None:
        raise HTTPException(status_code=404, detail="Responsable de revision fuera de la empresa activa.")
    if global_id and not (
        db.query(BimElement)
        .join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id)
        .join(BimModel, BimModel.id == BimModelVersion.bim_model_id)
        .filter(BimElement.global_id == global_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id)
        .first()
    ):
        raise HTTPException(status_code=404, detail="Elemento contextual fuera del proyecto BIM activo.")
    return revision


def _serialize(db: Session, review: BimCdeReview) -> dict:
    revision, document, assignee = (
        db.query(BimCdeDocumentRevision, BimCdeDocument, Usuario)
        .join(BimCdeDocument, BimCdeDocument.id == BimCdeDocumentRevision.document_id)
        .join(Usuario, Usuario.id == review.assigned_to)
        .filter(BimCdeDocumentRevision.id == review.document_revision_id)
        .one()
    )
    comments = db.query(BimCdeReviewComment).filter(BimCdeReviewComment.review_id == review.id).order_by(BimCdeReviewComment.id.asc()).all()
    return {
        "id": review.id,
        "project_id": review.proyecto_id,
        "company_id": review.empresa_id,
        "review_number": review.review_number,
        "title": review.title,
        "status": review.status,
        "document_revision_id": revision.id,
        "document_id": document.id,
        "document_code": document.document_code,
        "document_revision": revision.revision,
        "version_label": revision.version_label,
        "global_id": review.global_id,
        "viewpoint": review.viewpoint_json,
        "assigned_to": review.assigned_to,
        "assigned_name": assignee.nombre_completo or assignee.email,
        "due_at": review.due_at,
        "created_by": review.created_by,
        "resolution": review.resolution,
        "lock_version": review.lock_version,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
        "resolved_at": review.resolved_at,
        "closed_at": review.closed_at,
        "comments": [{"id": item.id, "body": item.body, "created_by": item.created_by, "created_at": item.created_at} for item in comments],
    }


def create_review(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    now = datetime.now(timezone.utc)
    if payload.due_at <= now:
        raise HTTPException(status_code=400, detail="El vencimiento de revision debe estar en el futuro.")
    _validate_context(db, project_id=project_id, company_id=company_id, document_revision_id=payload.document_revision_id, global_id=payload.global_id, assigned_to=payload.assigned_to)
    last_number = db.query(func.max(BimCdeReview.review_number)).filter(BimCdeReview.proyecto_id == project_id, BimCdeReview.empresa_id == company_id).scalar()
    sequence = int(last_number.rsplit("-", 1)[-1]) + 1 if last_number else 1
    review = BimCdeReview(
        empresa_id=company_id,
        proyecto_id=project_id,
        review_number=f"REV-{sequence:04d}",
        title=payload.title.strip(),
        status="open",
        document_revision_id=payload.document_revision_id,
        global_id=payload.global_id.strip() if payload.global_id else None,
        viewpoint_json=payload.viewpoint,
        assigned_to=payload.assigned_to,
        due_at=payload.due_at,
        created_by=user_id,
        lock_version=1,
    )
    db.add(review); db.flush()
    comment = BimCdeReviewComment(review_id=review.id, body=payload.initial_comment.strip(), created_by=user_id)
    db.add(comment); db.flush()
    if payload.assigned_to != user_id:
        _notify(db, review, user_id=payload.assigned_to, event_type="assigned", key="created")
    record_collaboration_event(
        db,
        project_id=project_id,
        company_id=company_id,
        actor_id=user_id,
        event_type="review.created",
        summary=f"Creo {review.review_number}: {review.title}",
        entity_type="cde_review",
        entity_id=review.id,
        payload={"review_number": review.review_number, "status": review.status},
    )
    db.commit(); db.refresh(review)
    return _serialize(db, review)


def list_reviews(db: Session, *, project_id: int, company_id: int, user_id: int, can_override: bool) -> list[dict]:
    query = db.query(BimCdeReview).filter(BimCdeReview.proyecto_id == project_id, BimCdeReview.empresa_id == company_id)
    if not can_override:
        query = query.filter(or_(BimCdeReview.created_by == user_id, BimCdeReview.assigned_to == user_id))
    return [_serialize(db, item) for item in query.order_by(BimCdeReview.id.desc()).all()]


def add_review_comment(db: Session, *, review_id: int, project_id: int, company_id: int, user_id: int, can_override: bool, payload) -> dict:
    review = _get_review(db, review_id=review_id, project_id=project_id, company_id=company_id)
    _require_participant(review, user_id=user_id, can_override=can_override)
    if review.status == "closed":
        raise HTTPException(status_code=409, detail="Una revision cerrada no admite comentarios.")
    if review.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La revision fue actualizada por otro usuario.")
    comment = BimCdeReviewComment(review_id=review.id, body=payload.body.strip(), created_by=user_id)
    db.add(comment); db.flush()
    target = review.assigned_to if user_id == review.created_by else review.created_by
    _notify(db, review, user_id=target, event_type="commented", key=f"comment:{comment.id}")
    review.lock_version += 1
    record_collaboration_event(
        db,
        project_id=project_id,
        company_id=company_id,
        actor_id=user_id,
        event_type="review.commented",
        summary=f"Comento {review.review_number}: {review.title}",
        entity_type="cde_review",
        entity_id=review.id,
        payload={"review_number": review.review_number, "comment_id": comment.id},
    )
    db.commit(); db.refresh(review)
    return _serialize(db, review)


def transition_review(db: Session, *, review_id: int, project_id: int, company_id: int, user_id: int, can_override: bool, payload) -> dict:
    review = _get_review(db, review_id=review_id, project_id=project_id, company_id=company_id)
    _require_participant(review, user_id=user_id, can_override=can_override)
    if review.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La revision fue actualizada por otro usuario.")
    now = datetime.now(timezone.utc)
    if payload.action == "resolve":
        if review.status != "open" or (user_id != review.assigned_to and not can_override):
            raise HTTPException(status_code=403 if review.status == "open" else 409, detail="Solo el responsable puede resolver una revision abierta.")
        if not payload.resolution or len(payload.resolution.strip()) < 3:
            raise HTTPException(status_code=400, detail="Resolver exige una respuesta verificable.")
        review.status = "resolved"; review.resolution = payload.resolution.strip(); review.resolved_by = user_id; review.resolved_at = now
        _notify(db, review, user_id=review.created_by, event_type="resolved", key=f"resolved:{review.lock_version}")
    elif payload.action == "reopen":
        if review.status != "resolved" or (user_id != review.created_by and not can_override):
            raise HTTPException(status_code=403 if review.status == "resolved" else 409, detail="Solo el creador puede reabrir una revision resuelta.")
        review.status = "open"; review.resolution = None; review.resolved_by = None; review.resolved_at = None
        _notify(db, review, user_id=review.assigned_to, event_type="reopened", key=f"reopened:{review.lock_version}")
    elif payload.action == "close":
        if review.status != "resolved" or (user_id != review.created_by and not can_override):
            raise HTTPException(status_code=403 if review.status == "resolved" else 409, detail="Solo el creador puede cerrar una revision resuelta.")
        review.status = "closed"; review.closed_by = user_id; review.closed_at = now
        _notify(db, review, user_id=review.assigned_to, event_type="closed", key=f"closed:{review.lock_version}")
    review.lock_version += 1
    record_collaboration_event(
        db,
        project_id=project_id,
        company_id=company_id,
        actor_id=user_id,
        event_type=f"review.{payload.action}",
        summary=f"Actualizo {review.review_number} a {review.status}.",
        entity_type="cde_review",
        entity_id=review.id,
        payload={"review_number": review.review_number, "status": review.status},
    )
    db.commit(); db.refresh(review)
    return _serialize(db, review)


def list_review_notifications(db: Session, *, project_id: int, company_id: int, user_id: int) -> list[dict]:
    rows = (
        db.query(BimCdeReviewNotification, BimCdeReview)
        .join(BimCdeReview, BimCdeReview.id == BimCdeReviewNotification.review_id)
        .filter(
            BimCdeReviewNotification.proyecto_id == project_id,
            BimCdeReviewNotification.empresa_id == company_id,
            BimCdeReviewNotification.usuario_id == user_id,
        )
        .order_by(BimCdeReviewNotification.id.desc())
        .all()
    )
    return [{"id": item.id, "review_id": review.id, "review_number": review.review_number, "title": review.title, "event_type": item.event_type, "read_at": item.read_at, "created_at": item.created_at} for item, review in rows]


def mark_review_notification_read(db: Session, *, notification_id: int, project_id: int, company_id: int, user_id: int) -> dict:
    item = db.query(BimCdeReviewNotification).filter(BimCdeReviewNotification.id == notification_id, BimCdeReviewNotification.proyecto_id == project_id, BimCdeReviewNotification.empresa_id == company_id, BimCdeReviewNotification.usuario_id == user_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Notificacion de revision no encontrada.")
    if item.read_at is None:
        item.read_at = datetime.now(timezone.utc); db.commit(); db.refresh(item)
    return next(row for row in list_review_notifications(db, project_id=project_id, company_id=company_id, user_id=user_id) if row["id"] == item.id)
