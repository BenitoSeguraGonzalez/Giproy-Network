from datetime import datetime, timezone
from pathlib import Path

from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate
from app.schemas.bim_4d_resources import Bim4dResourceAssignmentCreate, Bim4dResourceCreate
from app.services.bim.resource_4d_service import build_histogram, create_assignment, create_resource, list_resources
from app.services.bim.schedule_4d_service import create_activity_snapshot


def test_native_resource_histogram_detects_daily_overload(db, sample_empresa):
    user = Usuario(email="resources4d@example.com", hashed_password="x", nombre_completo="Resources 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Resources 4D Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.commit()
    first = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="resource-task-1", snapshot_revision="R1", activity_code="R1", activity_name="Actividad uno", planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 5, tzinfo=timezone.utc)))
    second = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="resource-task-2", snapshot_revision="R1", activity_code="R2", activity_name="Actividad dos", planned_start=datetime(2026, 8, 5, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 6, tzinfo=timezone.utc)))
    resource = create_resource(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dResourceCreate(code="MO-01", name="Cuadrilla estructura", resource_type="labor", unit="personas", capacity_per_day=8))
    create_assignment(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dResourceAssignmentCreate(resource_id=resource["id"], activity_snapshot_id=first["id"], demand_per_day=6))
    create_assignment(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dResourceAssignmentCreate(resource_id=resource["id"], activity_snapshot_id=second["id"], demand_per_day=4))
    histogram = build_histogram(db, resource_id=resource["id"], project_id=project.id, company_id=sample_empresa.id)
    assert histogram["peak_demand"] == 10
    assert histogram["overloaded_days"] == 1
    assert histogram["points"][2]["utilization_percent"] == 125
    assert list_resources(db, project_id=project.id, company_id=sample_empresa.id)[0]["source_kind"] == "bim_native"


def test_bim_4d_resources_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2017a1b2c3_bim_4d_resources.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2016a1b2c3"' in source
    assert '"bim_4d_resources"' in source
    assert '"bim_4d_resource_assignments"' in source
    assert "alter_column" not in source
