from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate, Bim4dBaselineCreate
from app.schemas.bim_4d_leveling import Bim4dLevelingCreate
from app.schemas.bim_4d_resources import Bim4dResourceAssignmentCreate, Bim4dResourceCreate
from app.services.bim.resource_4d_service import create_assignment, create_resource
from app.services.bim.resource_leveling_service import create_leveling_scenario, decide_leveling_scenario, list_leveling_scenarios
from app.services.bim.schedule_4d_service import create_activity_snapshot, create_baseline


def _fixture(db, company, *, revision=2, root="LEVEL-ROOT"):
    project = Proyecto(nombre="Leveling", codigo=f"{root}-R{revision}", codigo_root=root, revision=revision, empresa_id=company.id)
    user = Usuario(email=f"level-{revision}@example.com", hashed_password="x", nombre_completo="Leveling QA", empresa_id=company.id, rol="superadministrador")
    db.add_all([project, user]); db.commit()
    first = create_activity_snapshot(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref=f"r{revision}-a", snapshot_revision=f"R{revision}", activity_code="A", activity_name="Actividad A", planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 5, tzinfo=timezone.utc)))
    second = create_activity_snapshot(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref=f"r{revision}-b", snapshot_revision=f"R{revision}", activity_code="B", activity_name="Actividad B", planned_start=datetime(2026, 8, 4, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 6, tzinfo=timezone.utc)))
    baseline = create_baseline(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dBaselineCreate(name="BL", revision=f"BL-R{revision}", activity_snapshot_ids=[first["id"], second["id"]]))
    resource = create_resource(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dResourceCreate(code="MO-01", name="Cuadrilla", resource_type="labor", unit="personas", capacity_per_day=8))
    create_assignment(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dResourceAssignmentCreate(resource_id=resource["id"], activity_snapshot_id=first["id"], demand_per_day=6))
    create_assignment(db, project_id=project.id, company_id=company.id, user_id=user.id, payload=Bim4dResourceAssignmentCreate(resource_id=resource["id"], activity_snapshot_id=second["id"], demand_per_day=4))
    return project, user, first, second, baseline, resource


def test_leveling_removes_overload_without_mutating_source_and_records_project_revision(db, sample_empresa):
    project, user, first, second, baseline, resource = _fixture(db, sample_empresa)
    scenario = create_leveling_scenario(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLevelingCreate(baseline_id=baseline["id"], revision="LEV-R1", resource_ids=[resource["id"]]))
    assert scenario["project_revision"] == 2
    assert scenario["inputs"]["project_root_code"] == "LEVEL-ROOT"
    assert scenario["result"]["before_overloaded_resource_days"] == 2
    assert scenario["result"]["after_overloaded_resource_days"] == 0
    assert scenario["result"]["shifted_activities"] == 1
    assert scenario["result"]["source_immutable"] is True
    source_second = db.query(Bim4dActivitySnapshot).filter_by(id=second["id"]).one()
    assert source_second.planned_start.replace(tzinfo=timezone.utc) == datetime(2026, 8, 4, tzinfo=timezone.utc)


def test_leveling_cannot_mix_distinct_project_revision_gantts(db, sample_empresa):
    project_r2, user_r2, _first, _second, baseline_r2, _resource = _fixture(db, sample_empresa, revision=2, root="SHARED")
    project_r3, _user_r3, _a, _b, _baseline_r3, resource_r3 = _fixture(db, sample_empresa, revision=3, root="SHARED")
    with pytest.raises(HTTPException) as error:
        create_leveling_scenario(db, project_id=project_r2.id, company_id=sample_empresa.id, user_id=user_r2.id, payload=Bim4dLevelingCreate(baseline_id=baseline_r2["id"], revision="MIX", resource_ids=[resource_r3["id"]]))
    assert error.value.status_code == 404
    assert list_leveling_scenarios(db, project_id=project_r3.id, company_id=sample_empresa.id) == []


def test_leveling_approval_is_reversible_selection_not_source_mutation(db, sample_empresa):
    project, user, _first, _second, baseline, resource = _fixture(db, sample_empresa)
    first = create_leveling_scenario(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLevelingCreate(baseline_id=baseline["id"], revision="LEV-1", resource_ids=[resource["id"]]))
    approved = decide_leveling_scenario(db, scenario_id=first["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Escenario coordinado", expected_lock_version=1)
    assert approved["status"] == "approved"
    second = create_leveling_scenario(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dLevelingCreate(baseline_id=baseline["id"], revision="LEV-2", resource_ids=[resource["id"]]))
    decide_leveling_scenario(db, scenario_id=second["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, decision="approved", reason="Escenario alternativo", expected_lock_version=1)
    states = {item["revision"]: item["status"] for item in list_leveling_scenarios(db, project_id=project.id, company_id=sample_empresa.id)}
    assert states == {"LEV-2": "approved", "LEV-1": "superseded"}


def test_leveling_endpoints_are_registered():
    from app.api.endpoints.bim_models import router
    paths = {}
    for route in router.routes:
        paths.setdefault(route.path, set()).update(route.methods)
    assert paths["/projects/{project_id}/4d/resource-leveling"] == {"GET", "POST"}
    assert paths["/projects/{project_id}/4d/resource-leveling/{scenario_id}/decision"] == {"POST"}
