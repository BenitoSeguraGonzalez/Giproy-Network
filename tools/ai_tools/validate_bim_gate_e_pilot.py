"""Validate Gate E pilot evidence without manufacturing human approval."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_LEDGER = ROOT / "docs" / "architecture" / "bim_gate_e_pilot.json"
EXPECTED_FLOWS = {
    "ifc_import",
    "version_publication",
    "model_comparison",
    "issue_workflow",
    "ids_validation",
    "cde_review",
    "issue_reopening",
    "rollback_rehearsal",
}
EXPECTED_PREREQUISITES = {
    "allowlist_1_3": "verified",
    "classic_bim_off": "verified",
    "beta_https": "verified",
    "remote_collaboration": "verified",
    "rollback_restore": "verified",
    "conformance_pack": "verified_internal",
}


def load_ledger(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _parse_date(value, label: str, errors: list[str]) -> date | None:
    if not isinstance(value, str):
        errors.append(f"{label} must be an ISO date")
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        errors.append(f"{label} must be an ISO date")
        return None


def validate_ledger(ledger: dict, *, require_approved: bool = False) -> dict:
    errors: list[str] = []
    if ledger.get("environment") != "beta":
        errors.append("Gate E must run in beta")
    parsed_url = urlsplit(str(ledger.get("base_url", "")))
    if parsed_url.scheme != "https" or parsed_url.username or parsed_url.password:
        errors.append("base_url must be credential-free HTTPS")
    if ledger.get("authorized_company_ids") != [1, 3]:
        errors.append("authorized companies must remain exactly [1, 3]")
    if ledger.get("minimum_business_days") != 10:
        errors.append("minimum_business_days must remain 10")
    if ledger.get("minimum_real_reviews") != 2:
        errors.append("minimum_real_reviews must remain 2")
    if ledger.get("technical_prerequisites") != EXPECTED_PREREQUISITES:
        errors.append("technical prerequisites are incomplete or altered")

    flows = ledger.get("required_flows", {})
    if set(flows) != EXPECTED_FLOWS:
        errors.append("required flow set is incomplete or altered")
    for flow_id, flow in flows.items():
        if flow.get("status") not in {"pending", "passed", "failed"}:
            errors.append(f"{flow_id}: invalid status")
        if not isinstance(flow.get("evidence"), list):
            errors.append(f"{flow_id}: evidence must be a list")

    status = ledger.get("status")
    if status not in {"authorized_not_started", "in_progress", "approved", "rejected"}:
        errors.append("invalid pilot status")
    if require_approved and status != "approved":
        errors.append("Gate E human pilot is not approved")

    if status == "approved":
        participants = ledger.get("participants", {})
        coordinator = participants.get("bim_coordinator_user_id")
        business_user = participants.get("business_user_id")
        if not isinstance(coordinator, int) or coordinator <= 0:
            errors.append("approved pilot requires a named BIM coordinator user id")
        if not isinstance(business_user, int) or business_user <= 0:
            errors.append("approved pilot requires a named business user id")
        if coordinator == business_user:
            errors.append("BIM coordinator and business user must be different")

        period = ledger.get("period", {})
        start = _parse_date(period.get("start_date"), "start_date", errors)
        end = _parse_date(period.get("end_date"), "end_date", errors)
        raw_days = period.get("business_days", [])
        days = [_parse_date(value, "business_day", errors) for value in raw_days]
        valid_days = [value for value in days if value is not None]
        if len(valid_days) < 10 or len(set(valid_days)) != len(valid_days):
            errors.append("approved pilot requires at least 10 unique business days")
        if any(value.weekday() >= 5 for value in valid_days):
            errors.append("business_days cannot include weekends")
        if start and end and (start > end or any(value < start or value > end for value in valid_days)):
            errors.append("business_days must remain inside the declared period")

        evidence_days = {item.get("date") for item in ledger.get("daily_evidence", [])}
        if {value.isoformat() for value in valid_days} - evidence_days:
            errors.append("every business day requires daily evidence")
        reviews = ledger.get("real_reviews", [])
        if len(reviews) < 2 or any(
            not isinstance(item.get("model_version_id"), int)
            or item.get("model_version_id") <= 0
            or not item.get("evidence")
            for item in reviews
        ):
            errors.append("approved pilot requires two evidenced real model reviews")
        for flow_id, flow in flows.items():
            if flow.get("status") != "passed" or not flow.get("evidence"):
                errors.append(f"{flow_id}: approved pilot requires passed evidence")
        if any(item.get("status") != "resolved" for item in ledger.get("critical_incidents", [])):
            errors.append("approved pilot cannot retain unresolved critical incidents")
        decision = ledger.get("decision", {})
        if (
            decision.get("status") != "approved"
            or not isinstance(decision.get("approved_by_user_id"), int)
            or not decision.get("decided_at")
            or not decision.get("evidence")
        ):
            errors.append("approved pilot requires a complete human decision")

    return {"errors": errors, "status": status, "approved": status == "approved" and not errors}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER)
    parser.add_argument("--require-approved", action="store_true")
    args = parser.parse_args()
    result = validate_ledger(load_ledger(args.ledger), require_approved=args.require_approved)
    if result["errors"]:
        raise SystemExit("BIM_GATE_E_INVALID\n- " + "\n- ".join(result["errors"]))
    print(f"BIM_GATE_E_OK status={result['status']} approved={str(result['approved']).lower()}")


if __name__ == "__main__":
    main()
