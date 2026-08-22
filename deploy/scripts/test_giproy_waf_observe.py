import importlib.util
import hashlib
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("giproy-waf-observe.py")
SPEC = importlib.util.spec_from_file_location("giproy_waf_observe", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class WafObserverTests(unittest.TestCase):
    def test_route_removes_query_and_normalizes_identifiers(self):
        route = MODULE.normalize_route(
            "/api/v1/proyectos/123/modelos/123e4567-e89b-12d3-a456-426614174000?token=secret"
        )
        self.assertEqual(route, "/api/v1/proyectos/{id}/modelos/{uuid}")

    def test_access_log_parser_does_not_capture_headers_or_body(self):
        line = '10.0.0.1 - - [date] "PATCH /api/v1/proyectos/44?jwt=secret HTTP/1.1" 200 2'
        match = MODULE.ACCESS_RE.search(line)
        self.assertIsNotNone(match)
        self.assertEqual(MODULE.normalize_route(match.group("uri")), "/api/v1/proyectos/{id}")
        self.assertNotIn("secret", hashlib.sha256(line.encode("utf-8")).hexdigest())


if __name__ == "__main__":
    unittest.main()
