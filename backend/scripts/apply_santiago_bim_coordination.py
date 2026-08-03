import argparse
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.bim_4d import Bim4dActivitySnapshot, Bim4dBaseline, Bim4dBaselineActivity, Bim4dDependencySnapshot
from app.models.bim_coordination import CoordinationConflict, ProjectCoordinationSet
from app.models.bim_federation import BimFederation, BimFederationMember
from app.models.bim_model import BimModel
from app.models.bim_model_version import BimModelVersion
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.project_capability_grant import ProjectCapabilityGrant
from app.models.proyecto import Proyecto
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.usuario import Usuario
from app.services.audit_event import record_audit_event
from app.services.project_capability import PROFILE_CAPABILITIES


PROJECT_CODE = "SantiagoBermeo-2026-001"
CONFIRMATION = "APLICAR MIGRACION BIM COORDINADA SANTIAGO BERMEO"


def _date(value):
    parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return parsed


def _fingerprint(result: dict) -> str:
    return hashlib.sha256(json.dumps(result, sort_keys=True, separators=(",", ":"), default=str).encode()).hexdigest()


def apply(db, *, actor_id: int) -> dict:
    project = db.query(Proyecto).filter(Proyecto.codigo_root == PROJECT_CODE).one()
    company = db.query(Empresa).filter(Empresa.id == project.empresa_id).one()
    budget = db.query(Presupuesto).filter(Presupuesto.proyecto_id == project.id).one()
    schedule = db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id == project.id, CronogramaTrabajo.presupuesto_id == budget.id).one()
    versions = db.query(BimModelVersion).join(BimModel).filter(BimModel.proyecto_id == project.id, BimModel.empresa_id == company.id, BimModelVersion.is_active.is_(True)).all()
    if not versions:
        raise RuntimeError("El proyecto no tiene versión BIM activa.")
    actor = db.get(Usuario, actor_id)
    if not actor:
        raise RuntimeError("Actor de migración inexistente.")
    company.use_omniclass = True

    revision = f"project-{project.revision or 0}-schedule-{schedule.id}"
    lines = {str(item.id): item for item in db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == budget.id).all()}
    snapshots = {}
    for source_ref, payload in sorted((schedule.schedule_data or {}).items()):
        if str(source_ref).startswith("__") or not isinstance(payload, dict):
            continue
        existing = db.query(Bim4dActivitySnapshot).filter(
            Bim4dActivitySnapshot.empresa_id == company.id, Bim4dActivitySnapshot.proyecto_id == project.id,
            Bim4dActivitySnapshot.source_kind == "giproy_classic_schedule",
            Bim4dActivitySnapshot.source_ref == str(source_ref), Bim4dActivitySnapshot.snapshot_revision == revision,
        ).first()
        line = lines.get(str(source_ref))
        if not existing:
            existing = Bim4dActivitySnapshot(
                empresa_id=company.id, proyecto_id=project.id, source_kind="giproy_classic_schedule",
                source_ref=str(source_ref), budget_line_id=line.id if line else None,
                snapshot_revision=revision, activity_code=line.codigo_item if line and line.codigo_item else f"ACT-{source_ref}",
                activity_name=line.descripcion if line else f"Actividad {source_ref}",
                planned_start=_date(payload["start_date"]), planned_finish=_date(payload["end_date"]), captured_by=actor.id,
            )
            db.add(existing); db.flush()
        snapshots[str(source_ref)] = existing

    baseline_revision = f"SB-2026-R{project.revision or 0}"
    baseline = db.query(Bim4dBaseline).filter(Bim4dBaseline.empresa_id == company.id, Bim4dBaseline.proyecto_id == project.id, Bim4dBaseline.revision == baseline_revision).first()
    if not baseline:
        baseline = Bim4dBaseline(empresa_id=company.id, proyecto_id=project.id, name="Baseline coordinada inicial", revision=baseline_revision, methodology="giproy_classic_schedule_snapshot", created_by=actor.id)
        db.add(baseline); db.flush()
    existing_members = {row[0] for row in db.query(Bim4dBaselineActivity.activity_snapshot_id).filter(Bim4dBaselineActivity.baseline_id == baseline.id).all()}
    for snapshot in snapshots.values():
        if snapshot.id not in existing_members:
            db.add(Bim4dBaselineActivity(baseline_id=baseline.id, activity_snapshot_id=snapshot.id))

    dependencies_created = 0
    for successor_ref, payload in (schedule.schedule_data or {}).items():
        successor = snapshots.get(str(successor_ref))
        if not successor or not isinstance(payload, dict):
            continue
        for raw in payload.get("dependencies") or payload.get("predecessors") or []:
            predecessor_ref = str(raw.get("id") or raw.get("predecessor_id") or raw) if isinstance(raw, dict) else str(raw)
            predecessor = snapshots.get(predecessor_ref)
            if not predecessor or predecessor.id == successor.id:
                continue
            exists = db.query(Bim4dDependencySnapshot.id).filter(Bim4dDependencySnapshot.baseline_id == baseline.id, Bim4dDependencySnapshot.predecessor_activity_id == predecessor.id, Bim4dDependencySnapshot.successor_activity_id == successor.id, Bim4dDependencySnapshot.dependency_type == "FS").first()
            if not exists:
                db.add(Bim4dDependencySnapshot(baseline_id=baseline.id, predecessor_activity_id=predecessor.id, successor_activity_id=successor.id, dependency_type="FS", lag_days=0)); dependencies_created += 1

    federation = db.query(BimFederation).filter(BimFederation.proyecto_id == project.id, BimFederation.empresa_id == company.id, BimFederation.status == "active").first()
    if not federation:
        federation = BimFederation(proyecto_id=project.id, empresa_id=company.id, nombre="Federación coordinada inicial", revision=1, status="active", justification="Adecuación integral del proyecto de referencia.", created_by=actor.id)
        db.add(federation); db.flush()
    member_versions = {row[0] for row in db.query(BimFederationMember.bim_model_version_id).filter(BimFederationMember.bim_federation_id == federation.id).all()}
    for index, version in enumerate(versions):
        if version.id not in member_versions:
            db.add(BimFederationMember(bim_federation_id=federation.id, bim_model_version_id=version.id, discipline=version.bim_model.disciplina or "General", display_order=index, enabled=True, transform_json={"translation": [0, 0, 0], "rotation_degrees": [0, 0, 0], "scale": [1, 1, 1]}, georeference_json={"crs": "LOCAL", "origin": [0, 0, 0], "units": "m"}))

    coordination = db.query(ProjectCoordinationSet).filter(ProjectCoordinationSet.proyecto_id == project.id, ProjectCoordinationSet.empresa_id == company.id, ProjectCoordinationSet.active.is_(True)).first()
    if not coordination:
        coordination = ProjectCoordinationSet(empresa_id=company.id, proyecto_id=project.id, proyecto_codigo_root=PROJECT_CODE, proyecto_revision=int(project.revision or 0), revision=1, presupuesto_id=budget.id, presupuesto_revision=int(budget.revision or 0), cronograma_trabajo_id=schedule.id, baseline_id=baseline.id, bim_version_ids_json=sorted(version.id for version in versions), process_status="draft", coordination_status="incomplete", omniclass_status="unresolved", official=False, active=True, created_by=actor.id)
        db.add(coordination); db.flush()

    administrators = db.query(Usuario).filter(Usuario.empresa_id == company.id, Usuario.activo.is_(True), Usuario.rol.ilike("administrador")).all()
    for user in administrators:
        grant = db.query(ProjectCapabilityGrant).filter(ProjectCapabilityGrant.empresa_id == company.id, ProjectCapabilityGrant.proyecto_id == project.id, ProjectCapabilityGrant.usuario_id == user.id, ProjectCapabilityGrant.scope_key == "project").first()
        if not grant:
            db.add(ProjectCapabilityGrant(empresa_id=company.id, proyecto_id=project.id, usuario_id=user.id, scope_key="project", profile_code="administrador_bim", capabilities_json=sorted(PROFILE_CAPABILITIES["administrador_bim"]), active=True, granted_by=actor.id))

    conflict_specs = {
        "unclassified_budget_lines": {"severity": "warning", "refs": [item.id for item in lines.values() if not item.omniclass_codigo], "detail": {"count": sum(not item.omniclass_codigo for item in lines.values()), "automatic_resolution": False}},
        "missing_bim_disciplines": {"severity": "warning", "refs": [version.id for version in versions], "detail": {"present_disciplines": sorted({version.bim_model.disciplina or "General" for version in versions}), "required_review": True}},
        "missing_functional_role_assignments": {"severity": "warning", "refs": [user.id for user in administrators], "detail": {"technical_administrators": len(administrators), "business_roles_inferred": False}},
        "unlinked_coordination_entities": {"severity": "warning", "refs": [], "detail": {"budget_lines": len(lines), "activities": len(snapshots), "bim_elements": sum(version.element_count or 0 for version in versions), "automatic_links_created": 0}},
    }
    for conflict_type, spec in conflict_specs.items():
        exists = db.query(CoordinationConflict).filter(CoordinationConflict.coordination_set_id == coordination.id, CoordinationConflict.conflict_type == conflict_type, CoordinationConflict.status == "open").first()
        if not exists:
            db.add(CoordinationConflict(empresa_id=company.id, proyecto_id=project.id, coordination_set_id=coordination.id, conflict_type=conflict_type, severity=spec["severity"], status="open", entity_refs_json=spec["refs"], detail_json=spec["detail"]))

    result = {"project_id": project.id, "company_id": company.id, "omniclass_enabled": True, "budget_id": budget.id, "schedule_id": schedule.id, "snapshot_count": len(snapshots), "baseline_id": baseline.id, "dependencies_created": dependencies_created, "federation_id": federation.id, "federation_member_count": len(versions), "coordination_set_id": coordination.id, "capability_grant_count": len(administrators), "conflict_types": sorted(conflict_specs), "automatic_links_created": 0}
    record_audit_event(db, module="coordinacion", event_type="bim_coordinated_project_migrated", message="Proyecto de referencia adecuado al módulo BIM coordinado.", actor=actor, empresa_id=company.id, proyecto_id=project.id, proyecto_codigo_root=PROJECT_CODE, proyecto_revision=project.revision, capability="coordination.migration.apply", correlation_id=f"bim-migration:{PROJECT_CODE}", operation_status="applied", payload=result, commit=False)
    db.commit()
    result["result_fingerprint"] = _fingerprint(result)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--confirmation", default="")
    parser.add_argument("--actor-id", type=int, default=3)
    args = parser.parse_args()
    if not args.apply:
        print({"mode": "dry_run_only", "project": PROJECT_CODE, "required_confirmation": CONFIRMATION})
        return
    if args.confirmation != CONFIRMATION:
        raise SystemExit("Confirmación exacta requerida.")
    db = SessionLocal()
    try:
        print(apply(db, actor_id=args.actor_id))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
