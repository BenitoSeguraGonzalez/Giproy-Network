import argparse
import ast
import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import settings


CONFIRMATION = "APLICAR MIGRACION BIM COORDINADA SANTIAGO BERMEO"


def _run(command: list[str], environment: dict[str, str]) -> str:
    completed = subprocess.run(
        command,
        cwd=BACKEND_DIR,
        env=environment,
        check=True,
        text=True,
        capture_output=True,
    )
    if completed.stderr:
        print(completed.stderr, file=sys.stderr, end="")
    return completed.stdout.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("backup", type=Path)
    parser.add_argument("--database", default="giproy_bim_restore_verify_santiago_20260803")
    args = parser.parse_args()
    backup = args.backup.resolve(strict=True)
    if not args.database.startswith("giproy_bim_restore_verify_"):
        raise SystemExit("La base aislada debe usar el prefijo de verificación.")

    source_url = make_url(settings.sync_database_url)
    isolated_url = source_url.set(database=args.database)
    admin = create_engine(source_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    restored = None
    try:
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{args.database}" WITH (FORCE)'))
            connection.execute(text(f'CREATE DATABASE "{args.database}"'))

        environment = {
            **os.environ,
            "PGPASSWORD": source_url.password or "",
            "DATABASE_URL": isolated_url.render_as_string(hide_password=False),
        }
        subprocess.run(
            [
                r"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe",
                "--no-owner",
                "--no-privileges",
                "--host",
                source_url.host or "localhost",
                "--port",
                str(source_url.port or 5432),
                "--username",
                source_url.username or "postgres",
                "--dbname",
                args.database,
                str(backup),
            ],
            env=environment,
            check=True,
        )
        _run([sys.executable, "-m", "alembic", "upgrade", "de2064a1b2c3"], environment)
        command = [
            sys.executable,
            "scripts/apply_santiago_bim_coordination.py",
            "--apply",
            "--confirmation",
            CONFIRMATION,
            "--actor-id",
            "3",
        ]
        first = ast.literal_eval(_run(command, environment).splitlines()[-1])
        second = ast.literal_eval(_run(command, environment).splitlines()[-1])

        restored = create_engine(isolated_url)
        with restored.connect() as connection:
            counts = {
                "snapshots": connection.execute(text("select count(*) from bim_4d_activity_snapshots where proyecto_id=7")).scalar_one(),
                "baselines": connection.execute(text("select count(*) from bim_4d_baselines where proyecto_id=7")).scalar_one(),
                "federations": connection.execute(text("select count(*) from bim_federations where proyecto_id=7 and status='active'")).scalar_one(),
                "federation_members": connection.execute(text("select count(*) from bim_federation_members m join bim_federations f on f.id=m.bim_federation_id where f.proyecto_id=7")).scalar_one(),
                "coordination_sets": connection.execute(text("select count(*) from project_coordination_sets where proyecto_id=7 and active=true")).scalar_one(),
                "conflicts": connection.execute(text("select count(*) from coordination_conflicts where proyecto_id=7 and status='open'")).scalar_one(),
                "grants": connection.execute(text("select count(*) from project_capability_grants where proyecto_id=7 and active=true")).scalar_one(),
                "links": connection.execute(text("select count(*) from coordination_links where proyecto_id=7")).scalar_one(),
                "audit_events": connection.execute(text("select count(*) from system_audit_events where proyecto_id=7 and event_type='bim_coordinated_project_migrated'")).scalar_one(),
            }
        expected = {
            "snapshots": 187,
            "baselines": 1,
            "federations": 1,
            "federation_members": 1,
            "coordination_sets": 1,
            "conflicts": 4,
            "grants": 2,
            "links": 0,
            "audit_events": 2,
        }
        stable = {
            key: first[key] == second[key]
            for key in (
                "snapshot_count",
                "baseline_id",
                "federation_id",
                "federation_member_count",
                "coordination_set_id",
                "capability_grant_count",
                "conflict_types",
                "automatic_links_created",
            )
        }
        result = {
            "isolated_database": args.database,
            "counts": counts,
            "expected": expected,
            "counts_verified": counts == expected,
            "idempotent_domain_result": all(stable.values()),
            "stable_fields": stable,
        }
        print(result)
        if counts != expected or not all(stable.values()):
            raise SystemExit("El ensayo aislado no satisface los invariantes.")
    finally:
        if restored is not None:
            restored.dispose()
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{args.database}" WITH (FORCE)'))
        admin.dispose()


if __name__ == "__main__":
    main()
