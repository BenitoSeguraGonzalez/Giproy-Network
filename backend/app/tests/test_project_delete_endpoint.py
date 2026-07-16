from fastapi.testclient import TestClient
from datetime import date

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.base_trabajo import BaseTrabajo
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.models.project_calendar_entry import ProjectCalendarEntry
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.proyecto import ProyectoCreate
from app.services.proyecto import proyecto_service


def _admin_user(db, empresa_id: int) -> Usuario:
    return _user(db, empresa_id, "delete-project-admin@giproy.test", "administrador")


def _user(db, empresa_id: int, email: str, rol: str) -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo="Admin Delete",
        rol=rol,
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _empresa(db, nombre: str, ruc: str) -> Empresa:
    empresa = Empresa(
        nombre=nombre,
        ruc=ruc,
        proy_prefijo="OTR",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa


def test_delete_project_endpoint_removes_root_revision_and_operational_stack(db, sample_empresa):
    current_user = _admin_user(db, sample_empresa.id)
    root = proyecto_service.create_proyecto(
        db,
        ProyectoCreate(nombre="Proyecto borrado desde API", source_base_id=None),
        sample_empresa.id,
    )
    revision = proyecto_service.create_revision(db, root.id, sample_empresa.id)

    root_id = root.id
    revision_id = revision.id
    root_code = root.codigo_root or root.codigo
    base_ids = [project.base_trabajo_id for project in (root, revision) if project.base_trabajo_id]

    for project in (root, revision):
        presupuesto = (
            db.query(Presupuesto)
            .filter(Presupuesto.proyecto_id == project.id, Presupuesto.empresa_id == sample_empresa.id)
            .first()
        )
        if not presupuesto:
            presupuesto = Presupuesto(
                descripcion=f"Presupuesto {project.id}",
                proyecto_id=project.id,
                empresa_id=sample_empresa.id,
                subtotal=100,
                total=100,
            )
            db.add(presupuesto)
            db.flush()
        db.add(
            CronogramaValorado(
                empresa_id=sample_empresa.id,
                proyecto_id=project.id,
                presupuesto_id=presupuesto.id,
                period_type="mensual",
                distribution_mode="homogeneo",
                global_distribution=[],
                line_distribution_overrides={},
            )
        )
        db.add(
            CronogramaTrabajo(
                empresa_id=sample_empresa.id,
                proyecto_id=project.id,
                presupuesto_id=presupuesto.id,
                schedule_data={},
            )
        )
    db.add(
        ProjectCalendarEntry(
            empresa_id=sample_empresa.id,
            proyecto_codigo_root=root_code,
            calendar_date=date(2026, 5, 19),
            entry_type="annotation",
            title="Entrada a borrar",
            message="Debe desaparecer junto con el proyecto.",
            created_by=current_user.id,
        )
    )
    db.commit()

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.delete(f"/api/v1/proyectos/{root_id}?empresa_id={sample_empresa.id}")
            normal_list = client.get(f"/api/v1/proyectos/?empresa_id={sample_empresa.id}")
            recycle_list = client.get(f"/api/v1/proyectos/papelera?empresa_id={sample_empresa.id}")
            restore_response = client.post(f"/api/v1/proyectos/papelera/{root_id}/restore?empresa_id={sample_empresa.id}")
            delete_again_response = client.delete(f"/api/v1/proyectos/{root_id}?empresa_id={sample_empresa.id}")
            purge_response = client.delete(f"/api/v1/proyectos/papelera/{root_id}/purge?empresa_id={sample_empresa.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204, response.text
    assert normal_list.status_code == 200, normal_list.text
    assert all(item["id"] != root_id for item in normal_list.json())
    assert recycle_list.status_code == 200, recycle_list.text
    recycled_root = next(item for item in recycle_list.json() if item["id"] == root_id)
    assert recycled_root["deleted_at"] is not None
    assert recycled_root["recycle_expires_at"] is not None
    assert restore_response.status_code == 200, restore_response.text
    assert restore_response.json()["id"] == root_id
    assert delete_again_response.status_code == 204, delete_again_response.text
    assert purge_response.status_code == 204, purge_response.text
    assert db.query(Proyecto).filter(Proyecto.id.in_([root_id, revision_id])).count() == 0
    assert db.query(Presupuesto).filter(Presupuesto.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(CronogramaValorado).filter(CronogramaValorado.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(ProjectCalendarEntry).filter(ProjectCalendarEntry.proyecto_codigo_root == root_code).count() == 0
    for base_id in base_ids:
        assert db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first() is None


def test_delete_project_can_preserve_project_base_as_work_base(db, sample_empresa):
    current_user = _admin_user(db, sample_empresa.id)
    source_base = BaseTrabajo(
        codigo_unico="BT-PRESERVE-SOURCE",
        nombre="Base fuente para preservar",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
    )
    db.add(source_base)
    db.commit()
    db.refresh(source_base)

    root = proyecto_service.create_proyecto(
        db,
        ProyectoCreate(nombre="Proyecto borrado conservando base", source_base_id=source_base.id),
        sample_empresa.id,
    )
    root_id = root.id
    base_id = root.base_trabajo_id
    assert db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first().tipo == "Base de Proyecto"

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.delete(
                f"/api/v1/proyectos/{root_id}?empresa_id={sample_empresa.id}&delete_project_base=false"
            )
            assert response.status_code == 204, response.text

            preserved_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first()
            assert preserved_base is not None
            assert preserved_base.deleted_at is None
            assert preserved_base.tipo == "Base Maestra"
            assert "conservada desde el proyecto eliminado" in (preserved_base.descripcion or "")

            recycle_list = client.get(f"/api/v1/proyectos/papelera?empresa_id={sample_empresa.id}")
            assert recycle_list.status_code == 200, recycle_list.text
            recycled_root = next(item for item in recycle_list.json() if item["id"] == root_id)
            assert recycled_root["deleted_at"] is not None

            restore_response = client.post(f"/api/v1/proyectos/papelera/{root_id}/restore?empresa_id={sample_empresa.id}")
            assert restore_response.status_code == 200, restore_response.text
            restored_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first()
            assert restored_base is not None
            assert restored_base.tipo == "Base de Proyecto"

            delete_again_response = client.delete(
                f"/api/v1/proyectos/{root_id}?empresa_id={sample_empresa.id}&delete_project_base=false"
            )
            assert delete_again_response.status_code == 204, delete_again_response.text

            purge_response = client.delete(f"/api/v1/proyectos/papelera/{root_id}/purge?empresa_id={sample_empresa.id}")
            assert purge_response.status_code == 204, purge_response.text
    finally:
        app.dependency_overrides.clear()

    final_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first()
    assert final_base is not None
    assert final_base.deleted_at is None
    assert final_base.tipo == "Base Maestra"
    assert db.query(Proyecto).filter(Proyecto.id == root_id).first() is None


def test_delete_project_endpoint_accepts_superadmin_role_with_whitespace(db, sample_empresa):
    current_user = _user(db, sample_empresa.id, "delete-project-root@giproy.test", " Superadministrador ")
    root = proyecto_service.create_proyecto(
        db,
        ProyectoCreate(nombre="Proyecto borrado por superadmin", source_base_id=None),
        sample_empresa.id,
    )
    root_id = root.id

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.delete(f"/api/v1/proyectos/{root_id}?empresa_id={sample_empresa.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204, response.text
    recycled = db.query(Proyecto).filter(Proyecto.id == root_id).first()
    assert recycled is not None
    assert recycled.deleted_at is not None
    assert recycled.recycle_expires_at is not None


def test_delete_project_endpoint_blocks_admin_cross_company_empresa_id(db, sample_empresa):
    other_empresa = _empresa(db, "Empresa Ajena", "9999999990001")
    current_user = _admin_user(db, sample_empresa.id)
    root = proyecto_service.create_proyecto(
        db,
        ProyectoCreate(nombre="Proyecto protegido por tenant", source_base_id=None),
        sample_empresa.id,
    )

    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    try:
        with TestClient(app) as client:
            response = client.delete(f"/api/v1/proyectos/{root.id}?empresa_id={other_empresa.id}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert db.query(Proyecto).filter(Proyecto.id == root.id).first() is not None
