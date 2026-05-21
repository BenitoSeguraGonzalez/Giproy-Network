from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.api.endpoints import marketplace as marketplace_endpoint
from app.main import app


@pytest.mark.parametrize("field_name", ["files", "file"])
def test_portal_import_preview_accepts_single_uploaded_pdf(field_name, monkeypatch):
    captured = {}

    def fake_analyze_uploads(uploaded_files, source_role_hints=None, existing_analysis=None):
        captured["uploaded_files"] = uploaded_files
        return {
            "source_filename": uploaded_files[0][0],
            "items_count": 1,
            "total_amount": "1.00",
            "summary": {"document_kind": "presupuesto_only"},
        }

    fake_user = SimpleNamespace(
        rol="superadministrador",
        marketplace_permissions=["marketplace.manage_all_products"],
        empresa=None,
        empresa_nombre="Sistema",
    )
    app.dependency_overrides[get_current_active_user] = lambda: fake_user
    monkeypatch.setattr(
        marketplace_endpoint.public_procurement_portal_import_service,
        "analyze_uploads",
        fake_analyze_uploads,
    )

    try:
        client = TestClient(app)
        response = client.post(
            "/api/v1/marketplace/admin/portal-import/preview",
            files=[
                (
                    field_name,
                    ("compras publicas prueba1.pdf", b"%PDF-1.4 fake", "application/pdf"),
                )
            ],
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["import_source_kind"] == "archivo_base"
    assert data["import_source_reference"] == "compras publicas prueba1.pdf"
    assert data["import_analysis"]["items_count"] == 1
    assert captured["uploaded_files"] == [
        ("compras publicas prueba1.pdf", b"%PDF-1.4 fake")
    ]
