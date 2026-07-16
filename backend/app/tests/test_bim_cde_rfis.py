from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cde_rfi import BimCdeRfiCreate, BimCdeRfiTransition
from app.services.bim.cde_rfi_service import create_rfi, list_rfis, transition_rfi


def _context(db, company, suffix="ONE"):
    project = Proyecto(nombre=f"RFI {suffix}", codigo=f"RFI-{suffix}", codigo_root=f"RFI-{suffix}", revision=1, empresa_id=company.id)
    creator = Usuario(email=f"creator-{suffix.lower()}@example.com", hashed_password="x", nombre_completo="Creador RFI", empresa_id=company.id, rol="coordinador")
    responder = Usuario(email=f"answer-{suffix.lower()}@example.com", hashed_password="x", nombre_completo="Responsable RFI", empresa_id=company.id, rol="usuario")
    db.add_all([project, creator, responder]); db.commit()
    return project, creator, responder


def _create(db, project, company, creator, responder):
    return create_rfi(db, project_id=project.id, company_id=company.id, user_id=creator.id, payload=BimCdeRfiCreate(subject="Definir junta estructural", question="Confirmar material y espesor de la junta.", priority="high", assigned_to=responder.id))


def test_rfi_full_workflow_is_numbered_audited_and_optimistic(db, sample_empresa):
    project, creator, responder = _context(db, sample_empresa)
    rfi = _create(db, project, sample_empresa, creator, responder)
    assert rfi["rfi_number"] == "RFI-0001" and rfi["status"] == "draft"
    submitted = transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeRfiTransition(action="submit", reason="Consulta lista para envio", due_at=datetime.now(timezone.utc) + timedelta(days=5), expected_lock_version=1))
    answered = transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=responder.id, can_override=False, payload=BimCdeRfiTransition(action="answer", reason="Respuesta tecnica emitida", answer="Usar junta elastomerica de 20 mm.", expected_lock_version=2))
    closed = transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeRfiTransition(action="close", reason="Respuesta aceptada", expected_lock_version=3))
    assert submitted["status"] == "submitted" and answered["status"] == "answered" and closed["status"] == "closed"
    assert [event["event_type"] for event in closed["events"]] == ["created", "submit", "answer", "close"]
    assert closed["answer"] == "Usar junta elastomerica de 20 mm."


def test_rfi_enforces_responsible_transition_lock_and_project_scope(db, sample_empresa):
    project, creator, responder = _context(db, sample_empresa, "SCOPE")
    other, _other_creator, _other_responder = _context(db, sample_empresa, "OTHER")
    rfi = _create(db, project, sample_empresa, creator, responder)
    submitted = transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeRfiTransition(action="submit", reason="Enviar consulta", due_at=datetime.now(timezone.utc) + timedelta(days=3), expected_lock_version=1))
    with pytest.raises(HTTPException) as forbidden:
        transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeRfiTransition(action="answer", reason="Intento ajeno", answer="Respuesta no autorizada", expected_lock_version=2))
    assert forbidden.value.status_code == 403
    with pytest.raises(HTTPException) as stale:
        transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=responder.id, can_override=False, payload=BimCdeRfiTransition(action="answer", reason="Version obsoleta", answer="Respuesta valida", expected_lock_version=1))
    assert stale.value.status_code == 409
    assert list_rfis(db, project_id=other.id, company_id=sample_empresa.id) == []
    assert submitted["lock_version"] == 2


def test_rfi_submit_requires_future_due_date(db, sample_empresa):
    project, creator, responder = _context(db, sample_empresa, "DUE")
    rfi = _create(db, project, sample_empresa, creator, responder)
    with pytest.raises(HTTPException, match="futuro") as error:
        transition_rfi(db, rfi_id=rfi["id"], project_id=project.id, company_id=sample_empresa.id, user_id=creator.id, can_override=False, payload=BimCdeRfiTransition(action="submit", reason="Fecha invalida", due_at=datetime.now(timezone.utc) - timedelta(days=1), expected_lock_version=1))
    assert error.value.status_code == 400


def test_rfi_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/cde/rfi-assignees"] == {"GET"}
    assert paths["/projects/{project_id}/cde/rfis"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/cde/rfis/{rfi_id}/transition"] == {"POST"}
