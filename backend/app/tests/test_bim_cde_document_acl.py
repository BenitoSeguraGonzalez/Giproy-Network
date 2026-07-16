from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cde_acl import BimCdeDocumentAclSave
from app.services.bim.cde_acl_service import list_document_acl, save_document_acl
from app.services.bim.cde_document_service import create_document_revision, get_revision_file, list_document_revisions, list_documents


def _user(db, company, name):
    user = Usuario(email=f"acl-{name.lower()}@example.com", hashed_password="x", nombre_completo=name, empresa_id=company.id, rol="usuario")
    db.add(user); db.commit(); return user


def _document(db, company, tmp_path: Path):
    project = Proyecto(nombre="ACL CDE", codigo="ACL-CDE", codigo_root="ACL-CDE", revision=1, empresa_id=company.id)
    db.add(project); db.commit()
    creator = _user(db, company, "Creator")
    document = create_document_revision(db, project_id=project.id, company_id=company.id, user_id=creator.id, document_code="ACL-001", title="Plano restringido", category="drawing", version_label="P01", notes=None, source_filename="acl.pdf", media_type="application/pdf", content=b"acl-p01", storage_root=tmp_path)
    return project, creator, document


def _grant(db, project, company, creator, document, user, **permissions):
    return save_document_acl(db, document_id=document["id"], project_id=project.id, company_id=company.id, requester_id=creator.id, requester_role=creator.rol, payload=BimCdeDocumentAclSave(user_id=user.id, **permissions))


def test_document_acl_activates_restricted_mode_and_normalizes_permissions(db, sample_empresa, tmp_path):
    project, creator, document = _document(db, sample_empresa, tmp_path)
    viewer = _user(db, sample_empresa, "Viewer")
    outsider = _user(db, sample_empresa, "Outsider")
    assert len(list_documents(db, project_id=project.id, company_id=sample_empresa.id, requester_id=outsider.id, requester_role=outsider.rol)) == 1
    grant = _grant(db, project, sample_empresa, creator, document, viewer, can_revise=True)
    assert grant["can_view"] and grant["can_download"] and grant["can_revise"]
    assert list_documents(db, project_id=project.id, company_id=sample_empresa.id, requester_id=outsider.id, requester_role=outsider.rol) == []
    assert len(list_documents(db, project_id=project.id, company_id=sample_empresa.id, requester_id=viewer.id, requester_role=viewer.rol)) == 1
    _grant(db, project, sample_empresa, creator, document, viewer, can_revise=True, active=False)
    assert list_documents(db, project_id=project.id, company_id=sample_empresa.id, requester_id=viewer.id, requester_role=viewer.rol) == []
    assert list_documents(db, project_id=project.id, company_id=sample_empresa.id, requester_id=outsider.id, requester_role=outsider.rol) == []


def test_document_acl_enforces_view_download_revise_and_manager(db, sample_empresa, tmp_path):
    project, creator, document = _document(db, sample_empresa, tmp_path)
    viewer = _user(db, sample_empresa, "ViewOnly")
    downloader = _user(db, sample_empresa, "Downloader")
    manager = _user(db, sample_empresa, "Manager")
    _grant(db, project, sample_empresa, creator, document, viewer, can_view=True)
    _grant(db, project, sample_empresa, creator, document, downloader, can_download=True)
    _grant(db, project, sample_empresa, creator, document, manager, can_manage=True)
    assert len(list_document_revisions(db, document_id=document["id"], project_id=project.id, company_id=sample_empresa.id, requester_id=viewer.id, requester_role=viewer.rol)) == 1
    with pytest.raises(HTTPException) as denied_download:
        get_revision_file(db, revision_id=document["current"]["id"], project_id=project.id, company_id=sample_empresa.id, storage_root=tmp_path, requester_id=viewer.id, requester_role=viewer.rol)
    assert denied_download.value.status_code == 403
    assert get_revision_file(db, revision_id=document["current"]["id"], project_id=project.id, company_id=sample_empresa.id, storage_root=tmp_path, requester_id=downloader.id, requester_role=downloader.rol)[1].is_file()
    with pytest.raises(HTTPException) as denied_revision:
        create_document_revision(db, project_id=project.id, company_id=sample_empresa.id, user_id=viewer.id, document_code="ACL-001", title="Plano restringido", category="drawing", version_label="P02", notes=None, source_filename="acl-p02.pdf", media_type="application/pdf", content=b"acl-p02", storage_root=tmp_path, requester_role=viewer.rol)
    assert denied_revision.value.status_code == 403
    assert list_document_acl(db, document_id=document["id"], project_id=project.id, company_id=sample_empresa.id, requester_id=manager.id, requester_role=manager.rol)


def test_only_creator_superadmin_or_acl_manager_can_govern_acl(db, sample_empresa, tmp_path):
    project, creator, document = _document(db, sample_empresa, tmp_path)
    outsider = _user(db, sample_empresa, "NoManager")
    target = _user(db, sample_empresa, "Target")
    with pytest.raises(HTTPException) as denied:
        save_document_acl(db, document_id=document["id"], project_id=project.id, company_id=sample_empresa.id, requester_id=outsider.id, requester_role=outsider.rol, payload=BimCdeDocumentAclSave(user_id=target.id, can_view=True))
    assert denied.value.status_code == 403
    _grant(db, project, sample_empresa, creator, document, outsider, can_manage=True)
    saved = save_document_acl(db, document_id=document["id"], project_id=project.id, company_id=sample_empresa.id, requester_id=outsider.id, requester_role=outsider.rol, payload=BimCdeDocumentAclSave(user_id=target.id, can_download=True))
    assert saved["can_view"] and saved["can_download"]


def test_document_acl_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/cde/acl-users"] == {"GET"}
    assert paths["/projects/{project_id}/cde/documents/{document_id}/acl"] == {"GET", "PUT"}
