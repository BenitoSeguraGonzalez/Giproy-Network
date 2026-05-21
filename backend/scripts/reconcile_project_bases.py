from __future__ import annotations

import json
import sys
from dataclasses import asdict, is_dataclass
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.database import SessionLocal
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.proyecto import Proyecto
from app.services.project_base_reconciliation import project_base_reconciliation_service


def _serialize(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if is_dataclass(value):
        return asdict(value)
    return value


def main() -> int:
    bootstrap_db = SessionLocal()
    try:
        report = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "items": [],
        }

        project_bases = (
            bootstrap_db.query(BaseTrabajo, Proyecto, Empresa)
            .join(Proyecto, Proyecto.base_trabajo_id == BaseTrabajo.id)
            .join(Empresa, Empresa.id == BaseTrabajo.empresa_id)
            .filter(BaseTrabajo.tipo == "Base de Proyecto")
            .order_by(Empresa.id.asc(), BaseTrabajo.id.asc())
            .all()
        )
    finally:
        bootstrap_db.close()

    for base, project, empresa in project_bases:
        db = SessionLocal()
        try:
            inferred = project_base_reconciliation_service.infer_source_base(db, base.id, empresa.id)
            item = {
                "empresa_id": empresa.id,
                "empresa_nombre": empresa.nombre,
                "project_base_id": base.id,
                "project_base_nombre": base.nombre,
                "project_id": project.id,
                "project_nombre": project.nombre,
                "project_revision": int(project.revision or 0),
                "inferred_source": _serialize(inferred) if inferred else None,
                "status": "skipped",
            }

            if not inferred:
                item["reason"] = "source_base_not_inferred"
                report["items"].append(item)
                continue

            result = project_base_reconciliation_service.reconcile_base(
                db=db,
                source_base_id=inferred.source_base_id,
                target_base_id=base.id,
                empresa_id=empresa.id,
                repair_empty_apus=True,
            )
            item["status"] = "reconciled"
            item["result"] = result
            report["items"].append(item)
        except Exception as exc:
            db.rollback()
            report["items"].append(
                {
                    "empresa_id": empresa.id,
                    "empresa_nombre": empresa.nombre,
                    "project_base_id": base.id,
                    "project_base_nombre": base.nombre,
                    "project_id": project.id,
                    "project_nombre": project.nombre,
                    "project_revision": int(project.revision or 0),
                    "status": "error",
                    "error": str(exc),
                }
            )
        finally:
            db.close()

    report_dir = ROOT.parent / "docs" / "reportes"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / f"project_base_reconciliation_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2, default=_serialize), encoding="utf-8")
    print(str(report_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
