from __future__ import annotations

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Barrier
from uuid import uuid4

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.core.config import settings  # noqa: E402
from app.models.bim_cde_collaboration import (  # noqa: E402
    BimCdeCollaborationEvent,
    BimCdeCollaborationPresence,
)
from app.models.empresa import Empresa  # noqa: E402
from app.models.proyecto import Proyecto  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402
from app.schemas.bim_cde_collaboration import BimCdePresenceHeartbeat  # noqa: E402
from app.services.bim.cde_collaboration_service import (  # noqa: E402
    heartbeat_presence,
    list_active_presences,
    list_collaboration_events,
)


def validate(database_name: str, workers: int) -> None:
    if not database_name.endswith("_test"):
        raise RuntimeError("La base de concurrencia debe terminar en _test.")
    if workers < 2 or workers > 32:
        raise RuntimeError("El numero de workers debe estar entre 2 y 32.")

    source_url = make_url(settings.sync_database_url)
    if source_url.database == database_name:
        raise RuntimeError("La base de concurrencia no puede ser la base operativa.")
    target_url = source_url.set(database=database_name)
    engine = create_engine(target_url, pool_size=workers + 2, max_overflow=0)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    with engine.connect() as connection:
        tables = {
            row[0]
            for row in connection.execute(
                text(
                    "select tablename from pg_tables where schemaname='public' "
                    "and tablename in ('bim_cde_collaboration_presences', "
                    "'bim_cde_collaboration_events')"
                )
            )
        }
    if tables != {"bim_cde_collaboration_presences", "bim_cde_collaboration_events"}:
        raise RuntimeError("Ejecute primero validate_bim_postgresql.py sobre la misma base.")

    suffix = uuid4().hex[:10]
    setup = SessionLocal()
    company_id = project_id = user_id = second_user_id = None
    try:
        company = Empresa(
            nombre=f"BIM Concurrency {suffix}",
            ruc=f"9{suffix[:9]}",
            proy_prefijo="BIMC",
            proy_periodo="2026",
            proy_secuencial=1,
            proy_secuencial_size=3,
        )
        setup.add(company)
        setup.flush()
        project = Proyecto(
            nombre="CDE concurrente",
            codigo_root=f"CDE-{suffix}",
            revision=1,
            empresa_id=company.id,
        )
        user = Usuario(
            email=f"cde-{suffix}@example.com",
            hashed_password="x",
            nombre_completo="Coordinador Concurrente",
            empresa_id=company.id,
            rol="coordinador",
            activo=True,
        )
        second_user = Usuario(
            email=f"cde-second-{suffix}@example.com",
            hashed_password="x",
            nombre_completo="Revisor Concurrente",
            empresa_id=company.id,
            rol="usuario",
            activo=True,
        )
        setup.add_all([project, user, second_user])
        setup.commit()
        company_id, project_id = company.id, project.id
        user_id, second_user_id = user.id, second_user.id

        barrier = Barrier(workers)
        shared_payload = BimCdePresenceHeartbeat(
            session_key=f"shared-{suffix}",
            workspace="coordination",
            context={"tool": "reviews"},
        )

        def concurrent_heartbeat() -> int:
            session = SessionLocal()
            try:
                barrier.wait(timeout=15)
                return heartbeat_presence(
                    session,
                    project_id=project_id,
                    company_id=company_id,
                    user_id=user_id,
                    payload=shared_payload,
                )["id"]
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=workers) as executor:
            presence_ids = list(executor.map(lambda _index: concurrent_heartbeat(), range(workers)))
        if len(set(presence_ids)) != 1:
            raise RuntimeError("Los heartbeats concurrentes crearon presencias distintas.")

        heartbeat_presence(
            setup,
            project_id=project_id,
            company_id=company_id,
            user_id=second_user_id,
            payload=BimCdePresenceHeartbeat(
                session_key=f"reviewer-{suffix}",
                workspace="viewer",
                context={"global_id": "GUID-CONCURRENT-001"},
            ),
        )
        active = list_active_presences(
            setup,
            project_id=project_id,
            company_id=company_id,
            current_user_id=user_id,
        )
        if len(active) != 2:
            raise RuntimeError(f"Se esperaban 2 sesiones activas y se obtuvieron {len(active)}.")

        initial_feed = list_collaboration_events(
            setup,
            project_id=project_id,
            company_id=company_id,
            after_id=0,
            limit=100,
        )
        joined = [event for event in initial_feed["events"] if event["event_type"] == "presence.joined"]
        if len(joined) != 2:
            raise RuntimeError(f"El feed contiene {len(joined)} uniones; se esperaban 2.")

        shared_presence = setup.query(BimCdeCollaborationPresence).filter_by(
            empresa_id=company_id,
            proyecto_id=project_id,
            usuario_id=user_id,
            session_key=shared_payload.session_key,
        ).one()
        shared_presence.last_seen_at = datetime.now(timezone.utc) - timedelta(minutes=2)
        setup.commit()
        if len(list_active_presences(
            setup,
            project_id=project_id,
            company_id=company_id,
            current_user_id=user_id,
        )) != 1:
            raise RuntimeError("La expiracion no retiro solo la sesion obsoleta.")

        heartbeat_presence(
            setup,
            project_id=project_id,
            company_id=company_id,
            user_id=user_id,
            payload=shared_payload,
        )
        reconnected = list_active_presences(
            setup,
            project_id=project_id,
            company_id=company_id,
            current_user_id=user_id,
        )
        if len(reconnected) != 2:
            raise RuntimeError("La sesion expirada no se recupero mediante heartbeat.")

        heartbeat_presence(
            setup,
            project_id=project_id,
            company_id=company_id,
            user_id=user_id,
            payload=BimCdePresenceHeartbeat(
                session_key=shared_payload.session_key,
                workspace="viewer",
                context={"global_id": "GUID-RECONNECTED-002"},
            ),
        )
        delta = list_collaboration_events(
            setup,
            project_id=project_id,
            company_id=company_id,
            after_id=initial_feed["cursor"],
            limit=100,
        )
        if [event["event_type"] for event in delta["events"]] != ["presence.context_changed"]:
            raise RuntimeError("El cursor no recupero exactamente el cambio posterior a la reconexion.")

        final_feed = list_collaboration_events(
            setup,
            project_id=project_id,
            company_id=company_id,
            after_id=0,
            limit=100,
        )
        final_joined = [event for event in final_feed["events"] if event["event_type"] == "presence.joined"]
        if len(final_joined) != 2:
            raise RuntimeError("La reconexion duplico eventos presence.joined.")

        print(
            "BIM_CDE_CONCURRENCY_OK "
            f"workers={workers} unique_shared_presence=1 active_sessions=2 "
            f"joined_events={len(final_joined)} delta_events={len(delta['events'])} "
            "expiry=true reconnect=true cursor=true"
        )
    finally:
        setup.rollback()
        if company_id is not None:
            setup.query(BimCdeCollaborationEvent).filter_by(empresa_id=company_id).delete(
                synchronize_session=False
            )
            setup.query(BimCdeCollaborationPresence).filter_by(empresa_id=company_id).delete(
                synchronize_session=False
            )
            if project_id is not None:
                setup.query(Proyecto).filter_by(id=project_id).delete(synchronize_session=False)
            user_ids = [item for item in (user_id, second_user_id) if item is not None]
            if user_ids:
                setup.query(Usuario).filter(Usuario.id.in_(user_ids)).delete(synchronize_session=False)
            setup.query(Empresa).filter_by(id=company_id).delete(synchronize_session=False)
            setup.commit()
        setup.close()
        engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", default="giproy_bim_test")
    parser.add_argument("--workers", type=int, default=12)
    args = parser.parse_args()
    validate(args.database, args.workers)


if __name__ == "__main__":
    main()
