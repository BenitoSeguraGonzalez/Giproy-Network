from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_event import Bim4dUnplannedEventCreate, Bim4dUnplannedEventDecision
from app.services.bim.unplanned_event_service import create_event, decide_event, list_events


def test_unplanned_event_real_impact_and_decision(db, sample_empresa):
    now = datetime(2026, 7, 16, 15, tzinfo=timezone.utc)
    user = Usuario(email="event4d@example.com", hashed_password="x", nombre_completo="Event 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Event Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    activity = Bim4dActivitySnapshot(empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="giproy_classic_schedule", source_ref="event-1", snapshot_revision="R1", activity_code="A-100", activity_name="Cimentacion", planned_start=now, planned_finish=now + timedelta(days=3), captured_by=user.id); db.add(activity); db.commit()
    event = create_event(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dUnplannedEventCreate(activity_snapshot_id=activity.id, event_type="weather", title="Lluvia intensa", description="Frente detenido por saturacion.", occurred_at=now, delay_days=1.5, actual_cost=2400))
    assert event["status"] == "reported" and event["delay_days"] == 1.5 and event["actual_cost"] == 2400
    assert list_events(db, project_id=project.id, company_id=sample_empresa.id)[0]["activity_snapshot_id"] == activity.id
    decided = decide_event(db, event_id=event["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dUnplannedEventDecision(action="validate", reason="Validado por residente"))
    assert decided["status"] == "validated" and decided["decided_by"] == user.id
    try:
        decide_event(db, event_id=event["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dUnplannedEventDecision(action="void", reason="Segundo intento"))
        assert False, "No se puede decidir dos veces"
    except HTTPException as error:
        assert error.status_code == 409


def test_unplanned_event_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2035a1b2c3_bim_unplanned_events.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2034a1b2c3"' in source
    assert '"bim_4d_unplanned_events"' in source and "alter_column" not in source
