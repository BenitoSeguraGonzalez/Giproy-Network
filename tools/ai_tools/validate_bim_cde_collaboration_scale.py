from __future__ import annotations

import argparse
import sys
from pathlib import Path
from time import perf_counter
from uuid import uuid4

from sqlalchemy import create_engine, func, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from app.core.config import settings  # noqa: E402
from app.models.bim_cde_collaboration import BimCdeCollaborationEvent  # noqa: E402
from app.models.empresa import Empresa  # noqa: E402
from app.models.proyecto import Proyecto  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402
from app.services.bim.cde_collaboration_service import list_collaboration_events  # noqa: E402


EXPECTED_CURSOR_INDEX = "ix_bim_cde_collaboration_events_project_cursor"


def percentile_95(values: list[float]) -> float:
    if not values:
        raise ValueError("Se requiere al menos una medicion.")
    ordered = sorted(values)
    rank = max(0, (95 * len(ordered) + 99) // 100 - 1)
    return ordered[rank]


def plan_index_names(node: dict) -> set[str]:
    names = {node["Index Name"]} if node.get("Index Name") else set()
    for child in node.get("Plans", []):
        names.update(plan_index_names(child))
    return names


def validate(database_name: str, event_count: int, samples: int, max_p95_ms: float) -> None:
    if not database_name.endswith("_test"):
        raise RuntimeError("La base de escala debe terminar en _test.")
    if event_count < 10_000 or event_count > 1_000_000:
        raise RuntimeError("event-count debe estar entre 10000 y 1000000.")
    if samples < 20 or samples > 500:
        raise RuntimeError("samples debe estar entre 20 y 500.")
    if max_p95_ms <= 0:
        raise RuntimeError("max-p95-ms debe ser positivo.")

    source_url = make_url(settings.sync_database_url)
    if source_url.database == database_name:
        raise RuntimeError("La base de escala no puede ser la base operativa.")
    engine = create_engine(source_url.set(database=database_name), pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

    with engine.connect() as connection:
        table_exists = connection.execute(
            text(
                "select exists(select 1 from pg_tables where schemaname='public' "
                "and tablename='bim_cde_collaboration_events')"
            )
        ).scalar_one()
    if not table_exists:
        engine.dispose()
        raise RuntimeError("Ejecute primero validate_bim_postgresql.py sobre la misma base.")

    suffix = uuid4().hex[:10]
    db = SessionLocal()
    company_id = project_id = user_id = decoy_company_id = decoy_project_id = None
    try:
        company = Empresa(
            nombre=f"BIM Scale {suffix}",
            ruc=f"8{suffix[:9]}",
            proy_prefijo="BIMS",
            proy_periodo="2026",
            proy_secuencial=1,
            proy_secuencial_size=3,
        )
        db.add(company)
        db.flush()
        project = Proyecto(
            nombre="CDE escala",
            codigo_root=f"SC-{suffix}",
            revision=1,
            empresa_id=company.id,
        )
        user = Usuario(
            email=f"cde-scale-{suffix}@example.com",
            hashed_password="x",
            nombre_completo="Operador Escala CDE",
            empresa_id=company.id,
            rol="coordinador",
            activo=True,
        )
        db.add_all([project, user])
        db.commit()
        company_id, project_id, user_id = company.id, project.id, user.id

        initial_count = event_count - 100
        for start in range(0, initial_count, 5000):
            size = min(5000, initial_count - start)
            db.bulk_insert_mappings(
                BimCdeCollaborationEvent,
                [
                    {
                        "empresa_id": company_id,
                        "proyecto_id": project_id,
                        "actor_id": user_id,
                        "event_type": "scale.cursor",
                        "entity_type": "scale_probe",
                        "entity_id": start + offset,
                        "summary": "Evento sintetico de certificacion CDE.",
                        "payload_json": {"sequence": start + offset},
                    }
                    for offset in range(size)
                ],
            )
            db.commit()

        cursor = db.query(func.max(BimCdeCollaborationEvent.id)).filter_by(
            empresa_id=company_id,
            proyecto_id=project_id,
        ).scalar()
        decoy_company = Empresa(
            nombre=f"BIM Scale Decoy {suffix}",
            ruc=f"7{suffix[:9]}",
            proy_prefijo="BIMD",
            proy_periodo="2026",
            proy_secuencial=1,
            proy_secuencial_size=3,
        )
        db.add(decoy_company)
        db.flush()
        decoy_project = Proyecto(
            nombre="CDE escala senuelo",
            codigo_root=f"SD-{suffix}",
            revision=1,
            empresa_id=decoy_company.id,
        )
        db.add(decoy_project)
        db.flush()
        decoy_company_id, decoy_project_id = decoy_company.id, decoy_project.id
        db.add(
            BimCdeCollaborationEvent(
                empresa_id=decoy_company_id,
                proyecto_id=decoy_project_id,
                actor_id=None,
                event_type="scale.decoy",
                entity_type="scale_probe",
                entity_id=1,
                summary="Evento senuelo de otro tenant.",
                payload_json={},
            )
        )
        db.bulk_insert_mappings(
            BimCdeCollaborationEvent,
            [
                {
                    "empresa_id": company_id,
                    "proyecto_id": project_id,
                    "actor_id": user_id,
                    "event_type": "scale.cursor",
                    "entity_type": "scale_probe",
                    "entity_id": initial_count + offset,
                    "summary": "Evento sintetico de certificacion CDE.",
                    "payload_json": {"sequence": initial_count + offset},
                }
                for offset in range(100)
            ],
        )
        db.commit()

        seeded = db.query(func.count(BimCdeCollaborationEvent.id)).filter_by(
            empresa_id=company_id,
            proyecto_id=project_id,
        ).scalar()
        if seeded != event_count:
            raise RuntimeError(f"Corpus incompleto: {seeded}/{event_count} eventos.")
        plan_payload = db.execute(
            text(
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "
                "SELECT id FROM bim_cde_collaboration_events "
                "WHERE empresa_id=:company_id AND proyecto_id=:project_id AND id>:cursor "
                "ORDER BY id ASC LIMIT 100"
            ),
            {"company_id": company_id, "project_id": project_id, "cursor": cursor},
        ).scalar_one()
        plan_root = plan_payload[0]["Plan"]
        indexes = plan_index_names(plan_root)
        if EXPECTED_CURSOR_INDEX not in indexes:
            raise RuntimeError(f"El feed no uso el indice compuesto esperado: {sorted(indexes)}.")

        timings_ms = []
        for _ in range(samples):
            started = perf_counter()
            feed = list_collaboration_events(
                db,
                project_id=project_id,
                company_id=company_id,
                after_id=cursor,
                limit=100,
            )
            timings_ms.append((perf_counter() - started) * 1000)
            if len(feed["events"]) != 100 or feed["cursor"] <= cursor:
                raise RuntimeError("El feed incremental no mantuvo limite o cursor monotono.")
            if any(event["event_type"] != "scale.cursor" for event in feed["events"]):
                raise RuntimeError("El feed incremental mezclo otro scope tenant/proyecto.")

        p95_ms = percentile_95(timings_ms)
        if p95_ms > max_p95_ms:
            raise RuntimeError(f"p95={p95_ms:.3f}ms supera el SLO local de {max_p95_ms:.3f}ms.")
        print(
            "BIM_CDE_SCALE_OK "
            f"events={event_count} samples={samples} page=100 "
            f"p95_ms={p95_ms:.3f} max_p95_ms={max_p95_ms:.3f} "
            f"index={EXPECTED_CURSOR_INDEX} tenant_isolation=true cursor=true"
        )
    finally:
        db.rollback()
        if company_id is not None:
            db.query(BimCdeCollaborationEvent).filter_by(empresa_id=company_id).delete(
                synchronize_session=False
            )
            if project_id is not None:
                db.query(Proyecto).filter_by(id=project_id).delete(synchronize_session=False)
            if user_id is not None:
                db.query(Usuario).filter_by(id=user_id).delete(synchronize_session=False)
            db.query(Empresa).filter_by(id=company_id).delete(synchronize_session=False)
            db.commit()
        if decoy_company_id is not None:
            db.query(BimCdeCollaborationEvent).filter_by(empresa_id=decoy_company_id).delete(
                synchronize_session=False
            )
            if decoy_project_id is not None:
                db.query(Proyecto).filter_by(id=decoy_project_id).delete(synchronize_session=False)
            db.query(Empresa).filter_by(id=decoy_company_id).delete(synchronize_session=False)
            db.commit()
        db.close()
        engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", default="giproy_bim_test")
    parser.add_argument("--event-count", type=int, default=100_000)
    parser.add_argument("--samples", type=int, default=60)
    parser.add_argument("--max-p95-ms", type=float, default=150.0)
    args = parser.parse_args()
    validate(args.database, args.event_count, args.samples, args.max_p95_ms)


if __name__ == "__main__":
    main()
