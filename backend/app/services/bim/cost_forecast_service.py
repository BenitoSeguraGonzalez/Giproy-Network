from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_cost_actual import BimCostActualEntry
from app.models.bim_cost_contract import BimCostContract
from app.models.bim_cost_forecast import BimCostForecast
from app.models.bim_qto import BimCostEstimate


MONEY = Decimal("0.01")
def _money(value): return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)
def _serialize(value):
    return {"id": value.id, "project_id": value.proyecto_id, "company_id": value.empresa_id, "estimate_id": value.estimate_id, "revision": value.revision, "currency": value.currency, "baseline_budget": float(value.baseline_budget), "committed_cost": float(value.committed_cost), "actual_cost": float(value.actual_cost), "estimate_to_complete": float(value.estimate_to_complete), "forecast_at_completion": float(value.forecast_at_completion), "variance_at_completion": float(value.variance_at_completion), "rationale": value.rationale, "status": value.status, "decision_reason": value.decision_reason, "lock_version": value.lock_version, "created_by": value.created_by, "decided_by": value.decided_by, "created_at": value.created_at, "decided_at": value.decided_at}


def create_forecast(db, *, project_id, company_id, user_id, payload):
    currency = payload.currency.upper()
    estimate = db.query(BimCostEstimate).filter(BimCostEstimate.proyecto_id == project_id, BimCostEstimate.empresa_id == company_id, BimCostEstimate.status == "approved", BimCostEstimate.currency == currency).with_for_update().first()
    if not estimate: raise HTTPException(status_code=409, detail="El forecast exige una estimacion BIM aprobada en la misma moneda.")
    revision = payload.revision.strip()
    if db.query(BimCostForecast.id).filter(BimCostForecast.proyecto_id == project_id, BimCostForecast.empresa_id == company_id, BimCostForecast.currency == currency, BimCostForecast.revision == revision).first(): raise HTTPException(status_code=409, detail="La revision de forecast BIM ya existe.")
    committed = sum((_money(row.committed_amount) for row in db.query(BimCostContract).filter(BimCostContract.proyecto_id == project_id, BimCostContract.empresa_id == company_id, BimCostContract.currency == currency, BimCostContract.status.in_(("active", "completed"))).all()), Decimal("0"))
    actual = sum((_money(row.incremental_actual_cost) for row in db.query(BimCostActualEntry).filter(BimCostActualEntry.proyecto_id == project_id, BimCostActualEntry.empresa_id == company_id, BimCostActualEntry.currency == currency).all()), Decimal("0"))
    etc = _money(payload.estimate_to_complete); eac = actual + etc; baseline = _money(estimate.subtotal)
    value = BimCostForecast(empresa_id=company_id, proyecto_id=project_id, estimate_id=estimate.id, revision=revision, currency=currency, baseline_budget=baseline, committed_cost=committed, actual_cost=actual, estimate_to_complete=etc, forecast_at_completion=eac, variance_at_completion=baseline - eac, rationale=payload.rationale.strip(), created_by=user_id)
    db.add(value); db.commit(); db.refresh(value); return _serialize(value)


def list_forecasts(db, *, project_id, company_id):
    return [_serialize(value) for value in db.query(BimCostForecast).filter(BimCostForecast.proyecto_id == project_id, BimCostForecast.empresa_id == company_id).order_by(BimCostForecast.created_at.desc(), BimCostForecast.id.desc()).all()]


def decide_forecast(db, *, forecast_id, project_id, company_id, user_id, payload):
    value = db.query(BimCostForecast).filter(BimCostForecast.id == forecast_id, BimCostForecast.proyecto_id == project_id, BimCostForecast.empresa_id == company_id).with_for_update().first()
    if not value: raise HTTPException(status_code=404, detail="Forecast BIM fuera del proyecto activo.")
    if value.status != "draft" or value.lock_version != payload.expected_lock_version: raise HTTPException(status_code=409, detail="El forecast cambio o ya fue decidido.")
    if payload.decision == "approved":
        for previous in db.query(BimCostForecast).filter(BimCostForecast.proyecto_id == project_id, BimCostForecast.empresa_id == company_id, BimCostForecast.currency == value.currency, BimCostForecast.status == "approved", BimCostForecast.id != value.id).with_for_update().all(): previous.status = "superseded"; previous.lock_version += 1
    value.status = payload.decision; value.decision_reason = payload.reason.strip(); value.decided_by = user_id; value.decided_at = datetime.now(timezone.utc); value.lock_version += 1
    db.commit(); db.refresh(value); return _serialize(value)
