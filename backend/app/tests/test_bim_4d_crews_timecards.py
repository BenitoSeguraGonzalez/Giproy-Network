from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_planning import Bim4dWorkArea
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_resources import Bim4dCrewCreate, Bim4dTimecardCreate
from app.services.bim.resource_4d_service import create_crew, create_timecard, list_crews, list_timecards


def test_crew_directory_and_timecard_are_project_scoped(db, sample_empresa):
    now = datetime(2026, 7, 16, 13, tzinfo=timezone.utc)
    user = Usuario(email="crew@example.com", hashed_password="x", nombre_completo="Crew BIM", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Crew Project", empresa_id=sample_empresa.id)
    other_project = Proyecto(nombre="Other Crew Project", empresa_id=sample_empresa.id)
    db.add_all([user, project, other_project]); db.flush()
    activity = Bim4dActivitySnapshot(empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="giproy_classic_schedule", source_ref="crew-1", snapshot_revision="R1", activity_code="EST-100", activity_name="Estructura", planned_start=now, planned_finish=now + timedelta(days=2), captured_by=user.id)
    area = Bim4dWorkArea(empresa_id=sample_empresa.id, proyecto_id=project.id, code="FN-01", name="Frente norte", description="Frente BIM", created_by=user.id)
    db.add_all([activity, area]); db.commit()

    crew = create_crew(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dCrewCreate(code="CU-EST-01", name="Cuadrilla estructura 1", trade="Estructura", member_count=8, note="Directorio BIM sin personas"))
    assert crew["member_count"] == 8
    assert list_crews(db, project_id=project.id, company_id=sample_empresa.id, active_only=True)[0]["code"] == "CU-EST-01"
    assert list_crews(db, project_id=other_project.id, company_id=sample_empresa.id) == []

    payload = Bim4dTimecardCreate(crew_id=crew["id"], activity_snapshot_id=activity.id, work_area_id=area.id, work_date=date(2026, 7, 16), regular_hours=8, overtime_hours=2, installed_quantity=14.5, installed_unit="m3", note="Vaciado de cimentacion")
    timecard = create_timecard(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert timecard["total_hours"] == 10
    assert timecard["crew_code"] == "CU-EST-01"
    assert list_timecards(db, project_id=project.id, company_id=sample_empresa.id, crew_id=crew["id"])[0]["installed_quantity"] == 14.5
    with pytest.raises(HTTPException) as duplicate:
        create_timecard(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert duplicate.value.status_code == 409
    with pytest.raises(HTTPException) as cross_project:
        create_timecard(db, project_id=other_project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert cross_project.value.status_code == 404


def test_crew_timecard_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2037a1b2c3_bim_crews_timecards.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2036a1b2c3"' in source
    assert '"bim_4d_crews"' in source and '"bim_4d_timecards"' in source
    assert "alter_column" not in source
