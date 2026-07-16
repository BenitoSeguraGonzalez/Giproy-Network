from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_resources import Bim4dResource
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_4d_resources import Bim4dFieldResourceMovementCreate
from app.services.bim.resource_4d_service import create_field_resource_movement, list_field_resource_movements


def test_field_resource_receipt_consumption_return_and_balance(db, sample_empresa):
    now = datetime(2026, 7, 16, 15, tzinfo=timezone.utc)
    user = Usuario(email="field-resource@example.com", hashed_password="x", nombre_completo="Field Resource", empresa_id=sample_empresa.id, rol="superadministrador")
    project = Proyecto(nombre="Field Resource Project", empresa_id=sample_empresa.id); db.add_all([user, project]); db.flush()
    activity = Bim4dActivitySnapshot(empresa_id=sample_empresa.id, proyecto_id=project.id, source_kind="giproy_classic_schedule", source_ref="mat-1", snapshot_revision="R1", activity_code="MAT-100", activity_name="Hormigon", planned_start=now, planned_finish=now + timedelta(days=2), captured_by=user.id)
    resource = Bim4dResource(empresa_id=sample_empresa.id, proyecto_id=project.id, code="MAT-H25", name="Hormigon H25", resource_type="material", unit="m3", capacity_per_day=20, created_by=user.id)
    db.add_all([activity, resource]); db.commit()
    receipt = create_field_resource_movement(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dFieldResourceMovementCreate(resource_id=resource.id, movement_type="receipt", quantity=12, occurred_at=now, reference="REM-001", note="Recepcion conforme"))
    consumed = create_field_resource_movement(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dFieldResourceMovementCreate(resource_id=resource.id, activity_snapshot_id=activity.id, movement_type="consume", quantity=5, occurred_at=now + timedelta(hours=1), note="Consumo cimentacion"))
    returned = create_field_resource_movement(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dFieldResourceMovementCreate(resource_id=resource.id, activity_snapshot_id=activity.id, movement_type="return", quantity=1, occurred_at=now + timedelta(hours=2), note="Retorno sobrante"))
    assert [receipt["balance_after"], consumed["balance_after"], returned["balance_after"]] == [12, 7, 8]
    assert list_field_resource_movements(db, project_id=project.id, company_id=sample_empresa.id)[-1]["balance_after"] == 8
    with pytest.raises(HTTPException) as error:
        create_field_resource_movement(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=Bim4dFieldResourceMovementCreate(resource_id=resource.id, activity_snapshot_id=activity.id, movement_type="consume", quantity=9, occurred_at=now + timedelta(hours=3), note="Consumo excesivo"))
    assert error.value.status_code == 409


def test_field_resource_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2036a1b2c3_bim_field_resource_movements.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2035a1b2c3"' in source
    assert '"bim_4d_field_resource_movements"' in source and "alter_column" not in source
