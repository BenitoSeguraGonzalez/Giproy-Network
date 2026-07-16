from decimal import Decimal
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimQtoSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_qto import BimCostEstimateCreate, BimCostEstimateDecision
from app.services.bim.cost_estimate_service import create_cost_estimate, decide_cost_estimate, list_cost_estimates


def _approved_qto(db, company_id):
    project = Proyecto(nombre="Estimate Project", empresa_id=company_id)
    user = Usuario(email="estimate@example.com", hashed_password="x", nombre_completo="Estimate BIM", empresa_id=company_id, rol="superadministrador")
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company_id, nombre="Estimate model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="E-V1", status="ready", is_active=True)
    db.add(version); db.flush()
    qto = BimQtoSnapshot(empresa_id=company_id, proyecto_id=project.id, bim_model_version_id=version.id, revision="QTO-A", grouping_json=["ifc_class"], quantity_names_json=[], mappings_json=[], rows_json=[{"group": {"ifc_class": "IFCWALL"}, "quantity_name": "NetVolume", "unit": "m3", "value": 10, "wbs_code": "1.1", "cost_code": "EST-MUR"}, {"group": {"ifc_class": "IFCDOOR"}, "quantity_name": "Count", "unit": "ud", "value": 2, "wbs_code": "1.2", "cost_code": "ARQ-PUE"}], totals_json=[], coverage_json={"mapping_coverage_percent": 100}, checksum_sha256="a" * 64, status="approved", lock_version=2, created_by=user.id, decided_by=user.id)
    db.add(qto); db.commit()
    return project, user, qto


def test_estimate_requires_approved_complete_qto_pricing(db, sample_empresa):
    project, user, qto = _approved_qto(db, sample_empresa.id)
    payload = BimCostEstimateCreate(qto_snapshot_id=qto.id, revision="EST-R1", currency="USD", rates=[{"row_index": 0, "unit_rate": 125.25}, {"row_index": 1, "unit_rate": 240}])
    estimate = create_cost_estimate(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert Decimal(str(estimate["subtotal"])) == Decimal("1732.5")
    assert estimate["qto_checksum_sha256"] == qto.checksum_sha256
    assert len(estimate["lines"]) == 2
    decided = decide_cost_estimate(db, estimate_id=estimate["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCostEstimateDecision(decision="approved", reason="Estimacion BIM revisada", expected_lock_version=1))
    assert decided["status"] == "approved" and decided["lock_version"] == 2
    assert list_cost_estimates(db, project_id=project.id, company_id=sample_empresa.id)[0]["status"] == "approved"
    with pytest.raises(HTTPException) as error:
        create_cost_estimate(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCostEstimateCreate(qto_snapshot_id=qto.id, revision="EST-R2", rates=[{"row_index": 0, "unit_rate": 1}]))
    assert error.value.status_code == 422


def test_bim_cost_estimate_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2038a1b2c3_bim_cost_estimates.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2037a1b2c3"' in source
    assert '"bim_cost_estimates"' in source and "alter_column" not in source
