from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.core.unit_normalization import canonicalize_unit_symbol
from app.models.apu import APU
from app.models.presupuesto import PresupuestoDetalle
from app.models.unidad import Unidad


def _find_collisions(counter_source) -> dict[str, int]:
    return {
        " | ".join("" if value is None else str(value) for value in key): count
        for key, count in Counter(counter_source).items()
        if count > 1
    }


def main() -> int:
    db = SessionLocal()
    report: dict[str, object] = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "updated": {
            "unidades": 0,
            "apus": 0,
            "presupuesto_detalles": 0,
        },
        "collisions": {},
    }

    try:
        unidad_keys = [
            (
                canonicalize_unit_symbol(item.descripcion),
                item.subcategoria_codigo,
                bool(item.es_global),
                item.empresa_id,
                item.base_trabajo_id,
            )
            for item in db.query(Unidad).all()
        ]
        apu_keys = [
            (
                item.empresa_id,
                item.base_trabajo_id,
                item.descripcion_normalizada,
                canonicalize_unit_symbol(item.unidad),
            )
            for item in db.query(APU).all()
        ]
        report["collisions"] = {
            "unidades": _find_collisions(unidad_keys),
            "apus": _find_collisions(apu_keys),
        }
        if report["collisions"]["unidades"] or report["collisions"]["apus"]:
            raise RuntimeError("La normalización produciría colisiones. Abortado.")

        for item in db.query(Unidad).all():
            normalized = canonicalize_unit_symbol(item.descripcion)
            if normalized and item.descripcion != normalized:
                item.descripcion = normalized
                report["updated"]["unidades"] += 1

        for item in db.query(APU).all():
            normalized = canonicalize_unit_symbol(item.unidad)
            if normalized != (item.unidad or ""):
                item.unidad = normalized
                report["updated"]["apus"] += 1

        for item in db.query(PresupuestoDetalle).all():
            normalized = canonicalize_unit_symbol(item.unidad)
            if normalized != (item.unidad or ""):
                item.unidad = normalized
                report["updated"]["presupuesto_detalles"] += 1

        db.commit()

        report_dir = ROOT.parent / "docs" / "reportes"
        report_dir.mkdir(parents=True, exist_ok=True)
        report_path = report_dir / f"unit_normalization_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(str(report_path))
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
