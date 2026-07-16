from datetime import date
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_cost_contract import BimCostContract
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimCostEstimate, BimQtoSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cost_sov import BimCostSovCreate, BimCostSovDecision
from app.services.bim.cost_sov_service import create_sov, decide_sov, list_sovs


def _active_contract(db, company_id):
    project = Proyecto(nombre="SOV Project", empresa_id=company_id)
    user = Usuario(email="sov@example.com", hashed_password="x", nombre_completo="SOV BIM", empresa_id=company_id, rol="superadministrador")
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company_id, nombre="SOV model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="S-V1", status="ready", is_active=True)
    db.add(version); db.flush()
    qto = BimQtoSnapshot(
        empresa_id=company_id, proyecto_id=project.id, bim_model_version_id=version.id,
        revision="QTO-S", grouping_json=[], quantity_names_json=[], mappings_json=[], rows_json=[],
        totals_json=[], coverage_json={}, checksum_sha256="c" * 64, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(qto); db.flush()
    estimate = BimCostEstimate(
        empresa_id=company_id, proyecto_id=project.id, qto_snapshot_id=qto.id,
        revision="EST-S", currency="USD", qto_checksum_sha256=qto.checksum_sha256,
        lines_json=[], subtotal=9000, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(estimate); db.flush()
    contract = BimCostContract(
        empresa_id=company_id, proyecto_id=project.id, estimate_id=estimate.id,
        contract_number="CTR-S", title="Contrato SOV", counterparty_name="SOV SAS",
        currency="USD", committed_amount=9000, start_date=date(2026, 8, 1),
        end_date=date(2027, 2, 1), status="active", lock_version=2, created_by=user.id,
    )
    db.add(contract); db.commit()
    return project, user, contract


def _payload(contract_id, revision="SOV-R1"):
    return BimCostSovCreate(contract_id=contract_id, revision=revision, lines=[
        {"code": "01", "description": "Cimentacion", "scheduled_value": 5000},
        {"code": "02", "description": "Estructura", "scheduled_value": 4000},
    ])


def test_sov_requires_full_allocation_and_supersedes_approval(db, sample_empresa):
    project, user, contract = _active_contract(db, sample_empresa.id)
    first = create_sov(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(contract.id))
    approved = decide_sov(
        db, sov_id=first["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostSovDecision(decision="approved", reason="SOV contractual aprobado", expected_lock_version=1),
    )
    second = create_sov(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(contract.id, "SOV-R2"))
    decide_sov(
        db, sov_id=second["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostSovDecision(decision="approved", reason="Revision contractual aprobada", expected_lock_version=1),
    )
    values = list_sovs(db, project_id=project.id, company_id=sample_empresa.id)
    assert approved["total_scheduled_value"] == 9000
    assert {item["status"] for item in values} == {"approved", "superseded"}


def test_sov_rejects_partial_or_duplicate_allocation(db, sample_empresa):
    project, user, contract = _active_contract(db, sample_empresa.id)
    with pytest.raises(HTTPException) as error:
        create_sov(
            db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
            payload=BimCostSovCreate(contract_id=contract.id, revision="SOV-BAD", lines=[{"code": "01", "description": "Parcial", "scheduled_value": 8000}]),
        )
    assert error.value.status_code == 422
    with pytest.raises(HTTPException) as error:
        create_sov(
            db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
            payload=BimCostSovCreate(contract_id=contract.id, revision="SOV-DUP", lines=[{"code": "01", "description": "A", "scheduled_value": 5000}, {"code": "01", "description": "B", "scheduled_value": 4000}]),
        )
    assert error.value.status_code == 422


def test_bim_cost_sov_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2041a1b2c3_bim_cost_sov.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2040a1b2c3"' in source
    assert '"bim_cost_schedules_of_values"' in source and "alter_column" not in source
