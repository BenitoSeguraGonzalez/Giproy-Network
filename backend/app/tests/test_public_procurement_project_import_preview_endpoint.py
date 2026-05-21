from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.api.endpoints import proyectos as proyectos_endpoint
from app.main import app


def _superadmin_admin_generales():
    company = SimpleNamespace(nombre="Administradores Generales")
    return SimpleNamespace(
        rol="superadministrador",
        empresa=company,
        empresa_nombre=company.nombre,
    )


def _admin_admin_generales():
    company = SimpleNamespace(nombre="Administradores Generales")
    return SimpleNamespace(
        rol="administrador",
        empresa=company,
        empresa_nombre=company.nombre,
    )


def test_project_public_procurement_preview_requires_special_superadmin(monkeypatch):
    app.dependency_overrides[get_current_active_user] = lambda: _admin_admin_generales()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/proyectos/public-procurement-import/preview",
                files=[("files", ("fuente.pdf", b"%PDF", "application/pdf"))],
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "Administradores Generales" in response.json()["detail"]


def test_project_public_procurement_preview_uses_common_analyzer_contract(monkeypatch):
    captured = {}

    def fake_analyze_uploads(
        uploaded_files,
        source_role_hints=None,
        existing_analysis=None,
        *,
        include_parser_contract=False,
    ):
        captured["uploaded_files"] = uploaded_files
        captured["source_role_hints"] = source_role_hints
        captured["existing_analysis"] = existing_analysis
        captured["include_parser_contract"] = include_parser_contract
        return {
            "source_filename": uploaded_files[0][0],
            "items_count": 1,
            "technical_import_contract": {
                "parser_profile": "giproy_public_procurement_legacy_portal",
                "profile_version": "test",
            },
        }

    monkeypatch.setattr(
        proyectos_endpoint.public_procurement_technical_analysis_service,
        "analyze_uploads",
        fake_analyze_uploads,
    )
    app.dependency_overrides[get_current_active_user] = lambda: _superadmin_admin_generales()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/proyectos/public-procurement-import/preview",
                files=[
                    ("files", ("fuente.pdf", b"%PDF", "application/pdf")),
                    ("files", ("fuente.pdf", b"%PDF", "application/pdf")),
                ],
                data={
                    "source_roles_json": '{"fuente.pdf":"integrated"}',
                    "existing_analysis_json": '{"source_filename":"previo.pdf"}',
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["import_source_kind"] == "proyecto_import_preview"
    assert data["import_source_reference"] == "fuente.pdf"
    assert data["import_analysis"]["technical_import_contract"]["profile_version"] == "test"
    assert captured["uploaded_files"] == [("fuente.pdf", b"%PDF")]
    assert captured["source_role_hints"] == {"fuente.pdf": "integrated"}
    assert captured["existing_analysis"] == {"source_filename": "previo.pdf"}
    assert captured["include_parser_contract"] is True

