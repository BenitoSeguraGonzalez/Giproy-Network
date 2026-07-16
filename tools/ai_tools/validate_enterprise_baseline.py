"""Run the conservative enterprise validation baseline for GiProy Network.

This helper is intentionally limited to validation. It does not mutate source
code, start services, run migrations, or touch production data.
"""

from __future__ import annotations

import argparse
import compileall
import importlib
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


def add_result(results: list[CheckResult], name: str, ok: bool, detail: str) -> None:
    results.append(CheckResult(name=name, ok=ok, detail=detail))


def check_json(root: Path, results: list[CheckResult]) -> None:
    for relative in (
        "docs/project_state.json",
        "docs/runtime/WORK_MODE_STATE.json",
        "docs/repo_hygiene_inventory.json",
        "docs/logging_inventory.json",
        "docs/frontend_dependency_inventory.json",
        "docs/frontend_size_inventory.json",
    ):
        path = root / relative
        try:
            with path.open("r", encoding="utf-8") as handle:
                json.load(handle)
        except Exception as exc:  # pragma: no cover - diagnostic path
            add_result(results, f"json:{relative}", False, str(exc))
        else:
            add_result(results, f"json:{relative}", True, "valid JSON")


def check_backend_compile(root: Path, results: list[CheckResult]) -> None:
    ok = compileall.compile_dir(str(root / "backend" / "app"), quiet=1)
    add_result(results, "backend:compileall", ok, "backend/app")


def check_fastapi_import(root: Path, results: list[CheckResult]) -> None:
    backend_path = str(root / "backend")
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)
    try:
        importlib.import_module("app.main")
    except Exception as exc:  # pragma: no cover - diagnostic path
        add_result(results, "backend:import app.main", False, str(exc))
    else:
        add_result(results, "backend:import app.main", True, "import OK")


def run_command(
    root: Path,
    results: list[CheckResult],
    name: str,
    command: list[str],
    cwd: Path,
) -> None:
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
    except FileNotFoundError as exc:
        add_result(results, name, False, f"command not found: {exc}")
        return

    output_tail = "\n".join(completed.stdout.splitlines()[-12:])
    detail = output_tail or f"exit code {completed.returncode}"
    add_result(results, name, completed.returncode == 0, detail)


def resolve_command(env_name: str, command_name: str, windows_candidates: tuple[str, ...]) -> str:
    configured = os.environ.get(env_name)
    if configured:
        return configured

    discovered = shutil.which(command_name)
    if discovered:
        return discovered

    if os.name == "nt":
        for candidate in windows_candidates:
            if Path(candidate).exists():
                return candidate

    return command_name


def check_frontend(root: Path, results: list[CheckResult]) -> None:
    frontend = root / "frontend"
    npm = resolve_command(
        "NPM_CMD",
        "npm",
        (
            r"C:\Program Files\nodejs\npm.cmd",
            r"C:\Program Files (x86)\nodejs\npm.cmd",
        ),
    )
    node = resolve_command(
        "NODE_CMD",
        "node",
        (
            r"C:\Program Files\nodejs\node.exe",
            r"C:\Program Files (x86)\nodejs\node.exe",
        ),
    )
    run_command(root, results, "frontend:npm run build", [npm, "run", "build"], frontend)
    run_command(
        root,
        results,
        "frontend:smoke route lazy boundary",
        [node, "scripts/smoke-classic-route-lazy-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke API boundaries",
        [node, "scripts/smoke-classic-api-boundaries.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke admin config email API",
        [node, "scripts/smoke-classic-admin-config-email-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke SaaS empresas boundary",
        [node, "scripts/smoke-classic-saas-empresas-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke SaaS settings migration",
        [node, "scripts/smoke-classic-saas-settings-migration.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke SRI RUC registration",
        [node, "scripts/smoke-classic-sri-ruc-registration.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke company alias display",
        [node, "scripts/smoke-classic-company-alias-display.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke company logo",
        [node, "scripts/smoke-classic-company-logo-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke ProjectManager API",
        [node, "scripts/smoke-classic-project-manager-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Formula Polinomica API",
        [node, "scripts/smoke-classic-formula-polinomica-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Community API",
        [node, "scripts/smoke-classic-community-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Marketplace Admin API",
        [node, "scripts/smoke-classic-marketplace-admin-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Equipo API",
        [node, "scripts/smoke-classic-equipo-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Presupuesto API",
        [node, "scripts/smoke-classic-presupuesto-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Cronogramas API",
        [node, "scripts/smoke-classic-cronogramas-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke BasesTrabajo API",
        [node, "scripts/smoke-classic-bases-trabajo-api-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke DatosProyecto logging",
        [node, "scripts/smoke-classic-datos-proyecto-logging-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke Proyectos logging",
        [node, "scripts/smoke-classic-proyectos-logging-boundary.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke no BIM",
        [node, "scripts/smoke-classic-no-bim-contamination.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke tenant context",
        [node, "scripts/smoke-classic-superadmin-tenant-context.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke hierarchy PDF layout",
        [node, "scripts/smoke-classic-hierarchy-pdf-layout.mjs"],
        frontend,
    )
    run_command(
        root,
        results,
        "frontend:smoke precios unitarios UI",
        [node, "scripts/smoke-classic-precios-unitarios-ui-guards.mjs"],
        frontend,
    )


def check_frontend_architecture(root: Path, results: list[CheckResult]) -> None:
    run_command(
        root,
        results,
        "frontend:architecture guard",
        [sys.executable, "tools/ai_tools/validate_frontend_architecture.py"],
        root,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--include-frontend",
        action="store_true",
        help="Also run npm build and the classic no-BIM smoke.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repository_root()
    results: list[CheckResult] = []

    check_json(root, results)
    check_frontend_architecture(root, results)
    check_backend_compile(root, results)
    check_fastapi_import(root, results)
    if args.include_frontend:
        check_frontend(root, results)

    for result in results:
        status = "OK" if result.ok else "FAIL"
        print(f"[{status}] {result.name}: {result.detail}")

    return 0 if all(result.ok for result in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
