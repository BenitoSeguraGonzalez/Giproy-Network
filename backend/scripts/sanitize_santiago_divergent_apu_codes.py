from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU, APULinea
from app.models.presupuesto import PresupuestoDetalle
from app.services.apu import normalize_string


EMPRESA_ID = 3
SOURCE_BASE_ID = 32
TARGET_BASE_ID = 34
DIVERGENT_CODES = (
    "5-011-0001",
    "5-021-0001",
    "5-027-0001",
    "5-029-0001",
)


def _count_lines(db: Session, apu_id: int) -> int:
    return db.query(APULinea).filter(APULinea.apu_id == apu_id).count()


def _count_child_refs(db: Session, apu_id: int) -> int:
    return db.query(APULinea).filter(APULinea.apu_hijo_id == apu_id).count()


def _count_budget_refs(db: Session, apu_id: int) -> int:
    return db.query(PresupuestoDetalle).filter(PresupuestoDetalle.apu_id == apu_id).count()


def main() -> None:
    db = SessionLocal()
    summary = {
        "updated": [],
        "skipped_missing_source": [],
        "skipped_missing_target": [],
        "skipped_non_conservative": [],
    }

    try:
        for code in DIVERGENT_CODES:
            source = db.query(APU).filter(
                APU.empresa_id == EMPRESA_ID,
                APU.base_trabajo_id == SOURCE_BASE_ID,
                APU.codigo == code
            ).first()
            if not source:
                summary["skipped_missing_source"].append(code)
                continue

            target = db.query(APU).filter(
                APU.empresa_id == EMPRESA_ID,
                APU.base_trabajo_id == TARGET_BASE_ID,
                APU.codigo == code
            ).first()
            if not target:
                summary["skipped_missing_target"].append(code)
                continue

            target_lines = _count_lines(db, target.id)
            target_child_refs = _count_child_refs(db, target.id)
            target_budget_refs = _count_budget_refs(db, target.id)
            if target_lines or target_child_refs or target_budget_refs:
                summary["skipped_non_conservative"].append({
                    "codigo": code,
                    "target_id": target.id,
                    "target_lines": target_lines,
                    "target_child_refs": target_child_refs,
                    "target_budget_refs": target_budget_refs,
                })
                continue

            old_desc = target.descripcion
            old_unidad = target.unidad
            target.descripcion = source.descripcion
            target.descripcion_normalizada = normalize_string(source.descripcion)
            target.unidad = source.unidad
            target.omniclass_codigo = source.omniclass_codigo
            target.omniclass_titulo = source.omniclass_titulo
            db.flush()

            summary["updated"].append({
                "codigo": code,
                "target_id": target.id,
                "old_descripcion": old_desc,
                "new_descripcion": target.descripcion,
                "old_unidad": old_unidad,
                "new_unidad": target.unidad,
            })

        db.commit()
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    finally:
        db.close()


if __name__ == "__main__":
    main()
