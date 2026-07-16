from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cde_review import BimCdeReviewCommentCreate, BimCdeReviewCreate, BimCdeReviewTransition
from app.services.bim.cde_review_service import (
    add_review_comment,
    create_review,
    list_review_notifications,
    list_reviews,
    mark_review_notification_read,
    transition_review,
)


def _context(db, company):
    project = Proyecto(nombre="Revision CDE", codigo_root="REV-CDE", revision=4, empresa_id=company.id)
    creator = Usuario(email="review-creator@example.com", hashed_password="x", nombre_completo="Creador Review", empresa_id=company.id, rol="coordinador", activo=True)
    assignee = Usuario(email="review-assignee@example.com", hashed_password="x", nombre_completo="Responsable Review", empresa_id=company.id, rol="usuario", activo=True)
    outsider = Usuario(email="review-outsider@example.com", hashed_password="x", nombre_completo="Ajeno Review", empresa_id=company.id, rol="usuario", activo=True)
    db.add_all([project, creator, assignee, outsider]); db.flush()
    document = BimCdeDocument(empresa_id=company.id, proyecto_id=project.id, document_code="PLN-001", title="Plano coordinado", category="drawing", status="active", current_revision=1, created_by=creator.id)
    db.add(document); db.flush()
    revision = BimCdeDocumentRevision(document_id=document.id, empresa_id=company.id, proyecto_id=project.id, revision=1, version_label="P01", source_filename="plano.pdf", stored_path="test/plano.pdf", media_type="application/pdf", file_size_bytes=10, checksum_sha256="a" * 64, status="current", created_by=creator.id)
    db.add(revision); db.commit()
    return project, creator, assignee, outsider, revision


def _create(db, project, company, creator, assignee, revision):
    return create_review(
        db,
        project_id=project.id,
        company_id=company.id,
        user_id=creator.id,
        payload=BimCdeReviewCreate(
            title="Revisar encuentro de fachada",
            document_revision_id=revision.id,
            viewpoint={"camera": {"position": [1, 2, 3]}},
            assigned_to=assignee.id,
            due_at=datetime.now(timezone.utc) + timedelta(days=5),
            initial_comment="Validar detalle y tolerancias del encuentro.",
        ),
    )


def test_contextual_review_comments_decisions_and_notifications(db, sample_empresa):
    project, creator, assignee, _outsider, revision = _context(db, sample_empresa)
    review = _create(db, project, sample_empresa, creator, assignee, revision)
    assert review["review_number"] == "REV-0001" and review["document_revision_id"] == revision.id
    assert review["viewpoint"]["camera"]["position"] == [1, 2, 3]
    assert len(list_review_notifications(db, project_id=project.id, company_id=sample_empresa.id, user_id=assignee.id)) == 1

    commented = add_review_comment(db, review_id=review["id"], project_id=project.id, company_id=sample_empresa.id, user_id=assignee.id, can_override=False, payload=BimCdeReviewCommentCreate(body="Detalle validado con junta de 20 mm.", expected_lock_version=1))
    resolved = transition_review(db, review_id=review["id"], project_id=project.id, company_id=sample_empresa.id, user_id=assignee.id, can_override=False, payload=BimCdeReviewTransition(action="resolve", resolution="Plano conforme con observacion incorporada.", expected_lock_version=2))
    closed = transition_review(db, review_id=review["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeReviewTransition(action="close", expected_lock_version=3))
    assert len(commented["comments"]) == 2 and resolved["status"] == "resolved" and closed["status"] == "closed"
    creator_notifications = list_review_notifications(db, project_id=project.id, company_id=sample_empresa.id, user_id=creator.id)
    assert {item["event_type"] for item in creator_notifications} == {"commented", "resolved"}
    read = mark_review_notification_read(db, notification_id=creator_notifications[0]["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id)
    assert read["read_at"] is not None


def test_review_scope_participants_and_optimistic_lock(db, sample_empresa):
    project, creator, assignee, outsider, revision = _context(db, sample_empresa)
    review = _create(db, project, sample_empresa, creator, assignee, revision)
    assert list_reviews(db, project_id=project.id, company_id=sample_empresa.id, user_id=outsider.id, can_override=False) == []
    with pytest.raises(HTTPException) as forbidden:
        add_review_comment(db, review_id=review["id"], project_id=project.id, company_id=sample_empresa.id, user_id=outsider.id, can_override=False, payload=BimCdeReviewCommentCreate(body="No autorizado", expected_lock_version=1))
    assert forbidden.value.status_code == 403
    with pytest.raises(HTTPException) as stale:
        add_review_comment(db, review_id=review["id"], project_id=project.id, company_id=sample_empresa.id, user_id=assignee.id, can_override=False, payload=BimCdeReviewCommentCreate(body="Version obsoleta", expected_lock_version=2))
    assert stale.value.status_code == 409


def test_review_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/cde/reviews"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/cde/reviews/{review_id}/comments"] == {"POST"}
    assert paths["/projects/{project_id}/cde/reviews/{review_id}/transition"] == {"POST"}
    assert paths["/projects/{project_id}/cde/review-notifications"] == {"GET"}
