from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dProgressSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d import Bim4dActivitySnapshotCreate
from app.schemas.bim_4d_field import Bim4dFieldReportCreate
from app.services.bim.field_4d_service import add_field_evidence, create_field_report, get_field_evidence, list_field_reports
from app.services.bim.schedule_4d_service import create_activity_snapshot


def test_field_report_progress_evidence_and_earned_value(db, sample_empresa):
    user = Usuario(email="field4d@example.com", hashed_password="x", nombre_completo="Field 4D", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Field Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.commit()
    activity = create_activity_snapshot(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dActivitySnapshotCreate(source_ref="field-task", snapshot_revision="R1", activity_code="A-FIELD", activity_name="Instalar muros", planned_start=datetime(2026, 8, 3, tzinfo=timezone.utc), planned_finish=datetime(2026, 8, 7, tzinfo=timezone.utc)))
    report = create_field_report(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dFieldReportCreate(activity_snapshot_id=activity["id"], reported_at=datetime(2026, 8, 5, 18, tzinfo=timezone.utc), progress_percent=50, actual_start=datetime(2026, 8, 3, tzinfo=timezone.utc), installed_quantity=10, installed_unit="m3", labor_hours=32, equipment_hours=4, budget_at_completion=1000, planned_value_to_date=600, actual_cost=450, daily_log="Muro ejecutado y verificado en frente norte."))
    assert report["earned_value"] == 500
    assert report["schedule_performance_index"] == 0.8333
    assert report["cost_performance_index"] == 1.1111
    assert db.get(Bim4dProgressSnapshot, report["progress_snapshot_id"]).progress_percent == 50
    content = b"\x89PNG\r\nfield-evidence"
    evidence = add_field_evidence(db, report_id=report["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, filename="avance.png", content_type="image/png", content=content)
    assert evidence["byte_size"] == len(content)
    assert get_field_evidence(db, evidence_id=evidence["id"], project_id=project.id, company_id=sample_empresa.id).content == content
    assert len(list_field_reports(db, project_id=project.id, company_id=sample_empresa.id)[0]["evidence"]) == 1
    with pytest.raises(HTTPException) as duplicate:
        add_field_evidence(db, report_id=report["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, filename="duplicada.png", content_type="image/png", content=content)
    assert duplicate.value.status_code == 409


def test_bim_4d_field_migration_is_additive():
    path = Path(__file__).parents[2] / "alembic" / "versions" / "de2016a1b2c3_bim_4d_field.py"
    source = path.read_text(encoding="utf-8")
    assert 'down_revision = "de2015a1b2c3"' in source
    assert '"bim_4d_field_reports"' in source
    assert '"bim_4d_field_evidence"' in source
    assert "alter_column" not in source
