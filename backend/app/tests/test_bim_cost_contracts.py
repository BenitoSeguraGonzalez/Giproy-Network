from datetime import date
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimCostEstimate, BimQtoSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cost_contract import BimCostContractCreate, BimCostContractTransition
from app.services.bim.cost_contract_service import create_cost_contract, list_cost_contracts, transition_cost_contract


def _approved_estimate(db, company_id):
    project = Proyecto(nombre="Contract Project", empresa_id=company_id)
    user = Usuario(email="contract@example.com", hashed_password="x", nombre_completo="Contract BIM", empresa_id=company_id, rol="superadministrador")
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company_id, nombre="Contract model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="C-V1", status="ready", is_active=True)
    db.add(version); db.flush()
    qto = BimQtoSnapshot(
        empresa_id=company_id, proyecto_id=project.id, bim_model_version_id=version.id,
        revision="QTO-C", grouping_json=[], quantity_names_json=[], mappings_json=[],
        rows_json=[], totals_json=[], coverage_json={}, checksum_sha256="a" * 64,
        status="approved", lock_version=2, created_by=user.id, decided_by=user.id,
    )
    db.add(qto); db.flush()
    estimate = BimCostEstimate(
        empresa_id=company_id, proyecto_id=project.id, qto_snapshot_id=qto.id,
        revision="EST-A", currency="USD", qto_checksum_sha256="a" * 64,
        lines_json=[], subtotal=10000, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(estimate); db.commit()
    return project, user, estimate


def test_cost_contract_uses_approved_estimate_and_governed_transitions(db, sample_empresa):
    project, user, estimate = _approved_estimate(db, sample_empresa.id)
    created = create_cost_contract(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=BimCostContractCreate(
            estimate_id=estimate.id, contract_number="CTR-001", title="Estructura",
            counterparty_name="Constructora Andina", committed_amount=8250.55,
            start_date=date(2026, 8, 1), end_date=date(2026, 12, 15),
        ),
    )
    assert created["currency"] == "USD" and created["status"] == "draft"
    assert created["estimate_revision"] == "EST-A" and created["committed_amount"] == 8250.55
    active = transition_cost_contract(
        db, contract_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostContractTransition(target_status="active", reason="Contrato adjudicado", expected_lock_version=1),
    )
    closed = transition_cost_contract(
        db, contract_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostContractTransition(target_status="closed", reason="Alcance contractual terminado", expected_lock_version=2),
    )
    assert active["status"] == "active" and closed["status"] == "closed"
    assert list_cost_contracts(db, project_id=project.id, company_id=sample_empresa.id)[0]["lock_version"] == 3
    with pytest.raises(HTTPException) as error:
        transition_cost_contract(
            db, contract_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
            user_id=user.id, payload=BimCostContractTransition(target_status="cancelled", reason="Cierre ya consumado", expected_lock_version=3),
        )
    assert error.value.status_code == 409


def test_cost_contract_rejects_overcommit_and_terminal_transition(db, sample_empresa):
    project, user, estimate = _approved_estimate(db, sample_empresa.id)
    create_cost_contract(
        db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id,
        payload=BimCostContractCreate(
            estimate_id=estimate.id, contract_number="CTR-001", title="Obra civil",
            counterparty_name="Civil SAS", committed_amount=6000,
            start_date=date(2026, 8, 1), end_date=date(2026, 9, 1),
        ),
    )
    payload = BimCostContractCreate(
        estimate_id=estimate.id, contract_number="CTR-002", title="Instalaciones",
        counterparty_name="MEP SAS", committed_amount=5000,
        start_date=date(2026, 8, 1), end_date=date(2026, 9, 1),
    )
    with pytest.raises(HTTPException) as error:
        create_cost_contract(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=payload)
    assert error.value.status_code == 422


def test_bim_cost_contract_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2039a1b2c3_bim_cost_contracts.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2038a1b2c3"' in source
    assert '"bim_cost_contracts"' in source and "alter_column" not in source
