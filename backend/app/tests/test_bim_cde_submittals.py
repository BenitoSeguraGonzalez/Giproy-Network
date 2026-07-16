from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cde_submittal import BimCdeSubmittalCreate, BimCdeSubmittalRevisionCreate, BimCdeSubmittalTransition
from app.services.bim.cde_document_service import create_document_revision
from app.services.bim.cde_submittal_service import create_submittal, create_submittal_revision, list_submittals, transition_submittal


def _context(db, company, tmp_path: Path, suffix="ONE"):
    project = Proyecto(nombre=f"Submittal {suffix}", codigo=f"SUB-{suffix}", codigo_root=f"SUB-{suffix}", revision=1, empresa_id=company.id)
    creator = Usuario(email=f"sub-creator-{suffix.lower()}@example.com", hashed_password="x", nombre_completo="Emisor Submittal", empresa_id=company.id, rol="coordinador")
    reviewer = Usuario(email=f"sub-review-{suffix.lower()}@example.com", hashed_password="x", nombre_completo="Revisor Submittal", empresa_id=company.id, rol="usuario")
    db.add_all([project, creator, reviewer]); db.commit()
    document = create_document_revision(db, project_id=project.id, company_id=company.id, user_id=creator.id, document_code=f"SHOP-{suffix}", title="Plano de taller", category="drawing", version_label="P01", notes=None, source_filename="shop.pdf", media_type="application/pdf", content=f"p01-{suffix}".encode(), storage_root=tmp_path)
    return project, creator, reviewer, document


def _create(db, project, company, creator, reviewer, document):
    return create_submittal(db, project_id=project.id, company_id=company.id, user_id=creator.id, payload=BimCdeSubmittalCreate(title="Plano de taller fachada", submittal_type="shop_drawing", discipline="Arquitectura", specification_section="08 44 13", reviewer_id=reviewer.id, required_at=datetime.now(timezone.utc) + timedelta(days=7), document_id=document["id"], submission_notes="Primera emision"))


def _transition(db, row, project, company, user, action, comment):
    return transition_submittal(db, submittal_id=row["id"], project_id=project.id, company_id=company.id, user_id=user.id, can_override=False, payload=BimCdeSubmittalTransition(action=action, comment=comment, expected_lock_version=row["lock_version"]))


def test_submittal_approval_workflow_pins_document_revision_and_audits(db, sample_empresa, tmp_path):
    project, creator, reviewer, document = _context(db, sample_empresa, tmp_path)
    row = _create(db, project, sample_empresa, creator, reviewer, document)
    assert row["submittal_number"] == "SUB-0001" and row["revisions"][0]["document_revision_id"] == document["current"]["id"]
    row = _transition(db, row, project, sample_empresa, creator, "submit", "Emitir para revision")
    row = _transition(db, row, project, sample_empresa, reviewer, "start_review", "Revision tecnica iniciada")
    row = _transition(db, row, project, sample_empresa, reviewer, "approve", "Aprobado para construccion")
    assert row["status"] == "approved" and row["revisions"][0]["status"] == "approved"
    assert [event["event_type"] for event in row["events"]] == ["created", "submit", "start_review", "approve"]


def test_rejected_submittal_requires_new_cde_revision_before_resubmit(db, sample_empresa, tmp_path):
    project, creator, reviewer, document = _context(db, sample_empresa, tmp_path, "RESUB")
    row = _create(db, project, sample_empresa, creator, reviewer, document)
    row = _transition(db, row, project, sample_empresa, creator, "submit", "Emitir para revision")
    row = _transition(db, row, project, sample_empresa, reviewer, "start_review", "Revisar interferencias")
    row = _transition(db, row, project, sample_empresa, reviewer, "reject", "Corregir anclajes")
    with pytest.raises(HTTPException, match="nueva revision"):
        create_submittal_revision(db, submittal_id=row["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeSubmittalRevisionCreate(document_id=document["id"], submission_notes="Sin cambio", expected_lock_version=row["lock_version"]))
    updated_document = create_document_revision(db, project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, document_code="SHOP-RESUB", title="Plano de taller", category="drawing", version_label="P02", notes="Anclajes corregidos", source_filename="shop-p02.pdf", media_type="application/pdf", content=b"p02-resub", storage_root=tmp_path)
    row = create_submittal_revision(db, submittal_id=row["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeSubmittalRevisionCreate(document_id=updated_document["id"], submission_notes="Anclajes corregidos", expected_lock_version=row["lock_version"]))
    assert row["status"] == "draft" and row["current_revision"] == 2
    assert [item["status"] for item in row["revisions"]] == ["draft", "superseded"]


def test_submittal_enforces_reviewer_lock_due_date_and_project_scope(db, sample_empresa, tmp_path):
    project, creator, reviewer, document = _context(db, sample_empresa, tmp_path, "SCOPE")
    other, _creator2, _reviewer2, _document2 = _context(db, sample_empresa, tmp_path, "OTHER")
    row = _create(db, project, sample_empresa, creator, reviewer, document)
    row = _transition(db, row, project, sample_empresa, creator, "submit", "Emitir para revision")
    with pytest.raises(HTTPException) as forbidden:
        _transition(db, row, project, sample_empresa, creator, "start_review", "Intento no autorizado")
    assert forbidden.value.status_code == 403
    with pytest.raises(HTTPException) as stale:
        transition_submittal(db, submittal_id=row["id"], project_id=project.id, company_id=sample_empresa.id, user_id=reviewer.id, can_override=False, payload=BimCdeSubmittalTransition(action="start_review", comment="Version obsoleta", expected_lock_version=1))
    assert stale.value.status_code == 409 and list_submittals(db, project_id=other.id, company_id=sample_empresa.id) == []
    with pytest.raises(HTTPException, match="futuro"):
        create_submittal(db, project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, payload=BimCdeSubmittalCreate(title="Plano vencido", submittal_type="shop_drawing", discipline="Arquitectura", reviewer_id=reviewer.id, required_at=datetime.now(timezone.utc) - timedelta(days=1), document_id=document["id"]))


def test_submittal_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/cde/submittals"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/cde/submittals/{submittal_id}/revisions"] == {"POST"}
    assert paths["/projects/{project_id}/cde/submittals/{submittal_id}/transition"] == {"POST"}
