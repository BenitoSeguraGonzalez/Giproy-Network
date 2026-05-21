"""Generate a conservative logging inventory for GiProy Network.

The tool is read-only over source files and writes only the requested JSON
snapshot. It helps future sessions avoid broad manual searches before touching
logging, prints or frontend console calls.
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
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".ps1",
}

PRODUCT_PREFIXES = (
    "backend/app/",
    "frontend/src/",
)

SCRIPT_PREFIXES = (
    "scripts/",
    "tools/",
    "backend/scripts/",
)

LOG_PATTERNS = {
    "python_print": re.compile(r"\bprint\s*\("),
    "python_logger": re.compile(r"\blogger\.(debug|info|warning|error|exception|critical)\s*\("),
    "frontend_console": re.compile(r"\bconsole\.(log|debug|info|warn|error)\s*\("),
    "powershell_write": re.compile(r"\b(Write-Host|Write-Output|Write-Warning|Write-Error)\b", re.IGNORECASE),
}

SENSITIVE_PATTERNS = {
    "password": re.compile(r"password|contrase", re.IGNORECASE),
    "token": re.compile(r"\btoken\b|jwt|bearer", re.IGNORECASE),
    "authorization": re.compile(r"authorization", re.IGNORECASE),
    "session": re.compile(r"session_id|sid|cookie|device_id", re.IGNORECASE),
    "email": re.compile(r"\bemail\b|correo", re.IGNORECASE),
}


@dataclass
class Category:
    description: str
    count: int = 0
    samples: list[dict[str, object]] = field(default_factory=list)

    def add(self, path: str, line: int, kind: str, text: str, sensitive_hits: list[str]) -> None:
        self.count += 1
        if len(self.samples) < MAX_SAMPLES:
            self.samples.append(
                {
                    "path": path,
                    "line": line,
                    "kind": kind,
                    "sensitive_hits": sensitive_hits,
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


def iter_source_files(root: Path) -> Iterable[Path]:
    for current_root, dirs, files in os.walk(root):
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


def source_zone(relative: str) -> str:
    if relative.startswith("backend/app/"):
        return "backend_product"
    if relative.startswith("frontend/src/"):
        return "frontend_product"
    if relative.startswith(SCRIPT_PREFIXES):
        return "scripts_and_tools"
    return "other_source"


def sensitive_hits(text: str) -> list[str]:
    return [
        name
        for name, pattern in SENSITIVE_PATTERNS.items()
        if pattern.search(text)
    ]


def detect_kind(line: str) -> str | None:
    for name, pattern in LOG_PATTERNS.items():
        if pattern.search(line):
            return name
    return None


def build_inventory(root: Path) -> dict[str, object]:
    categories = {
        "backend_product": Category("Backend app code: endpoints, services, repositories, middleware and core."),
        "frontend_product": Category("Frontend src code: React modules, services, hooks and stores."),
        "scripts_and_tools": Category("CLI scripts, local tools, launchers and maintenance helpers."),
        "other_source": Category("Other source files outside primary product paths."),
    }
    kind_counts: dict[str, int] = {name: 0 for name in LOG_PATTERNS}
    sensitive_counts: dict[str, int] = {name: 0 for name in SENSITIVE_PATTERNS}
    scanned_files = 0
    scanned_lines = 0
    matched_lines = 0

    for path in iter_source_files(root):
        scanned_files += 1
        relative = rel_path(path, root)
        zone = source_zone(relative)
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue

        for line_number, line in enumerate(lines, start=1):
            scanned_lines += 1
            kind = detect_kind(line)
            if kind is None:
                continue
            hits = sensitive_hits(line)
            matched_lines += 1
            kind_counts[kind] += 1
            for hit in hits:
                sensitive_counts[hit] += 1
            categories[zone].add(relative, line_number, kind, line, hits)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "mode": "GIPROY CLASICO",
        "scope": "logging inventory; read-only source scan; no product code changes",
        "root": root.as_posix(),
        "totals": {
            "scanned_files": scanned_files,
            "scanned_lines": scanned_lines,
            "matched_lines": matched_lines,
        },
        "kind_counts": kind_counts,
        "sensitive_term_counts": sensitive_counts,
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
                "authentication",
                "multi-tenant",
                "license middleware",
                "database schema",
                "BIM code or UX in MODO 1",
            ],
            "review_notes": [
                "A sensitive term hit is heuristic context, not proof of leakage.",
                "Scripts and tools may intentionally use stdout as their user interface.",
                "Frontend console cleanup must be done module by module with build and smoke validation.",
            ],
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="docs/logging_inventory.json",
        help="Path to write the JSON snapshot, relative to repository root.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    root = repository_root()
    output = root / args.output
    inventory = build_inventory(root)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    totals = inventory["totals"]
    print(
        "logging_inventory: "
        f"{totals['matched_lines']} matched lines / "
        f"{totals['scanned_lines']} scanned lines / "
        f"{totals['scanned_files']} files"
    )
    print(f"written: {output.relative_to(root).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
