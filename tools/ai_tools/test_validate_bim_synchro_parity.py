from __future__ import annotations

import copy
import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("validate_bim_synchro_parity.py")
SPEC = importlib.util.spec_from_file_location("validate_bim_synchro_parity", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class BimSynchroParityValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.matrix = MODULE.load_matrix(MODULE.DEFAULT_MATRIX)

    def test_repository_contract_is_valid_and_reproducible(self) -> None:
        result = MODULE.validate_contract(self.matrix)
        self.assertEqual([], result["errors"])
        self.assertEqual(60, result["total"])
        self.assertEqual(63.33, result["score_percent"])
        self.assertEqual(
            {"complete": 33, "partial": 10, "absent": 17}, result["counts"]
        )

    def test_duplicate_and_missing_evidence_are_rejected(self) -> None:
        invalid = copy.deepcopy(self.matrix)
        invalid["capabilities"][1]["id"] = invalid["capabilities"][0]["id"]
        invalid["capabilities"][0]["evidence"] = []
        result = MODULE.validate_contract(invalid)
        self.assertTrue(any("duplicate capability ids" in error for error in result["errors"]))
        self.assertTrue(any("evidence must" in error for error in result["errors"]))


if __name__ == "__main__":
    unittest.main()
