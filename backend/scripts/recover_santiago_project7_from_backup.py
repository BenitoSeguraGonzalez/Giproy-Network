from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import MetaData, Table, insert, inspect, text
from sqlalchemy.orm import Session

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal, engine
from app.services.audit_event import record_audit_event


BACKUP_PATH = Path(__file__).resolve().parents[2] / "db_backup.json"
REPORT_DIR = Path(__file__).resolve().parents[2] / "tmp"


def _ids(rows: list[dict[str, Any]]) -> set[int]:
    return {int(row["id"]) for row in rows if row.get("id") is not None}


def _filter_columns(table: Table, row: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in row.items() if key in table.c}


def _existing_ids(db: Session, table_name: str, ids: set[int]) -> set[int]:
    if not ids:
        return set()
    id_list = ",".join(str(item) for item in sorted(ids))
    rows = db.execute(text(f"select id from {table_name} where id in ({id_list})")).fetchall()
    return {int(row[0]) for row in rows}


def _table(metadata: MetaData, name: str) -> Table:
    return Table(name, metadata, autoload_with=engine)


def _insert_missing(
    db: Session,
    metadata: MetaData,
    table_name: str,
    rows: list[dict[str, Any]],
    report: dict[str, Any],
    *,
    sort_by_id: bool = True,
) -> None:
    if not rows:
        report["tables"][table_name] = {"wanted": 0, "existing": 0, "inserted": 0}
        return
    rows = sorted(rows, key=lambda item: int(item.get("id") or 0)) if sort_by_id else list(rows)
    table = _table(metadata, table_name)
    wanted_ids = _ids(rows)
    existing = _existing_ids(db, table_name, wanted_ids)
    missing_rows = [row for row in rows if int(row["id"]) not in existing]
    for row in missing_rows:
        db.execute(insert(table).values(**_filter_columns(table, row)))
    report["tables"][table_name] = {
        "wanted": len(rows),
        "existing": len(existing),
        "inserted": len(missing_rows),
        "inserted_ids": [int(row["id"]) for row in missing_rows],
    }


def _sort_parent_first(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_id = {int(row["id"]): row for row in rows if row.get("id") is not None}
    ordered: list[dict[str, Any]] = []
    visited: set[int] = set()

    def visit(row_id: int) -> None:
        if row_id in visited:
            return
        row = by_id[row_id]
        parent_id = row.get("parent_id")
        if parent_id is not None and int(parent_id) in by_id:
            visit(int(parent_id))
        visited.add(row_id)
        ordered.append(row)

    for item_id in sorted(by_id):
        visit(item_id)
    return ordered


def _load_scope() -> dict[str, list[dict[str, Any]]]:
    data = json.loads(BACKUP_PATH.read_text(encoding="utf-8"))

    base34_id = 34
    project7_id = 7
    budget13_id = 13
    formula2_id = 2
    snapshot25_id = 25

    base34_subcategory_ids = {
        int(row["id"])
        for row in data["subcategorias_items"]
        if int(row.get("base_trabajo_id") or 0) == base34_id
    }
    base34_resource_ids = {
        int(row["id"])
        for row in data["recursos"]
        if int(row.get("base_trabajo_id") or 0) == base34_id
    }
    base34_apu_ids = {
        int(row["id"])
        for row in data["apus"]
        if int(row.get("base_trabajo_id") or 0) == base34_id
    }

    budget_detail_ids = {
        int(row["id"])
        for row in data["presupuesto_detalles"]
        if int(row.get("presupuesto_id") or 0) == budget13_id
    }

    return {
        "stakeholders": [
            row
            for row in data.get("stakeholders", [])
            if int(row.get("id") or 0) in {33, 34}
        ],
        "bases_trabajo": [
            row
            for row in data["bases_trabajo"]
            if int(row.get("id") or 0) == base34_id
        ],
        "subcategorias_items": [
            row
            for row in data["subcategorias_items"]
            if int(row.get("id") or 0) in base34_subcategory_ids
        ],
        "recursos": [
            row
            for row in data["recursos"]
            if int(row.get("id") or 0) in base34_resource_ids
        ],
        "apus": [
            row
            for row in data["apus"]
            if int(row.get("id") or 0) in base34_apu_ids
        ],
        "apu_lineas": [
            row
            for row in data["apu_lineas"]
            if int(row.get("apu_id") or 0) in base34_apu_ids
        ],
        "proyectos": [
            row
            for row in data["proyectos"]
            if int(row.get("id") or 0) == project7_id
        ],
        "edt_nodes": [
            row
            for row in data["edt_nodes"]
            if int(row.get("proyecto_id") or 0) == project7_id
        ],
        "presupuestos": [
            row
            for row in data["presupuestos"]
            if int(row.get("id") or 0) == budget13_id
        ],
        "presupuesto_detalles": _sort_parent_first([
            row
            for row in data["presupuesto_detalles"]
            if int(row.get("id") or 0) in budget_detail_ids
        ]),
        "presupuesto_indirectos": [
            row
            for row in data.get("presupuesto_indirectos", [])
            if int(row.get("presupuesto_id") or 0) == budget13_id
        ],
        "presupuesto_notas": [
            row
            for row in data.get("presupuesto_notas", [])
            if int(row.get("presupuesto_id") or 0) == budget13_id
        ],
        "presupuesto_vistas_usuario": [
            row
            for row in data.get("presupuesto_vistas_usuario", [])
            if int(row.get("presupuesto_id") or 0) == budget13_id and int(row.get("usuario_id") or 0) in {1, 3}
        ],
        "presupuesto_linea_vistas_usuario": [
            row
            for row in data.get("presupuesto_linea_vistas_usuario", [])
            if int(row.get("presupuesto_id") or 0) == budget13_id
            and int(row.get("linea_presupuesto_id") or 0) in budget_detail_ids
            and int(row.get("usuario_id") or 0) in {1, 3}
        ],
        "cronogramas_valorados": [
            row
            for row in data.get("cronogramas_valorados", [])
            if int(row.get("proyecto_id") or 0) == project7_id
        ],
        "cronogramas_trabajo": [
            row
            for row in data.get("cronogramas_trabajo", [])
            if int(row.get("proyecto_id") or 0) == project7_id
        ],
        "formula_polinomica": [
            row
            for row in data.get("formula_polinomica", [])
            if int(row.get("id") or 0) == formula2_id
        ],
        "formula_polinomica_monomios": [
            row
            for row in data.get("formula_polinomica_monomios", [])
            if int(row.get("formula_id") or 0) == formula2_id
        ],
        "formula_polinomica_asignaciones": [
            row
            for row in data.get("formula_polinomica_asignaciones", [])
            if int(row.get("formula_id") or 0) == formula2_id
            and int(row.get("recurso_id") or 0) in base34_resource_ids
        ],
        "project_calendar_snapshots": [
            row
            for row in data.get("project_calendar_snapshots", [])
            if int(row.get("id") or 0) == snapshot25_id
        ],
        "project_calendar_snapshot_days": [
            row
            for row in data.get("project_calendar_snapshot_days", [])
            if int(row.get("snapshot_id") or 0) == snapshot25_id
        ],
    }


def _validate_scope(scope: dict[str, list[dict[str, Any]]]) -> list[str]:
    errors: list[str] = []
    if len(scope["proyectos"]) != 1:
        errors.append("project_7_missing_in_backup_scope")
    if len(scope["bases_trabajo"]) != 1:
        errors.append("base_34_missing_in_backup_scope")
    if len(scope["presupuestos"]) != 1:
        errors.append("budget_13_missing_in_backup_scope")
    if not scope["presupuesto_detalles"]:
        errors.append("budget_13_without_details")
    if not scope["apus"]:
        errors.append("base_34_without_apus")
    if not scope["recursos"]:
        errors.append("base_34_without_resources")

    apu_ids = _ids(scope["apus"])
    detail_apu_ids = {
        int(row["apu_id"])
        for row in scope["presupuesto_detalles"]
        if row.get("apu_id") and str(row.get("tipo") or "").upper() != "CUENTA_PAQUETE"
    }
    missing_detail_apus = sorted(detail_apu_ids - apu_ids)
    if missing_detail_apus:
        errors.append(f"budget_detail_apus_out_of_scope:{missing_detail_apus[:10]}")

    detail_ids = _ids(scope["presupuesto_detalles"])
    missing_parent_ids = sorted(
        int(row["parent_id"])
        for row in scope["presupuesto_detalles"]
        if row.get("parent_id") and int(row["parent_id"]) not in detail_ids
    )
    if missing_parent_ids:
        errors.append(f"budget_detail_parent_missing:{missing_parent_ids[:10]}")

    return errors


def recover(*, apply: bool) -> dict[str, Any]:
    scope = _load_scope()
    errors = _validate_scope(scope)
    if errors:
        return {"ok": False, "apply": apply, "errors": errors}

    report: dict[str, Any] = {
        "ok": True,
        "apply": apply,
        "source": str(BACKUP_PATH),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "tables": {},
    }
    metadata = MetaData()
    order = [
        "stakeholders",
        "bases_trabajo",
        "subcategorias_items",
        "recursos",
        "apus",
        "apu_lineas",
        "proyectos",
        "edt_nodes",
        "presupuestos",
        "presupuesto_detalles",
        "presupuesto_indirectos",
        "presupuesto_notas",
        "presupuesto_vistas_usuario",
        "presupuesto_linea_vistas_usuario",
        "cronogramas_valorados",
        "cronogramas_trabajo",
        "formula_polinomica",
        "formula_polinomica_monomios",
        "formula_polinomica_asignaciones",
        "project_calendar_snapshots",
        "project_calendar_snapshot_days",
    ]

    db = SessionLocal()
    try:
        for table_name in order:
            _insert_missing(
                db,
                metadata,
                table_name,
                scope[table_name],
                report,
                sort_by_id=table_name != "presupuesto_detalles",
            )

        if apply:
            db.commit()
            record_audit_event(
                db,
                module="proyectos",
                event_type="project_recovered_from_backup",
                message="Proyecto historico de Santiago Bermeo recuperado desde db_backup.json.",
                severity="warning",
                empresa_id=3,
                target_empresa_id=3,
                entity_type="proyecto",
                entity_id=7,
                payload={
                    "project_id": 7,
                    "base_trabajo_id": 34,
                    "presupuesto_id": 13,
                    "source_backup": str(BACKUP_PATH),
                    "tables": report["tables"],
                },
            )
        else:
            db.rollback()
    except Exception as exc:
        db.rollback()
        report["ok"] = False
        report["error"] = str(exc)
    finally:
        db.close()

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORT_DIR / (
        f"santiago_project7_recovery_{'apply' if apply else 'dry_run'}_"
        f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    )
    report["report_path"] = str(report_path)
    report_path.write_text(json.dumps(report, ensure_ascii=True, indent=2, default=str), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply the recovery. Default is dry-run.")
    args = parser.parse_args()
    report = recover(apply=bool(args.apply))
    print(json.dumps(report, ensure_ascii=True, indent=2, default=str))


if __name__ == "__main__":
    main()
