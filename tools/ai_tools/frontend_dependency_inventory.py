"""Generate a conservative frontend dependency inventory for GiProy Network.

The tool is read-only over frontend source files and writes only the requested
JSON snapshot. It helps future sessions avoid broad manual searches before
touching API clients, tenant handling or frontend modularization.
"""

from __future__ import annotations

import argparse
import json
import os
import re
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

SOURCE_SUFFIXES = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
}

API_DIRECT_PATTERN = re.compile(
    r"\b(?:api|axios)\.(?:get|post|put|delete|patch)\s*\(|\bfetch\s*\("
)
TENANT_PATTERN = re.compile(
    r"\b(?:empresa_id|empresaId|selectedEmpresa|user\?\.empresa_id|withTenantConfig|withTenantParams|withoutTenant|skipTenant)\b"
)
BIM_PATTERN = re.compile(r"\b(?:Bim|BIM|bim)\b")
LAZY_PATTERN = re.compile(r"\b(?:lazyWithChunkRecovery|React\.lazy|lazy)\s*\(")


@dataclass
class Category:
    description: str
    count: int = 0
    samples: list[dict[str, object]] = field(default_factory=list)

    def add(self, path: str, line: int, text: str) -> None:
        self.count += 1
        if len(self.samples) < MAX_SAMPLES:
            self.samples.append(
                {
                    "path": path,
                    "line": line,
                    "text": text.strip()[:220],
                }
            )


def repository_root() -> Path:
    return Path(__file__).resolve().parents[2]


def rel_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def should_skip_dir(path: Path, root: Path) -> bool:
    relative = rel_path(path, root) if path != root else ""
    parts = set(Path(relative).parts)
    return bool(parts & IGNORED_DIR_PARTS)


def iter_frontend_source_files(root: Path) -> Iterable[Path]:
    source_root = root / "frontend" / "src"
    for current_root, dirs, files in os.walk(source_root):
        current = Path(current_root)
        dirs[:] = [
            name
            for name in sorted(dirs)
            if not should_skip_dir(current / name, root)
        ]
        for filename in sorted(files):
            path = current / filename
            if path.suffix.lower() in SOURCE_SUFFIXES:
                yield path


def zone_for(relative: str) -> str:
    parts = Path(relative).parts
    if len(parts) >= 3 and parts[0] == "frontend" and parts[1] == "src":
        return parts[2]
    return "other"


def build_inventory(root: Path) -> dict[str, object]:
    categories = {
        "direct_api_calls_outside_api": Category(
            "api/axios/fetch calls outside frontend/src/api that need migration review."
        ),
        "tenant_references": Category(
            "Tenant-related references that must not be changed without focused validation."
        ),
        "bim_references": Category(
            "BIM references expected to stay isolated from the classic layer."
        ),
        "lazy_boundaries": Category(
            "Lazy-loading boundaries already present in the frontend."
        ),
    }

    scanned_files = 0
    scanned_lines = 0
    file_counts_by_zone: dict[str, int] = {}
    largest_files: list[dict[str, object]] = []
    api_clients: list[str] = []

    api_root = root / "frontend" / "src" / "api"
    if api_root.exists():
        api_clients = sorted(
            rel_path(path, root)
            for path in api_root.iterdir()
            if path.is_file() and path.suffix.lower() in SOURCE_SUFFIXES
        )

    for path in iter_frontend_source_files(root):
        scanned_files += 1
        relative = rel_path(path, root)
        zone = zone_for(relative)
        file_counts_by_zone[zone] = file_counts_by_zone.get(zone, 0) + 1
        largest_files.append(
            {
                "path": relative,
                "size_kb": round(path.stat().st_size / 1024, 1),
            }
        )

        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue

        outside_api = not relative.startswith("frontend/src/api/")
        for line_number, line in enumerate(lines, start=1):
            scanned_lines += 1
            if outside_api and API_DIRECT_PATTERN.search(line):
                categories["direct_api_calls_outside_api"].add(relative, line_number, line)
            if TENANT_PATTERN.search(line):
                categories["tenant_references"].add(relative, line_number, line)
            if BIM_PATTERN.search(line):
                categories["bim_references"].add(relative, line_number, line)
            if LAZY_PATTERN.search(line):
                categories["lazy_boundaries"].add(relative, line_number, line)

    largest_files = sorted(largest_files, key=lambda item: item["size_kb"], reverse=True)[:20]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "GIPROY CLASICO",
        "scope": "frontend dependency inventory; read-only source scan; no product code changes",
        "root": root.as_posix(),
        "totals": {
            "scanned_files": scanned_files,
            "scanned_lines": scanned_lines,
            "api_clients": len(api_clients),
        },
        "file_counts_by_zone": dict(sorted(file_counts_by_zone.items())),
        "largest_files": largest_files,
        "api_clients": api_clients,
        "categories": {
            name: {
                "description": category.description,
                "count": category.count,
                "samples": category.samples,
            }
            for name, category in categories.items()
        },
        "policy": {
            "do_not_change_automatically": [
                "authentication and refresh flow",
                "tenant injection",
                "Settings company/user administration",
                "ProjectManager project operations",
                "Gantt/Cronogramas",
                "Presupuestos",
                "Community",
                "Marketplace",
                "BIM code or UX in MODO 1",
            ],
            "review_notes": [
                "Direct API call hits are candidates for domain clients, not automatic defects.",
                "External fetch calls such as maps/geocoding may intentionally stay outside GiProy API clients.",
                "BIM references are expected only inside isolated BIM routes, APIs, hooks and components.",
            ],
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="docs/frontend_dependency_inventory.json",
        help="Path to write the JSON snapshot, relative to repository root.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repository_root()
    output = root / args.output
    inventory = build_inventory(root)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(inventory, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"frontend dependency inventory written to {output.relative_to(root).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
