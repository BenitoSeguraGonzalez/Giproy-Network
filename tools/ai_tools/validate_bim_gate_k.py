"""Aggregate the final BIM release gate without bypassing external evidence."""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
DEFAULT_RELEASE = ROOT / "docs" / "architecture" / "bim_gate_k_release.json"
EXPECTED_CHECKS = {
    "classic_bim_off_baseline": "verified",
    "rollback_restore": "verified",
    "beta_https_health": "verified",
    "tenant_security": "verified",
    "observability": "verified",
    "support_runbook": "verified",
}
EXPECTED_CERTIFICATIONS = {"ifc_software", "iso_19650_audit"}


def _load_module(name: str):
    path = TOOLS / f"{name}.py"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def load_release(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validate_release(
    release: dict,
    *,
    parity_result: dict,
    gate_e_result: dict,
    conformance_result: dict,
) -> dict:
    errors: list[str] = []
    blockers: list[str] = []
    if release.get("environment") != "beta":
        errors.append("Gate K evidence must originate from beta")
    if release.get("release_scope") != "general_bim_rollout":
        errors.append("release_scope must remain general_bim_rollout")
    if release.get("technical_checks") != EXPECTED_CHECKS:
        errors.append("technical checks are incomplete or altered")

    certifications = release.get("external_certifications", {})
    if set(certifications) != EXPECTED_CERTIFICATIONS:
        errors.append("external certification set is incomplete or altered")
    for certification_id, certification in certifications.items():
        status = certification.get("status")
        if status not in {"pending_external", "verified_external"}:
            errors.append(f"{certification_id}: invalid certification status")
        if status == "verified_external" and (
            not str(certification.get("provider", "")).strip()
            or not certification.get("certificate_refs")
        ):
            errors.append(f"{certification_id}: verified certification requires provider and references")
        if status != "verified_external":
            blockers.append(f"{certification_id} certification pending")

    if parity_result.get("errors"):
        errors.extend(f"parity: {item}" for item in parity_result["errors"])
    if parity_result.get("score_percent") != 100.0:
        blockers.append(f"functional parity is {parity_result.get('score_percent', 0):.2f}%")
    if gate_e_result.get("errors") or not gate_e_result.get("approved"):
        blockers.append("Gate E human pilot is not approved")
    if conformance_result.get("errors"):
        errors.extend(f"conformance: {item}" for item in conformance_result["errors"])

    approvals = release.get("approvals", {})
    approver_ids = [
        approvals.get("product_owner_user_id"),
        approvals.get("bim_owner_user_id"),
        approvals.get("security_owner_user_id"),
    ]
    approvals_complete = (
        all(isinstance(value, int) and value > 0 for value in approver_ids)
        and len(set(approver_ids)) == 3
        and bool(approvals.get("decided_at"))
        and bool(approvals.get("evidence"))
    )
    if not approvals_complete:
        blockers.append("three distinct human approvals with evidence are pending")

    status = release.get("status")
    if status not in {"blocked", "approved", "rejected"}:
        errors.append("invalid Gate K status")
    prerequisites_green = not errors and not blockers
    if status == "approved" and not prerequisites_green:
        errors.append("Gate K cannot be approved while blockers remain")
    if status != "approved":
        blockers.append("Gate K decision is not approved")
    approved = status == "approved" and not errors and not blockers
    return {"errors": errors, "blockers": blockers, "status": status, "approved": approved}


def evaluate_repository(release_path: Path = DEFAULT_RELEASE) -> dict:
    parity = _load_module("validate_bim_synchro_parity")
    gate_e = _load_module("validate_bim_gate_e_pilot")
    conformance = _load_module("validate_bim_conformance_evidence")
    return validate_release(
        load_release(release_path),
        parity_result=parity.validate_contract(parity.load_matrix(parity.DEFAULT_MATRIX)),
        gate_e_result=gate_e.validate_ledger(gate_e.load_ledger(gate_e.DEFAULT_LEDGER), require_approved=True),
        conformance_result=conformance.validate_pack(conformance.load_pack(conformance.DEFAULT_PACK)),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", type=Path, default=DEFAULT_RELEASE)
    parser.add_argument("--require-approved", action="store_true")
    args = parser.parse_args()
    result = evaluate_repository(args.release)
    if result["errors"]:
        raise SystemExit("BIM_GATE_K_INVALID\n- " + "\n- ".join(result["errors"]))
    if args.require_approved and not result["approved"]:
        raise SystemExit("BIM_GATE_K_BLOCKED\n- " + "\n- ".join(result["blockers"]))
    print(
        f"BIM_GATE_K_OK status={result['status']} approved={str(result['approved']).lower()} "
        f"blockers={len(result['blockers'])}"
    )


if __name__ == "__main__":
    main()
