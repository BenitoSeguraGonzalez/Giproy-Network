import zipfile
import base64
from io import BytesIO
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.endpoints import bim_models as bim_models_endpoint
from app.core.config import settings
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.models.system_bim_setting import SystemBimSetting
from app.schemas.bim_issue import BimIssueCreateRequest, BimIssueUpdateRequest
from app.services.bim.issue_service import add_issue_comment, create_issue, export_issue_bcf, get_issue, import_issue_bcf, update_issue
from app.services.bim.coordination_import_stage_service import confirm_preflight, create_preflight


def _scope(db, company):
    project = Proyecto(nombre="BCF pilot", empresa_id=company.id)
    user = Usuario(email="bcf@example.com", hashed_password="test", nombre_completo="BCF Coordinator", empresa_id=company.id)
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company.id, nombre="Architecture")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P01")
    db.add(version); db.commit()
    return project, user, version


def test_bcf_issue_roundtrip_preserves_topic_viewpoint_comments_and_history(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    issue = create_issue(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueCreateRequest(title="Duct crosses beam", description="Coordinate opening", version_id=version.id, priority="high", viewpoint={"source_version_id": version.id, "camera": {"position": [1, 2, 3]}, "selected_guids": ["DUCT-1", "BEAM-2"]}))
    issue = update_issue(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueUpdateRequest(status="in_review"))
    issue = add_issue_comment(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, body="Opening proposal attached")
    assert [event["event_type"] for event in issue.events] == ["created", "updated", "commented"]
    assert issue.comments[0]["body"] == "Opening proposal attached"

    bcf = export_issue_bcf(issue)
    with zipfile.ZipFile(BytesIO(bcf)) as archive:
        assert "bcf.version" in archive.namelist()
        assert any(name.endswith("markup.bcf") for name in archive.namelist())
        assert any(name.endswith("viewpoint.bcfv") for name in archive.namelist())

    imported_project = Proyecto(nombre="BCF import", empresa_id=sample_empresa.id)
    db.add(imported_project); db.commit()
    imported = import_issue_bcf(db, content=bcf, project_id=imported_project.id, company_id=sample_empresa.id, user_id=user.id)
    assert imported.topic_guid == issue.topic_guid
    assert imported.title == issue.title
    assert imported.viewpoint.selected_guids == ["DUCT-1", "BEAM-2"]


def test_bcf_issue_is_tenant_scoped(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    issue = create_issue(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueCreateRequest(title="Scoped", version_id=version.id))
    with pytest.raises(HTTPException) as exc_info:
        get_issue(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id + 1)
    assert exc_info.value.status_code == 404


def test_bcf_http_import_requires_and_consumes_confirmed_stage(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(settings, "BIM_ENABLED", True)
    monkeypatch.setattr(settings, "BIM_ALLOWED_EMPRESA_IDS", "")
    monkeypatch.setattr(settings, "BIM_ALLOWED_USER_IDS", "")
    project, user, version = _scope(db, sample_empresa)
    user.rol = "administrador"
    db.add(SystemBimSetting(titulo="BCF HTTP", descripcion="Test", is_enabled=True, superadmin_only=False, allowed_company_ids=str(sample_empresa.id)))
    source = create_issue(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueCreateRequest(title="BCF HTTP source", version_id=version.id))
    content = export_issue_bcf(source)
    target = Proyecto(nombre="BCF HTTP target", empresa_id=sample_empresa.id)
    db.add(target); db.commit(); db.refresh(target)
    staged = create_preflight(
        db, project_id=target.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(source_domain="bim", source_format="bcf", filename="issues.bcf", content_base64=base64.b64encode(content).decode("ascii"), coordination_set_id=None),
    )
    confirm_preflight(
        db, stage_id=staged["id"], project_id=target.id, company_id=sample_empresa.id, user_id=user.id,
        payload=SimpleNamespace(expected_checksum_sha256=staged["checksum_sha256"], reason="HTTP import"),
    )
    app = FastAPI(); app.include_router(bim_models_endpoint.router, prefix="/bim")
    app.dependency_overrides[bim_models_endpoint.get_db] = lambda: db
    app.dependency_overrides[bim_models_endpoint.get_current_active_user] = lambda: user
    client = TestClient(app)

    missing = client.post(f"/bim/projects/{target.id}/issues/import-bcf", files={"file": ("issues.bcf", content, "application/zip")})
    imported = client.post(
        f"/bim/projects/{target.id}/issues/import-bcf",
        data={"stage_id": str(staged["id"])},
        files={"file": ("issues.bcf", content, "application/zip")},
    )
    repeated = client.post(
        f"/bim/projects/{target.id}/issues/import-bcf",
        data={"stage_id": str(staged["id"])},
        files={"file": ("issues.bcf", content, "application/zip")},
    )

    assert missing.status_code == 422
    assert imported.status_code == 200, imported.text
    assert repeated.status_code == 200
    assert repeated.json()["id"] == imported.json()["id"]
