from pathlib import Path

from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimCostEstimate, BimQtoSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cost_forecast import BimCostForecastCreate, BimCostForecastDecision
from app.services.bim.cost_forecast_service import create_forecast, decide_forecast, list_forecasts


def test_forecast_snapshot_and_approval_supersession(db, sample_empresa):
    user=Usuario(email="forecast@example.com",hashed_password="x",nombre_completo="Forecast",empresa_id=sample_empresa.id,rol="superadministrador"); project=Proyecto(nombre="Forecast",empresa_id=sample_empresa.id); db.add_all([user,project]); db.flush()
    model=BimModel(proyecto_id=project.id,empresa_id=sample_empresa.id,nombre="F");db.add(model);db.flush();version=BimModelVersion(bim_model_id=model.id,version_label="F1",status="ready",is_active=True);db.add(version);db.flush()
    qto=BimQtoSnapshot(empresa_id=sample_empresa.id,proyecto_id=project.id,bim_model_version_id=version.id,revision="QF",grouping_json=[],quantity_names_json=[],mappings_json=[],rows_json=[],totals_json=[],coverage_json={},checksum_sha256="f"*64,status="approved",lock_version=2,created_by=user.id);db.add(qto);db.flush()
    estimate=BimCostEstimate(empresa_id=sample_empresa.id,proyecto_id=project.id,qto_snapshot_id=qto.id,revision="EF",currency="USD",qto_checksum_sha256=qto.checksum_sha256,lines_json=[],subtotal=10000,status="approved",lock_version=2,created_by=user.id);db.add(estimate);db.commit()
    first=create_forecast(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCostForecastCreate(revision="FC-R1",currency="USD",estimate_to_complete=8000,rationale="Proyeccion inicial aprobable"))
    decide_forecast(db,forecast_id=first["id"],project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCostForecastDecision(decision="approved",reason="Forecast inicial aprobado",expected_lock_version=1))
    second=create_forecast(db,project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCostForecastCreate(revision="FC-R2",currency="USD",estimate_to_complete=9000,rationale="Revision por productividad"))
    decided=decide_forecast(db,forecast_id=second["id"],project_id=project.id,company_id=sample_empresa.id,user_id=user.id,payload=BimCostForecastDecision(decision="approved",reason="Forecast actualizado aprobado",expected_lock_version=1))
    assert decided["forecast_at_completion"]==9000 and decided["variance_at_completion"]==1000
    assert {item["status"] for item in list_forecasts(db,project_id=project.id,company_id=sample_empresa.id)}=={"approved","superseded"}


def test_forecast_migration_is_additive():
    source=(Path(__file__).parents[2]/"alembic"/"versions"/"de2044a1b2c3_bim_cost_forecasts.py").read_text(encoding="utf-8")
    assert 'down_revision="de2043a1b2c3"' in source and '"bim_cost_forecasts"' in source and "alter_column" not in source
