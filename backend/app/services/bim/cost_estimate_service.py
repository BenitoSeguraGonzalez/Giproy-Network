from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_qto import BimCostEstimate, BimQtoSnapshot


MONEY = Decimal("0.01")


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(value):
    return {
        "id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id,
        "qto_snapshot_id": value.qto_snapshot_id, "revision": value.revision,
        "currency": value.currency, "qto_checksum_sha256": value.qto_checksum_sha256,
        "lines": list(value.lines_json or []), "subtotal": float(value.subtotal),
        "status": value.status, "decision_reason": value.decision_reason,
        "lock_version": value.lock_version, "created_by": value.created_by,
        "decided_by": value.decided_by, "created_at": value.created_at,
        "decided_at": value.decided_at,
    }


def create_cost_estimate(db, *, project_id, company_id, user_id, payload):
    qto = db.query(BimQtoSnapshot).filter(
        BimQtoSnapshot.id == payload.qto_snapshot_id,
        BimQtoSnapshot.proyecto_id == project_id,
        BimQtoSnapshot.empresa_id == company_id,
        BimQtoSnapshot.status == "approved",
    ).first()
    if not qto:
        raise HTTPException(status_code=409, detail="La estimacion exige un QTO aprobado del proyecto activo.")
    if db.query(BimCostEstimate.id).filter(
        BimCostEstimate.proyecto_id == project_id,
        BimCostEstimate.empresa_id == company_id,
        BimCostEstimate.revision == payload.revision,
    ).first():
        raise HTTPException(status_code=409, detail="La revision de estimacion BIM ya existe.")
    rows = list(qto.rows_json or [])
    rate_map = {item.row_index: _money(item.unit_rate) for item in payload.rates}
    if len(rate_map) != len(payload.rates) or set(rate_map) != set(range(len(rows))):
        raise HTTPException(status_code=422, detail="Cada fila QTO debe tener exactamente un precio unitario.")
    lines = []
    subtotal = Decimal("0")
    for index, row in enumerate(rows):
        quantity = Decimal(str(row.get("value") or 0))
        total = (quantity * rate_map[index]).quantize(MONEY, rounding=ROUND_HALF_UP)
        subtotal += total
        lines.append({
            "row_index": index, "group": dict(row.get("group") or {}),
            "quantity_name": row.get("quantity_name"), "quantity": float(quantity),
            "unit": row.get("unit"), "wbs_code": row.get("wbs_code"),
            "cost_code": row.get("cost_code"), "unit_rate": float(rate_map[index]),
            "line_total": float(total),
        })
    value = BimCostEstimate(
        empresa_id=company_id, proyecto_id=project_id,
        qto_snapshot_id=qto.id, revision=payload.revision,
        currency=payload.currency.upper(), qto_checksum_sha256=qto.checksum_sha256,
        lines_json=lines, subtotal=subtotal.quantize(MONEY), created_by=user_id,
    )
    db.add(value); db.commit(); db.refresh(value)
    return _serialize(value)


def list_cost_estimates(db, *, project_id, company_id):
    values = db.query(BimCostEstimate).filter(
        BimCostEstimate.proyecto_id == project_id,
        BimCostEstimate.empresa_id == company_id,
    ).order_by(BimCostEstimate.created_at.desc(), BimCostEstimate.id.desc()).all()
    return [_serialize(value) for value in values]


def decide_cost_estimate(db, *, estimate_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostEstimate).filter(
        BimCostEstimate.id == estimate_id,
        BimCostEstimate.proyecto_id == project_id,
        BimCostEstimate.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Estimacion BIM fuera del proyecto activo.")
    if value.status != "draft" or value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La estimacion BIM cambio o ya fue decidida.")
    if payload.decision == "approved":
        active = db.query(BimCostEstimate).filter(
            BimCostEstimate.proyecto_id == project_id,
            BimCostEstimate.empresa_id == company_id,
            BimCostEstimate.status == "approved",
            BimCostEstimate.id != value.id,
        ).with_for_update().all()
        for previous in active:
            previous.status = "superseded"
            previous.lock_version += 1
    value.status = payload.decision
    value.decision_reason = payload.reason.strip()
    value.decided_by = user_id
    value.decided_at = datetime.now(timezone.utc)
    value.lock_version += 1
    db.commit(); db.refresh(value)
    return _serialize(value)
