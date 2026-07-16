from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.bim_cde import BimCdeDocument
from app.models.bim_cde_rfi import BimCdeRfi, BimCdeRfiEvent
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.usuario import Usuario


def _get_rfi(db: Session, *, rfi_id: int, project_id: int, company_id: int) -> BimCdeRfi:
    rfi = db.query(BimCdeRfi).filter(BimCdeRfi.id == rfi_id, BimCdeRfi.proyecto_id == project_id, BimCdeRfi.empresa_id == company_id).first()
    if rfi is None:
        raise HTTPException(status_code=404, detail="RFI BIM no encontrado.")
    return rfi


def _validate_refs(db: Session, *, project_id: int, company_id: int, document_id: int | None, global_id: str | None, assigned_to: int | None) -> None:
    if document_id and not db.query(BimCdeDocument).filter(BimCdeDocument.id == document_id, BimCdeDocument.proyecto_id == project_id, BimCdeDocument.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Documento CDE fuera del proyecto activo.")
    if assigned_to and not db.query(Usuario).filter(Usuario.id == assigned_to, Usuario.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Responsable RFI fuera de la empresa activa.")
    if global_id and not db.query(BimElement).join(BimModelVersion, BimModelVersion.id == BimElement.bim_model_version_id).join(BimModel, BimModel.id == BimModelVersion.bim_model_id).filter(BimElement.global_id == global_id, BimModel.proyecto_id == project_id, BimModel.empresa_id == company_id).first():
        raise HTTPException(status_code=404, detail="Elemento RFI fuera del proyecto BIM activo.")


def _serialize(db: Session, rfi: BimCdeRfi) -> dict:
    events = db.query(BimCdeRfiEvent).filter(BimCdeRfiEvent.rfi_id == rfi.id).order_by(BimCdeRfiEvent.id.asc()).all()
    return {
        "id": rfi.id, "project_id": rfi.proyecto_id, "company_id": rfi.empresa_id,
        "rfi_number": rfi.rfi_number, "subject": rfi.subject, "question": rfi.question,
        "priority": rfi.priority, "status": rfi.status, "due_at": rfi.due_at,
        "document_id": rfi.document_id, "global_id": rfi.global_id, "assigned_to": rfi.assigned_to,
        "answer": rfi.answer, "created_by": rfi.created_by, "answered_by": rfi.answered_by,
        "closed_by": rfi.closed_by, "lock_version": rfi.lock_version, "created_at": rfi.created_at,
        "submitted_at": rfi.submitted_at, "answered_at": rfi.answered_at, "closed_at": rfi.closed_at,
        "updated_at": rfi.updated_at,
        "events": [{"id": item.id, "event_type": item.event_type, "payload": item.payload_json or {}, "created_by": item.created_by, "created_at": item.created_at} for item in events],
    }


def list_rfi_assignees(db: Session, *, company_id: int) -> list[dict]:
    rows = db.query(Usuario).filter(Usuario.empresa_id == company_id).order_by(Usuario.nombre_completo.asc(), Usuario.id.asc()).all()
    return [{"id": item.id, "name": item.nombre_completo or item.email, "email": item.email} for item in rows]


def create_rfi(db: Session, *, project_id: int, company_id: int, user_id: int, payload) -> dict:
    _validate_refs(db, project_id=project_id, company_id=company_id, document_id=payload.document_id, global_id=payload.global_id, assigned_to=payload.assigned_to)
    last_number = db.query(func.max(BimCdeRfi.rfi_number)).filter(BimCdeRfi.proyecto_id == project_id, BimCdeRfi.empresa_id == company_id).scalar()
    sequence = int(last_number.rsplit("-", 1)[-1]) + 1 if last_number else 1
    rfi = BimCdeRfi(
        empresa_id=company_id, proyecto_id=project_id, rfi_number=f"RFI-{sequence:04d}",
        subject=payload.subject.strip(), question=payload.question.strip(), priority=payload.priority,
        status="draft", due_at=payload.due_at, document_id=payload.document_id,
        global_id=payload.global_id.strip() if payload.global_id else None,
        assigned_to=payload.assigned_to, created_by=user_id, lock_version=1,
    )
    db.add(rfi); db.flush()
    db.add(BimCdeRfiEvent(rfi_id=rfi.id, event_type="created", payload_json={"status": "draft"}, created_by=user_id))
    db.commit(); db.refresh(rfi)
    return _serialize(db, rfi)


def list_rfis(db: Session, *, project_id: int, company_id: int) -> list[dict]:
    rows = db.query(BimCdeRfi).filter(BimCdeRfi.proyecto_id == project_id, BimCdeRfi.empresa_id == company_id).order_by(BimCdeRfi.id.desc()).all()
    return [_serialize(db, item) for item in rows]


def transition_rfi(db: Session, *, rfi_id: int, project_id: int, company_id: int, user_id: int, can_override: bool, payload) -> dict:
    rfi = _get_rfi(db, rfi_id=rfi_id, project_id=project_id, company_id=company_id)
    if rfi.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El RFI fue actualizado por otro usuario.")
    now = datetime.now(timezone.utc)
    event_payload = {"reason": payload.reason}
    if payload.action == "submit":
        if rfi.status != "draft":
            raise HTTPException(status_code=409, detail="Solo un RFI borrador puede enviarse.")
        assignee = payload.assigned_to or rfi.assigned_to
        due_at = payload.due_at or rfi.due_at
        _validate_refs(db, project_id=project_id, company_id=company_id, document_id=rfi.document_id, global_id=rfi.global_id, assigned_to=assignee)
        if not assignee or not due_at:
            raise HTTPException(status_code=400, detail="Enviar un RFI exige responsable y vencimiento.")
        if due_at <= now:
            raise HTTPException(status_code=400, detail="El vencimiento RFI debe estar en el futuro.")
        rfi.assigned_to = assignee; rfi.due_at = due_at; rfi.status = "submitted"; rfi.submitted_at = now
        event_payload.update({"assigned_to": assignee, "due_at": due_at.isoformat()})
    elif payload.action == "answer":
        if rfi.status != "submitted":
            raise HTTPException(status_code=409, detail="Solo un RFI enviado puede responderse.")
        if user_id != rfi.assigned_to and not can_override:
            raise HTTPException(status_code=403, detail="Solo el responsable puede responder el RFI.")
        if not payload.answer or len(payload.answer.strip()) < 5:
            raise HTTPException(status_code=400, detail="La respuesta RFI es obligatoria.")
        rfi.answer = payload.answer.strip(); rfi.status = "answered"; rfi.answered_by = user_id; rfi.answered_at = now
        event_payload["answer"] = rfi.answer
    elif payload.action == "close":
        if rfi.status != "answered":
            raise HTTPException(status_code=409, detail="Solo un RFI respondido puede cerrarse.")
        if user_id != rfi.created_by and not can_override:
            raise HTTPException(status_code=403, detail="Solo el creador puede cerrar el RFI.")
        rfi.status = "closed"; rfi.closed_by = user_id; rfi.closed_at = now
    elif payload.action == "void":
        if rfi.status not in {"draft", "submitted"}:
            raise HTTPException(status_code=409, detail="El RFI ya no puede anularse.")
        if user_id != rfi.created_by and not can_override:
            raise HTTPException(status_code=403, detail="Solo el creador puede anular el RFI.")
        rfi.status = "void"; rfi.closed_by = user_id; rfi.closed_at = now
    rfi.lock_version += 1
    db.add(BimCdeRfiEvent(rfi_id=rfi.id, event_type=payload.action, payload_json=event_payload, created_by=user_id))
    db.commit(); db.refresh(rfi)
    return _serialize(db, rfi)
