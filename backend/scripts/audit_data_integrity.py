from __future__ import annotations

import json
import sys
from pathlib import Path
from decimal import Decimal

from sqlalchemy import create_engine, text

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import settings


CHECKS = {
    "project_detail_null_empresa": """
        SELECT id, codigo_root, empresa_id
        FROM proyecto_detalles
        WHERE empresa_id IS NULL
        ORDER BY id
    """,
    "duplicate_budgets_same_project": """
        SELECT
            empresa_id,
            proyecto_id,
            count(*) AS total,
            array_agg(id ORDER BY id) AS presupuesto_ids
        FROM presupuestos
        GROUP BY empresa_id, proyecto_id
        HAVING count(*) > 1
        ORDER BY empresa_id, proyecto_id
    """,
    "indirectos_cross_empresa": """
        SELECT pi.id, pi.presupuesto_id, pi.empresa_id, p.empresa_id AS presupuesto_empresa_id
        FROM presupuesto_indirectos pi
        JOIN presupuestos p ON p.id = pi.presupuesto_id
        WHERE pi.empresa_id <> p.empresa_id
        ORDER BY pi.id
    """,
    "subcats_cross_base_empresa": """
        SELECT s.id, s.empresa_id, s.base_trabajo_id, b.empresa_id AS base_empresa_id
        FROM subcategorias_items s
        JOIN bases_trabajo b ON b.id = s.base_trabajo_id
        WHERE s.empresa_id <> b.empresa_id
        ORDER BY s.id
    """,
    "recursos_cross_subcat_empresa": """
        SELECT r.id, r.empresa_id, r.subcategoria_item_id, s.empresa_id AS subcat_empresa_id
        FROM recursos r
        JOIN subcategorias_items s ON s.id = r.subcategoria_item_id
        WHERE r.empresa_id <> s.empresa_id
        ORDER BY r.id
    """,
    "recursos_cross_base_empresa": """
        SELECT r.id, r.empresa_id, r.base_trabajo_id, b.empresa_id AS base_empresa_id
        FROM recursos r
        JOIN bases_trabajo b ON b.id = r.base_trabajo_id
        WHERE r.empresa_id <> b.empresa_id
        ORDER BY r.id
    """,
    "apus_cross_subcat_empresa": """
        SELECT a.id, a.empresa_id, a.subcategoria_item_id, s.empresa_id AS subcat_empresa_id
        FROM apus a
        JOIN subcategorias_items s ON s.id = a.subcategoria_item_id
        WHERE a.subcategoria_item_id IS NOT NULL
          AND a.empresa_id <> s.empresa_id
        ORDER BY a.id
    """,
    "apus_cross_base_empresa": """
        SELECT a.id, a.empresa_id, a.base_trabajo_id, b.empresa_id AS base_empresa_id
        FROM apus a
        JOIN bases_trabajo b ON b.id = a.base_trabajo_id
        WHERE a.empresa_id <> b.empresa_id
        ORDER BY a.id
    """,
    "apus_cross_subcat_base": """
        SELECT a.id, a.empresa_id, a.base_trabajo_id, a.subcategoria_item_id,
               s.base_trabajo_id AS subcat_base_id, s.empresa_id AS subcat_empresa_id
        FROM apus a
        JOIN subcategorias_items s ON s.id = a.subcategoria_item_id
        WHERE a.subcategoria_item_id IS NOT NULL
          AND (
              a.base_trabajo_id <> s.base_trabajo_id
              OR a.empresa_id <> s.empresa_id
          )
        ORDER BY a.id
    """,
    "apu_line_recurso_cross_context": """
        SELECT l.id, l.apu_id, a.empresa_id AS apu_empresa_id, a.base_trabajo_id AS apu_base_id,
               l.recurso_id, r.empresa_id AS recurso_empresa_id, r.base_trabajo_id AS recurso_base_id
        FROM apu_lineas l
        JOIN apus a ON a.id = l.apu_id
        JOIN recursos r ON r.id = l.recurso_id
        WHERE r.empresa_id <> a.empresa_id
           OR r.base_trabajo_id <> a.base_trabajo_id
        ORDER BY l.id
    """,
    "apu_line_apu_hijo_cross_context": """
        SELECT l.id, l.apu_id, a.empresa_id AS apu_empresa_id, a.base_trabajo_id AS apu_base_id,
               l.apu_hijo_id, h.empresa_id AS apu_hijo_empresa_id, h.base_trabajo_id AS apu_hijo_base_id
        FROM apu_lineas l
        JOIN apus a ON a.id = l.apu_id
        JOIN apus h ON h.id = l.apu_hijo_id
        WHERE h.empresa_id <> a.empresa_id
           OR h.base_trabajo_id <> a.base_trabajo_id
        ORDER BY l.id
    """,
    "presupuesto_line_apu_cross_empresa": """
        SELECT pd.id, pd.presupuesto_id, p.empresa_id AS presupuesto_empresa_id, pd.apu_id, a.empresa_id AS apu_empresa_id
        FROM presupuesto_detalles pd
        JOIN presupuestos p ON p.id = pd.presupuesto_id
        JOIN apus a ON a.id = pd.apu_id
        WHERE pd.apu_id IS NOT NULL
          AND p.empresa_id <> a.empresa_id
        ORDER BY pd.id
    """,
    "orphan_note_presupuesto": """
        SELECT n.id, n.presupuesto_id
        FROM presupuesto_notas n
        LEFT JOIN presupuestos p ON p.id = n.presupuesto_id
        WHERE p.id IS NULL
        ORDER BY n.id
    """,
    "orphan_note_linea": """
        SELECT n.id, n.linea_presupuesto_id
        FROM presupuesto_notas n
        LEFT JOIN presupuesto_detalles pd ON pd.id = n.linea_presupuesto_id
        WHERE n.linea_presupuesto_id IS NOT NULL
          AND pd.id IS NULL
        ORDER BY n.id
    """,
    "orphan_view_presupuesto": """
        SELECT v.id, v.presupuesto_id
        FROM presupuesto_vistas_usuario v
        LEFT JOIN presupuestos p ON p.id = v.presupuesto_id
        WHERE p.id IS NULL
        ORDER BY v.id
    """,
    "orphan_line_view_linea": """
        SELECT lv.id, lv.linea_presupuesto_id
        FROM presupuesto_linea_vistas_usuario lv
        LEFT JOIN presupuesto_detalles pd ON pd.id = lv.linea_presupuesto_id
        WHERE pd.id IS NULL
        ORDER BY lv.id
    """,
    "orphan_apu_lines": """
        SELECT l.id, l.apu_id, l.recurso_id, l.apu_hijo_id
        FROM apu_lineas l
        WHERE l.recurso_id IS NULL
          AND l.apu_hijo_id IS NULL
        ORDER BY l.id
    """,
    "budgets_missing_fixed_indirects": """
        WITH expected AS (
            SELECT count(*)::int AS total
            FROM (
                VALUES
                    ('1.2-gastos-tecnicos-generales'),
                    ('1.4-gastos-administrativos-generales'),
                    ('4.3-garantia-fiel-cumplimiento'),
                    ('4.3-garantia-anticipo'),
                    ('4.3-garantia-buen-uso-materiales'),
                    ('4.3-impuestos-varios'),
                    ('4.4-cargos-financieros-bancarios'),
                    ('4.4-gastos-concursos-licitaciones'),
                    ('4.4-seguridad-industrial'),
                    ('6.1-utilidad'),
                    ('6.2-imprevistos')
            ) AS fixed(concepto_codigo)
        )
        SELECT p.id AS presupuesto_id, p.empresa_id, count(pi.id) FILTER (WHERE pi.fijo = true) AS fixed_count
        FROM presupuestos p
        LEFT JOIN presupuesto_indirectos pi ON pi.presupuesto_id = p.id
        GROUP BY p.id, p.empresa_id
        HAVING count(pi.id) FILTER (WHERE pi.fijo = true) < (SELECT total FROM expected)
        ORDER BY p.id
    """,
}


def _serialize_row(row) -> dict:
    data = dict(row._mapping)
    for key, value in list(data.items()):
        if isinstance(value, Decimal):
            data[key] = str(value)
    return data


def main() -> None:
    engine = create_engine(settings.sync_database_url)
    report = {"database": settings.POSTGRES_DB, "checks": {}, "totals": {"issues": 0, "checks": len(CHECKS)}}

    with engine.connect() as conn:
        for name, sql in CHECKS.items():
            rows = conn.execute(text(sql)).fetchall()
            report["checks"][name] = {
                "count": len(rows),
                "rows": [_serialize_row(row) for row in rows[:50]],
            }
            report["totals"]["issues"] += len(rows)

    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
