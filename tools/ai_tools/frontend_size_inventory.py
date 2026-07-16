from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
FRONTEND_SRC = ROOT / "frontend" / "src"
OUTPUT_JSON = ROOT / "docs" / "frontend_size_inventory.json"

TEXT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
    ".json",
    ".mjs",
}


def is_text_source(path: Path) -> bool:
    if path.suffix.lower() not in TEXT_EXTENSIONS:
        return False
    parts = set(path.parts)
    return "node_modules" not in parts and "dist" not in parts


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def count_lines(path: Path) -> int:
    try:
        return len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
    except OSError:
        return 0


def classify(path: Path) -> str:
    rel_parts = path.relative_to(FRONTEND_SRC).parts
    if not rel_parts:
        return "root"
    return rel_parts[0]


def main() -> None:
    files = []
    totals_by_area: dict[str, dict[str, int]] = {}

    for path in FRONTEND_SRC.rglob("*"):
        if not path.is_file() or not is_text_source(path):
            continue
        area = classify(path)
        size_bytes = path.stat().st_size
        line_count = count_lines(path)
        files.append(
            {
                "path": relative(path),
                "area": area,
                "bytes": size_bytes,
                "lines": line_count,
            }
        )
        totals_by_area.setdefault(area, {"files": 0, "bytes": 0, "lines": 0})
        totals_by_area[area]["files"] += 1
        totals_by_area[area]["bytes"] += size_bytes
        totals_by_area[area]["lines"] += line_count

    files.sort(key=lambda item: (item["bytes"], item["lines"]), reverse=True)

    payload = {
        "generated_by": "tools/ai_tools/frontend_size_inventory.py",
        "scope": "frontend/src",
        "totals": {
            "files": len(files),
            "bytes": sum(item["bytes"] for item in files),
            "lines": sum(item["lines"] for item in files),
        },
        "areas": dict(sorted(totals_by_area.items())),
        "largest_files": files[:50],
    }

    OUTPUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"frontend size inventory written to {relative(OUTPUT_JSON)}")


if __name__ == "__main__":
    main()
