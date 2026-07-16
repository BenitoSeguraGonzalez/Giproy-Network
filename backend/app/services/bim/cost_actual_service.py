from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from app.models.bim_4d import Bim4dActivitySnapshot
from app.models.bim_4d_event import Bim4dUnplannedEvent
from app.models.bim_4d_field import Bim4dFieldReport
from app.models.bim_cost_actual import BimCostActualEntry


MONEY = Decimal("0.01")


def _money(value):
    return Decimal(str(value)).quantize(MONEY, rounding=ROUND_HALF_UP)


def _serialize(entry, activity):
    return {
        "id": entry.id, "project_id": entry.proyecto_id, "company_id": entry.empresa_id,
        "field_report_id": entry.field_report_id, "activity_snapshot_id": entry.activity_snapshot_id,
        "activity_code": activity.activity_code, "activity_name": activity.activity_name,
        "work_area_id": entry.work_area_id, "occurred_at": entry.occurred_at,
        "currency": entry.currency, "cumulative_actual_cost": float(entry.cumulative_actual_cost),
        "incremental_actual_cost": float(entry.incremental_actual_cost),
        "posted_by": entry.posted_by, "posted_at": entry.posted_at,
    }


def _build_entry(report, previous_cost, previous_currency, user_id):
    cumulative = _money(report.actual_cost)
    if previous_currency and report.currency != previous_currency:
        raise HTTPException(
            status_code=422,
            detail=f"La moneda del parte {report.id} difiere de la serie de coste de la actividad.",
        )
    if cumulative < previous_cost:
        raise HTTPException(
            status_code=422,
            detail=f"El coste acumulado del parte {report.id} es inferior al parte anterior de la actividad.",
        )
    return BimCostActualEntry(
        empresa_id=report.empresa_id, proyecto_id=report.proyecto_id,
        field_report_id=report.id, activity_snapshot_id=report.activity_snapshot_id,
        work_area_id=report.work_area_id, occurred_at=report.reported_at,
        currency=report.currency, cumulative_actual_cost=cumulative,
        incremental_actual_cost=cumulative - previous_cost, posted_by=user_id,
    )


def post_field_report_actual_cost(db, *, report, user_id):
    previous = db.query(Bim4dFieldReport).filter(
        Bim4dFieldReport.proyecto_id == report.proyecto_id,
        Bim4dFieldReport.empresa_id == report.empresa_id,
        Bim4dFieldReport.activity_snapshot_id == report.activity_snapshot_id,
        Bim4dFieldReport.id != report.id,
        Bim4dFieldReport.reported_at < report.reported_at,
    ).order_by(Bim4dFieldReport.reported_at.desc(), Bim4dFieldReport.id.desc()).first()
    entry = _build_entry(
        report, _money(previous.actual_cost) if previous else Decimal("0"),
        previous.currency if previous else None, user_id,
    )
    db.add(entry); db.flush()
    return entry


def sync_actual_cost_ledger(db, *, project_id, company_id, user_id):
    reports = db.query(Bim4dFieldReport).filter(
        Bim4dFieldReport.proyecto_id == project_id,
        Bim4dFieldReport.empresa_id == company_id,
    ).order_by(Bim4dFieldReport.activity_snapshot_id, Bim4dFieldReport.reported_at, Bim4dFieldReport.id).with_for_update().all()
    previous_by_activity = defaultdict(lambda: (Decimal("0"), None))
    candidates = []
    existing_ids = {row[0] for row in db.query(BimCostActualEntry.field_report_id).filter(
        BimCostActualEntry.proyecto_id == project_id,
        BimCostActualEntry.empresa_id == company_id,
    ).all()}
    for report in reports:
        previous_cost, previous_currency = previous_by_activity[report.activity_snapshot_id]
        candidate = _build_entry(report, previous_cost, previous_currency, user_id)
        previous_by_activity[report.activity_snapshot_id] = (candidate.cumulative_actual_cost, candidate.currency)
        if report.id not in existing_ids:
            candidates.append(candidate)
    db.add_all(candidates); db.commit()
    return get_actual_cost_ledger(db, project_id=project_id, company_id=company_id)


def get_actual_cost_ledger(db, *, project_id, company_id):
    rows = db.query(BimCostActualEntry, Bim4dActivitySnapshot).join(
        Bim4dActivitySnapshot, Bim4dActivitySnapshot.id == BimCostActualEntry.activity_snapshot_id
    ).filter(
        BimCostActualEntry.proyecto_id == project_id,
        BimCostActualEntry.empresa_id == company_id,
    ).order_by(BimCostActualEntry.occurred_at.desc(), BimCostActualEntry.id.desc()).all()
    totals = defaultdict(lambda: Decimal("0"))
    for entry, _activity in rows:
        totals[entry.currency] += _money(entry.incremental_actual_cost)
    source_count = db.query(Bim4dFieldReport.id).filter(
        Bim4dFieldReport.proyecto_id == project_id,
        Bim4dFieldReport.empresa_id == company_id,
    ).count()
    exception_cost = sum((
        _money(value.actual_cost) for value in db.query(Bim4dUnplannedEvent).filter(
            Bim4dUnplannedEvent.proyecto_id == project_id,
            Bim4dUnplannedEvent.empresa_id == company_id,
            Bim4dUnplannedEvent.status == "validated",
        ).all()
    ), Decimal("0"))
    return {
        "entries": [_serialize(entry, activity) for entry, activity in rows],
        "currency_totals": {currency: float(amount) for currency, amount in sorted(totals.items())},
        "source_report_count": source_count, "posted_report_count": len(rows),
        "validated_exception_cost": float(exception_cost),
    }
