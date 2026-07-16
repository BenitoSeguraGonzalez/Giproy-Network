from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_cost_change_order import BimCostChangeOrder
from app.models.bim_cost_contract import BimCostContract
from app.models.bim_cost_payment import BimCostPaymentApplication
from app.models.bim_cost_sov import BimCostScheduleOfValues


MONEY = Decimal("0.01")


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(value, contract):
    return {
        "id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id,
        "contract_id": value.contract_id, "contract_number": contract.contract_number,
        "change_number": value.change_number, "title": value.title,
        "description": value.description, "currency": value.currency,
        "requested_cost_delta": float(value.requested_cost_delta),
        "requested_schedule_days": value.requested_schedule_days,
        "approved_cost_delta": float(value.approved_cost_delta) if value.approved_cost_delta is not None else None,
        "approved_schedule_days": value.approved_schedule_days,
        "contract_amount_before": float(value.contract_amount_before) if value.contract_amount_before is not None else None,
        "contract_amount_after": float(value.contract_amount_after) if value.contract_amount_after is not None else None,
        "status": value.status, "transition_reason": value.transition_reason,
        "decision_reason": value.decision_reason, "lock_version": value.lock_version,
        "created_by": value.created_by, "submitted_by": value.submitted_by,
        "decided_by": value.decided_by, "created_at": value.created_at,
        "submitted_at": value.submitted_at, "decided_at": value.decided_at,
    }


def create_change_order(db, *, project_id, company_id, user_id, payload):
    contract = db.query(BimCostContract).filter(
        BimCostContract.id == payload.contract_id,
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
        BimCostContract.status == "active",
    ).first()
    if not contract:
        raise HTTPException(status_code=409, detail="La orden de cambio exige un contrato BIM activo.")
    number = payload.change_number.strip()
    if db.query(BimCostChangeOrder.id).filter(
        BimCostChangeOrder.contract_id == contract.id,
        BimCostChangeOrder.empresa_id == company_id,
        BimCostChangeOrder.proyecto_id == project_id,
        BimCostChangeOrder.change_number == number,
    ).first():
        raise HTTPException(status_code=409, detail="El numero de orden de cambio ya existe.")
    value = BimCostChangeOrder(
        empresa_id=company_id, proyecto_id=project_id, contract_id=contract.id,
        change_number=number, title=payload.title.strip(), description=payload.description.strip(),
        currency=contract.currency, requested_cost_delta=_money(payload.requested_cost_delta),
        requested_schedule_days=payload.requested_schedule_days, created_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value, contract)


def list_change_orders(db, *, project_id, company_id):
    values = db.query(BimCostChangeOrder, BimCostContract).join(
        BimCostContract, BimCostContract.id == BimCostChangeOrder.contract_id
    ).filter(
        BimCostChangeOrder.proyecto_id == project_id,
        BimCostChangeOrder.empresa_id == company_id,
    ).order_by(BimCostChangeOrder.created_at.desc(), BimCostChangeOrder.id.desc()).all()
    return [_serialize(value, contract) for value, contract in values]


def transition_change_order(db, *, change_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostChangeOrder).filter(
        BimCostChangeOrder.id == change_id,
        BimCostChangeOrder.proyecto_id == project_id,
        BimCostChangeOrder.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Orden de cambio BIM fuera del proyecto activo.")
    if value.status != "potential" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La orden cambio o ya fue enviada/cancelada.")
    contract = db.query(BimCostContract).filter(BimCostContract.id == value.contract_id).one()
    if payload.target_status == "submitted" and contract.status != "active":
        raise HTTPException(status_code=409, detail="El contrato BIM debe permanecer activo para enviar la orden.")
    value.status = payload.target_status; value.transition_reason = payload.reason.strip()
    if payload.target_status == "submitted":
        value.submitted_by = user_id; value.submitted_at = datetime.now(timezone.utc)
    else:
        value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value, contract)


def decide_change_order(db, *, change_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostChangeOrder).filter(
        BimCostChangeOrder.id == change_id,
        BimCostChangeOrder.proyecto_id == project_id,
        BimCostChangeOrder.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Orden de cambio BIM fuera del proyecto activo.")
    if value.status != "submitted" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La orden cambio o ya fue decidida.")
    contract = db.query(BimCostContract).filter(BimCostContract.id == value.contract_id).with_for_update().one()
    if contract.status != "active":
        raise HTTPException(status_code=409, detail="El contrato BIM debe permanecer activo para decidir la orden.")
    if payload.decision == "approved":
        cost_delta = payload.approved_cost_delta
        schedule_days = payload.approved_schedule_days
        if cost_delta is None or schedule_days is None:
            raise HTTPException(status_code=422, detail="La aprobacion exige impactos de coste y plazo aprobados.")
        approved_cost = _money(cost_delta)
        requested_cost = _money(value.requested_cost_delta)
        if approved_cost == 0 and schedule_days == 0:
            raise HTTPException(status_code=422, detail="La orden aprobada debe conservar impacto de coste o plazo.")
        if approved_cost and (approved_cost * requested_cost < 0 or abs(approved_cost) > abs(requested_cost)):
            raise HTTPException(status_code=422, detail="El coste aprobado debe conservar signo y no exceder lo solicitado.")
        if schedule_days and (schedule_days * value.requested_schedule_days < 0 or abs(schedule_days) > abs(value.requested_schedule_days)):
            raise HTTPException(status_code=422, detail="El plazo aprobado debe conservar signo y no exceder lo solicitado.")
        before = _money(contract.committed_amount); after = before + approved_cost
        reserved = sum(
            (_money(item.gross_requested) for item in db.query(BimCostPaymentApplication).filter(
                BimCostPaymentApplication.contract_id == contract.id,
                BimCostPaymentApplication.status != "rejected",
            ).with_for_update().all()),
            Decimal("0"),
        )
        if after <= 0 or after < reserved:
            raise HTTPException(status_code=422, detail="El nuevo compromiso no puede ser no positivo ni inferior a pagos reservados.")
        value.approved_cost_delta = approved_cost; value.approved_schedule_days = schedule_days
        value.contract_amount_before = before; value.contract_amount_after = after
        contract.committed_amount = after; contract.lock_version += 1
        for sov in db.query(BimCostScheduleOfValues).filter(
            BimCostScheduleOfValues.contract_id == contract.id,
            BimCostScheduleOfValues.status == "approved",
        ).with_for_update().all():
            sov.status = "superseded"; sov.lock_version += 1
    value.status = payload.decision; value.decision_reason = payload.reason.strip()
    value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value); db.refresh(contract)
    return _serialize(value, contract)
