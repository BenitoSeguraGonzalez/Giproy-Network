from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from sqlalchemy import func

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import SessionLocal
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem


def _load_company_snapshot(db, company_name: str) -> dict:
    company = (
        db.query(Empresa)
        .filter(func.lower(Empresa.nombre) == company_name.strip().lower())
        .first()
    )
    if not company:
        raise ValueError(f"No se encontró la empresa '{company_name}'.")

    project_rows = (
        db.query(Proyecto.id, Proyecto.codigo, Proyecto.nombre)
        .filter(Proyecto.empresa_id == company.id)
        .order_by(Proyecto.id.asc())
        .all()
    )
    base_rows = (
        db.query(BaseTrabajo.id, BaseTrabajo.codigo_unico, BaseTrabajo.nombre, BaseTrabajo.tipo)
        .filter(BaseTrabajo.empresa_id == company.id)
        .order_by(BaseTrabajo.id.asc())
        .all()
    )

    base_ids = [row.id for row in base_rows]
    project_ids = [row.id for row in project_rows]

    return {
        "company": {
            "id": company.id,
            "nombre": company.nombre,
        },
        "projects": [
            {"id": row.id, "codigo": row.codigo, "nombre": row.nombre}
            for row in project_rows
        ],
        "bases": [
            {
                "id": row.id,
                "codigo_unico": row.codigo_unico,
                "nombre": row.nombre,
                "tipo": row.tipo,
            }
            for row in base_rows
        ],
        "related_counts": {
            "proyectos": len(project_rows),
            "presupuestos": db.query(Presupuesto).filter(Presupuesto.proyecto_id.in_(project_ids)).count() if project_ids else 0,
            "bases_trabajo": len(base_rows),
            "subcategorias": db.query(SubcategoriaItem).filter(SubcategoriaItem.base_trabajo_id.in_(base_ids)).count() if base_ids else 0,
            "recursos": db.query(Recurso).filter(Recurso.base_trabajo_id.in_(base_ids)).count() if base_ids else 0,
            "apus": db.query(APU).filter(APU.base_trabajo_id.in_(base_ids)).count() if base_ids else 0,
        },
    }


def _delete_company_projects_and_bases(db, company_id: int) -> dict:
    deleted_projects = (
        db.query(Proyecto)
        .filter(Proyecto.empresa_id == company_id)
        .delete(synchronize_session=False)
    )
    deleted_bases = (
        db.query(BaseTrabajo)
        .filter(BaseTrabajo.empresa_id == company_id)
        .delete(synchronize_session=False)
    )
    return {
        "deleted_projects": deleted_projects,
        "deleted_bases": deleted_bases,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Elimina proyectos y bases de trabajo de una empresa sin tocar el resto de sus datos."
    )
    parser.add_argument("--company-name", required=True, help="Nombre exacto de la empresa.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Ejecuta el borrado. Si no se indica, solo muestra la previsualización.",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        snapshot_before = _load_company_snapshot(db, args.company_name)
        payload: dict[str, object] = {
            "mode": "apply" if args.apply else "preview",
            "before": snapshot_before,
        }

        if not args.apply:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0

        deletion_result = _delete_company_projects_and_bases(
            db=db,
            company_id=snapshot_before["company"]["id"],
        )
        db.commit()

        snapshot_after = _load_company_snapshot(db, args.company_name)
        payload["deleted"] = deletion_result
        payload["after"] = snapshot_after
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
