from datetime import date
from pathlib import Path

import pytest
from fastapi import HTTPException

from app.models.bim_cost_contract import BimCostContract
from app.models.bim_cost_payment import BimCostPaymentApplication
from app.models.bim_cost_sov import BimCostScheduleOfValues
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.bim_qto import BimCostEstimate, BimQtoSnapshot
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.bim_cost_change_order import BimCostChangeOrderCreate, BimCostChangeOrderDecision, BimCostChangeOrderTransition
from app.services.bim.cost_change_order_service import create_change_order, decide_change_order, transition_change_order


def _contract_context(db, company_id, payment_reserved=0):
    project = Proyecto(nombre="Change Project", empresa_id=company_id)
    user = Usuario(email="change@example.com", hashed_password="x", nombre_completo="Change BIM", empresa_id=company_id, rol="superadministrador")
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company_id, nombre="Change model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="CO-V1", status="ready", is_active=True)
    db.add(version); db.flush()
    qto = BimQtoSnapshot(
        empresa_id=company_id, proyecto_id=project.id, bim_model_version_id=version.id,
        revision="QTO-CO", grouping_json=[], quantity_names_json=[], mappings_json=[], rows_json=[],
        totals_json=[], coverage_json={}, checksum_sha256="d" * 64, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(qto); db.flush()
    estimate = BimCostEstimate(
        empresa_id=company_id, proyecto_id=project.id, qto_snapshot_id=qto.id,
        revision="EST-CO", currency="USD", qto_checksum_sha256=qto.checksum_sha256,
        lines_json=[], subtotal=9000, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(estimate); db.flush()
    contract = BimCostContract(
        empresa_id=company_id, proyecto_id=project.id, estimate_id=estimate.id,
        contract_number="CTR-CO", title="Contrato cambios", counterparty_name="Cambios SAS",
        currency="USD", committed_amount=9000, start_date=date(2026, 8, 1),
        end_date=date(2027, 2, 1), status="active", lock_version=2, created_by=user.id,
    )
    db.add(contract); db.flush()
    sov = BimCostScheduleOfValues(
        empresa_id=company_id, proyecto_id=project.id, contract_id=contract.id,
        revision="SOV-CO", lines_json=[{"code": "01", "description": "Base", "scheduled_value": 9000}],
        total_scheduled_value=9000, status="approved", lock_version=2, created_by=user.id, decided_by=user.id,
    )
    db.add(sov); db.flush()
    if payment_reserved:
        db.add(BimCostPaymentApplication(
            empresa_id=company_id, proyecto_id=project.id, contract_id=contract.id,
            application_number="PAY-CO", period_start=date(2026, 8, 1), period_end=date(2026, 8, 31),
            currency="USD", gross_requested=payment_reserved, retention_requested=0,
            net_requested=payment_reserved, status="submitted", lock_version=2, created_by=user.id,
        ))
    db.commit()
    return project, user, contract, sov


def _create_and_submit(db, project, user, contract, company_id, delta, days=10):
    created = create_change_order(
        db, project_id=project.id, company_id=company_id, user_id=user.id,
        payload=BimCostChangeOrderCreate(
            contract_id=contract.id, change_number="CO-001", title="Cambio de alcance",
            description="Cambio solicitado y documentado", requested_cost_delta=delta,
            requested_schedule_days=days,
        ),
    )
    transition_change_order(
        db, change_id=created["id"], project_id=project.id, company_id=company_id,
        user_id=user.id, payload=BimCostChangeOrderTransition(
            target_status="submitted", reason="Enviada para revision", expected_lock_version=1,
        ),
    )
    return created


def test_approved_change_updates_contract_and_supersedes_sov(db, sample_empresa):
    project, user, contract, sov = _contract_context(db, sample_empresa.id)
    created = _create_and_submit(db, project, user, contract, sample_empresa.id, 1000)
    approved = decide_change_order(
        db, change_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostChangeOrderDecision(
            decision="approved", reason="Cambio aprobado por direccion", expected_lock_version=2,
            approved_cost_delta=800, approved_schedule_days=7,
        ),
    )
    db.refresh(contract); db.refresh(sov)
    assert approved["contract_amount_before"] == 9000 and approved["contract_amount_after"] == 9800
    assert float(contract.committed_amount) == 9800 and sov.status == "superseded"


def test_change_cannot_reduce_below_reserved_payments_or_exceed_request(db, sample_empresa):
    project, user, contract, _sov = _contract_context(db, sample_empresa.id, payment_reserved=8500)
    created = _create_and_submit(db, project, user, contract, sample_empresa.id, -1000, -5)
    with pytest.raises(HTTPException) as error:
        decide_change_order(
            db, change_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
            user_id=user.id, payload=BimCostChangeOrderDecision(
                decision="approved", reason="Reduccion contractual", expected_lock_version=2,
                approved_cost_delta=-1000, approved_schedule_days=-5,
            ),
        )
    assert error.value.status_code == 422


def test_bim_cost_change_order_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2042a1b2c3_bim_cost_change_orders.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2041a1b2c3"' in source
    assert '"bim_cost_change_orders"' in source and "alter_column" not in source
