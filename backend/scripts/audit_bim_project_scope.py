"""Read-only scope audit for a project's BIM rows.

It intentionally never deletes or updates data. It is the mandatory preflight
for any future BIM-only reset.
"""
import argparse
import json
from datetime import datetime

from sqlalchemy import MetaData, Table, inspect, select, func

from app.core.database import SessionLocal, engine


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-id', type=int, required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    inspector = inspect(engine)
    tables = [name for name in inspector.get_table_names() if name.startswith('bim') or name.startswith('coordination')]
    result = {'project_id': args.project_id, 'generated_at': datetime.utcnow().isoformat(), 'tables': {}, 'rows': {}}
    with SessionLocal() as db:
        for table_name in tables:
            columns = {item['name'] for item in inspector.get_columns(table_name)}
            scope_column = 'proyecto_id' if 'proyecto_id' in columns else 'project_id' if 'project_id' in columns else None
            if not scope_column:
                continue
            table = Table(table_name, MetaData(), autoload_with=engine)
            rows = db.execute(select(table).where(table.c[scope_column] == args.project_id)).mappings().all()
            result['tables'][table_name] = {'scope_column': scope_column, 'count': len(rows)}
            result['rows'][table_name] = [dict(row) for row in rows]
    with open(args.output, 'w', encoding='utf-8') as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2, default=str)
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))


if __name__ == '__main__':
    main()
