from app.models.proyecto import Proyecto
from app.models.edo import TipoNodo
from app.models.edt import TipoNodoEdt
from app.repositories.edo import edo_repo
from app.repositories.edt import edt_repo
from app.repositories.stakeholder import stakeholder_repo
from app.schemas.edo import EdoNodeCreate
from app.schemas.edt import EdtNodeCreate
from app.schemas.stakeholder import RolCreate, StakeholderCreate
from app.services.reporting import ReportingService
from app.models.stakeholder import ProyectoStakeholder


def _create_project(db, sample_empresa):
    project = Proyecto(
        nombre="Santiago Bermeo test",
        codigo="SANTIAGO-2026-001",
        codigo_root="SANTIAGO-2026-001",
        revision=0,
        empresa_id=sample_empresa.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def _create_stakeholder(db, sample_empresa, project):
    return stakeholder_repo.create(
        db,
        StakeholderCreate(
            nombre="Ana",
            apellidos="Responsable",
            email="ana@example.com",
            proyecto_codigo_root=project.codigo_root,
        ),
        sample_empresa.id,
    )


def test_edo_role_assignment_synchronizes_stakeholder_directory(db, sample_empresa):
    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Fiscalizacion"),
        sample_empresa.id,
    )

    edo_repo.create(
        db,
        EdoNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodo.STAKEHOLDER,
            orden=0,
            codigo="TBD",
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )

    [synced] = stakeholder_repo.get_by_project_root(
        db,
        codigo_root=project.codigo_root,
        empresa_id=sample_empresa.id,
        proyecto_id=project.id,
    )

    assert synced.assigned is True
    assert synced.rol_id == role.id
    assert synced.rol_nombre == "Fiscalizacion"


def test_stakeholders_export_cache_key_tracks_synced_roles(db, sample_empresa):
    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Fiscalizacion"),
        sample_empresa.id,
    )
    service = ReportingService()

    before = service._build_report_export_cache_key(
        db,
        report_type="stakeholders",
        entity_ids=[project.id],
        empresa_id=sample_empresa.id,
        template_id="001",
        export_format="xlsx",
    )

    edo_repo.create(
        db,
        EdoNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodo.STAKEHOLDER,
            orden=0,
            codigo="TBD",
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )

    after = service._build_report_export_cache_key(
        db,
        report_type="stakeholders",
        entity_ids=[project.id],
        empresa_id=sample_empresa.id,
        template_id="001",
        export_format="xlsx",
    )

    assert before != after
    assert "Fiscalizacion" in str(after)


def test_stakeholders_excel_uses_operational_edo_role_when_assignment_is_missing(db, sample_empresa):
    import openpyxl
    from io import BytesIO

    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Gerente de Proyecto"),
        sample_empresa.id,
    )
    service = ReportingService()

    edo_repo.create(
        db,
        EdoNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodo.STAKEHOLDER,
            orden=0,
            codigo="TBD",
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )
    db.query(ProyectoStakeholder).delete()
    db.commit()

    preview = service._build_stakeholders_preview(db, project, sample_empresa.id)
    assert preview["lineas"][0]["rol"] == "Gerente de Proyecto"
    assert preview["lineas"][0]["nombre_completo"] == "Ana Responsable"
    assert "nombres" not in preview["lineas"][0]
    assert "apellidos" not in preview["lineas"][0]
    assert [column["key"] for column in preview["table_columns"]] == [
        "codigo",
        "nombre_completo",
        "profesion",
        "contacto",
        "ubicacion",
        "rol",
    ]
    assert all(column.get("width_weight") for column in preview["table_columns"])

    workbook = openpyxl.load_workbook(BytesIO(service.generate_stakeholders_report(db, project.id, sample_empresa.id).getvalue()))
    values = [cell.value for row in workbook.active.iter_rows() for cell in row]
    assert "Gerente de Proyecto" in values
    assert "Sin rol asignado" not in values


def test_stakeholder_with_edo_role_cannot_be_deleted(db, sample_empresa):
    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Fiscalizacion"),
        sample_empresa.id,
    )

    edo_repo.create(
        db,
        EdoNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodo.STAKEHOLDER,
            orden=0,
            codigo="TBD",
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )

    try:
        stakeholder_repo.delete(db, stakeholder.id)
    except ValueError as exc:
        assert "Primero debe liberarse en EDO/EDT" in str(exc)
    else:
        raise AssertionError("Deleting a stakeholder used in EDO should be blocked")

    assert stakeholder_repo.get_by_id(db, stakeholder.id) is not None


def test_edt_role_assignment_synchronizes_stakeholder_directory(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(edt_repo, "_sync_presupuesto_codes", lambda *args, **kwargs: None)
    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Responsable tecnico"),
        sample_empresa.id,
    )

    edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodoEdt.STAKEHOLDER,
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )

    [synced] = stakeholder_repo.get_by_project_root(
        db,
        codigo_root=project.codigo_root,
        empresa_id=sample_empresa.id,
        proyecto_id=project.id,
    )

    assert synced.assigned is True
    assert synced.rol_id == role.id
    assert synced.rol_nombre == "Responsable tecnico"


def test_stakeholder_with_edt_role_cannot_be_deleted(db, sample_empresa, monkeypatch):
    monkeypatch.setattr(edt_repo, "_sync_presupuesto_codes", lambda *args, **kwargs: None)
    project = _create_project(db, sample_empresa)
    stakeholder = _create_stakeholder(db, sample_empresa, project)
    role = stakeholder_repo.create_rol(
        db,
        RolCreate(nombre="Responsable tecnico"),
        sample_empresa.id,
    )

    edt_repo.create(
        db,
        EdtNodeCreate(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodoEdt.STAKEHOLDER,
            stakeholder_id=stakeholder.id,
            rol_id=role.id,
        ),
        sample_empresa.id,
    )

    try:
        stakeholder_repo.delete(db, stakeholder.id)
    except ValueError as exc:
        assert "Primero debe liberarse en EDO/EDT" in str(exc)
    else:
        raise AssertionError("Deleting a stakeholder used in EDT should be blocked")

    assert stakeholder_repo.get_by_id(db, stakeholder.id) is not None
