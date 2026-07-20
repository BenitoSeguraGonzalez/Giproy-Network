from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).with_name("validate_bim_cde_collaboration_scale.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_cde_collaboration_scale", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_percentile_95_uses_nearest_rank():
    assert MODULE.percentile_95(list(range(1, 101))) == 95
    assert MODULE.percentile_95([4.5]) == 4.5


def test_percentile_95_requires_measurements():
    with pytest.raises(ValueError):
        MODULE.percentile_95([])


def test_plan_index_names_walks_nested_nodes():
    plan = {
        "Node Type": "Limit",
        "Plans": [
            {
                "Node Type": "Index Scan",
                "Index Name": MODULE.EXPECTED_CURSOR_INDEX,
            }
        ],
    }
    assert MODULE.plan_index_names(plan) == {MODULE.EXPECTED_CURSOR_INDEX}
