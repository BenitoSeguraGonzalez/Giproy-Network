from __future__ import annotations

import argparse
from pathlib import Path


REQUIRED_PATHS = [
    ".git/HEAD",
    "AI_CONTEXT.md",
    "docs/project_state.json",
    "docs/architecture/project_map.json",
    "docs/HANDOFF.md",
    "docs/SAFE_REFACTOR_PROGRESS.md",
    "docs/ENVIRONMENT_DOCKER_PREFLIGHT.md",
    "docs/architecture/BIM_MASTER_PLAN.md",
    "docs/architecture/BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md",
    "docs/STYLE_GUIDE.md",
    "docs/runtime/WORK_MODE_STATE.json",
    "backend/app/main.py",
    "frontend/package.json",
    "frontend/src",
]


def check_workspace(root: Path) -> tuple[list[str], list[str]]:
    missing: list[str] = []
    present: list[str] = []

    for relative in REQUIRED_PATHS:
        target = root / relative
        if target.exists():
            present.append(relative)
        else:
            missing.append(relative)

    return present, missing


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate that the GiProy Network workspace contains the minimum source tree required for enterprise-safe implementation."
    )
    parser.add_argument(
        "--root",
        default=".",
        help="Workspace root to inspect. Defaults to current directory.",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    present, missing = check_workspace(root)

    print(f"Workspace: {root}")
    print(f"Present required paths: {len(present)}")
    for item in present:
        print(f"  OK  {item}")

    print(f"Missing required paths: {len(missing)}")
    for item in missing:
        print(f"  MISS {item}")

    if missing:
        print("RESULT: INCOMPLETE_WORKSPACE")
        return 2

    print("RESULT: COMPLETE_WORKSPACE")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
