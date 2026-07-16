from datetime import datetime, timedelta, timezone

from app.models.bim_cde import BimCdeDocument, BimCdeDocumentRevision
from app.models.bim_cde_acl import BimCdeDocumentAcl
from app.models.bim_cde_review import BimCdeReview, BimCdeReviewNotification
from app.models.bim_cde_rfi import BimCdeRfi
from app.models.bim_cde_submittal import BimCdeSubmittal
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.cde_dashboard_service import get_cde_dashboard


def _build_dashboard_context(db, company):
    now = datetime.now(timezone.utc)
    project = Proyecto(nombre="Dashboard CDE", codigo_root="CDE-DASH", revision=2, empresa_id=company.id)
    viewer = Usuario(email="dash-viewer@example.com", hashed_password="x", nombre_completo="Coordinador Visible", empresa_id=company.id, rol="usuario", activo=True)
    other = Usuario(email="dash-other@example.com", hashed_password="x", nombre_completo="Responsable Restringido", empresa_id=company.id, rol="usuario", activo=True)
    admin = Usuario(email="dash-admin@example.com", hashed_password="x", nombre_completo="Administrador BIM", empresa_id=company.id, rol="superadministrador", activo=True)
    db.add_all([project, viewer, other, admin]); db.flush()

    visible = BimCdeDocument(empresa_id=company.id, proyecto_id=project.id, document_code="DOC-V", title="Documento visible", category="drawing", status="active", current_revision=1, created_by=viewer.id)
    restricted = BimCdeDocument(empresa_id=company.id, proyecto_id=project.id, document_code="DOC-R", title="Documento restringido", category="report", status="active", current_revision=1, created_by=other.id)
    db.add_all([visible, restricted]); db.flush()
    db.add_all([
        BimCdeDocumentRevision(document_id=visible.id, empresa_id=company.id, proyecto_id=project.id, revision=1, version_label="P01", source_filename="visible.pdf", stored_path="test/visible.pdf", media_type="application/pdf", file_size_bytes=1, checksum_sha256="a" * 64, status="current", created_by=viewer.id),
        BimCdeDocumentRevision(document_id=restricted.id, empresa_id=company.id, proyecto_id=project.id, revision=1, version_label="P01", source_filename="restricted.pdf", stored_path="test/restricted.pdf", media_type="application/pdf", file_size_bytes=1, checksum_sha256="b" * 64, status="current", created_by=other.id),
        BimCdeDocumentAcl(document_id=restricted.id, empresa_id=company.id, proyecto_id=project.id, usuario_id=viewer.id, can_view=False, can_download=False, can_revise=False, can_manage=False, granted_by=admin.id),
    ])
    db.flush()
    visible_revision = db.query(BimCdeDocumentRevision).filter(BimCdeDocumentRevision.document_id == visible.id).one()

    viewer_rfi = BimCdeRfi(empresa_id=company.id, proyecto_id=project.id, rfi_number="RFI-0001", subject="RFI vencido", question="Pregunta", priority="high", status="submitted", due_at=now - timedelta(days=1), assigned_to=viewer.id, created_by=other.id, lock_version=1)
    other_rfi = BimCdeRfi(empresa_id=company.id, proyecto_id=project.id, rfi_number="RFI-0002", subject="RFI ajeno", question="Pregunta", priority="normal", status="submitted", due_at=now + timedelta(days=1), assigned_to=other.id, created_by=other.id, lock_version=1)
    viewer_submittal = BimCdeSubmittal(empresa_id=company.id, proyecto_id=project.id, submittal_number="SUB-0001", title="Plano pendiente", submittal_type="shop_drawing", discipline="Arquitectura", reviewer_id=viewer.id, required_at=now + timedelta(days=2), status="under_review", current_revision=1, lock_version=1, created_by=other.id)
    other_submittal = BimCdeSubmittal(empresa_id=company.id, proyecto_id=project.id, submittal_number="SUB-0002", title="Plano ajeno", submittal_type="shop_drawing", discipline="Estructura", reviewer_id=other.id, required_at=now - timedelta(days=2), status="submitted", current_revision=1, lock_version=1, created_by=other.id)
    viewer_review = BimCdeReview(empresa_id=company.id, proyecto_id=project.id, review_number="REV-0001", title="Revision vencida", status="open", document_revision_id=visible_revision.id, assigned_to=viewer.id, due_at=now - timedelta(hours=2), created_by=other.id, lock_version=1)
    db.add_all([viewer_rfi, other_rfi, viewer_submittal, other_submittal, viewer_review]); db.flush()
    db.add(BimCdeReviewNotification(review_id=viewer_review.id, empresa_id=company.id, proyecto_id=project.id, usuario_id=viewer.id, event_type="assigned", dedupe_key="dashboard-test"))
    db.commit()
    return now, project, viewer, other, admin


def test_cde_dashboard_respects_acl_participant_scope_and_deadlines(db, sample_empresa):
    now, project, viewer, _other, _admin = _build_dashboard_context(db, sample_empresa)
    result = get_cde_dashboard(db, project_id=project.id, company_id=sample_empresa.id, user_id=viewer.id, requester_role=viewer.rol, can_override=False, now=now)
    assert result["scope"] == "participant"
    assert result["totals"] == {
        "documents": 1, "document_revisions": 1, "open_rfis": 1, "overdue_rfis": 1,
        "pending_submittals": 1, "overdue_submittals": 0, "open_reviews": 1,
        "overdue_reviews": 1, "unread_notifications": 1,
    }
    assert [item["number"] for item in result["priority_queue"]] == ["RFI-0001", "REV-0001", "SUB-0001"]
    assert result["responsible_workload"][0]["name"] == "Coordinador Visible"
    assert result["responsible_workload"][0]["overdue"] == 2


def test_cde_dashboard_superadmin_sees_project_scope(db, sample_empresa):
    now, project, _viewer, _other, admin = _build_dashboard_context(db, sample_empresa)
    result = get_cde_dashboard(db, project_id=project.id, company_id=sample_empresa.id, user_id=admin.id, requester_role=admin.rol, can_override=True, now=now)
    assert result["scope"] == "project"
    assert result["totals"]["documents"] == 2
    assert result["totals"]["open_rfis"] == 2
    assert result["totals"]["pending_submittals"] == 2
    assert result["totals"]["overdue_submittals"] == 1
    assert {item["name"] for item in result["responsible_workload"]} == {"Coordinador Visible", "Responsable Restringido"}


def test_cde_dashboard_endpoint_is_registered():
    from app.api.endpoints.bim_models import router

    paths = {route.path: route.methods for route in router.routes}
    assert paths["/projects/{project_id}/cde/dashboard"] == {"GET"}
