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
from app.schemas.bim_cost_payment import BimCostPaymentApplicationCreate, BimCostPaymentApplicationDecision, BimCostPaymentApplicationSubmit
from app.services.bim.cost_payment_service import create_payment_application, decide_payment_application, list_payment_applications, submit_payment_application


def _active_contract(db, company_id):
    project = Proyecto(nombre="Payment Project", empresa_id=company_id)
    user = Usuario(email="payment@example.com", hashed_password="x", nombre_completo="Payment BIM", empresa_id=company_id, rol="superadministrador")
    db.add_all([project, user]); db.flush()
    model = BimModel(proyecto_id=project.id, empresa_id=company_id, nombre="Payment model")
    db.add(model); db.flush()
    version = BimModelVersion(bim_model_id=model.id, version_label="P-V1", status="ready", is_active=True)
    db.add(version); db.flush()
    qto = BimQtoSnapshot(
        empresa_id=company_id, proyecto_id=project.id, bim_model_version_id=version.id,
        revision="QTO-P", grouping_json=[], quantity_names_json=[], mappings_json=[], rows_json=[],
        totals_json=[], coverage_json={}, checksum_sha256="b" * 64, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(qto); db.flush()
    estimate = BimCostEstimate(
        empresa_id=company_id, proyecto_id=project.id, qto_snapshot_id=qto.id,
        revision="EST-P", currency="USD", qto_checksum_sha256=qto.checksum_sha256,
        lines_json=[], subtotal=10000, status="approved", lock_version=2,
        created_by=user.id, decided_by=user.id,
    )
    db.add(estimate); db.flush()
    contract = BimCostContract(
        empresa_id=company_id, proyecto_id=project.id, estimate_id=estimate.id,
        contract_number="CTR-P", title="Contrato de obra", counterparty_name="Obra SAS",
        currency="USD", committed_amount=9000, start_date=date(2026, 8, 1),
        end_date=date(2027, 2, 1), status="active", lock_version=2, created_by=user.id,
    )
    db.add(contract); db.commit()
    return project, user, contract


def _payload(contract_id, number="PAY-001", gross=4000, retention=400):
    return BimCostPaymentApplicationCreate(
        contract_id=contract_id, application_number=number,
        period_start=date(2026, 8, 1), period_end=date(2026, 8, 31),
        gross_requested=gross, retention_requested=retention,
    )


def test_payment_application_submit_and_certify(db, sample_empresa):
    project, user, contract = _active_contract(db, sample_empresa.id)
    created = create_payment_application(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(contract.id))
    assert created["net_requested"] == 3600 and created["status"] == "draft"
    submitted = submit_payment_application(
        db, application_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostPaymentApplicationSubmit(expected_lock_version=1),
    )
    certified = decide_payment_application(
        db, application_id=created["id"], project_id=project.id, company_id=sample_empresa.id,
        user_id=user.id, payload=BimCostPaymentApplicationDecision(
            decision="certified", reason="Avance comprobado en obra", expected_lock_version=2,
            certified_gross=3800, certified_retention=380,
        ),
    )
    assert submitted["status"] == "submitted"
    assert certified["status"] == "certified" and certified["certified_net"] == 3420
    assert list_payment_applications(db, project_id=project.id, company_id=sample_empresa.id)[0]["lock_version"] == 3


def test_payment_application_enforces_contract_balance_and_certified_amount(db, sample_empresa):
    project, user, contract = _active_contract(db, sample_empresa.id)
    first = create_payment_application(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(contract.id, gross=6000, retention=0))
    with pytest.raises(HTTPException) as error:
        create_payment_application(db, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=_payload(contract.id, number="PAY-002", gross=4000, retention=0))
    assert error.value.status_code == 422
    submit_payment_application(db, application_id=first["id"], project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimCostPaymentApplicationSubmit(expected_lock_version=1))
    with pytest.raises(HTTPException) as error:
        decide_payment_application(
            db, application_id=first["id"], project_id=project.id, company_id=sample_empresa.id,
            user_id=user.id, payload=BimCostPaymentApplicationDecision(
                decision="certified", reason="Importe incorrecto", expected_lock_version=2,
                certified_gross=6001, certified_retention=0,
            ),
        )
    assert error.value.status_code == 422


def test_bim_cost_payment_migration_is_additive():
    source = (Path(__file__).parents[2] / "alembic" / "versions" / "de2040a1b2c3_bim_cost_payment_applications.py").read_text(encoding="utf-8")
    assert 'down_revision = "de2039a1b2c3"' in source
    assert '"bim_cost_payment_applications"' in source and "alter_column" not in source
