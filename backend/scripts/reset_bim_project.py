"""BIM-only project reset with dependency ordering.

Dry-run is the default. Execution requires --execute and an exact confirmation
token. The script never targets project, budget, schedule, or document tables.
"""
import argparse
from collections import defaultdict

from sqlalchemy import MetaData, Table, inspect, select

from app.core.database import SessionLocal, engine


def scoped_tables():
    inspector = inspect(engine)
    names = [name for name in inspector.get_table_names() if name.startswith('bim') or name.startswith('coordination')]
    metadata = MetaData()
    tables = {name: Table(name, metadata, autoload_with=engine) for name in names}
    scoped = {name: table for name, table in tables.items() if 'proyecto_id' in table.c or 'project_id' in table.c}
    return inspector, tables, scoped


def child_first_order(inspector, tables):
    parents = defaultdict(set)
    for name in tables:
        for fk in inspector.get_foreign_keys(name):
            target = fk.get('referred_table')
            if target in tables and target != name:
                parents[name].add(target)
    ordered, visiting, visited = [], set(), set()

    def visit(name):
        if name in visited:
            return
        if name in visiting:
            return
        visiting.add(name)
        for parent in sorted(parents[name]):
            visit(parent)
        visiting.remove(name)
        visited.add(name)
        ordered.append(name)

    for name in sorted(tables):
        visit(name)
    return list(reversed(ordered))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-id', type=int, required=True)
    parser.add_argument('--execute', action='store_true')
    parser.add_argument('--confirm', default='')
    args = parser.parse_args()
    if args.execute and args.confirm != f'BIM-ONLY-{args.project_id}':
        raise SystemExit(f'Para ejecutar exige --confirm BIM-ONLY-{args.project_id}')
    inspector, tables, scoped = scoped_tables()
    order = child_first_order(inspector, tables)
    counts = {}
    with SessionLocal() as db:
        for name in order:
            table = scoped.get(name)
            if table is None:
                continue
            column = table.c.get('proyecto_id') if 'proyecto_id' in table.c else table.c.get('project_id')
            count = db.execute(select(list(table.primary_key.columns)[0]).where(column == args.project_id)).all()
            counts[name] = len(count)
        if args.execute:
            for name in order:
                table = scoped.get(name)
                if table is None:
                    continue
                column = table.c.get('proyecto_id') if 'proyecto_id' in table.c else table.c.get('project_id')
                db.execute(table.delete().where(column == args.project_id))
            db.commit()
    mode = 'EXECUTED' if args.execute else 'DRY-RUN'
    print(mode, 'project', args.project_id, 'tables', len(counts), 'rows', sum(counts.values()))
    for name, count in counts.items():
        if count:
            print(f'{name}: {count}')


if __name__ == '__main__':
    main()
