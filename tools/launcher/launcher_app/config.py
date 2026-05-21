from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LauncherConfig:
    project_root: Path
    backend_service_name: str = "GiProy-Backend"
    frontend_service_name: str = "GiProy-Frontend"
    backend_port: int = 3001
    # Puerto publico local del frontend clasico. Cloudflare Tunnel apunta a 3010.
    frontend_ports: tuple[int, int] = (3010, 8080)

    @property
    def log_dir(self) -> Path:
        return self.project_root / ".runtime" / "logs"

    @property
    def backend_log(self) -> Path:
        return self.log_dir / "backend-nssm.log"

    @property
    def frontend_log(self) -> Path:
        return self.log_dir / "frontend-nssm.log"

    @property
    def system_log(self) -> Path:
        return self.log_dir / "launcher.log"

    @property
    def settings_file(self) -> Path:
        return self.project_root / ".runtime" / "launcher_settings.json"

    @property
    def monitor_dir(self) -> Path:
        return self.project_root / ".runtime" / "monitor"

    @property
    def monitor_metrics_jsonl(self) -> Path:
        return self.monitor_dir / "metrics.jsonl"

    @property
    def monitor_alerts_jsonl(self) -> Path:
        return self.monitor_dir / "alerts.jsonl"

    @property
    def monitor_reports_dir(self) -> Path:
        return self.monitor_dir / "reports"


def default_config() -> LauncherConfig:
    probe = Path(__file__).resolve()
    root = probe.parents[3]
    for candidate in probe.parents:
        if (candidate / "backend").exists() and (candidate / "frontend").exists():
            root = candidate
            break
    return LauncherConfig(project_root=root)
