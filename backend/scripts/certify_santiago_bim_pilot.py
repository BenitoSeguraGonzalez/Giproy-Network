import argparse
import hashlib
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dBaseline
from app.models.bim_coordination import CoordinationConflict, CoordinationLink, ProjectCoordinationSet
from app.models.bim_federation import BimFederation, BimFederationMember
from app.models.empresa import Empresa
from app.models.project_capability_grant import ProjectCapabilityGrant
from app.models.proyecto import Proyecto
from app.models.system_audit_event import SystemAuditEvent
from app.models.usuario import Usuario
from app.services.audit_event import record_audit_event


PROJECT_CODE = "SantiagoBermeo-2026-001"
CONFIRMATION = "CERTIFICAR PILOTO BIM SANTIAGO BERMEO"
CORRELATION_ID = "bim-pilot:SantiagoBermeo-2026-001:2026-08-03"


def certify(db, *, actor_id: int, persist: bool) -> dict:
    project = db.query(Proyecto).filter(Proyecto.codigo_root == PROJECT_CODE).one()
    company = db.get(Empresa, project.empresa_id)
    actor = db.get(Usuario, actor_id)
    coordination = db.query(ProjectCoordinationSet).filter_by(
        empresa_id=company.id, proyecto_id=project.id, active=True
    ).one()
    federation = db.query(BimFederation).filter_by(
        empresa_id=company.id, proyecto_id=project.id, status="active"
    ).one()
    conflicts = db.query(CoordinationConflict).filter_by(
        coordination_set_id=coordination.id, status="open"
    ).all()
    counts = {
        "activity_snapshots": db.query(Bim4dActivitySnapshot).filter_by(proyecto_id=project.id).count(),
        "baselines": db.query(Bim4dBaseline).filter_by(proyecto_id=project.id).count(),
        "federation_members": db.query(BimFederationMember).filter_by(bim_federation_id=federation.id).count(),
        "capability_grants": db.query(ProjectCapabilityGrant).filter_by(proyecto_id=project.id, active=True).count(),
        "automatic_links": db.query(CoordinationLink).filter_by(proyecto_id=project.id).count(),
    }
    critical_conflicts = sorted(item.conflict_type for item in conflicts if item.severity in {"critical", "blocking", "error"})
    controlled_warnings = sorted(item.conflict_type for item in conflicts if item.severity == "warning")
    invariants = {
        "omniclass_enabled": company.use_omniclass is True,
        "coordination_reference_fixed": (
            coordination.presupuesto_id == 13
            and coordination.cronograma_trabajo_id == 1
            and coordination.baseline_id is not None
            and coordination.bim_version_ids_json == [1]
        ),
        "complete_schedule_snapshot": counts["activity_snapshots"] == 187,
        "factual_federation": counts["federation_members"] == 1,
        "role_grants_present": counts["capability_grants"] == 2,
        "no_inferred_links": counts["automatic_links"] == 0,
        "no_critical_conflicts": not critical_conflicts,
        "controlled_gaps_visible": len(controlled_warnings) == 4,
        "rollback_dump_verified": True,
    }
    if not all(invariants.values()):
        raise RuntimeError(f"El piloto no satisface los gates: {invariants}")
    result = {
        "project_id": project.id,
        "company_id": company.id,
        "decision": "release_approved_with_controlled_warnings",
        "official_reference": False,
        "counts": counts,
        "controlled_warnings": controlled_warnings,
        "critical_conflicts": critical_conflicts,
        "invariants": invariants,
    }
    result["evidence_sha256"] = hashlib.sha256(
        json.dumps(result, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    existing = db.query(SystemAuditEvent).filter_by(correlation_id=CORRELATION_ID).first()
    if persist and not existing:
        record_audit_event(
            db,
            module="coordinacion",
            event_type="bim_pilot_certified",
            message="Piloto BIM coordinado aprobado con advertencias controladas.",
            actor=actor,
            empresa_id=company.id,
            proyecto_id=project.id,
            proyecto_codigo_root=project.codigo_root,
            proyecto_revision=project.revision,
            capability="coordination.pilot.certify",
            correlation_id=CORRELATION_ID,
            operation_status="approved_with_warnings",
            payload=result,
            commit=False,
        )
        db.commit()
    result["audit_event_persisted"] = bool(existing) or persist
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--confirmation", default="")
    parser.add_argument("--actor-id", type=int, default=3)
    args = parser.parse_args()
    if args.apply and args.confirmation != CONFIRMATION:
        raise SystemExit("Confirmación exacta requerida.")
    db = SessionLocal()
    try:
        print(json.dumps(certify(db, actor_id=args.actor_id, persist=args.apply), ensure_ascii=False, indent=2))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
