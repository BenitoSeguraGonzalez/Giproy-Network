from datetime import datetime, timezone

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_element import BimElement
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate, Bim4dBaselineCreate, Bim4dDependencyCreate
from app.schemas.bim_4d_planning import Bim4dConstructibleComponentCreate, Bim4dScenarioCreate, Bim4dScenarioShift, Bim4dWorkAreaCreate
from app.services.bim.planning_4d_service import analyze_space_time_conflicts, create_constructible_component, create_scenario, create_work_area, list_constructible_components, list_scenarios, list_work_areas
from app.services.bim.schedule_4d_service import create_activity_snapshot, create_baseline


def test_workfront_component_and_what_if_are_isolated(db, sample_empresa):
    user = Usuario(email="planning4d@example.com", hashed_password="x", nombre_completo="Planning 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Planning 4D Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Planning Model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True)
    db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-PLAN-001", ifc_class="IfcWall", nombre="Wall")
    db.add(element); db.commit()

    first = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="task-1", snapshot_revision="R1", activity_code="A1", activity_name="Construir", planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 7, tzinfo=timezone.utc)))
    second = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="task-2", snapshot_revision="R1", activity_code="A2", activity_name="Inspeccionar", planned_start=datetime(2026, 8, 8, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 9, tzinfo=timezone.utc)))
    baseline = create_baseline(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dBaselineCreate(name="BL", revision="BL-PLAN", activity_snapshot_ids=[first["id"], second["id"]], dependencies=[Bim4dDependencyCreate(predecessor_activity_id=first["id"], successor_activity_id=second["id"], dependency_type="FS", lag_days=1)]))

    area = create_work_area(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dWorkAreaCreate(code="F-01", name="Frente norte"))
    component = create_constructible_component(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dConstructibleComponentCreate(work_area_id=area["id"], version_id=version.id, code="CC-01", name="Muro construible", element_ids=[element.id], activity_snapshot_ids=[first["id"]]))
    assert component["global_ids"] == ["GUID-PLAN-001"]
    assert list_work_areas(db, project_id=project.id, company_id=sample_empresa.id)[0]["component_count"] == 1
    assert list_constructible_components(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == component["id"]

    original_start = db.get(Bim4dActivitySnapshot, second["id"]).planned_start
    scenario = create_scenario(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dScenarioCreate(baseline_id=baseline["id"], name="Adelantar inspeccion", revision="WF-01", shifts=[Bim4dScenarioShift(activity_snapshot_id=second["id"], offset_days=-2)]))
    assert scenario["metrics"]["dependency_violations"] == 1
    assert list_scenarios(db, project_id=project.id, company_id=sample_empresa.id)[0]["id"] == scenario["id"]
    assert db.get(Bim4dActivitySnapshot, second["id"]).planned_start == original_start


def test_bim_4d_planning_migration_is_additive():
    from pathlib import Path
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2014a1b2c3_bim_4d_planning.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2013a1b2c3"' in source
    assert '"bim_4d_work_areas"' in source
    assert '"bim_4d_constructible_components"' in source
    assert '"bim_4d_scenarios"' in source
    assert "alter_column" not in source


def test_space_time_conflict_uses_shared_geometry_and_overlap(db, sample_empresa):
    user = Usuario(email="conflicts4d@example.com", hashed_password="x", nombre_completo="Conflicts 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Conflict Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=sample_empresa.id, nombre="Conflict Model"); db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="v1", status="published", is_active=True); db.add(version); db.flush()
    element = BimElement(bim_model_version_id=version.id, global_id="GUID-CONFLICT-001", ifc_class="IfcWall", nombre="Wall"); db.add(element); db.commit()
    first = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="conflict-1", snapshot_revision="R1", activity_code="C1", activity_name="Montaje inicial", planned_start=datetime(2026, 9, 1, tzinfo=timezone.utc), planned_finish=datetime(2026, 9, 4, tzinfo=timezone.utc)))
    second = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="conflict-2", snapshot_revision="R1", activity_code="C2", activity_name="Acabado solapado", planned_start=datetime(2026, 9, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 9, 5, tzinfo=timezone.utc)))
    area = create_work_area(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dWorkAreaCreate(code="CF-01", name="Frente conflicto"))
    create_constructible_component(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dConstructibleComponentCreate(work_area_id=area["id"], version_id=version.id, code="CC-CF", name="Componente conflicto", element_ids=[element.id], activity_snapshot_ids=[first["id"], second["id"]]))
    analysis = analyze_space_time_conflicts(db, project_id=project.id, company_id=sample_empresa.id)
    assert analysis["counts"] == {"critical": 1, "high": 0, "medium": 0, "total": 1}
    assert analysis["conflicts"][0]["global_ids"] == ["GUID-CONFLICT-001"]
