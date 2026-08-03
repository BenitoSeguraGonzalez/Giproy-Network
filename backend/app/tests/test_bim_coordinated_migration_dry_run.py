import ast
from pathlib import Path
import subprocess
import sys

from scripts.dry_run_bim_coordinated_migration import (
    build_safety_manifest,
    migration_manifest,
    normalize_reference,
)


def test_project_reference_accepts_canonical_hash_and_whitespace():
    assert normalize_reference("  #SantiagoBermeo-2026-001  ") == "SantiagoBermeo-2026-001"
    assert normalize_reference("SantiagoBermeo-2026-001") == "SantiagoBermeo-2026-001"


def test_dry_run_script_contains_no_database_mutation_calls():
    script = Path(__file__).parents[2] / "scripts" / "dry_run_bim_coordinated_migration.py"
    tree = ast.parse(script.read_text(encoding="utf-8"))
    forbidden = {"add", "add_all", "bulk_save_objects", "commit", "delete", "execute", "flush", "merge"}
    called = {
        node.func.attr
        for node in ast.walk(tree)
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
    }
    assert called.isdisjoint(forbidden)


def test_safety_manifest_is_deterministic_and_requires_isolated_restore():
    inputs = {
        "project": {"id": 7, "code": "SantiagoBermeo-2026-001", "revision": 0},
        "company": {"id": 3, "name": "Santiago Bermeo", "use_omniclass": False},
        "inventory": {"budgets": [{"id": 13}], "schedules": [{"id": 1}], "bim_models": [{"id": 1}]},
        "schema": {"ready": False, "missing_tables": ["coordination_links"]},
        "proposed_actions": [{"action": "enable_tenant_omniclass"}],
    }
    first = build_safety_manifest(**inputs)
    second = build_safety_manifest(**inputs)

    assert first == second
    assert len(first["plan_fingerprint"]) == 64
    assert first["idempotency"]["key"] == second["idempotency"]["key"]
    assert first["backup"] == {
        "scope": "empresa_completa",
        "required_before_write": True,
        "format": "application/vnd.giproy.company-backup",
        "restore_validation_required": True,
        "restore_target": "copia_aislada",
    }
    assert first["write_operations"] == 0


def test_coordinated_migration_manifest_has_existing_hashed_files():
    manifest = migration_manifest()

    assert [item["filename"] for item in manifest] == [
        "de2058a1b2c3_project_capabilities_audit.py",
        "de2059a1b2c3_bim_coordination_core.py",
        "de2060a1b2c3_coordination_import_staging.py",
        "de2061a1b2c3_bim_activity_budget_line.py",
        "de2062a1b2c3_audit_hash_chain.py",
        "de2063a1b2c3_budget_coordination_metadata.py",
        "de2064a1b2c3_bim_reconciliation_decisions.py",
    ]
    assert all(len(item["sha256"]) == 64 and item["size_bytes"] > 0 for item in manifest)


def test_script_direct_entrypoint_can_load_backend_package():
    script = Path(__file__).parents[2] / "scripts" / "dry_run_bim_coordinated_migration.py"
    result = subprocess.run(
        [sys.executable, str(script), "--help"],
        cwd=script.parents[1],
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert "--project" in result.stdout
