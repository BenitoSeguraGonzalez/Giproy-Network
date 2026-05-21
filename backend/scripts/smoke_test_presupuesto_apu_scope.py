from __future__ import annotations

import json
import os
import sys

from sqlalchemy.orm import aliased

CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.models.apu import APU, APULinea
from app.models.recurso import Recurso
from app.services.presupuesto import find_mixed_presupuesto_apu_lines


def main() -> int:
    db = SessionLocal()
    try:
        mixed = find_mixed_presupuesto_apu_lines(db)
        child_apu = aliased(APU)
        mixed_apu_resource = (
            db.query(APULinea.id)
            .join(APU, APULinea.apu_id == APU.id)
            .join(Recurso, APULinea.recurso_id == Recurso.id)
            .filter(APULinea.recurso_id.isnot(None), APU.base_trabajo_id != Recurso.base_trabajo_id)
            .count()
        )
        mixed_apu_child = (
            db.query(APULinea.id)
            .join(APU, APULinea.apu_id == APU.id)
            .join(child_apu, APULinea.apu_hijo_id == child_apu.id)
            .filter(APULinea.apu_hijo_id.isnot(None), APU.base_trabajo_id != child_apu.base_trabajo_id)
            .count()
        )
        payload = {
            "mixed_budget_lines": len(mixed),
            "mixed_apu_resource_lines": mixed_apu_resource,
            "mixed_apu_child_lines": mixed_apu_child,
            "sample": [
                {
                    "linea_id": line.id,
                    "presupuesto_id": line.presupuesto_id,
                    "apu_id": line.apu_id,
                    "codigo_item": line.codigo_item,
                    "descripcion": line.descripcion,
                }
                for line in mixed[:10]
            ],
        }
        print(json.dumps(payload, ensure_ascii=False, indent=2, default=str))
        return 0 if (not mixed and mixed_apu_resource == 0 and mixed_apu_child == 0) else 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
