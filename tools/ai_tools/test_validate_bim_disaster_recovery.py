import unittest
from datetime import datetime, timezone

from tools.ai_tools.validate_bim_disaster_recovery import _normalize, _require_test_database


class BimDisasterRecoveryValidatorTests(unittest.TestCase):
    def test_database_guard_rejects_non_test_targets(self):
        with self.assertRaisesRegex(RuntimeError, "terminado en _test"):
            _require_test_database("giproy")
        with self.assertRaisesRegex(RuntimeError, "identificador seguro"):
            _require_test_database('giproy";drop_database_test')
        _require_test_database("giproy_bim_dr_test")

    def test_normalization_is_stable_for_binary_and_timezone_values(self):
        self.assertEqual(
            {"bytes_sha256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", "size": 3},
            _normalize(b"abc"),
        )
        self.assertEqual(
            "2026-07-17T12:00:00+00:00",
            _normalize(datetime(2026, 7, 17, 12, 0, tzinfo=timezone.utc)),
        )


if __name__ == "__main__":
    unittest.main()
