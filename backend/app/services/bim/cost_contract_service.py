from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_cost_contract import BimCostContract
from app.models.bim_qto import BimCostEstimate


MONEY = Decimal("0.01")
TRANSITIONS = {
    "draft": {"active", "cancelled"},
    "active": {"closed", "cancelled"},
    "closed": set(),
    "cancelled": set(),
}


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(value, estimate):
    return {
        "id": value.id,
        "project_id": value.proyecto_id,
        "company_id": value.empresa_id,
        "estimate_id": value.estimate_id,
        "estimate_revision": estimate.revision,
        "contract_number": value.contract_number,
        "title": value.title,
        "counterparty_name": value.counterparty_name,
        "currency": value.currency,
        "committed_amount": float(value.committed_amount),
        "estimate_subtotal": float(estimate.subtotal),
        "start_date": value.start_date,
        "end_date": value.end_date,
        "status": value.status,
        "transition_reason": value.transition_reason,
        "lock_version": value.lock_version,
        "created_by": value.created_by,
        "transitioned_by": value.transitioned_by,
        "created_at": value.created_at,
        "transitioned_at": value.transitioned_at,
    }


def create_cost_contract(db, *, project_id, company_id, user_id, payload):
    estimate = db.query(BimCostEstimate).filter(
        BimCostEstimate.id == payload.estimate_id,
        BimCostEstimate.proyecto_id == project_id,
        BimCostEstimate.empresa_id == company_id,
        BimCostEstimate.status == "approved",
    ).with_for_update().first()
    if not estimate:
        raise HTTPException(status_code=409, detail="El contrato exige una estimacion BIM aprobada del proyecto activo.")
    if db.query(BimCostContract.id).filter(
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
        BimCostContract.contract_number == payload.contract_number.strip(),
    ).first():
        raise HTTPException(status_code=409, detail="El numero de contrato BIM ya existe.")
    committed_amount = _money(payload.committed_amount)
    existing_commitment = sum(
        (_money(item.committed_amount) for item in db.query(BimCostContract).filter(
            BimCostContract.estimate_id == estimate.id,
            BimCostContract.empresa_id == company_id,
            BimCostContract.proyecto_id == project_id,
            BimCostContract.status != "cancelled",
        ).with_for_update().all()),
        Decimal("0"),
    )
    if existing_commitment + committed_amount > _money(estimate.subtotal):
        raise HTTPException(status_code=422, detail="El compromiso acumulado no puede superar el subtotal de la estimacion aprobada.")
    value = BimCostContract(
        empresa_id=company_id,
        proyecto_id=project_id,
        estimate_id=estimate.id,
        contract_number=payload.contract_number.strip(),
        title=payload.title.strip(),
        counterparty_name=payload.counterparty_name.strip(),
        currency=estimate.currency,
        committed_amount=committed_amount,
        start_date=payload.start_date,
        end_date=payload.end_date,
        created_by=user_id,
    )
    db.add(value)
    db.commit()
    db.refresh(value)
    return _serialize(value, estimate)


def list_cost_contracts(db, *, project_id, company_id):
    values = db.query(BimCostContract, BimCostEstimate).join(
        BimCostEstimate, BimCostEstimate.id == BimCostContract.estimate_id
    ).filter(
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
    ).order_by(BimCostContract.created_at.desc(), BimCostContract.id.desc()).all()
    return [_serialize(value, estimate) for value, estimate in values]


def transition_cost_contract(db, *, contract_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostContract).filter(
        BimCostContract.id == contract_id,
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Contrato BIM fuera del proyecto activo.")
    if value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El contrato BIM cambio; actualice antes de continuar.")
    if payload.target_status not in TRANSITIONS[value.status]:
        raise HTTPException(status_code=409, detail=f"Transicion BIM no permitida: {value.status} -> {payload.target_status}.")
    value.status = payload.target_status
    value.transition_reason = payload.reason.strip()
    value.transitioned_by = user_id
    value.transitioned_at = datetime.now(timezone.utc)
    value.lock_version += 1
    estimate = db.query(BimCostEstimate).filter(BimCostEstimate.id == value.estimate_id).one()
    db.commit()
    db.refresh(value)
    return _serialize(value, estimate)
