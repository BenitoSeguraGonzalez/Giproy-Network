from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.cde_document_service import (
    archive_document,
    create_document_revision,
    get_revision_file,
    list_document_revisions,
    list_documents,
)


def _context(db, company, *, suffix="A"):
    project = Proyecto(nombre=f"CDE {suffix}", codigo=f"CDE-{suffix}", codigo_root=f"CDE-{suffix}", revision=1, empresa_id=company.id)
    user = Usuario(email=f"cde-{suffix.lower()}@example.com", hashed_password="x", nombre_completo="CDE QA", empresa_id=company.id, rol="superadministrador")
    db.add_all([project, user]); db.commit()
    return project, user


def _upload(db, project, company, user, storage, *, content=b"revision one", label="P01", filename="plan.pdf"):
    return create_document_revision(
        db,
        project_id=project.id,
        company_id=company.id,
        user_id=user.id,
        document_code="ARQ-001",
        title="Plano de arquitectura",
        category="drawing",
        version_label=label,
        notes="Emision coordinada",
        source_filename=filename,
        media_type="application/pdf",
        content=content,
        storage_root=storage,
    )


def test_cde_creates_immutable_revisions_and_preserves_current(db, sample_empresa, tmp_path):
    project, user = _context(db, sample_empresa)
    first = _upload(db, project, sample_empresa, user, tmp_path)
    second = _upload(db, project, sample_empresa, user, tmp_path, content=b"revision two", label="C01")
    assert first["current_revision"] == 1
    assert second["current_revision"] == 2
    revisions = list_document_revisions(db, document_id=second["id"], project_id=project.id, company_id=sample_empresa.id)
    assert [(item["revision"], item["status"]) for item in revisions] == [(2, "current"), (1, "superseded")]
    current, path = get_revision_file(db, revision_id=revisions[0]["id"], project_id=project.id, company_id=sample_empresa.id, storage_root=tmp_path)
    assert current.checksum_sha256 == second["current"]["checksum_sha256"]
    assert path.read_bytes() == b"revision two"


def test_cde_rejects_duplicate_executable_and_cross_project_access(db, sample_empresa, tmp_path):
    project, user = _context(db, sample_empresa, suffix="ONE")
    other, _ = _context(db, sample_empresa, suffix="TWO")
    created = _upload(db, project, sample_empresa, user, tmp_path)
    with pytest.raises(ValueError, match="coincide"):
        _upload(db, project, sample_empresa, user, tmp_path)
    with pytest.raises(ValueError, match="no permitido"):
        _upload(db, project, sample_empresa, user, tmp_path, content=b"bad", filename="payload.exe")
    with pytest.raises(HTTPException) as error:
        list_document_revisions(db, document_id=created["id"], project_id=other.id, company_id=sample_empresa.id)
    assert error.value.status_code == 404


def test_cde_checksum_tamper_and_archive_are_controlled(db, sample_empresa, tmp_path):
    project, user = _context(db, sample_empresa, suffix="SEC")
    created = _upload(db, project, sample_empresa, user, tmp_path)
    revision = created["current"]
    _record, path = get_revision_file(db, revision_id=revision["id"], project_id=project.id, company_id=sample_empresa.id, storage_root=tmp_path)
    path.write_bytes(b"tampered")
    with pytest.raises(HTTPException, match="integridad") as error:
        get_revision_file(db, revision_id=revision["id"], project_id=project.id, company_id=sample_empresa.id, storage_root=tmp_path)
    assert error.value.status_code == 409
    archived = archive_document(db, document_id=created["id"], project_id=project.id, company_id=sample_empresa.id)
    assert archived["status"] == "archived"
    assert list_documents(db, project_id=project.id, company_id=sample_empresa.id) == []
    assert list_documents(db, project_id=project.id, company_id=sample_empresa.id, include_archived=True)[0]["status"] == "archived"


def test_cde_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/cde/documents"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/cde/documents/{document_id}/revisions"] == {"GET"}
    assert paths["/projects/{project_id}/cde/revisions/{revision_id}/content"] == {"GET"}
    assert paths["/projects/{project_id}/cde/documents/{document_id}/archive"] == {"POST"}
