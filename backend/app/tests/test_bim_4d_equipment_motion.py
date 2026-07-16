from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_equipment import Bim4dEquipmentCreate, Bim4dEquipmentMotionCreate
from app.services.bim.equipment_4d_service import conflicts, create_equipment, create_motion_plan, list_equipment, playback


def test_equipment_motion_playback_and_conflict_are_tenant_scoped(db, sample_empresa):
    user = Usuario(email="motion4d@example.com", hashed_password="x", nombre_completo="Motion 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Motion Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    activity = Bim4dActivitySnapshot(empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="giproy_classic_schedule", source_ref="motion-1", snapshot_revision="R1", activity_code="A1", activity_name="Izaje", planned_start=datetime(2026, 7, 12, tzinfo=timezone.utc), planned_finish=datetime(2026, 7, 13, tzinfo=timezone.utc), captured_by=user.id); db.add(activity); db.commit()
    crane = create_equipment(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentCreate(code="EQ-01", name="Grua torre", equipment_type="crane", dimensions={"x": 3, "y": 8, "z": 3}))
    truck = create_equipment(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentCreate(code="EQ-02", name="Camion", equipment_type="truck", dimensions={"x": 2.5, "y": 3, "z": 7}))
    first = create_motion_plan(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentMotionCreate(equipment_id=crane["id"], activity_snapshot_id=activity.id, revision="R1", path=[{"x": 0, "y": 0, "z": 0, "offset_seconds": 0}, {"x": 10, "y": 0, "z": 0, "offset_seconds": 100}], operation_radius=2, temporary_geometry="cylinder"))
    second = create_motion_plan(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentMotionCreate(equipment_id=truck["id"], activity_snapshot_id=activity.id, revision="R1", path=[{"x": 5, "y": -5, "z": 0, "offset_seconds": 0}, {"x": 5, "y": 5, "z": 0, "offset_seconds": 100}], operation_radius=1.5, temporary_geometry="box"))
    position = playback(db, motion_plan_id=first["id"], project_id=project.id, company_id=sample_empresa.id, percent=50)
    assert position["position"] == {"x": 5, "y": 0, "z": 0} and position["offset_seconds"] == 50
    detected = conflicts(db, motion_plan_id=first["id"], project_id=project.id, company_id=sample_empresa.id)
    assert detected[0]["conflicting_motion_plan_id"] == second["id"] and detected[0]["minimum_path_distance"] == pytest.approx(0)
    assert len(list_equipment(db, project_id=project.id, company_id=sample_empresa.id)) == 2
    with pytest.raises(HTTPException) as tenant_error:
        playback(db, motion_plan_id=first["id"], project_id=project.id, company_id=sample_empresa.id + 1, percent=50)
    assert tenant_error.value.status_code == 404


def test_equipment_motion_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2020a1b2c3_bim_4d_equipment_motion.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2019a1b2c3"' in source
    assert '"bim_4d_equipment_motion_plans"' in source
    assert "alter_column" not in source
