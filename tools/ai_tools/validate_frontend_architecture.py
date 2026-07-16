from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEPENDENCY_INVENTORY = ROOT / "docs" / "frontend_dependency_inventory.json"
SIZE_INVENTORY = ROOT / "docs" / "frontend_size_inventory.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def fail(message: str) -> int:
    print(f"[FAIL] frontend-architecture: {message}")
    return 1


def main() -> int:
    try:
        dependency = load_json(DEPENDENCY_INVENTORY)
        size = load_json(SIZE_INVENTORY)
    except Exception as exc:
        return fail(str(exc))

    direct_calls = (
        dependency.get("categories", {})
        .get("direct_api_calls_outside_api", {})
        .get("count")
    )
    if direct_calls != 0:
        return fail(
            f"expected 0 direct API calls outside frontend/src/api, found {direct_calls}"
        )

    api_clients = dependency.get("totals", {}).get("api_clients", 0)
    if api_clients <= 0:
        return fail("dependency inventory does not report API clients")

    largest_files = size.get("largest_files", [])
    if not largest_files:
        return fail("size inventory does not report largest files")

    totals = size.get("totals", {})
    if totals.get("files", 0) <= 0 or totals.get("lines", 0) <= 0:
        return fail("size inventory totals are empty")

    print(
        "[OK] frontend-architecture: "
        f"direct_api_calls=0, api_clients={api_clients}, "
        f"size_files={totals.get('files')}, size_lines={totals.get('lines')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
