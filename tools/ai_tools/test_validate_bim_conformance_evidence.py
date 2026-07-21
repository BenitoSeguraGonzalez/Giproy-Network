from __future__ import annotations

import copy
import importlib.util
import sys
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_bim_conformance_evidence.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_conformance_evidence", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_repository_conformance_pack_is_valid():
    result = MODULE.validate_pack(MODULE.load_pack(MODULE.DEFAULT_PACK))
    assert result == {
        "errors": [],
        "total": 10,
        "counts": {"verified_internal": 9, "external_pending": 1},
    }


def test_pack_rejects_formal_claim_and_released_external_gates():
    pack = copy.deepcopy(MODULE.load_pack(MODULE.DEFAULT_PACK))
    pack["claim_level"] = "formally_certified"
    pack["controls"][-1]["status"] = "verified_internal"
    pack["release_gates"]["gate_k_certification"] = "verified"

    errors = MODULE.validate_pack(pack)["errors"]

    assert "claim_level must explicitly deny formal certification" in errors
    assert "formal certification must remain external_pending" in errors
    assert "release gates must preserve human and external blockers" in errors


def test_pack_rejects_missing_or_escaping_evidence(tmp_path):
    pack = copy.deepcopy(MODULE.load_pack(MODULE.DEFAULT_PACK))
    pack["controls"][0]["evidence"] = ["../outside.md", "missing.md"]

    errors = MODULE.validate_pack(pack, root=tmp_path)["errors"]

    assert any("evidence escapes repository" in error for error in errors)
    assert any("missing evidence" in error for error in errors)
