from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_qto import BimQtoSnapshotCreate
from app.services.bim.qto_service import (
    create_qto_snapshot,
    decide_qto_snapshot,
    get_qto_5d_package,
    list_qto_snapshots,
)


def _fixture(db, sample_empresa):
    project = Proyecto(
        nombre="QTO QA",
        codigo="QTO-QA",
        codigo_root="QTO-QA",
        revision=1,
        empresa_id=sample_empresa.id,
    )
    user = Usuario(
        email="qto@example.com",
        hashed_password="not-used",
        nombre_completo="QTO QA",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([project, user])
    db.flush()
    model = BimModel(
        proyecto_id=project.id,
        empresa_id=sample_empresa.id,
        nombre="Modelo QTO",
    )
    db.add(model)
    db.flush()
    version = BimModelVersion(
        bim_model_id=model.id,
        version_label="QTO-V1",
        status="ready",
        is_active=True,
    )
    db.add(version)
    db.flush()
    db.add_all(
        [
            BimElement(
                bim_model_version_id=version.id,
                global_id="QTO-GUID-001",
                ifc_class="IFCWALL",
                storey_name="Nivel 1",
                classification="Muros",
                properties={"Quantity.BaseQuantities.NetVolume": 2.5, "Material.Name": "Hormigon"},
            ),
            BimElement(
                bim_model_version_id=version.id,
                global_id="QTO-GUID-002",
                ifc_class="IFCWALL",
                storey_name="Nivel 1",
                classification="Muros",
                properties={"Quantity.BaseQuantities.NetVolume": 3.0, "Material.Name": "Hormigon"},
            ),
            BimElement(
                bim_model_version_id=version.id,
                global_id="QTO-GUID-003",
                ifc_class="IFCDOOR",
                storey_name="Nivel 1",
                classification="Puertas",
                properties={"Reference": "D-01"},
            ),
        ]
    )
    db.commit()
    return project, user, version


def test_qto_snapshot_groups_quantities_and_reports_mapping_coverage(db, sample_empresa):
    project, user, version = _fixture(db, sample_empresa)
    payload = BimQtoSnapshotCreate(
        version_id=version.id,
        revision="QTO-R1",
        group_by=["ifc_class", "storey", "material"],
        mappings=[
            {
                "ifc_class": "IFCWALL",
                "material": "Hormigon",
                "wbs_code": "1.1",
                "cost_code": "EST-MUR",
            }
        ],
    )
    snapshot = create_qto_snapshot(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=payload,
    )

    assert len(snapshot["rows"]) == 1
    assert snapshot["rows"][0]["value"] == 5.5
    assert snapshot["rows"][0]["element_count"] == 2
    assert snapshot["rows"][0]["wbs_code"] == "1.1"
    assert snapshot["rows"][0]["cost_code"] == "EST-MUR"
    assert snapshot["totals"][0]["value"] == 5.5
    assert snapshot["coverage"] == {
        "total_elements": 3,
        "elements_with_quantities": 2,
        "elements_without_quantities": 1,
        "mapped_elements": 2,
        "unmapped_elements_with_quantities": 0,
        "quantity_coverage_percent": 66.67,
        "mapping_coverage_percent": 100.0,
    }
    assert len(snapshot["checksum_sha256"]) == 64


def test_qto_snapshot_is_immutable_and_tenant_scoped(db, sample_empresa):
    project, user, version = _fixture(db, sample_empresa)
    payload = BimQtoSnapshotCreate(version_id=version.id, revision="QTO-R1")
    create_qto_snapshot(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=payload,
    )
    try:
        create_qto_snapshot(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=user.id,
            payload=payload,
        )
        assert False, "duplicate revision must fail"
    except ValueError as exc:
        assert "ya existe" in str(exc)
    assert len(list_qto_snapshots(db, project_id=project.id, company_id=sample_empresa.id)) == 1
    assert list_qto_snapshots(db, project_id=project.id, company_id=sample_empresa.id + 999) == []


def test_qto_approval_requires_full_mapping_and_current_lock(db, sample_empresa):
    project, user, version = _fixture(db, sample_empresa)
    snapshot = create_qto_snapshot(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimQtoSnapshotCreate(version_id=version.id, revision="QTO-DRAFT"),
    )
    try:
        decide_qto_snapshot(
            db,
            snapshot_id=snapshot["id"],
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=user.id,
            decision="approved",
            reason="Revision coordinada",
            expected_lock_version=snapshot["lock_version"],
        )
        assert False, "incomplete mapping must fail"
    except ValueError as exc:
        assert "100%" in str(exc)


def test_qto_approval_supersedes_active_revision_and_exports_5d_package(db, sample_empresa):
    project, user, version = _fixture(db, sample_empresa)
    mapping = [{"ifc_class": "IFCWALL", "wbs_code": "1.1", "cost_code": "EST-MUR"}]
    first = create_qto_snapshot(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimQtoSnapshotCreate(version_id=version.id, revision="QTO-R1", mappings=mapping),
    )
    approved_first = decide_qto_snapshot(
        db,
        snapshot_id=first["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        decision="approved",
        reason="Primera revision aprobada",
        expected_lock_version=first["lock_version"],
    )
    package = get_qto_5d_package(
        db,
        snapshot_id=first["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
    )
    assert approved_first["status"] == "approved"
    assert package["qto_checksum_sha256"] == first["checksum_sha256"]
    assert package["rows"][0]["wbs_code"] == "1.1"

    second = create_qto_snapshot(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimQtoSnapshotCreate(version_id=version.id, revision="QTO-R2", mappings=mapping),
    )
    decide_qto_snapshot(
        db,
        snapshot_id=second["id"],
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        decision="approved",
        reason="Segunda revision aprobada",
        expected_lock_version=second["lock_version"],
    )
    rows = list_qto_snapshots(db, project_id=project.id, company_id=sample_empresa.id)
    assert {item["revision"]: item["status"] for item in rows} == {"QTO-R2": "approved", "QTO-R1": "superseded"}
    try:
        get_qto_5d_package(db, snapshot_id=first["id"], project_id=project.id, company_id=sample_empresa.id)
        assert False, "superseded package must not remain active"
    except ValueError as exc:
        assert "aprobado" in str(exc)


def test_qto_snapshot_endpoints_are_registered_inside_bim_router():
    from app.api.endpoints.bim_models import router

    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/qto-snapshots"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/qto-snapshots/{snapshot_id}/decision"] == {"POST"}
    assert paths["/projects/{project_id}/qto-snapshots/{snapshot_id}/5d-package"] == {"GET"}
