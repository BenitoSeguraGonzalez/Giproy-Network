from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.models.edt import EdtNode
from app.repositories.edt import edt_repo
from app.services.presupuesto import sync_presupuesto_codes_with_edt


def main() -> None:
    engine = create_engine(settings.sync_database_url)
    summary = {
        "projects_scanned": 0,
        "edt_branches_recalculated": 0,
        "presupuestos_synced": 0,
    }

    with Session(engine) as db:
        projects = db.query(
            EdtNode.proyecto_id,
            EdtNode.empresa_id,
        ).distinct().order_by(EdtNode.empresa_id.asc(), EdtNode.proyecto_id.asc()).all()

        for proyecto_id, empresa_id in projects:
            summary["projects_scanned"] += 1
            edt_repo._recalcular_rama(db, None, proyecto_id, "", empresa_id)
            summary["edt_branches_recalculated"] += 1
            summary["presupuestos_synced"] += sync_presupuesto_codes_with_edt(db, proyecto_id, empresa_id)

        db.commit()

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
