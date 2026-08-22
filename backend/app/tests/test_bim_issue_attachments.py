import importlib.util
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations
from fastapi import HTTPException

from app.main import app
from app.schemas.bim_issue import BimIssueCreateRequest
from app.services.bim.issue_service import add_issue_attachment, create_issue, get_issue, get_issue_attachment
from app.tests.test_bim_issues_bcf import _scope


def test_issue_photographic_evidence_is_integral_audited_and_tenant_scoped(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    issue = create_issue(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueCreateRequest(title="Fisura en muro", version_id=version.id))
    content = b"\x89PNG\r\n\x1a\nfield-photo"
    attachment = add_issue_attachment(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, filename="../fisura.png", content_type="image/png", content=content)

    assert attachment.filename == "fisura.png"
    assert attachment.byte_size == len(content)
    assert len(attachment.checksum_sha256) == 64
    assert get_issue_attachment(db, attachment_id=attachment.id, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id).content == content
    refreshed = get_issue(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id)
    assert refreshed.attachments[0].id == attachment.id
    assert refreshed.events[-1]["event_type"] == "attachment_added"

    with pytest.raises(HTTPException) as duplicate:
        add_issue_attachment(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, filename="otra.png", content_type="image/png", content=content)
    assert duplicate.value.status_code == 409
    with pytest.raises(HTTPException) as foreign:
        get_issue_attachment(db, attachment_id=attachment.id, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id + 1)
    assert foreign.value.status_code == 404


def test_issue_attachment_rejects_forged_image(db, sample_empresa):
    project, user, version = _scope(db, sample_empresa)
    issue = create_issue(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimIssueCreateRequest(title="Evidencia invalida", version_id=version.id))
    with pytest.raises(HTTPException) as invalid:
        add_issue_attachment(db, issue_id=issue.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, filename="falsa.png", content_type="image/png", content=b"not-an-image")
    assert invalid.value.status_code == 415


def test_issue_attachment_migration_is_additive_and_reversible():
    path = Path(__file__).resolve().parents[2] / "alembic" / "versions" / "de2033a1b2c3_bim_issue_attachments.py"
    spec = importlib.util.spec_from_file_location("bim_issue_attachment_migration", path)
    migration = importlib.util.module_from_spec(spec); spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite:///:memory:")
    metadata = sa.MetaData()
    sa.Table("bim_issues", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    sa.Table("usuarios", metadata, sa.Column("id", sa.Integer(), primary_key=True))
    with engine.begin() as connection:
        metadata.create_all(connection)
        migration.op = Operations(MigrationContext.configure(connection)); migration.upgrade()
        assert "bim_issue_attachments" in sa.inspect(connection).get_table_names()
        migration.downgrade()
        assert "bim_issue_attachments" not in sa.inspect(connection).get_table_names()


def test_issue_attachment_endpoints_are_registered():
    paths = set(app.openapi()["paths"])
    assert "/api/v1/bim/projects/{project_id}/issues/{issue_id}/attachments" in paths
    assert "/api/v1/bim/projects/{project_id}/issues/{issue_id}/attachments/{attachment_id}/content" in paths
