from __future__ import annotations

import json
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings
from app.models.apu import APU
from app.models.presupuesto import Presupuesto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.services.apu import normalize_string
from app.services.presupuesto import (
    calculate_presupuesto_totals,
    ensure_presupuesto_indirectos,
    get_or_create_operational_presupuesto,
)


def _find_matching_subcategoria(db: Session, apu: APU, source_subcat: SubcategoriaItem):
    return db.query(SubcategoriaItem).filter(
        SubcategoriaItem.base_trabajo_id == apu.base_trabajo_id,
        SubcategoriaItem.empresa_id == apu.empresa_id,
        SubcategoriaItem.codigo == source_subcat.codigo
    ).first()


def _find_matching_recurso(db: Session, apu: APU, recurso: Recurso):
    return db.query(Recurso).filter(
        Recurso.base_trabajo_id == apu.base_trabajo_id,
        Recurso.empresa_id == apu.empresa_id,
        Recurso.descripcion_normalizada == recurso.descripcion_normalizada,
        Recurso.unidad == recurso.unidad
    ).first()


def _find_matching_apu(db: Session, apu: APU, apu_hijo: APU):
    return db.query(APU).filter(
        APU.base_trabajo_id == apu.base_trabajo_id,
        APU.empresa_id == apu.empresa_id,
        APU.descripcion_normalizada == apu_hijo.descripcion_normalizada,
        APU.unidad == apu_hijo.unidad
    ).first()


def main() -> None:
    engine = create_engine(settings.sync_database_url)
    summary = {
        "project_detail_deleted": 0,
        "duplicate_budget_groups_resolved": 0,
        "duplicate_budget_rows_deleted": 0,
        "indirectos_empresa_aligned": 0,
        "orphan_general_notes_deleted": 0,
        "orphan_line_notes_deleted": 0,
        "orphan_budget_views_deleted": 0,
        "orphan_line_views_deleted": 0,
        "orphan_apu_lines_deleted": 0,
        "apus_subcategoria_realigned": 0,
        "apu_lineas_recurso_realigned": 0,
        "apu_lineas_apu_hijo_realigned": 0,
        "apu_cross_unresolved_subcategorias": 0,
        "apu_cross_unresolved_recursos": 0,
        "apu_cross_unresolved_apus_hijo": 0,
        "budgets_seeded_or_recalculated": 0,
    }

    with Session(engine) as db:
        duplicate_budget_rows = db.execute(
            text(
                """
                SELECT empresa_id, proyecto_id, count(*) AS total
                FROM presupuestos
                GROUP BY empresa_id, proyecto_id
                HAVING count(*) > 1
                ORDER BY empresa_id, proyecto_id
                """
            )
        ).fetchall()

        for row in duplicate_budget_rows:
            empresa_id = int(row.empresa_id)
            proyecto_id = int(row.proyecto_id)
            total_before = int(row.total)
            get_or_create_operational_presupuesto(db, proyecto_id, empresa_id)
            summary["duplicate_budget_groups_resolved"] += 1
            summary["duplicate_budget_rows_deleted"] += max(total_before - 1, 0)

        # Delete orphaned project details still outside any tenant and without a matching project.
        summary["project_detail_deleted"] = db.execute(
            text(
                """
                DELETE FROM proyecto_detalles d
                WHERE d.empresa_id IS NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM proyectos p
                      WHERE p.codigo_root = d.codigo_root
                         OR p.codigo = d.codigo_root
                  )
                """
            )
        ).rowcount or 0

        # Align indirect item tenant with its parent budget tenant.
        summary["indirectos_empresa_aligned"] = db.execute(
            text(
                """
                UPDATE presupuesto_indirectos pi
                SET empresa_id = p.empresa_id
                FROM presupuestos p
                WHERE p.id = pi.presupuesto_id
                  AND pi.empresa_id <> p.empresa_id
                """
            )
        ).rowcount or 0

        summary["orphan_general_notes_deleted"] = db.execute(
            text(
                """
                DELETE FROM presupuesto_notas n
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM presupuestos p
                    WHERE p.id = n.presupuesto_id
                )
                """
            )
        ).rowcount or 0

        summary["orphan_line_notes_deleted"] = db.execute(
            text(
                """
                DELETE FROM presupuesto_notas n
                WHERE n.linea_presupuesto_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1
                      FROM presupuesto_detalles pd
                      WHERE pd.id = n.linea_presupuesto_id
                  )
                """
            )
        ).rowcount or 0

        summary["orphan_budget_views_deleted"] = db.execute(
            text(
                """
                DELETE FROM presupuesto_vistas_usuario v
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM presupuestos p
                    WHERE p.id = v.presupuesto_id
                )
                """
            )
        ).rowcount or 0

        summary["orphan_line_views_deleted"] = db.execute(
            text(
                """
                DELETE FROM presupuesto_linea_vistas_usuario lv
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM presupuesto_detalles pd
                    WHERE pd.id = lv.linea_presupuesto_id
                )
                """
            )
        ).rowcount or 0

        summary["orphan_apu_lines_deleted"] = db.execute(
            text(
                """
                DELETE FROM apu_lineas l
                WHERE l.recurso_id IS NULL
                  AND l.apu_hijo_id IS NULL
                """
            )
        ).rowcount or 0

        apus = db.query(APU).order_by(APU.empresa_id.asc(), APU.base_trabajo_id.asc(), APU.id.asc()).all()
        for apu in apus:
            if apu.subcategoria_item_id:
                subcat = db.query(SubcategoriaItem).filter(SubcategoriaItem.id == apu.subcategoria_item_id).first()
                if not subcat:
                    summary["apu_cross_unresolved_subcategorias"] += 1
                elif subcat.base_trabajo_id != apu.base_trabajo_id or subcat.empresa_id != apu.empresa_id:
                    replacement = _find_matching_subcategoria(db, apu, subcat)
                    if replacement:
                        apu.subcategoria_item_id = replacement.id
                        summary["apus_subcategoria_realigned"] += 1
                    else:
                        summary["apu_cross_unresolved_subcategorias"] += 1

            for linea in apu.lineas:
                if linea.recurso_id:
                    recurso = db.query(Recurso).filter(Recurso.id == linea.recurso_id).first()
                    if not recurso:
                        summary["apu_cross_unresolved_recursos"] += 1
                    elif recurso.base_trabajo_id != apu.base_trabajo_id or recurso.empresa_id != apu.empresa_id:
                        replacement = _find_matching_recurso(db, apu, recurso)
                        if replacement:
                            linea.recurso_id = replacement.id
                            summary["apu_lineas_recurso_realigned"] += 1
                        else:
                            summary["apu_cross_unresolved_recursos"] += 1

                if linea.apu_hijo_id:
                    apu_hijo = db.query(APU).filter(APU.id == linea.apu_hijo_id).first()
                    if not apu_hijo:
                        summary["apu_cross_unresolved_apus_hijo"] += 1
                    elif apu_hijo.base_trabajo_id != apu.base_trabajo_id or apu_hijo.empresa_id != apu.empresa_id:
                        replacement = _find_matching_apu(db, apu, apu_hijo)
                        if replacement:
                            linea.apu_hijo_id = replacement.id
                            summary["apu_lineas_apu_hijo_realigned"] += 1
                        else:
                            summary["apu_cross_unresolved_apus_hijo"] += 1

            apu.descripcion_normalizada = normalize_string(apu.descripcion)

        budgets = db.query(Presupuesto).all()
        for presupuesto in budgets:
            ensure_presupuesto_indirectos(db, presupuesto)
            calculate_presupuesto_totals(db, presupuesto)
            summary["budgets_seeded_or_recalculated"] += 1

        db.commit()

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
