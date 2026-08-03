import pytest
from sqlalchemy import text
from sqlalchemy.exc import StatementError

from app.models.system_audit_event import SystemAuditEvent
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.services.audit_event import AUDIT_RETENTION_POLICY, import_legacy_audit_entries, record_audit_event, sanitize_audit_payload, verify_audit_chain


def _event():
    return SystemAuditEvent(module="proyecto", event_type="project_changed", message="Project changed")


def test_project_audit_event_cannot_be_updated(db):
    event = _event(); db.add(event); db.commit(); db.refresh(event)
    event.message = "Tampered"
    with pytest.raises((RuntimeError, StatementError)):
        db.commit()
    db.rollback()


def test_project_audit_event_cannot_be_deleted(db):
    event = _event(); db.add(event); db.commit()
    db.delete(event)
    with pytest.raises((RuntimeError, StatementError)):
        db.commit()
    db.rollback()


def test_project_audit_payload_is_redacted_bounded_and_binary_safe():
    safe = sanitize_audit_payload({"password": "secret", "nested": {"access_token": "token"}, "content": b"secret", "name": "ok"})
    assert safe == {"password": "[REDACTED]", "nested": {"access_token": "[REDACTED]"}, "content": "[REDACTED]", "name": "ok"}


def test_project_audit_hash_chain_detects_direct_database_tampering(db, sample_empresa):
    user = Usuario(email="audit-chain@example.com", hashed_password="x", nombre_completo="Auditor", empresa_id=sample_empresa.id, rol="administrador")
    project = Proyecto(nombre="Audit chain", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.commit(); db.refresh(user); db.refresh(project)
    first = record_audit_event(db, module="proyecto", event_type="project_created", message="Creado", actor=user, empresa_id=sample_empresa.id, proyecto_id=project.id, entity_type="project", entity_id=project.id, payload={"password": "never-store", "name": "Audit chain"})
    second = record_audit_event(db, module="proyecto", event_type="project_updated", message="Actualizado", actor=user, empresa_id=sample_empresa.id, proyecto_id=project.id, entity_type="project", entity_id=project.id, payload={"field": "name"})
    assert first.event_hash != second.event_hash
    events = db.query(SystemAuditEvent).filter(SystemAuditEvent.proyecto_id == project.id).order_by(SystemAuditEvent.id).all()
    assert verify_audit_chain(events)["valid"] is True
    assert events[0].detail_json["password"] == "[REDACTED]"

    db.execute(text("UPDATE system_audit_events SET message = 'alterado' WHERE id = :id"), {"id": first.id}); db.commit()
    tampered = db.query(SystemAuditEvent).filter(SystemAuditEvent.proyecto_id == project.id).order_by(SystemAuditEvent.id).all()
    result = verify_audit_chain(tampered)
    assert result == {"valid": False, "broken_event_id": first.id}


def test_audit_retention_policy_forbids_automatic_purge():
    assert AUDIT_RETENTION_POLICY["minimum_days"] >= 3650
    assert AUDIT_RETENTION_POLICY["automatic_purge_enabled"] is False
    assert AUDIT_RETENTION_POLICY["legal_hold_supported"] is True
    assert AUDIT_RETENTION_POLICY["archive_requires_integrity_verification"] is True


def test_audit_can_share_domain_transaction_and_rolls_back_atomically(db, sample_empresa):
    company_id = sample_empresa.id
    original_name = sample_empresa.nombre
    savepoint = db.begin_nested()
    sample_empresa.nombre = "Must rollback"
    record_audit_event(
        db, module="proyecto", event_type="atomic_change", message="Atomic",
        empresa_id=company_id, payload={"field": "nombre"}, commit=False,
    )
    savepoint.rollback(); db.expire_all()
    assert db.get(Empresa, company_id).nombre == original_name
    assert db.query(SystemAuditEvent).filter(SystemAuditEvent.event_type == "atomic_change").count() == 0


def test_legacy_logs_are_sanitized_sealed_and_imported_idempotently(db, sample_empresa):
    entries = [{"message": "login failed", "authorization": "Bearer secret", "context": {"api_key": "secret"}}]
    first = import_legacy_audit_entries(db, entries=entries, empresa_id=sample_empresa.id)
    second = import_legacy_audit_entries(db, entries=entries, empresa_id=sample_empresa.id)
    assert first == {"imported": 1, "duplicates": 0, "total": 1}
    assert second == {"imported": 0, "duplicates": 1, "total": 1}
    event = db.query(SystemAuditEvent).filter(SystemAuditEvent.event_type == "legacy_log_imported").one()
    assert event.detail_json["entry"]["authorization"] == "[REDACTED]"
    assert event.detail_json["entry"]["context"]["api_key"] == "[REDACTED]"
    assert verify_audit_chain([event])["valid"] is True
