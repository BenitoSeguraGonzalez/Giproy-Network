from __future__ import annotations

import copy
import importlib.util
import sys
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_bim_gate_k.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_gate_k", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_repository_gate_k_is_structurally_valid_but_blocked():
    result = MODULE.evaluate_repository()
    assert result["errors"] == []
    assert result["approved"] is False
    assert "Gate E human pilot is not approved" in result["blockers"]
    assert any("functional parity is" in item for item in result["blockers"])


def test_gate_k_can_approve_only_with_all_external_and_human_evidence():
    release = copy.deepcopy(MODULE.load_release(MODULE.DEFAULT_RELEASE))
    release["status"] = "approved"
    for certification in release["external_certifications"].values():
        certification.update(
            status="verified_external",
            provider="Accredited verifier",
            certificate_refs=["certificate:verified"],
        )
    release["approvals"] = {
        "product_owner_user_id": 10,
        "bim_owner_user_id": 20,
        "security_owner_user_id": 30,
        "decided_at": "2026-08-31T17:00:00-05:00",
        "evidence": ["decision:gate-k"],
    }

    result = MODULE.validate_release(
        release,
        parity_result={"errors": [], "score_percent": 100.0},
        gate_e_result={"errors": [], "approved": True},
        conformance_result={"errors": []},
    )

    assert result == {"errors": [], "blockers": [], "status": "approved", "approved": True}


def test_gate_k_rejects_approved_status_with_duplicate_approvers_and_pending_certificate():
    release = copy.deepcopy(MODULE.load_release(MODULE.DEFAULT_RELEASE))
    release["status"] = "approved"
    release["approvals"] = {
        "product_owner_user_id": 10,
        "bim_owner_user_id": 10,
        "security_owner_user_id": 10,
        "decided_at": "2026-08-31T17:00:00-05:00",
        "evidence": ["decision:invalid"],
    }
    result = MODULE.validate_release(
        release,
        parity_result={"errors": [], "score_percent": 100.0},
        gate_e_result={"errors": [], "approved": True},
        conformance_result={"errors": []},
    )
    assert "Gate K cannot be approved while blockers remain" in result["errors"]
    assert any("certification pending" in item for item in result["blockers"])
    assert "three distinct human approvals with evidence are pending" in result["blockers"]
