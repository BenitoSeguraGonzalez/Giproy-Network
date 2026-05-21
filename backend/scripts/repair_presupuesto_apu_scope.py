from __future__ import annotations

import argparse
import json
import os
import sys


CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.database import SessionLocal
from app.services.presupuesto import repair_presupuesto_apu_scope


def main() -> int:
    parser = argparse.ArgumentParser(description="Repara líneas de presupuesto que referencian APUs de otra base_trabajo.")
    parser.add_argument("--empresa-id", type=int, default=None)
    parser.add_argument("--proyecto-id", type=int, default=None)
    parser.add_argument("--presupuesto-id", type=int, default=None)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        result = repair_presupuesto_apu_scope(
            db,
            empresa_id=args.empresa_id,
            proyecto_id=args.proyecto_id,
            presupuesto_id=args.presupuesto_id,
            commit=True,
        )
        print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
