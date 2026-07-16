from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_field import Bim4dFieldReportCreate
from app.services.bim.cost_actual_service import get_actual_cost_ledger, sync_actual_cost_ledger
from app.services.bim.field_4d_service import create_field_report


def _payload(activity_id, reported_at, progress, actual_cost):
    return Bim4dFieldReportCreate(
        activity_snapshot_id=activity_id, reported_at=reported_at,
        progress_percent=progress, installed_quantity=progress, installed_unit="m2",
        labor_hours=8, equipment_hours=1, budget_at_completion=2000,
        planned_value_to_date=1000, actual_cost=actual_cost, currency="USD",
        daily_log="Parte de coste real acumulado validado en campo.",
    )


def test_field_reports_post_incremental_actual_cost_and_sync_is_idempotent(db, sample_empresa):
    now = datetime(2026, 7, 16, 12, tzinfo=timezone.utc)
    user = Usuario(email="actual-cost@example.com", hashed_password="x", nombre_completo="Actual Cost", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Actual Cost Project", empresa_id=sample_empresa.id)
    db.add_all([user, project]); db.flush()
    activity = Bim4dActivitySnapshot(
        empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="bim_native",
        source_ref="actual-1", snapshot_revision="R1", activity_code="A-REAL",
        activity_name="Instalar cerramiento", planned_start=now,
        planned_finish=now + timedelta(days=5), captured_by=user.id,
    )
    db.add(activity); db.commit()

    create_field_report(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(activity.id, now + timedelta(days=1), 25, 400))
    create_field_report(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(activity.id, now + timedelta(days=2), 50, 650))

    ledger = get_actual_cost_ledger(db, project_id=project.id, company_id=sample_empresa.id)
    assert ledger["currency_totals"] == {"USD": 650.0}
    assert [entry["incremental_actual_cost"] for entry in reversed(ledger["entries"])] == [400.0, 250.0]
    assert ledger["source_report_count"] == ledger["posted_report_count"] == 2
    synced = sync_actual_cost_ledger(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id)
    assert synced["posted_report_count"] == 2

    with pytest.raises(HTTPException) as decreasing:
        create_field_report(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(activity.id, now + timedelta(days=3), 60, 600))
    assert decreasing.value.status_code == 422
    different_currency = _payload(activity.id, now + timedelta(days=3), 60, 700)
    different_currency.currency = "EUR"
    with pytest.raises(HTTPException) as mixed:
        create_field_report(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=different_currency)
    assert mixed.value.status_code == 422


def test_actual_cost_ledger_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2043a1b2c3_bim_actual_cost_ledger.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2042a1b2c3"' in source
    assert '"bim_cost_actual_entries"' in source
    assert 'op.add_column("bim_4d_field_reports"' in source
    assert "alter_column" not in source
