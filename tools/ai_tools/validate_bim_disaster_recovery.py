from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import MetaData, Table, create_engine, inspect, select, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.core.config import settings  # noqa: E402
from app.core.database import Base  # noqa: E402
import app.models  # noqa: E402,F401
from app.models.bim_cde_rfi import BimCdeRfi  # noqa: E402
from app.models.bim_operational_notification import BimOperationalNotification  # noqa: E402
from app.models.empresa import Empresa  # noqa: E402
from app.models.proyecto import Proyecto  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402


CLASSIC_TABLES = ("empresas", "proyectos", "usuarios")
FIXTURE_IDS = {"company": 910001, "project": 910002, "user": 910003}


def _require_test_database(name: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_]+_test", name):
        raise RuntimeError(f"La base DR debe ser un identificador seguro terminado en _test: {name}")


def _normalize(value):
    if isinstance(value, bytes):
        return {"bytes_sha256": hashlib.sha256(value).hexdigest(), "size": len(value)}
    if isinstance(value, (datetime,)):
        return value.astimezone(timezone.utc).isoformat() if value.tzinfo else value.replace(tzinfo=timezone.utc).isoformat()
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def table_fingerprint(engine, table_name: str) -> dict:
    metadata = MetaData()
    table = Table(table_name, metadata, autoload_with=engine)
    order_columns = list(table.primary_key.columns) or list(table.columns)
    with engine.connect() as connection:
        rows = connection.execute(select(table).order_by(*order_columns)).mappings().all()
    payload = [
        {key: _normalize(value) for key, value in sorted(row.items())}
        for row in rows
    ]
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str).encode()
    return {"rows": len(payload), "sha256": hashlib.sha256(encoded).hexdigest()}


def domain_fingerprint(engine, table_names: list[str]) -> dict:
    return {table_name: table_fingerprint(engine, table_name) for table_name in sorted(table_names)}


def _reset_databases(source_url, database_names: tuple[str, str]) -> None:
    for name in database_names:
        _require_test_database(name)
        if source_url.database == name:
            raise RuntimeError("El ensayo DR no puede usar la base operativa.")
    admin_engine = create_engine(source_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as connection:
            for name in database_names:
                connection.execute(
                    text(
                        "select pg_terminate_backend(pid) from pg_stat_activity "
                        "where datname=:database and pid <> pg_backend_pid()"
                    ),
                    {"database": name},
                )
                connection.execute(text(f'DROP DATABASE IF EXISTS "{name}"'))
                connection.execute(text(f'CREATE DATABASE "{name}"'))
    finally:
        admin_engine.dispose()


def _drop_databases(source_url, database_names: tuple[str, str]) -> None:
    admin_engine = create_engine(source_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    try:
        with admin_engine.connect() as connection:
            for name in database_names:
                connection.execute(
                    text(
                        "select pg_terminate_backend(pid) from pg_stat_activity "
                        "where datname=:database and pid <> pg_backend_pid()"
                    ),
                    {"database": name},
                )
                connection.execute(text(f'DROP DATABASE IF EXISTS "{name}"'))
    finally:
        admin_engine.dispose()


def _postgres_bin(source_url) -> Path:
    override = os.getenv("POSTGRESQL_BIN")
    if override:
        candidate = Path(override)
        if (candidate / "pg_dump.exe").exists():
            return candidate
    engine = create_engine(source_url)
    try:
        with engine.connect() as connection:
            major = int(connection.execute(text("show server_version_num")).scalar_one()) // 10000
    finally:
        engine.dispose()
    candidates = [
        Path(f"C:/Program Files/PostgreSQL/{major}/bin"),
        Path("C:/Program Files/PostgreSQL/18/bin"),
        Path("C:/Program Files/PostgreSQL/17/bin"),
    ]
    for candidate in candidates:
        if (candidate / "pg_dump.exe").exists() and (candidate / "pg_restore.exe").exists():
            return candidate
    raise RuntimeError("No se encontraron pg_dump.exe y pg_restore.exe compatibles.")


def _seed_classic(engine) -> None:
    with Session(engine) as session:
        session.add(Empresa(
            id=FIXTURE_IDS["company"],
            nombre="BIM DR Fixture",
            ruc="1799999999001",
            proy_prefijo="DR",
            proy_periodo="2026",
            proy_secuencial=1,
            proy_secuencial_size=3,
        ))
        session.add(Proyecto(
            id=FIXTURE_IDS["project"],
            nombre="BIM DR Project",
            codigo_root="BIM-DR",
            revision=1,
            empresa_id=FIXTURE_IDS["company"],
        ))
        session.add(Usuario(
            id=FIXTURE_IDS["user"],
            email="bim-dr@example.com",
            hashed_password="fixture",
            nombre_completo="BIM DR Operator",
            empresa_id=FIXTURE_IDS["company"],
            rol="superadministrador",
            activo=True,
        ))
        session.commit()


def _seed_bim(engine) -> None:
    due_at = datetime(2026, 8, 1, 12, 0, tzinfo=timezone.utc)
    created_at = datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)
    with Session(engine) as session:
        rfi = BimCdeRfi(
            empresa_id=FIXTURE_IDS["company"],
            proyecto_id=FIXTURE_IDS["project"],
            rfi_number="RFI-DR-0001",
            subject="Validar recuperación BIM",
            question="¿La copia conserva el contrato y la trazabilidad?",
            priority="high",
            status="submitted",
            due_at=due_at,
            assigned_to=FIXTURE_IDS["user"],
            created_by=FIXTURE_IDS["user"],
            lock_version=1,
            created_at=created_at,
            updated_at=created_at,
        )
        session.add(rfi)
        session.flush()
        session.add(BimOperationalNotification(
            empresa_id=FIXTURE_IDS["company"],
            proyecto_id=FIXTURE_IDS["project"],
            usuario_id=FIXTURE_IDS["user"],
            source_type="rfi",
            source_id=rfi.id,
            source_number=rfi.rfi_number,
            title=rfi.subject,
            event_type="due_soon",
            severity="warning",
            escalation_level=0,
            due_at=due_at,
            dedupe_key="bim-dr-fixture-rfi",
            created_at=created_at,
            updated_at=created_at,
        ))
        session.commit()


def _run_postgres_tool(binary: Path, source_url, database: str, extra: list[str]) -> None:
    environment = os.environ.copy()
    if source_url.password:
        environment["PGPASSWORD"] = source_url.password
    command = [
        str(binary),
        "--host", source_url.host or "localhost",
        "--port", str(source_url.port or 5432),
        "--username", source_url.username or "postgres",
        "--dbname", database,
        *extra,
    ]
    subprocess.run(command, check=True, env=environment, capture_output=True, text=True)


def validate(source_database: str, restore_database: str, *, keep_databases: bool = False) -> dict:
    database_names = (source_database, restore_database)
    source_url = make_url(settings.sync_database_url)
    _reset_databases(source_url, database_names)
    source_engine = create_engine(source_url.set(database=source_database))
    restore_engine = create_engine(source_url.set(database=restore_database))
    started_at = time.perf_counter()
    try:
        Base.metadata.create_all(source_engine)
        Base.metadata.create_all(restore_engine)
        _seed_classic(source_engine)
        _seed_classic(restore_engine)
        _seed_bim(source_engine)

        bim_tables = sorted(
            table_name for table_name in inspect(source_engine).get_table_names()
            if table_name.startswith("bim_")
        )
        if not bim_tables:
            raise RuntimeError("El esquema DR no contiene tablas BIM.")
        source_fingerprint = domain_fingerprint(source_engine, bim_tables)
        classic_before = domain_fingerprint(restore_engine, list(CLASSIC_TABLES))

        postgres_bin = _postgres_bin(source_url)
        with tempfile.TemporaryDirectory(prefix="giproy-bim-dr-") as temporary:
            archive = Path(temporary) / "bim-domain.dump"
            _run_postgres_tool(
                postgres_bin / "pg_dump.exe",
                source_url,
                source_database,
                ["--format=custom", "--data-only", "--no-owner", "--no-privileges", "--table=bim_*", f"--file={archive}"],
            )
            if not archive.exists() or archive.stat().st_size == 0:
                raise RuntimeError("pg_dump no generó un artefacto BIM verificable.")
            _run_postgres_tool(
                postgres_bin / "pg_restore.exe",
                source_url,
                restore_database,
                ["--data-only", "--no-owner", "--no-privileges", "--exit-on-error", str(archive)],
            )

        restore_fingerprint = domain_fingerprint(restore_engine, bim_tables)
        classic_after = domain_fingerprint(restore_engine, list(CLASSIC_TABLES))
        if source_fingerprint != restore_fingerprint:
            raise RuntimeError("La restauración BIM no reproduce conteos y checksums de origen.")
        if classic_before != classic_after:
            raise RuntimeError("La restauración BIM modificó tablas clásicas de contexto.")
        aggregate = hashlib.sha256(
            json.dumps(source_fingerprint, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        result = {
            "tables": len(bim_tables),
            "rows": sum(value["rows"] for value in source_fingerprint.values()),
            "sha256": aggregate,
            "classic_unchanged": True,
            "elapsed_seconds": round(time.perf_counter() - started_at, 3),
        }
        print(
            "BIM_DR_OK "
            f"tables={result['tables']} rows={result['rows']} "
            f"classic_unchanged=true checksum={aggregate} "
            f"elapsed_seconds={result['elapsed_seconds']}"
        )
        return result
    finally:
        source_engine.dispose()
        restore_engine.dispose()
        if not keep_databases:
            _drop_databases(source_url, database_names)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-database", default="giproy_bim_dr_source_test")
    parser.add_argument("--restore-database", default="giproy_bim_dr_restore_test")
    parser.add_argument("--keep-databases", action="store_true")
    args = parser.parse_args()
    validate(args.source_database, args.restore_database, keep_databases=args.keep_databases)


if __name__ == "__main__":
    main()
