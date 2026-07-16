from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_cost_contract import BimCostContract
from app.models.bim_cost_sov import BimCostScheduleOfValues


MONEY = Decimal("0.01")


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(value, contract):
    return {
        "id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id,
        "contract_id": value.contract_id, "contract_number": contract.contract_number,
        "revision": value.revision, "lines": list(value.lines_json or []),
        "total_scheduled_value": float(value.total_scheduled_value),
        "contract_committed_amount": float(contract.committed_amount), "currency": contract.currency,
        "status": value.status, "decision_reason": value.decision_reason,
        "lock_version": value.lock_version, "created_by": value.created_by,
        "decided_by": value.decided_by, "created_at": value.created_at,
        "decided_at": value.decided_at,
    }


def create_sov(db, *, project_id, company_id, user_id, payload):
    contract = db.query(BimCostContract).filter(
        BimCostContract.id == payload.contract_id,
        BimCostContract.proyecto_id == project_id,
        BimCostContract.empresa_id == company_id,
        BimCostContract.status == "active",
    ).with_for_update().first()
    if not contract:
        raise HTTPException(status_code=409, detail="El SOV exige un contrato BIM activo del proyecto.")
    revision = payload.revision.strip()
    if db.query(BimCostScheduleOfValues.id).filter(
        BimCostScheduleOfValues.contract_id == contract.id,
        BimCostScheduleOfValues.proyecto_id == project_id,
        BimCostScheduleOfValues.empresa_id == company_id,
        BimCostScheduleOfValues.revision == revision,
    ).first():
        raise HTTPException(status_code=409, detail="La revision SOV ya existe para el contrato.")
    codes = [line.code.strip() for line in payload.lines]
    if len(set(codes)) != len(codes):
        raise HTTPException(status_code=422, detail="Los codigos SOV deben ser unicos dentro de la revision.")
    lines = [{
        "code": line.code.strip(), "description": line.description.strip(),
        "scheduled_value": float(_money(line.scheduled_value)),
    } for line in payload.lines]
    total = sum((_money(line["scheduled_value"]) for line in lines), Decimal("0"))
    if total != _money(contract.committed_amount):
        raise HTTPException(status_code=422, detail="La suma SOV debe coincidir exactamente con el compromiso contractual.")
    value = BimCostScheduleOfValues(
        empresa_id=company_id, proyecto_id=project_id, contract_id=contract.id,
        revision=revision, lines_json=lines, total_scheduled_value=total,
        created_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value, contract)


def list_sovs(db, *, project_id, company_id):
    values = db.query(BimCostScheduleOfValues, BimCostContract).join(
        BimCostContract, BimCostContract.id == BimCostScheduleOfValues.contract_id
    ).filter(
        BimCostScheduleOfValues.proyecto_id == project_id,
        BimCostScheduleOfValues.empresa_id == company_id,
    ).order_by(BimCostScheduleOfValues.created_at.desc(), BimCostScheduleOfValues.id.desc()).all()
    return [_serialize(value, contract) for value, contract in values]


def decide_sov(db, *, sov_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostScheduleOfValues).filter(
        BimCostScheduleOfValues.id == sov_id,
        BimCostScheduleOfValues.proyecto_id == project_id,
        BimCostScheduleOfValues.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="SOV BIM fuera del proyecto activo.")
    if value.status != "draft" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="El SOV cambio o ya fue decidido.")
    contract = db.query(BimCostContract).filter(BimCostContract.id == value.contract_id).with_for_update().one()
    if payload.decision == "approved":
        active = db.query(BimCostScheduleOfValues).filter(
            BimCostScheduleOfValues.contract_id == contract.id,
            BimCostScheduleOfValues.status == "approved",
            BimCostScheduleOfValues.id != value.id,
        ).with_for_update().all()
        for previous in active:
            previous.status = "superseded"; previous.lock_version += 1
    value.status = payload.decision; value.decision_reason = payload.reason.strip()
    value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value, contract)
