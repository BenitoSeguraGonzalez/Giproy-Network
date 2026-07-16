from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_equipment import Bim4dEquipmentCreate, Bim4dEquipmentMotionCreate
from app.schemas.bim_4d_safety import Bim4dSafetyInspectionCreate, Bim4dSafetyPunchCreate, Bim4dSafetyPunchUpdate, Bim4dSafetyRiskCreate
from app.services.bim.equipment_4d_service import create_equipment, create_motion_plan
from app.services.bim.safety_4d_service import add_inspection, create_punch_item, create_risk, evaluate_exposure, list_inspections, list_punch_items, list_risks, update_punch_item


def test_safety_risk_inspection_and_equipment_exposure(db, sample_empresa):
    now = datetime(2026, 7, 12, tzinfo=timezone.utc)
    user = Usuario(email="safety4d@example.com", hashed_password="x", nombre_completo="Safety 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Safety Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    activity = Bim4dActivitySnapshot(empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="giproy_classic_schedule", source_ref="safe-1", snapshot_revision="R1", activity_code="A1", activity_name="Izaje", planned_start=now, planned_finish=now + timedelta(hours=1), captured_by=user.id); db.add(activity); db.commit()
    machine = create_equipment(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentCreate(code="SAFE-EQ", name="Grua", equipment_type="crane", dimensions={"x": 2, "y": 4, "z": 2}))
    motion = create_motion_plan(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dEquipmentMotionCreate(equipment_id=machine["id"], activity_snapshot_id=activity.id, revision="R1", path=[{"x": 0, "y": 0, "z": 0, "offset_seconds": 0}, {"x": 10, "y": 0, "z": 0, "offset_seconds": 100}], operation_radius=1, temporary_geometry="box"))
    risk = create_risk(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dSafetyRiskCreate(activity_snapshot_id=activity.id, title="Cruce bajo carga", hazard_type="lifting", severity=5, likelihood=3, controls=["Barricada", "Señalero"], zone={"x": 5, "y": 0, "z": 0, "radius": 2}, active_start=now, active_finish=now + timedelta(minutes=30)))
    assert risk["risk_score"] == 15 and list_risks(db, project_id=project.id, company_id=sample_empresa.id)[0]["controls"] == ["Barricada", "Señalero"]
    exposure = evaluate_exposure(db, risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id)
    assert exposure == [{"risk_id": risk["id"], "motion_plan_id": motion["id"], "exposed": True, "minimum_distance": 0.0, "exclusion_distance": 3.0, "sampled_points": 21}]
    checklist = [{"label": "Barricada instalada", "passed": True}, {"label": "Senalero presente", "passed": False, "note": "Turno pendiente"}]
    inspection = add_inspection(db, risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dSafetyInspectionCreate(inspected_at=now, result="non_compliant", note="Falta senalero", evidence_ref="bim://evidence/SAFE-1", checklist=checklist))
    assert inspection["risk_id"] == risk["id"] and inspection["checklist"][1]["passed"] is False
    assert list_inspections(db, risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id)[0]["evidence_ref"] == "bim://evidence/SAFE-1"
    punch = create_punch_item(db, risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dSafetyPunchCreate(inspection_id=inspection["id"], title="Asignar senalero", priority="critical", due_at=now + timedelta(hours=2)))
    assert punch["status"] == "open" and list_punch_items(db, risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id)[0]["priority"] == "critical"
    closed = update_punch_item(db, punch_id=punch["id"], risk_id=risk["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dSafetyPunchUpdate(status="closed"))
    assert closed["closed_by"] == user.id and closed["closed_at"] is not None

    other_project = Proyecto(nombre="Outside Safety Project", empresa_id=sample_empresa.id); db.add(other_project); db.commit()
    try:
        list_punch_items(db, risk_id=risk["id"], project_id=other_project.id, company_id=sample_empresa.id)
        assert False, "El riesgo no puede cruzar proyecto"
    except HTTPException as error:
        assert error.status_code == 404


def test_safety_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2021a1b2c3_bim_4d_safety_risks.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2020a1b2c3"' in source
    assert '"bim_4d_safety_risks"' in source and '"bim_4d_safety_inspections"' in source
    assert "alter_column" not in source
    checklist_source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2034a1b2c3_bim_field_inspection_checklists.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2033a1b2c3"' in checklist_source
    assert '"bim_4d_safety_punch_items"' in checklist_source and '"checklist_json"' in checklist_source
    assert "alter_column" not in checklist_source
