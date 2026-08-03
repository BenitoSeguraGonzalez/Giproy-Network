import argparse
import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.config import settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("backup", type=Path)
    parser.add_argument("--database", default="giproy_bim_restore_verify_20260803")
    args = parser.parse_args()
    backup = args.backup.resolve(strict=True)
    if not args.database.startswith("giproy_bim_restore_verify_"):
        raise SystemExit("La base aislada debe usar el prefijo de verificación.")
    url = make_url(settings.sync_database_url)
    admin = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    restored = None
    try:
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{args.database}"'))
            connection.execute(text(f'CREATE DATABASE "{args.database}"'))
        environment = {**os.environ, "PGPASSWORD": url.password or ""}
        subprocess.run([
            r"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe",
            "--no-owner", "--no-privileges", "--host", url.host or "localhost",
            "--port", str(url.port or 5432), "--username", url.username or "postgres",
            "--dbname", args.database, str(backup),
        ], env=environment, check=True)
        restored = create_engine(url.set(database=args.database))
        with restored.connect() as connection:
            values = {
                "project": connection.execute(text("select count(*) from proyectos where id=7 and codigo_root='SantiagoBermeo-2026-001'")).scalar_one(),
                "budget_lines": connection.execute(text("select count(*) from presupuesto_detalles pd join presupuestos p on p.id=pd.presupuesto_id where p.proyecto_id=7")).scalar_one(),
                "schedule": connection.execute(text("select count(*) from cronogramas_trabajo where id=1 and proyecto_id=7")).scalar_one(),
                "bim_versions": connection.execute(text("select count(*) from bim_model_versions v join bim_models m on m.id=v.bim_model_id where m.proyecto_id=7")).scalar_one(),
            }
        expected = {"project": 1, "budget_lines": 201, "schedule": 1, "bim_versions": 1}
        print({**values, "isolated_restore_verified": values == expected})
        if values != expected:
            raise SystemExit("Los conteos restaurados no coinciden.")
    finally:
        if restored is not None:
            restored.dispose()
        with admin.connect() as connection:
            connection.execute(text(f'DROP DATABASE IF EXISTS "{args.database}" WITH (FORCE)'))
        admin.dispose()


if __name__ == "__main__":
    main()
