"""Validate the machine-readable BIM SYNCHRO parity contract."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MATRIX = ROOT / "docs" / "architecture" / "bim_synchro_parity_matrix.json"
MARKDOWN_STATUS = {"Completa": "complete", "Parcial": "partial", "Ausente": "absent"}
EXPECTED_GROUPS = {
    "4d_modeler": 10,
    "scheduling_interop": 6,
    "control_cde": 8,
    "field": 8,
    "perform": 8,
    "cost": 7,
    "handover": 5,
    "enterprise": 8,
}


def load_matrix(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def markdown_states(path: Path) -> dict[str, str]:
    states: dict[str, str] = {}
    pattern = re.compile(r"^\| ([A-H]\d{2}) \|.*\| (Completa|Parcial|Ausente) \|")
    for line in path.read_text(encoding="utf-8").splitlines():
        match = pattern.match(line)
        if match:
            states[match.group(1)] = MARKDOWN_STATUS[match.group(2)]
    return states


def validate_contract(matrix: dict, root: Path = ROOT) -> dict:
    errors: list[str] = []
    weights = matrix.get("status_weights", {})
    if weights != {"complete": 1.0, "partial": 0.5, "absent": 0.0}:
        errors.append("status_weights must be complete=1, partial=0.5, absent=0")

    capabilities = matrix.get("capabilities", [])
    ids = [item.get("id") for item in capabilities]
    duplicates = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicates:
        errors.append(f"duplicate capability ids: {', '.join(duplicates)}")

    expected_ids = [
        *(f"A{value:02d}" for value in range(1, 11)),
        *(f"B{value:02d}" for value in range(1, 7)),
        *(f"C{value:02d}" for value in range(1, 9)),
        *(f"D{value:02d}" for value in range(1, 9)),
        *(f"E{value:02d}" for value in range(1, 9)),
        *(f"F{value:02d}" for value in range(1, 8)),
        *(f"G{value:02d}" for value in range(1, 6)),
        *(f"H{value:02d}" for value in range(1, 9)),
    ]
    if ids != expected_ids:
        errors.append("capability ids must be ordered and contiguous from A01 to H08")

    group_counts = Counter(item.get("group") for item in capabilities)
    if dict(group_counts) != EXPECTED_GROUPS:
        errors.append(f"unexpected group counts: {dict(group_counts)}")

    for item in capabilities:
        capability_id = item.get("id", "<missing>")
        status = item.get("status")
        if status not in weights:
            errors.append(f"{capability_id}: invalid status {status!r}")
        evidence = item.get("evidence")
        if not isinstance(evidence, list) or not evidence or not all(
            isinstance(value, str) and value.strip() for value in evidence
        ):
            errors.append(f"{capability_id}: evidence must be a non-empty string list")

    source = root / matrix.get("source_document", "")
    if not source.is_file():
        errors.append(f"source_document does not exist: {source}")
        source_states = {}
    else:
        source_states = markdown_states(source)
    json_states = {item["id"]: item["status"] for item in capabilities if "id" in item}
    if source_states != json_states:
        errors.append("Markdown and JSON capability states differ")

    requirements = matrix.get("release_requirements", {})
    required_flags = (
        "gate_e_human_pilot",
        "gate_k_certification",
        "classic_bim_off_baseline",
        "rollback_verified",
    )
    if requirements.get("required_score_percent") != 100.0:
        errors.append("release score must be 100%")
    if not all(requirements.get(flag) is True for flag in required_flags):
        errors.append("all release requirement flags must be true")

    counts = Counter(item.get("status") for item in capabilities)
    score = sum(weights.get(item.get("status"), 0.0) for item in capabilities)
    percentage = round(score * 100 / len(capabilities), 2) if capabilities else 0.0
    return {
        "errors": errors,
        "total": len(capabilities),
        "counts": dict(counts),
        "score_percent": percentage,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--matrix", type=Path, default=DEFAULT_MATRIX)
    parser.add_argument("--require-complete", action="store_true")
    args = parser.parse_args()

    result = validate_contract(load_matrix(args.matrix))
    if result["errors"]:
        raise SystemExit("BIM_SYNCHRO_PARITY_INVALID\n- " + "\n- ".join(result["errors"]))
    if args.require_complete and result["score_percent"] != 100.0:
        raise SystemExit(
            "BIM_SYNCHRO_PARITY_INCOMPLETE "
            f"score={result['score_percent']:.2f}% counts={result['counts']}"
        )
    print(
        "BIM_SYNCHRO_PARITY_OK "
        f"total={result['total']} score={result['score_percent']:.2f}% "
        f"counts={result['counts']}"
    )


if __name__ == "__main__":
    main()
