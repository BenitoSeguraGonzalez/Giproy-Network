from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.calculation_policy import CALCULATION_POLICY_VERSION
from app.core.database import SessionLocal
from app.core.rounding import round_decimal
from app.models.apu import APU
from app.models.empresa import Empresa
from app.models.polinomica import FormulaPolinomica
from app.models.presupuesto import Presupuesto
from app.models.recurso import Recurso
from app.services.apu import update_apu_operational_price
from app.services.formula_polinomica import formula_polinomica_service
from app.services.presupuesto import refresh_presupuesto_prices


def _empresa_filter(query, model, empresa_id: int | None):
    if empresa_id is None:
        return query
    return query.filter(model.empresa_id == empresa_id)


def _round_recurso_prices(db: Session, empresa_id: int | None, apply_changes: bool, summary: dict) -> None:
    empresas = {
        empresa.id: empresa
        for empresa in _empresa_filter(db.query(Empresa), Empresa, empresa_id).all()
    }
    recursos = _empresa_filter(db.query(Recurso).order_by(Recurso.empresa_id.asc(), Recurso.id.asc()), Recurso, empresa_id).all()

    for recurso in recursos:
        summary["recursos_scanned"] += 1
        empresa = empresas.get(recurso.empresa_id)
        dec_moneda = int(getattr(empresa, "decimales_moneda", 2) or 2)
        rounded_price = round_decimal(recurso.precio or 0, dec_moneda)
        if rounded_price != recurso.precio:
            summary["recursos_changed"] += 1
            if apply_changes:
                recurso.precio = rounded_price

    if apply_changes:
        db.commit()


def _recalculate_apus(db: Session, empresa_id: int | None, apply_changes: bool, summary: dict) -> None:
    apu_ids = [
        apu_id
        for (apu_id,) in _empresa_filter(
            db.query(APU.id).order_by(APU.empresa_id.asc(), APU.base_trabajo_id.asc(), APU.id.asc()),
            APU,
            empresa_id,
        ).all()
    ]
    summary["apus_scanned"] = len(apu_ids)
    if not apply_changes:
        return

    for apu_id in apu_ids:
        update_apu_operational_price(db, apu_id)
        summary["apus_recalculated"] += 1


def _recalculate_presupuestos(db: Session, empresa_id: int | None, apply_changes: bool, summary: dict) -> None:
    presupuesto_ids = [
        presupuesto_id
        for (presupuesto_id,) in _empresa_filter(
            db.query(Presupuesto.id).order_by(Presupuesto.empresa_id.asc(), Presupuesto.proyecto_id.asc(), Presupuesto.id.asc()),
            Presupuesto,
            empresa_id,
        ).all()
    ]
    summary["presupuestos_scanned"] = len(presupuesto_ids)
    if not apply_changes:
        return

    for presupuesto_id in presupuesto_ids:
        refresh_presupuesto_prices(db, presupuesto_id)
        summary["presupuestos_recalculated"] += 1


def _recalculate_formulas(db: Session, empresa_id: int | None, apply_changes: bool, summary: dict) -> None:
    formula_rows = db.query(FormulaPolinomica).join(Presupuesto, Presupuesto.id == FormulaPolinomica.presupuesto_id)
    if empresa_id is not None:
        formula_rows = formula_rows.filter(Presupuesto.empresa_id == empresa_id)
    formulas = formula_rows.order_by(Presupuesto.empresa_id.asc(), FormulaPolinomica.presupuesto_id.asc()).all()

    summary["formulas_scanned"] = len(formulas)
    if not apply_changes:
        return

    for formula in formulas:
        formula_polinomica_service.regenerate_formula(
            db,
            presupuesto_id=formula.presupuesto_id,
            tipo=formula.tipo or "SIN_DESGLOSE",
        )
        summary["formulas_regenerated"] += 1
    db.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Migra GiProy a la politica oficial de redondeo directo.")
    parser.add_argument("--empresa-id", type=int, default=None, help="Limita la migracion a una empresa.")
    parser.add_argument("--apply", action="store_true", help="Aplica cambios persistentes en la base de datos.")
    args = parser.parse_args()

    summary = {
        "policy_version": CALCULATION_POLICY_VERSION,
        "empresa_id": args.empresa_id,
        "apply": args.apply,
        "recursos_scanned": 0,
        "recursos_changed": 0,
        "apus_scanned": 0,
        "apus_recalculated": 0,
        "presupuestos_scanned": 0,
        "presupuestos_recalculated": 0,
        "formulas_scanned": 0,
        "formulas_regenerated": 0,
    }

    db = SessionLocal()
    try:
        _round_recurso_prices(db, args.empresa_id, args.apply, summary)
        _recalculate_apus(db, args.empresa_id, args.apply, summary)
        _recalculate_presupuestos(db, args.empresa_id, args.apply, summary)
        _recalculate_formulas(db, args.empresa_id, args.apply, summary)
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
