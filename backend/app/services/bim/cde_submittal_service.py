from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_cde_submittal import BimCdeSubmittal, BimCdeSubmittalEvent, BimCdeSubmittalRevision
from app.models.usuario import Usuario


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _get_submittal(db: Session, *, submittal_id: int, project_id: int, company_id: int) -> BimCdeSubmittal:
    row = db.query(BimCdeSubmittal).filter(BimCdeSubmittal.id == submittal_id, BimCdeSubmittal.proyecto_id == project_id, BimCdeSubmittal.empresa_id == company_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Submittal BIM no encontrado.")
    return row


def _current_document_revision(db: Session, *, document_id: int, project_id: int, company_id: int) -> tuple[BimCdeDocument, BimCdeDocumentRevision]:
    document = db.query(BimCdeDocument).filter(BimCdeDocument.id == document_id, BimCdeDocument.proyecto_id == project_id, BimCdeDocument.empresa_id == company_id, BimCdeDocument.status == "active").first()
    if document is None:
        raise HTTPException(status_code=404, detail="Documento CDE del submittal fuera del proyecto activo.")
    revision = db.query(BimCdeDocumentRevision).filter(BimCdeDocumentRevision.document_id == document.id, BimCdeDocumentRevision.status == "current").first()
    if revision is None:
        raise HTTPException(status_code=409, detail="El documento CDE no tiene revision vigente.")
    return document, revision


def _validate_reviewer(db: Session, *, reviewer_id: int, company_id: int) -> None:
    if not db.query(Usuario).filter(Usuario.id == reviewer_id, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Revisor del submittal fuera de la empresa activa.")


def _current_revision(db: Session, submittal: BimCdeSubmittal) -> BimCdeSubmittalRevision:
    revision = db.query(BimCdeSubmittalRevision).filter(BimCdeSubmittalRevision.submittal_id == submittal.id, BimCdeSubmittalRevision.revision == submittal.current_revision).first()
    if revision is None:
        raise HTTPException(status_code=409, detail="Revision vigente del submittal no disponible.")
    return revision


def _serialize_revision(row: BimCdeSubmittalRevision) -> dict:
    return {"id": row.id, "revision": row.revision, "document_id": row.document_id, "document_revision_id": row.document_revision_id, "status": row.status, "submission_notes": row.submission_notes, "decision_comment": row.decision_comment, "submitted_by": row.submitted_by, "reviewed_by": row.reviewed_by, "submitted_at": row.submitted_at, "reviewed_at": row.reviewed_at, "created_at": row.created_at}


def _serialize(db: Session, row: BimCdeSubmittal) -> dict:
    revisions = db.query(BimCdeSubmittalRevision).filter(BimCdeSubmittalRevision.submittal_id == row.id).order_by(BimCdeSubmittalRevision.revision.desc()).all()
    events = db.query(BimCdeSubmittalEvent).filter(BimCdeSubmittalEvent.submittal_id == row.id).order_by(BimCdeSubmittalEvent.id.asc()).all()
    return {
        "id": row.id, "project_id": row.proyecto_id, "company_id": row.empresa_id,
        "submittal_number": row.submittal_number, "title": row.title, "submittal_type": row.submittal_type,
        "discipline": row.discipline, "specification_section": row.specification_section,
        "reviewer_id": row.reviewer_id, "required_at": row.required_at, "status": row.status,
        "current_revision": row.current_revision, "lock_version": row.lock_version,
        "created_by": row.created_by, "created_at": row.created_at, "updated_at": row.updated_at,
        "revisions": [_serialize_revision(item) for item in revisions],
        "events": [{"id": item.id, "event_type": item.event_type, "payload": item.payload_json or {}, "created_by": item.created_by, "created_at": item.created_at} for item in events],
    }


def create_submittal(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    now = datetime.now(timezone.utc)
    if _as_utc(payload.required_at) <= now:
        raise HTTPException(status_code=400, detail="La fecha requerida del submittal debe estar en el futuro.")
    _validate_reviewer(db, reviewer_id=payload.reviewer_id, company_id=company_id)
    document, document_revision = _current_document_revision(db, document_id=payload.document_id, project_id=project_id, company_id=company_id)
    if payload.submittal_type == "shop_drawing" and document.category not in {"drawing", "model"}:
        raise HTTPException(status_code=400, detail="Un plano de ingenieria exige documento CDE de tipo plano o modelo.")
    last_number = db.query(func.max(BimCdeSubmittal.submittal_number)).filter(BimCdeSubmittal.proyecto_id == project_id, BimCdeSubmittal.empresa_id == company_id).scalar()
    sequence = int(last_number.rsplit("-", 1)[-1]) + 1 if last_number else 1
    row = BimCdeSubmittal(
        empresa_id=company_id, proyecto_id=project_id, submittal_number=f"SUB-{sequence:04d}",
        title=payload.title.strip(), submittal_type=payload.submittal_type, discipline=payload.discipline.strip(),
        specification_section=payload.specification_section.strip() if payload.specification_section else None,
        reviewer_id=payload.reviewer_id, required_at=payload.required_at, status="draft",
        current_revision=1, lock_version=1, created_by=user_id,
    )
    db.add(row); db.flush()
    db.add(BimCdeSubmittalRevision(submittal_id=row.id, revision=1, document_id=document.id, document_revision_id=document_revision.id, status="draft", submission_notes=payload.submission_notes.strip() if payload.submission_notes else None))
    db.add(BimCdeSubmittalEvent(submittal_id=row.id, event_type="created", payload_json={"document_revision_id": document_revision.id}, created_by=user_id))
    db.commit(); db.refresh(row)
    return _serialize(db, row)


def list_submittals(db: Session, *, project_id: int, company_id: int) -> list[dict]:
    rows = db.query(BimCdeSubmittal).filter(BimCdeSubmittal.proyecto_id == project_id, BimCdeSubmittal.empresa_id == company_id).order_by(BimCdeSubmittal.id.desc()).all()
    return [_serialize(db, item) for item in rows]


def create_submittal_revision(db: Session, *, submittal_id: int, project_id: int, company_id: int, user_id: int, can_override: bool, payload) -> dict:
    row = _get_submittal(db, submittal_id=submittal_id, project_id=project_id, company_id=company_id)
    if row.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El submittal fue actualizado por otro usuario.")
    if row.status != "rejected":
        raise HTTPException(status_code=409, detail="Solo un submittal rechazado admite nueva revision.")
    if user_id != row.created_by and not can_override:
        raise HTTPException(status_code=403, detail="Solo el creador puede reenviar el submittal.")
    document, document_revision = _current_document_revision(db, document_id=payload.document_id, project_id=project_id, company_id=company_id)
    if row.submittal_type == "shop_drawing" and document.category not in {"drawing", "model"}:
        raise HTTPException(status_code=400, detail="Un plano de ingenieria exige documento CDE de tipo plano o modelo.")
    previous = _current_revision(db, row)
    if previous.document_revision_id == document_revision.id:
        raise HTTPException(status_code=400, detail="El reenvio exige una nueva revision documental CDE.")
    previous.status = "superseded"
    row.current_revision += 1; row.status = "draft"; row.lock_version += 1
    db.add(BimCdeSubmittalRevision(submittal_id=row.id, revision=row.current_revision, document_id=document.id, document_revision_id=document_revision.id, status="draft", submission_notes=payload.submission_notes.strip()))
    db.add(BimCdeSubmittalEvent(submittal_id=row.id, event_type="revision_created", payload_json={"revision": row.current_revision, "document_revision_id": document_revision.id}, created_by=user_id))
    db.commit(); db.refresh(row)
    return _serialize(db, row)


def transition_submittal(db: Session, *, submittal_id: int, project_id: int, company_id: int, user_id: int, can_override: bool, payload) -> dict:
    row = _get_submittal(db, submittal_id=submittal_id, project_id=project_id, company_id=company_id)
    if row.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El submittal fue actualizado por otro usuario.")
    revision = _current_revision(db, row)
    now = datetime.now(timezone.utc)
    if payload.action == "submit":
        if row.status != "draft":
            raise HTTPException(status_code=409, detail="Solo un submittal borrador puede enviarse.")
        if user_id != row.created_by and not can_override:
            raise HTTPException(status_code=403, detail="Solo el creador puede enviar el submittal.")
        if _as_utc(row.required_at) <= now:
            raise HTTPException(status_code=400, detail="La fecha requerida del submittal ya vencio.")
        row.status = revision.status = "submitted"; revision.submitted_by = user_id; revision.submitted_at = now
    elif payload.action == "start_review":
        if row.status != "submitted":
            raise HTTPException(status_code=409, detail="Solo un submittal enviado puede entrar en revision.")
        if user_id != row.reviewer_id and not can_override:
            raise HTTPException(status_code=403, detail="Solo el revisor asignado puede iniciar la revision.")
        row.status = revision.status = "under_review"
    elif payload.action in {"approve", "reject"}:
        if row.status != "under_review":
            raise HTTPException(status_code=409, detail="Solo un submittal en revision puede decidirse.")
        if user_id != row.reviewer_id and not can_override:
            raise HTTPException(status_code=403, detail="Solo el revisor asignado puede decidir el submittal.")
        row.status = revision.status = "approved" if payload.action == "approve" else "rejected"
        revision.reviewed_by = user_id; revision.reviewed_at = now; revision.decision_comment = payload.comment.strip()
    elif payload.action == "void":
        if row.status not in {"draft", "submitted"}:
            raise HTTPException(status_code=409, detail="El submittal ya no puede anularse.")
        if user_id != row.created_by and not can_override:
            raise HTTPException(status_code=403, detail="Solo el creador puede anular el submittal.")
        row.status = revision.status = "void"
    row.lock_version += 1
    db.add(BimCdeSubmittalEvent(submittal_id=row.id, event_type=payload.action, payload_json={"comment": payload.comment, "revision": row.current_revision}, created_by=user_id))
    db.commit(); db.refresh(row)
    return _serialize(db, row)
