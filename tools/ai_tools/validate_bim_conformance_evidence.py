"""Validate the BIM international conformance evidence pack."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PACK = ROOT / "docs" / "architecture" / "bim_conformance_evidence.json"
EXPECTED_CONTROL_IDS = (
    "ISO19650-1",
    "ISO19650-2",
    "ISO19650-3",
    "ISO19650-4",
    "ISO19650-5",
    "ISO19650-6",
    "IFC",
    "IDS-1.0",
    "BCF-2.1",
    "FORMAL-CERTIFICATION",
)
ALLOWED_STATUSES = {"verified_internal", "scope_gap", "external_pending"}
EXPECTED_GATES = {
    "classic_bim_off_baseline": "verified",
    "rollback_verified": "verified",
    "gate_e_human_pilot": "pending_human",
    "gate_k_certification": "pending_external",
}
OFFICIAL_HOST_SUFFIXES = ("iso.org", "buildingsmart.org")


def load_pack(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_pack(pack: dict, root: Path = ROOT) -> dict:
    errors: list[str] = []
    if pack.get("claim_level") != "verified_internal_not_formally_certified":
        errors.append("claim_level must explicitly deny formal certification")

    sources = pack.get("official_sources")
    if not isinstance(sources, list) or len(sources) < 4:
        errors.append("official_sources must contain ISO and buildingSMART references")
    else:
        for source in sources:
            parsed = urlsplit(source)
            host = (parsed.hostname or "").lower()
            if parsed.scheme != "https" or not any(
                host == suffix or host.endswith(f".{suffix}") for suffix in OFFICIAL_HOST_SUFFIXES
            ):
                errors.append(f"non-official or insecure source: {source}")

    controls = pack.get("controls", [])
    ids = tuple(item.get("id") for item in controls)
    if ids != EXPECTED_CONTROL_IDS:
        errors.append("control ids must match the ordered international baseline")
    for control in controls:
        control_id = control.get("id", "<missing>")
        if control.get("status") not in ALLOWED_STATUSES:
            errors.append(f"{control_id}: invalid status")
        if not str(control.get("scope_note", "")).strip():
            errors.append(f"{control_id}: scope_note is required")
        evidence = control.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            errors.append(f"{control_id}: evidence is required")
            continue
        for relative in evidence:
            path = (root / relative).resolve()
            try:
                path.relative_to(root.resolve())
            except ValueError:
                errors.append(f"{control_id}: evidence escapes repository: {relative}")
                continue
            if not path.is_file():
                errors.append(f"{control_id}: missing evidence: {relative}")

    by_id = {item.get("id"): item for item in controls}
    if by_id.get("FORMAL-CERTIFICATION", {}).get("status") != "external_pending":
        errors.append("formal certification must remain external_pending")
    if by_id.get("IFC", {}).get("status") != "verified_internal":
        errors.append("IFC must retain verified internal IFC2X3/IFC4/IFC4X3 evidence")
    if pack.get("release_gates") != EXPECTED_GATES:
        errors.append("release gates must preserve human and external blockers")

    counts = Counter(item.get("status") for item in controls)
    return {"errors": errors, "total": len(controls), "counts": dict(counts)}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pack", type=Path, default=DEFAULT_PACK)
    args = parser.parse_args()
    result = validate_pack(load_pack(args.pack))
    if result["errors"]:
        raise SystemExit("BIM_CONFORMANCE_INVALID\n- " + "\n- ".join(result["errors"]))
    print(f"BIM_CONFORMANCE_OK total={result['total']} counts={result['counts']}")


if __name__ == "__main__":
    main()
