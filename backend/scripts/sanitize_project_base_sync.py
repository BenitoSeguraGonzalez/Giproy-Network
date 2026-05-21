from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.services.project_base_reconciliation import project_base_reconciliation_service


def main() -> int:
    parser = argparse.ArgumentParser(description="Previsualiza o sanea la sincronización entre Base Maestra y Base de Proyecto.")
    parser.add_argument("--empresa-id", type=int, required=True)
    parser.add_argument("--project-base-id", type=int, required=True)
    parser.add_argument("--mode", choices=["preview", "sync-missing", "repair-inherited"], default="preview")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.mode == "preview":
            result = project_base_reconciliation_service.preview_sync_missing(
                db=db,
                target_base_id=args.project_base_id,
                empresa_id=args.empresa_id,
            )
        elif args.mode == "sync-missing":
            result = project_base_reconciliation_service.sync_missing_only(
                db=db,
                target_base_id=args.project_base_id,
                empresa_id=args.empresa_id,
            )
        else:
            result = project_base_reconciliation_service.repair_inherited_only(
                db=db,
                target_base_id=args.project_base_id,
                empresa_id=args.empresa_id,
            )

        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
