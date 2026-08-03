"""Repair a database whose Alembic BIM revision was stamped ahead of its schema.

The script is deliberately conservative: it only creates BIM tables that are
present in the current SQLAlchemy metadata and absent from PostgreSQL. Existing
tables, rows, columns, constraints and indexes are never dropped or replaced.

Usage:
    python backend/scripts/repair_missing_bim_tables.py
    python backend/scripts/repair_missing_bim_tables.py --apply
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sqlalchemy import inspect, text


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app.models  # noqa: E402,F401
from app.core.database import Base, engine  # noqa: E402


def missing_bim_tables() -> list[str]:
    existing = set(inspect(engine).get_table_names())
    return sorted(
        table_name
        for table_name in Base.metadata.tables
        if table_name.startswith("bim_") and table_name not in existing
    )


def missing_known_columns() -> list[tuple[str, str]]:
    inspector = inspect(engine)
    expected = (
        ("bim_4d_field_reports", "currency"),
        ("bim_4d_safety_inspections", "checklist_json"),
    )
    missing: list[tuple[str, str]] = []
    for table_name, column_name in expected:
        if table_name not in inspector.get_table_names():
            continue
        actual_columns = {column["name"] for column in inspector.get_columns(table_name)}
        if column_name not in actual_columns:
            missing.append((table_name, column_name))
    return missing


def repair_known_columns() -> None:
    missing = set(missing_known_columns())
    with engine.begin() as connection:
        if ("bim_4d_field_reports", "currency") in missing:
            connection.execute(
                text(
                    "ALTER TABLE bim_4d_field_reports "
                    "ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD'"
                )
            )
            connection.execute(
                text(
                    "ALTER TABLE bim_4d_field_reports "
                    "ALTER COLUMN currency DROP DEFAULT"
                )
            )
        if ("bim_4d_safety_inspections", "checklist_json") in missing:
            connection.execute(
                text(
                    "ALTER TABLE bim_4d_safety_inspections "
                    "ADD COLUMN checklist_json JSON NOT NULL DEFAULT '[]'::json"
                )
            )
            connection.execute(
                text(
                    "ALTER TABLE bim_4d_safety_inspections "
                    "ALTER COLUMN checklist_json DROP DEFAULT"
                )
            )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Create the missing BIM tables. Without this flag the script is read-only.",
    )
    args = parser.parse_args()

    before = missing_bim_tables()
    columns_before = missing_known_columns()
    print(f"Missing BIM tables before repair: {len(before)}")
    for table_name in before:
        print(f"  - {table_name}")
    print(f"Missing known BIM columns before repair: {len(columns_before)}")
    for table_name, column_name in columns_before:
        print(f"  - {table_name}.{column_name}")

    if not args.apply:
        print("Dry run only. Re-run with --apply after taking a database backup.")
        return 0

    if before:
        tables = [Base.metadata.tables[name] for name in before]
        Base.metadata.create_all(bind=engine, tables=tables, checkfirst=True)
    repair_known_columns()

    after = missing_bim_tables()
    columns_after = missing_known_columns()
    print(f"Missing BIM tables after repair: {len(after)}")
    if after:
        for table_name in after:
            print(f"  - {table_name}")
        return 1
    print(f"Missing known BIM columns after repair: {len(columns_after)}")
    if columns_after:
        for table_name, column_name in columns_after:
            print(f"  - {table_name}.{column_name}")
        return 1

    print("BIM table repair completed without replacing existing tables.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    finally:
        engine.dispose()
