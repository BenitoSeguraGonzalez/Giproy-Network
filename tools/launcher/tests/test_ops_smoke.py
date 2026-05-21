from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import sys


PROJECT_ROOT = Path(__file__).resolve().parents[3]
LAUNCHER_ROOT = PROJECT_ROOT / "tools" / "launcher"
if str(LAUNCHER_ROOT) not in sys.path:
    sys.path.insert(0, str(LAUNCHER_ROOT))

from launcher_app.config import LauncherConfig  # noqa: E402
from launcher_app.ops import (  # noqa: E402
    AlertEvent,
    append_alert_events,
    append_metrics_snapshot,
    clear_monitor_history,
    export_alerts_json,
    export_metrics_csv,
    load_launcher_settings,
    load_recent_alerts,
    parse_auth_activity,
    percentile,
    save_launcher_settings,
)


class LauncherOpsSmokeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cfg = LauncherConfig(project_root=self.root)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_percentile(self) -> None:
        self.assertAlmostEqual(percentile([1, 2, 3, 4], 0.5), 2.5)
        self.assertEqual(percentile([], 0.95), 0.0)

    def test_settings_roundtrip(self) -> None:
        settings = load_launcher_settings(self.cfg)
        settings.cpu_warn_percent = 77.5
        settings.endpoint_p95_warn_ms = 987.0
        save_launcher_settings(self.cfg, settings)
        reloaded = load_launcher_settings(self.cfg)
        self.assertEqual(reloaded.cpu_warn_percent, 77.5)
        self.assertEqual(reloaded.endpoint_p95_warn_ms, 987.0)

    def test_parse_auth_activity(self) -> None:
        self.cfg.log_dir.mkdir(parents=True, exist_ok=True)
        self.cfg.backend_log.write_text(
            '\n'.join(
                [
                    'INFO:     127.0.0.1:51919 - "POST /api/v1/auth/login HTTP/1.1" 200 OK',
                    'INFO:     10.0.0.5:51919 - "POST /api/v1/auth/login HTTP/1.1" 401 Unauthorized',
                ]
            ),
            encoding="utf-8",
        )
        a = parse_auth_activity(self.cfg.backend_log)
        self.assertEqual(a.login_ok, 1)
        self.assertEqual(a.login_fail, 1)
        self.assertIn("127.0.0.1", a.unique_client_ips)
        self.assertIn("10.0.0.5", a.unique_client_ips)

    def test_alerts_and_metrics_exports(self) -> None:
        append_metrics_snapshot(
            self.cfg,
            {
                "ts": "2026-02-28T10:00:00",
                "cpu_percent": 10.0,
                "memory_percent": 20.0,
                "disk_percent": 30.0,
                "net_tx_mb": 40.0,
                "net_rx_mb": 50.0,
                "backend_clients": 1,
            },
        )
        append_alert_events(
            self.cfg,
            [
                AlertEvent(
                    ts="2026-02-28T10:00:00",
                    severity="WARN",
                    source="system",
                    message="CPU alta",
                )
            ],
        )

        csv_path = export_metrics_csv(self.cfg)
        self.assertTrue(csv_path.exists())
        csv_txt = csv_path.read_text(encoding="utf-8")
        self.assertIn("cpu_percent", csv_txt)

        json_path = export_alerts_json(self.cfg)
        self.assertTrue(json_path.exists())
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["severity"], "WARN")

        alerts = load_recent_alerts(self.cfg)
        self.assertEqual(len(alerts), 1)

    def test_clear_monitor_history(self) -> None:
        append_metrics_snapshot(self.cfg, {"ts": "x"})
        append_alert_events(self.cfg, [AlertEvent(ts="x", severity="WARN", source="x", message="x")])
        self.assertTrue(self.cfg.monitor_metrics_jsonl.exists())
        self.assertTrue(self.cfg.monitor_alerts_jsonl.exists())
        clear_monitor_history(self.cfg)
        self.assertFalse(self.cfg.monitor_metrics_jsonl.exists())
        self.assertFalse(self.cfg.monitor_alerts_jsonl.exists())


if __name__ == "__main__":
    unittest.main()
