import zipfile
from io import BytesIO

import pytest
from fastapi import HTTPException

from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_issue import BimIssueCreateRequest, BimIssueUpdateRequest
from app.services.bim.issue_service import add_issue_comment, create_issue, export_issue_bcf, get_issue, import_issue_bcf, update_issue


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
