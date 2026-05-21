from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.services.project_base_reconciliation import project_base_reconciliation_service


def _base_counts(db: Session, base_id: int, empresa_id: int) -> dict[str, int]:
    return {
        "subcategories": db.query(SubcategoriaItem).filter(
            SubcategoriaItem.base_trabajo_id == base_id,
            SubcategoriaItem.empresa_id == empresa_id,
        ).count(),
        "resources": db.query(Recurso).filter(
            Recurso.base_trabajo_id == base_id,
            Recurso.empresa_id == empresa_id,
        ).count(),
        "apus": db.query(APU).filter(
            APU.base_trabajo_id == base_id,
            APU.empresa_id == empresa_id,
        ).count(),
        "apu_lines": db.query(APULinea)
        .join(APU, APULinea.apu_id == APU.id)
        .filter(APU.base_trabajo_id == base_id, APU.empresa_id == empresa_id)
        .count(),
    }


def _resolve_empresa_id(db: Session, empresa_nombre: str) -> int:
    empresa = (
        db.query(Empresa)
        .filter(Empresa.nombre.ilike(f"%{empresa_nombre}%"))
        .order_by(Empresa.id.asc())
        .first()
    )
    if not empresa:
        raise ValueError(f"No se encontró empresa para '{empresa_nombre}'.")
    return empresa.id


def _repair_source_chain(db: Session, source_base: BaseTrabajo, empresa_id: int) -> dict[str, object] | None:
    source_counts = _base_counts(db, source_base.id, empresa_id)
    if source_counts["subcategories"] or source_counts["resources"] or source_counts["apus"]:
        return None

    if not source_base.source_base_id:
        return {
            "base_id": source_base.id,
            "base_nombre": source_base.nombre,
            "status": "empty_without_upstream_source",
            "counts_before": source_counts,
        }

    result = project_base_reconciliation_service.reconcile_base(
        db=db,
        source_base_id=source_base.source_base_id,
        target_base_id=source_base.id,
        empresa_id=empresa_id,
        repair_empty_apus=True,
    )
    return {
        "base_id": source_base.id,
        "base_nombre": source_base.nombre,
        "status": "reconciled_from_upstream",
        "counts_before": source_counts,
        "counts_after": _base_counts(db, source_base.id, empresa_id),
        "result": result,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Repara bases maestras y sincronización de bases de proyecto en Santiago Bermeo.")
    parser.add_argument("--empresa", default="Santiago Bermeo")
    parser.add_argument("--project-base-id", type=int, default=None)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        empresa_id = _resolve_empresa_id(db, args.empresa)
        query = (
            db.query(BaseTrabajo)
            .filter(
                BaseTrabajo.empresa_id == empresa_id,
                BaseTrabajo.tipo == "Base de Proyecto",
            )
            .order_by(BaseTrabajo.id.asc())
        )
        if args.project_base_id:
            query = query.filter(BaseTrabajo.id == args.project_base_id)

        project_bases = query.all()
        report: dict[str, object] = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "empresa_id": empresa_id,
            "empresa": args.empresa,
            "project_bases": [],
        }

        for project_base in project_bases:
            source_base = None
            if project_base.source_base_id:
                source_base = (
                    db.query(BaseTrabajo)
                    .filter(BaseTrabajo.id == project_base.source_base_id, BaseTrabajo.empresa_id == empresa_id)
                    .first()
                )

            upstream_repair = _repair_source_chain(db, source_base, empresa_id) if source_base else None
            result = None
            if source_base:
                result = project_base_reconciliation_service.reconcile_base(
                    db=db,
                    source_base_id=source_base.id,
                    target_base_id=project_base.id,
                    empresa_id=empresa_id,
                    repair_empty_apus=True,
                )

            project = (
                db.query(Proyecto)
                .filter(Proyecto.base_trabajo_id == project_base.id, Proyecto.empresa_id == empresa_id)
                .first()
            )
            report["project_bases"].append(
                {
                    "project_base_id": project_base.id,
                    "project_base_nombre": project_base.nombre,
                    "project_nombre": project.nombre if project else None,
                    "source_base_id": source_base.id if source_base else None,
                    "source_base_nombre": source_base.nombre if source_base else None,
                    "source_counts": _base_counts(db, source_base.id, empresa_id) if source_base else None,
                    "target_counts": _base_counts(db, project_base.id, empresa_id),
                    "upstream_repair": upstream_repair,
                    "reconcile_result": result,
                }
            )

        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
