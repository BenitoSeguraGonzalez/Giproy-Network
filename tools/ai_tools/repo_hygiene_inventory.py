"""Generate a conservative hygiene inventory for GiProy Network.

The tool is read-only over the repository tree. It classifies files that need
review before GitHub/private CI work, but it does not move, delete or rewrite
source files.
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


MAX_SAMPLES = 200

IGNORED_DIR_PARTS = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    "node_modules",
    "dist",
    "build",
}

FORMAL_TEST_PREFIXES = (
    "backend/app/tests/",
    "tools/launcher/tests/",
)

LOOSE_SCRIPT_PREFIXES = (
    "check_",
    "verify_",
    "fix_",
    "tmp_",
    "debug_",
    "test_",
    "migrate_",
    "seed_",
    "audit_",
    "clean_",
    "restart_",
    "inspect_",
)

CRITICAL_SUFFIXES = {
    ".sql",
    ".dump",
}

GENERATED_SUFFIXES = {
    ".db",
    ".sqlite",
    ".sqlite3",
    ".log",
    ".jsonl",
}

ARCHIVE_SUFFIXES = {
    ".gz",
    ".tar",
    ".zip",
    ".7z",
}


@dataclass
class Category:
    risk: str
    description: str
    count: int = 0
    samples: list[dict[str, str]] = field(default_factory=list)

    def add(self, path: str, reason: str) -> None:
        self.count += 1
        if len(self.samples) < MAX_SAMPLES:
            self.samples.append({"path": path, "reason": reason})


def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


def rel_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def should_skip_dir(path: Path, root: Path) -> bool:
    relative = rel_path(path, root) if path != root else ""
    parts = set(Path(relative).parts)
    return bool(parts & IGNORED_DIR_PARTS)


def iter_files(root: Path) -> Iterable[Path]:
    for current_root, dirs, files in os.walk(root):
        current = Path(current_root)
        dirs[:] = [
            name
            for name in sorted(dirs)
            if not should_skip_dir(current / name, root)
        ]
        for filename in sorted(files):
            yield current / filename


def is_formal_test(relative: str) -> bool:
    return relative.startswith(FORMAL_TEST_PREFIXES)


def is_sensitive_name(relative: str, lower_name: str, lower_path: str) -> tuple[bool, str]:
    if relative == "docs/db_credentials.txt":
        return True, "credenciales locales documentadas"
    if "api key" in lower_path or "apikey" in lower_path:
        return True, "nombre de archivo sugiere API key"
    if "token" in lower_name and lower_name.endswith(".txt"):
        return True, "archivo TXT con token en el nombre"
    if "cloudflared-bkp/" in lower_path:
        return True, "backup local de Cloudflared"
    if lower_path.startswith("dbdump/"):
        return True, "dump de base de datos"
    if lower_path.startswith("backups/"):
        return True, "backup local"
    if lower_path.startswith("complementos/"):
        return True, "binario/licencia externa"
    if lower_name in {"auth_session_trace.jsonl", "fatal_errors.log"}:
        return True, "traza local sensible"
    return False, ""


def classify(relative: str, path: Path) -> tuple[str, str] | None:
    lower_path = relative.lower()
    lower_name = path.name.lower()
    suffix = path.suffix.lower()

    sensitive, reason = is_sensitive_name(relative, lower_name, lower_path)
    if sensitive:
        return "critical_sensitive_artifacts", reason

    if suffix in CRITICAL_SUFFIXES:
        return "critical_sensitive_artifacts", "dump o script SQL fuera de migracion formal"

    if any(lower_name.endswith(ext) for ext in ARCHIVE_SUFFIXES):
        return "critical_sensitive_artifacts", "archivo comprimido no fuente"

    if suffix in GENERATED_SUFFIXES:
        return "high_generated_artifacts", "archivo local/generado"

    if lower_path.startswith("tmp/"):
        return "high_generated_artifacts", "artefacto temporal bajo tmp"

    if lower_path.startswith("frontend/tmp_"):
        return "high_generated_artifacts", "artefacto temporal frontend"

    if lower_path.startswith("frontend/") and (
        "lint" in lower_name or lower_name.endswith("harness.html")
    ):
        return "high_generated_artifacts", "salida local de QA/frontend"

    if suffix == ".py" and not is_formal_test(relative):
        if lower_name.startswith(LOOSE_SCRIPT_PREFIXES):
            return "medium_loose_scripts", "script suelto con prefijo operativo/debug"
        if relative.startswith(("backend/scripts/", "scripts/")):
            return "medium_loose_scripts", "script operativo historico"
        if "/" not in relative and lower_name not in {"setup.py"}:
            return "medium_loose_scripts", "script Python en raiz"

    if is_formal_test(relative):
        return "low_formal_tests_and_assets", "prueba formal conservada"

    if lower_path.startswith(("frontend/src/assets/", "frontend/public/", "assets/")):
        return "low_formal_tests_and_assets", "asset productivo o publico"

    return None


def build_inventory(root: Path) -> dict[str, object]:
    categories = {
        "critical_sensitive_artifacts": Category(
            risk="critical",
            description="Credenciales, tokens, dumps, backups, trazas o binarios/licencias externas.",
        ),
        "high_generated_artifacts": Category(
            risk="high",
            description="Artefactos locales, temporales, logs, DB locales o evidencias de QA.",
        ),
        "medium_loose_scripts": Category(
            risk="medium",
            description="Scripts historicos/debug/ops que requieren busqueda de referencias antes de mover.",
        ),
        "low_formal_tests_and_assets": Category(
            risk="low",
            description="Pruebas formales y assets que deben conservarse y validarse si cambian.",
        ),
    }

    scanned = 0
    categorized = 0

    for path in iter_files(root):
        scanned += 1
        relative = rel_path(path, root)
        result = classify(relative, path)
        if result is None:
            continue
        category_name, reason = result
        categories[category_name].add(relative, reason)
        categorized += 1

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "GIPROY CLASICO",
        "scope": "repo hygiene inventory; no code movement; no destructive action",
        "root": root.as_posix(),
        "totals": {
            "scanned_files": scanned,
            "categorized_files": categorized,
            "sample_limit_per_category": MAX_SAMPLES,
        },
        "categories": {
            name: {
                "risk": category.risk,
                "description": category.description,
                "count": category.count,
                "samples": category.samples,
            }
            for name, category in categories.items()
        },
        "rules": {
            "do_not_delete": True,
            "move_only_by_task": True,
            "search_references_before_move": True,
            "validate_bim_non_interference": True,
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--json",
        type=Path,
        default=None,
        help="Optional path to write the inventory JSON.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repository_root()
    inventory = build_inventory(root)

    if args.json:
        output_path = args.json
        if not output_path.is_absolute():
            output_path = root / output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(inventory, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    print(
        "repo_hygiene_inventory: "
        f"{inventory['totals']['categorized_files']} categorized / "
        f"{inventory['totals']['scanned_files']} scanned"
    )
    for name, category in inventory["categories"].items():
        print(f"- {name}: {category['count']} ({category['risk']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
