from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_cost_contract import BimCostContract
from app.models.bim_cost_payment import BimCostPaymentApplication


MONEY = Decimal("0.01")


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(value, contract):
    return {
        "id": value.id,
        "project_id": value.proyecto_id,
        "company_id": value.empresa_id,
        "contract_id": value.contract_id,
        "contract_number": contract.contract_number,
        "application_number": value.application_number,
        "period_start": value.period_start,
        "period_end": value.period_end,
        "currency": value.currency,
        "gross_requested": float(value.gross_requested),
        "retention_requested": float(value.retention_requested),
        "net_requested": float(value.net_requested),
        "certified_gross": float(value.certified_gross) if value.certified_gross is not None else None,
        "certified_retention": float(value.certified_retention) if value.certified_retention is not None else None,
        "certified_net": float(value.certified_net) if value.certified_net is not None else None,
        "status": value.status,
        "decision_reason": value.decision_reason,
        "lock_version": value.lock_version,
        "created_by": value.created_by,
        "submitted_by": value.submitted_by,
        "decided_by": value.decided_by,
        "created_at": value.created_at,
        "submitted_at": value.submitted_at,
        "decided_at": value.decided_at,
    }


def create_payment_application(db, *, project_id, company_id, user_id, payload):
    contract = db.query(BimCostContract).filter(
        BimCostContract.id == payload.contract_id,
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
        BimCostContract.status == "active",
    ).with_for_update().first()
    if not contract:
        raise HTTPException(status_code=409, detail="La solicitud exige un contrato BIM activo del proyecto.")
    number = payload.application_number.strip()
    if db.query(BimCostPaymentApplication.id).filter(
        BimCostPaymentApplication.contract_id == contract.id,
        BimCostPaymentApplication.empresa_id == company_id,
        BimCostPaymentApplication.proyecto_id == project_id,
        BimCostPaymentApplication.application_number == number,
    ).first():
        raise HTTPException(status_code=409, detail="El numero de solicitud de pago ya existe para el contrato.")
    gross = _money(payload.gross_requested)
    retention = _money(payload.retention_requested)
    reserved = sum(
        (_money(item.gross_requested) for item in db.query(BimCostPaymentApplication).filter(
            BimCostPaymentApplication.contract_id == contract.id,
            BimCostPaymentApplication.status != "rejected",
        ).with_for_update().all()),
        Decimal("0"),
    )
    if reserved + gross > _money(contract.committed_amount):
        raise HTTPException(status_code=422, detail="El bruto solicitado acumulado supera el compromiso contractual.")
    value = BimCostPaymentApplication(
        empresa_id=company_id, proyecto_id=project_id, contract_id=contract.id,
        application_number=number, period_start=payload.period_start,
        period_end=payload.period_end, currency=contract.currency,
        gross_requested=gross, retention_requested=retention,
        net_requested=gross - retention, created_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value, contract)


def list_payment_applications(db, *, project_id, company_id):
    values = db.query(BimCostPaymentApplication, BimCostContract).join(
        BimCostContract, BimCostContract.id == BimCostPaymentApplication.contract_id
    ).filter(
        BimCostPaymentApplication.proyecto_id == project_id,
        BimCostPaymentApplication.empresa_id == company_id,
    ).order_by(BimCostPaymentApplication.created_at.desc(), BimCostPaymentApplication.id.desc()).all()
    return [_serialize(value, contract) for value, contract in values]


def submit_payment_application(db, *, application_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostPaymentApplication).filter(
        BimCostPaymentApplication.id == application_id,
        BimCostPaymentApplication.proyecto_id == project_id,
        BimCostPaymentApplication.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Solicitud de pago BIM fuera del proyecto activo.")
    if value.status != "draft" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La solicitud cambio o ya fue enviada.")
    contract = db.query(BimCostContract).filter(BimCostContract.id == value.contract_id).one()
    if contract.status != "active":
        raise HTTPException(status_code=409, detail="El contrato BIM debe permanecer activo para enviar la solicitud.")
    value.status = "submitted"; value.submitted_by = user_id
    value.submitted_at = datetime.now(timezone.utc); value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value, contract)


def decide_payment_application(db, *, application_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostPaymentApplication).filter(
        BimCostPaymentApplication.id == application_id,
        BimCostPaymentApplication.proyecto_id == project_id,
        BimCostPaymentApplication.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Solicitud de pago BIM fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La solicitud cambio o ya fue decidida.")
    contract = db.query(BimCostContract).filter(BimCostContract.id == value.contract_id).with_for_update().one()
    if payload.decision == "certified":
        if payload.certified_gross is None:
            raise HTTPException(status_code=422, detail="La certificacion exige un importe bruto certificado.")
        gross = _money(payload.certified_gross)
        retention = _money(payload.certified_retention)
        if gross > _money(value.gross_requested) or retention > gross:
            raise HTTPException(status_code=422, detail="Los importes certificados exceden la solicitud o su bruto.")
        certified_before = sum(
            (_money(item.certified_gross) for item in db.query(BimCostPaymentApplication).filter(
                BimCostPaymentApplication.contract_id == contract.id,
                BimCostPaymentApplication.status == "certified",
                BimCostPaymentApplication.id != value.id,
            ).with_for_update().all()),
            Decimal("0"),
        )
        if certified_before + gross > _money(contract.committed_amount):
            raise HTTPException(status_code=422, detail="El certificado acumulado supera el compromiso contractual.")
        value.certified_gross = gross; value.certified_retention = retention
        value.certified_net = gross - retention
    value.status = payload.decision; value.decision_reason = payload.reason.strip()
    value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value, contract)
