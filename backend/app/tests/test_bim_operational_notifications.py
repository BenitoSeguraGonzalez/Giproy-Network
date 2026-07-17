from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_cde_review import BimCdeReview
from app.models.bim_cde_rfi import BimCdeRfi
from app.models.bim_cde_submittal import BimCdeSubmittal
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.operational_notification_service import (
    acknowledge_operational_notification,
    list_operational_notifications,
    reconcile_operational_notifications,
)


def _context(db, company):
    now = datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)
    project = Proyecto(nombre="Alertas BIM", codigo_root="BIM-ALERT", revision=1, empresa_id=company.id)
    user = Usuario(email="bim-alerts@example.com", hashed_password="x", nombre_completo="Coordinador BIM", empresa_id=company.id, rol="usuario", activo=True)
    outsider = Usuario(email="bim-alerts-other@example.com", hashed_password="x", nombre_completo="Otro usuario", empresa_id=company.id, rol="usuario", activo=True)
    db.add_all([project, user, outsider]); db.flush()
    document = BimCdeDocument(empresa_id=company.id, proyecto_id=project.id, document_code="DOC-ALERT", title="Plano coordinado", category="drawing", status="active", current_revision=1, created_by=user.id)
    db.add(document); db.flush()
    revision = BimCdeDocumentRevision(document_id=document.id, empresa_id=company.id, proyecto_id=project.id, revision=1, version_label="P01", source_filename="alert.pdf", stored_path="test/alert.pdf", media_type="application/pdf", file_size_bytes=1, checksum_sha256="a" * 64, status="current", created_by=user.id)
    db.add(revision); db.flush()
    rfi = BimCdeRfi(empresa_id=company.id, proyecto_id=project.id, rfi_number="RFI-ALERT", subject="RFI vencido", question="Resolver interferencia", priority="high", status="submitted", due_at=now - timedelta(hours=2), assigned_to=user.id, created_by=outsider.id, lock_version=1)
    submittal = BimCdeSubmittal(empresa_id=company.id, proyecto_id=project.id, submittal_number="SUB-ALERT", title="Submittal próximo", submittal_type="shop_drawing", discipline="Estructura", reviewer_id=user.id, required_at=now + timedelta(hours=24), status="under_review", current_revision=1, lock_version=1, created_by=outsider.id)
    review = BimCdeReview(empresa_id=company.id, proyecto_id=project.id, review_number="REV-ALERT", title="Revisión escalada", status="open", document_revision_id=revision.id, assigned_to=user.id, due_at=now - timedelta(hours=60), created_by=outsider.id, lock_version=1)
    db.add_all([rfi, submittal, review]); db.commit()
    return now, project, user, outsider, rfi


def test_operational_notification_matrix_is_idempotent_and_escalates(db, sample_empresa):
    now, project, user, _outsider, _rfi = _context(db, sample_empresa)
    first = reconcile_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, now=now)
    assert first["generated"] == first["active"] == 3 and first["resolved"] == 0
    rows = list_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    assert [(row["source_type"], row["event_type"], row["escalation_level"]) for row in rows] == [
        ("review", "escalated", 2),
        ("rfi", "overdue", 1),
        ("submittal", "due_soon", 0),
    ]
    second = reconcile_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, now=now)
    assert second["generated"] == 0 and second["active"] == 3 and second["resolved"] == 0


def test_operational_notification_ack_is_recipient_scoped_and_stale_rows_resolve(db, sample_empresa):
    now, project, user, outsider, rfi = _context(db, sample_empresa)
    reconcile_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, now=now)
    row = next(item for item in list_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id) if item["source_type"] == "rfi")
    with pytest.raises(HTTPException, match="no encontrada"):
        acknowledge_operational_notification(db, notification_id=row["id"], project_id=project.id, company_id=sample_empresa.id, user_id=outsider.id)
    acknowledged = acknowledge_operational_notification(db, notification_id=row["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    assert acknowledged["acknowledged_at"] is not None
    rfi.status = "closed"; db.commit()
    result = reconcile_operational_notifications(db, project_id=project.id, company_id=sample_empresa.id, now=now)
    assert result["active"] == 2 and result["resolved"] == 1


def test_operational_notification_contract_and_migration_are_registered():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    base = "/projects/{project_id}/cde/operational-notifications"
    assert paths[base] == {"GET"}
    assert paths[f"{base}/reconcile"] == {"POST"}
    assert paths[f"{base}/{{notification_id}}/ack"] == {"POST"}
    migration = (Path(__file__).parents[2] / "alembic" / "versions" / "de2053a1b2c3_bim_operational_notifications.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2052a1b2c3"' in migration
    assert "bim_operational_notifications" in migration and "alter_column" not in migration
