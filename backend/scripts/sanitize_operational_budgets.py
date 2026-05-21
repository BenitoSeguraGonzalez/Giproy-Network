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
from app.models.proyecto import Proyecto
from app.services.presupuesto import get_or_create_operational_presupuesto


def main() -> None:
    engine = create_engine(settings.sync_database_url)
    summary = {
        "projects_scanned": 0,
        "budgets_sanitized": 0,
    }

    with Session(engine) as db:
        proyectos = db.query(Proyecto).order_by(Proyecto.empresa_id.asc(), Proyecto.id.asc()).all()
        for proyecto in proyectos:
            summary["projects_scanned"] += 1
            before_count = db.query(Proyecto).filter(Proyecto.id == proyecto.id).count()
            presupuesto = get_or_create_operational_presupuesto(db, proyecto.id, proyecto.empresa_id)
            if presupuesto:
                summary["budgets_sanitized"] += 1

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
