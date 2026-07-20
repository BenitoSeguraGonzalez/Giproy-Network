from __future__ import annotations

import copy
import importlib.util
import sys
from datetime import date, timedelta
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_bim_gate_e_pilot.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_gate_e_pilot", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def _approved_ledger():
    ledger = copy.deepcopy(MODULE.load_ledger(MODULE.DEFAULT_LEDGER))
    start = date(2026, 7, 20)
    days = []
    current = start
    while len(days) < 10:
        if current.weekday() < 5:
            days.append(current.isoformat())
        current += timedelta(days=1)
    ledger["status"] = "approved"
    ledger["participants"] = {"bim_coordinator_user_id": 10, "business_user_id": 20}
    ledger["period"] = {"start_date": days[0], "end_date": days[-1], "business_days": days}
    for flow in ledger["required_flows"].values():
        flow.update(status="passed", evidence=["audit:1"])
    ledger["daily_evidence"] = [{"date": value, "evidence": [f"daily:{value}"]} for value in days]
    ledger["real_reviews"] = [
        {"model_version_id": 101, "evidence": ["review:1"]},
        {"model_version_id": 102, "evidence": ["review:2"]},
    ]
    ledger["decision"] = {
        "status": "approved",
        "approved_by_user_id": 30,
        "decided_at": "2026-07-31T17:00:00-05:00",
        "evidence": ["decision:1"],
    }
    return ledger


def test_pending_repository_ledger_is_valid_but_not_approved():
    result = MODULE.validate_ledger(MODULE.load_ledger(MODULE.DEFAULT_LEDGER))
    assert result == {"errors": [], "status": "authorized_not_started", "approved": False}
    required = MODULE.validate_ledger(MODULE.load_ledger(MODULE.DEFAULT_LEDGER), require_approved=True)
    assert "Gate E human pilot is not approved" in required["errors"]


def test_complete_human_evidence_can_approve_gate_e():
    result = MODULE.validate_ledger(_approved_ledger(), require_approved=True)
    assert result == {"errors": [], "status": "approved", "approved": True}


def test_forged_approval_without_duration_reviews_or_distinct_users_is_rejected():
    ledger = _approved_ledger()
    ledger["participants"]["business_user_id"] = 10
    ledger["period"]["business_days"] = ledger["period"]["business_days"][:3]
    ledger["daily_evidence"] = []
    ledger["real_reviews"] = []
    ledger["required_flows"]["ifc_import"] = {"status": "pending", "evidence": []}

    errors = MODULE.validate_ledger(ledger, require_approved=True)["errors"]

    assert "BIM coordinator and business user must be different" in errors
    assert "approved pilot requires at least 10 unique business days" in errors
    assert "every business day requires daily evidence" in errors
    assert "approved pilot requires two evidenced real model reviews" in errors
    assert "ifc_import: approved pilot requires passed evidence" in errors
