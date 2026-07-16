from pathlib import Path

import pytest

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.bim.p6_xml_interop_service import export_p6_xml, parse_p6_xml
from app.services.bim.schedule_import_revision_service import (
    compare_schedule_interchange,
    create_import_revision,
    decide_import_revision,
    list_import_revisions,
    rollback_import_revision,
)


P6_FIXTURE = Path(__file__).parent / "fixtures" / "bim" / "scheduling" / "p6-basic.xml"


def _project_and_user(db, sample_empresa):
    project = Proyecto(
        nombre="Schedule revision QA",
        codigo="SCHEDULE-REV-QA",
        codigo_root="SCHEDULE-REV-QA",
        revision=1,
        empresa_id=sample_empresa.id,
    )
    user = Usuario(
        email="schedule-revision@example.com",
        hashed_password="not-used",
        nombre_completo="Schedule Revision QA",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([project, user])
    db.commit()
    db.refresh(project)
    db.refresh(user)
    return project, user


def _document(filename="p6-basic.xml"):
    return parse_p6_xml(
        P6_FIXTURE.read_bytes(),
        source_filename=filename,
        timezone_name="America/Bogota",
    )["document"]


def test_schedule_import_revision_approval_supersede_and_rollback(db, sample_empresa):
    project, user = _project_and_user(db, sample_empresa)
    first = create_import_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        document=_document(),
    )
    first = decide_import_revision(
        db,
        revision_id=first["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        decision="approved",
        reason="Primera revision validada",
        expected_version=first["version"],
    )
    second_document = _document("p6-second.xml")
    second_document.activities[1] = second_document.activities[1].model_copy(
        update={"percent_complete": 30}
    )
    second = create_import_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        document=second_document,
    )
    second = decide_import_revision(
        db,
        revision_id=second["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        decision="approved",
        reason="Segunda revision validada",
        expected_version=second["version"],
    )
    assert second["previous_approved_revision_id"] == first["id"]
    revisions = list_import_revisions(
        db, project_id=project.id, company_id=sample_empresa.id
    )
    assert {item["revision"]: item["status"] for item in revisions} == {
        2: "approved",
        1: "superseded",
    }

    rolled_back = rollback_import_revision(
        db,
        revision_id=second["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        reason="Rollback QA verificado",
        expected_version=second["version"],
    )
    assert rolled_back["status"] == "rolled_back"
    revisions = list_import_revisions(
        db, project_id=project.id, company_id=sample_empresa.id
    )
    assert {item["revision"]: item["status"] for item in revisions} == {
        2: "rolled_back",
        1: "approved",
    }


def test_schedule_import_revision_rejects_duplicate_and_stale_version(db, sample_empresa):
    project, user = _project_and_user(db, sample_empresa)
    document = _document()
    revision = create_import_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        document=document,
    )
    with pytest.raises(ValueError, match="mismo contenido"):
        create_import_revision(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=user.id,
            document=document,
        )
    with pytest.raises(ValueError, match="actualizada"):
        decide_import_revision(
            db,
            revision_id=revision["id"],
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=user.id,
            decision="approved",
            reason="Version obsoleta",
            expected_version=99,
        )


def test_schedule_import_revisions_are_tenant_scoped(db, sample_empresa):
    project, user = _project_and_user(db, sample_empresa)
    create_import_revision(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        document=_document(),
    )
    assert list_import_revisions(
        db, project_id=project.id, company_id=sample_empresa.id + 999
    ) == []


def test_schedule_semantic_comparison_ignores_format_object_ids():
    left = _document()
    right = parse_p6_xml(
        export_p6_xml(left),
        source_filename="round-trip.xml",
        timezone_name="America/Bogota",
    )["document"]
    equivalent = compare_schedule_interchange(left, right)
    assert equivalent["equivalent"] is True
    assert equivalent["differences"] == []

    right.activities[1] = right.activities[1].model_copy(
        update={"percent_complete": 55}
    )
    different = compare_schedule_interchange(left, right)
    assert different["equivalent"] is False
    assert [item["section"] for item in different["differences"]] == ["activities"]


def test_schedule_import_revision_endpoints_are_registered_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/4d/schedule-interchange/compare"] == {"POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/revisions"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/revisions/{revision_id}/decision"] == {"POST"}
    assert paths["/projects/{project_id}/4d/schedule-interchange/revisions/{revision_id}/rollback"] == {"POST"}
