"""Read-only preflight for the coordinated BIM migration.

This command never writes. It produces the evidence required before Alembic and
pilot data changes are authorized and applied in a separate operation.
"""

import argparse
import hashlib
import json
from pathlib import Path
import sys

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import inspect

from app.core.database import SessionLocal
from app.models.bim_model import BimModel
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion


COORDINATED_MIGRATIONS = (
    "de2058a1b2c3_project_capabilities_audit.py",
    "de2059a1b2c3_bim_coordination_core.py",
    "de2060a1b2c3_coordination_import_staging.py",
    "de2061a1b2c3_bim_activity_budget_line.py",
    "de2062a1b2c3_audit_hash_chain.py",
    "de2063a1b2c3_budget_coordination_metadata.py",
    "de2064a1b2c3_bim_reconciliation_decisions.py",
)


def stable_fingerprint(payload: dict) -> str:
    serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def migration_manifest() -> list[dict]:
    versions_dir = Path(__file__).parents[1] / "alembic" / "versions"
    manifest = []
    for filename in COORDINATED_MIGRATIONS:
        path = versions_dir / filename
        content = path.read_bytes()
        manifest.append({
            "filename": filename,
            "sha256": hashlib.sha256(content).hexdigest(),
            "size_bytes": len(content),
        })
    return manifest


def build_safety_manifest(*, project: dict, company: dict, inventory: dict, schema: dict, proposed_actions: list[dict]) -> dict:
    immutable_plan = {
        "contract_version": 1,
        "project": project,
        "company": company,
        "inventory": inventory,
        "schema": schema,
        "proposed_actions": proposed_actions,
        "migrations": migration_manifest(),
    }
    return {
        "contract_version": 1,
        "plan_fingerprint": stable_fingerprint(immutable_plan),
        "migrations": immutable_plan["migrations"],
        "backup": {
            "scope": "empresa_completa",
            "required_before_write": True,
            "format": "application/vnd.giproy.company-backup",
            "restore_validation_required": True,
            "restore_target": "copia_aislada",
        },
        "idempotency": {
            "key": f'bim-coordinated-v1:{project["id"]}:{stable_fingerprint(immutable_plan)}',
            "second_dry_run_must_match_fingerprint": True,
        },
        "write_operations": 0,
    }


def normalize_reference(value: str) -> str:
    return (value or "").strip().lstrip("#")


def run(project_reference: str) -> dict:
    reference = normalize_reference(project_reference)
    db = SessionLocal()
    try:
        project = db.query(Proyecto).filter(
            (Proyecto.codigo == reference) | (Proyecto.codigo_root == reference)
        ).first()
        if not project:
            return {"ok": False, "mode": "dry_run", "project_reference": reference, "errors": ["project_not_found"]}
        company = db.query(Empresa).filter(Empresa.id == project.empresa_id).one()
        budgets = db.query(Presupuesto).filter(Presupuesto.proyecto_id == project.id).order_by(Presupuesto.id).all()
        schedules = db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id == project.id).order_by(CronogramaTrabajo.id).all()
        models = db.query(BimModel).filter(BimModel.proyecto_id == project.id).order_by(BimModel.id).all()
        budget_rows = []
        total_lines = 0
        classified_lines = 0
        for budget in budgets:
            lines = db.query(PresupuestoDetalle.id, PresupuestoDetalle.omniclass_codigo).filter(PresupuestoDetalle.presupuesto_id == budget.id).all()
            line_count = len(lines)
            line_classified = sum(bool(line.omniclass_codigo) for line in lines)
            total_lines += line_count
            classified_lines += line_classified
            budget_rows.append({
                "id": budget.id, "revision": budget.revision, "description": budget.descripcion,
                "status": budget.estado, "total": float(budget.total or 0),
                "line_count": line_count, "omniclass_line_count": line_classified,
            })
        schedule_rows = []
        for schedule in schedules:
            data = schedule.schedule_data or {}
            task_keys = [key for key in data if key != "__config__"]
            schedule_rows.append({
                "id": schedule.id, "budget_id": schedule.presupuesto_id,
                "task_count": len(task_keys), "has_config": "__config__" in data,
            })
        model_rows = [{
            "id": model.id, "name": model.nombre, "discipline": model.disciplina,
            "active": model.activo,
            "versions": [{"id": version.id, "label": version.version_label, "status": version.status, "active": version.is_active} for version in model.versions],
        } for model in models]
        tables = set(inspect(db.bind).get_table_names())
        required_tables = {
            "project_capability_grants", "project_coordination_sets", "coordination_links",
            "coordination_proposals", "coordination_conflicts", "bim_classification_resolutions",
            "coordination_import_stages",
        }
        proposed = []
        if not company.use_omniclass:
            proposed.append({"action": "enable_tenant_omniclass", "company_id": company.id, "reason": "BIM coordinated default"})
        proposed.append({
            "action": "create_coordination_set",
            "project_id": project.id,
            "budget_id": budgets[0].id if len(budgets) == 1 else None,
            "budget_revision": budgets[0].revision if len(budgets) == 1 else None,
            "schedule_id": schedules[0].id if len(schedules) == 1 else None,
            "bim_version_ids": [version.id for model in models for version in model.versions if version.is_active],
            "requires_review": not (len(budgets) == 1 and len(schedules) == 1 and any(model.versions for model in models)),
        })
        proposed.append({
            "action": "preserve_source_classifications",
            "budget_lines_total": total_lines,
            "budget_lines_with_omniclass": classified_lines,
            "unclassified_budget_lines": total_lines - classified_lines,
            "automatic_master_resolution": False,
        })
        project_payload = {"id": project.id, "code": project.codigo, "code_root": project.codigo_root, "revision": project.revision, "company_id": project.empresa_id}
        company_payload = {"id": company.id, "name": company.nombre, "use_omniclass": company.use_omniclass}
        inventory_payload = {
            "budgets": budget_rows, "schedules": schedule_rows, "bim_models": model_rows,
            "project_assignments": db.query(ProyectoAsignacion).filter(ProyectoAsignacion.proyecto_id == project.id).count(),
        }
        schema_payload = {"ready": required_tables <= tables, "missing_tables": sorted(required_tables - tables)}
        safety_manifest = build_safety_manifest(
            project=project_payload,
            company=company_payload,
            inventory=inventory_payload,
            schema=schema_payload,
            proposed_actions=proposed,
        )
        return {
            "ok": True,
            "mode": "dry_run",
            "writes_performed": 0,
            "project": project_payload,
            "company": company_payload,
            "inventory": inventory_payload,
            "schema": schema_payload,
            "proposed_actions": proposed,
            "safety_manifest": safety_manifest,
            "gates": {
                "single_project_revision": project.revision == 0,
                "single_budget": len(budgets) == 1,
                "single_schedule": len(schedules) == 1,
                "has_active_bim_version": any(version.is_active for model in models for version in model.versions),
                "no_automatic_links_without_evidence": True,
            },
        }
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", default="#SantiagoBermeo-2026-001")
    args = parser.parse_args()
    print(json.dumps(run(args.project), ensure_ascii=False, indent=2, sort_keys=True))
