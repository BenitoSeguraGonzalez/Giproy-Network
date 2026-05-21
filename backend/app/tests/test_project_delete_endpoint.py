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
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204, response.text
    assert db.query(Proyecto).filter(Proyecto.id.in_([root_id, revision_id])).count() == 0
    assert db.query(Presupuesto).filter(Presupuesto.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(CronogramaValorado).filter(CronogramaValorado.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id.in_([root_id, revision_id])).count() == 0
    assert db.query(ProjectCalendarEntry).filter(ProjectCalendarEntry.proyecto_codigo_root == root_code).count() == 0
    for base_id in base_ids:
        assert db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id).first() is None


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
    assert db.query(Proyecto).filter(Proyecto.id == root_id).first() is None


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
