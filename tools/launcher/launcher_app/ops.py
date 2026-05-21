from __future__ import annotations

import ctypes
import csv
import json
import locale
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import psutil

from .config import LauncherConfig


@dataclass
class CommandResult:
    ok: bool
    code: int
    out: str
    err: str


@dataclass
class RuntimeStatus:
    backend_service: str
    frontend_service: str
    backend_port_pid: int | None
    frontend_port_pids: dict[int, int]


@dataclass
class SystemMetrics:
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    net_sent_mb: float
    net_recv_mb: float
    backend_connected_clients: list[str]


@dataclass
class ProcessMetrics:
    pid: int
    name: str
    cpu_percent: float
    rss_mb: float
    threads: int
    uptime_seconds: float


@dataclass
class EndpointHealth:
    name: str
    ok: bool
    status_code: int | None
    latency_ms: float | None
    detail: str = ""


@dataclass
class PlatformCheckResult:
    node_ok: bool
    npm_ok: bool
    db_ok: bool
    backend_ok: bool


@dataclass
class LocalIADiagnostics:
    backend_reachable: bool
    auth_ok: bool
    active_engine: str
    local_profile: str
    runtime_mode: str
    runtime_effective: str
    cuda_available: bool | None
    gpu_offload: bool | None
    gpu_name: str
    gpu_utilization_percent: float | None
    gpu_memory_used_mb: float | None
    gpu_memory_total_mb: float | None
    efficiency: str
    detail: str


@dataclass
class LogHealth:
    errors: int
    warnings: int
    total_lines: int


@dataclass
class AuthActivity:
    login_ok: int
    login_fail: int
    unique_client_ips: list[str]
    recent_events: list[dict[str, str]] | None = None


@dataclass
class LauncherSettings:
    status_refresh_ms: int = 3000
    health_refresh_ms: int = 12000
    log_refresh_ms: int = 1000
    cpu_warn_percent: float = 85.0
    memory_warn_percent: float = 90.0
    disk_warn_percent: float = 90.0
    latency_p95_warn_ms: float = 1200.0
    endpoint_sla_warn_percent: float = 97.0
    endpoint_p95_warn_ms: float = 1500.0


@dataclass
class AlertEvent:
    ts: str
    severity: str
    source: str
    message: str


@dataclass
class ServiceSpec:
    service_name: str
    app: str
    app_parameters: str
    app_directory: Path
    stdout_log: Path
    stderr_log: Path


def is_admin() -> bool:
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def elevate_self(args: list[str]) -> bool:
    exe = sys.executable
    script = str(Path(sys.argv[0]).resolve())
    params = f'"{script}" ' + " ".join(args)
    rc = ctypes.windll.shell32.ShellExecuteW(None, "runas", exe, params, None, 1)
    return rc > 32


def _ensure_nssm(cfg: LauncherConfig) -> Path:
    nssm_dir = cfg.project_root / "scripts" / "tools" / "nssm"
    nssm_dir.mkdir(parents=True, exist_ok=True)
    nssm_exe = nssm_dir / "nssm.exe"
    if nssm_exe.exists():
        return nssm_exe
    nssm_in_path = shutil.which("nssm.exe") or shutil.which("nssm")
    if nssm_in_path and Path(nssm_in_path).exists():
        shutil.copy2(Path(nssm_in_path), nssm_exe)
        return nssm_exe

    urls = [
        "https://github.com/mizoe/nssm/releases/download/2.24/nssm-2.24.zip",
        "https://web.archive.org/web/20230225132801if_/https://nssm.cc/release/nssm-2.24.zip",
        "https://nssm.cc/release/nssm-2.24.zip",
    ]
    errors: list[str] = []
    for url in urls:
        try:
            with tempfile.TemporaryDirectory(prefix="nssm_dl_") as tmp:
                tmp_path = Path(tmp)
                zip_path = tmp_path / "nssm.zip"
                with urllib.request.urlopen(url, timeout=30) as resp:
                    zip_path.write_bytes(resp.read())
                with zipfile.ZipFile(zip_path, "r") as zf:
                    zf.extractall(tmp_path)
                candidates = list(tmp_path.rglob("nssm.exe"))
                if not candidates:
                    raise RuntimeError("No se encontro nssm.exe en el ZIP descargado.")
                preferred = next((c for c in candidates if "\\win64\\" in str(c).lower()), candidates[0])
                shutil.copy2(preferred, nssm_exe)
                return nssm_exe
        except Exception as exc:
            errors.append(f"{url} -> {exc}")
            continue
    raise RuntimeError("No se pudo descargar NSSM desde mirrors.\n" + "\n".join(errors))


def _service_exists(name: str) -> bool:
    res = run_cmd(["sc", "query", name])
    txt = f"{res.out}\n{res.err}".upper()
    return "FAILED 1060" not in txt


def _service_binary_path(name: str) -> str:
    res = run_cmd(["sc", "qc", name])
    if not res.ok:
        return ""
    for ln in res.out.splitlines():
        ln_u = ln.upper()
        if "BINARY_PATH_NAME" in ln_u or "NOMBRE_RUTA_BINARIO" in ln_u:
            parts = ln.split(":", 1)
            if len(parts) == 2:
                return parts[1].strip()
    return ""


def _nssm_set(nssm: Path, service_name: str, key: str, value: str) -> CommandResult:
    return run_cmd([str(nssm), "set", service_name, key, value])


def _service_is_nssm(name: str) -> bool:
    return "nssm" in _service_binary_path(name).lower()


def _stop_and_delete_service_names(service_names: list[str] | tuple[str, ...]) -> list[str]:
    messages: list[str] = []
    for service_name in service_names:
        if not _service_exists(service_name):
            continue
        stop_res = run_cmd(["sc", "stop", service_name])
        if stop_res.out:
            messages.append(stop_res.out)
        if stop_res.err:
            messages.append(stop_res.err)
        _wait_for_service_stop(service_name, timeout=8)
        delete_res = run_cmd(["sc", "delete", service_name])
        if delete_res.out:
            messages.append(delete_res.out)
        if delete_res.err:
            messages.append(delete_res.err)
    return messages


def _find_npm_cmd() -> str:
    candidates = [
        Path(r"C:\Program Files\nodejs\npm.cmd"),
        Path(r"C:\Program Files (x86)\nodejs\npm.cmd"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    found = shutil.which("npm.cmd") or shutil.which("npm")
    if found:
        return found
    raise RuntimeError("No se encontro npm.cmd en el sistema.")


def _nodejs_path_dir() -> str | None:
    candidates = [
        Path(r"C:\Program Files\nodejs"),
        Path(r"C:\Program Files (x86)\nodejs"),
    ]
    for candidate in candidates:
        if (candidate / "node.exe").exists():
            return str(candidate)
    found = shutil.which("node.exe") or shutil.which("node")
    if found:
        return str(Path(found).parent)
    return None


def _backend_service_spec(cfg: LauncherConfig) -> ServiceSpec:
    # Prioriza la venv real del proyecto y solo cae a Python global como ultimo recurso.
    candidates = [
        cfg.project_root / "backend" / ".venv" / "Scripts" / "python.exe",
        cfg.project_root / "backend" / "venv" / "Scripts" / "python.exe",
        cfg.project_root / ".venv" / "Scripts" / "python.exe",
        cfg.project_root / "venv" / "Scripts" / "python.exe",
    ]
    python_exe = next((candidate for candidate in candidates if candidate.exists()), None)
    if python_exe is None:
        import shutil, sys
        python_exe = Path(shutil.which("python.exe") or sys.executable)
    
    return ServiceSpec(
        service_name=cfg.backend_service_name,
        app=str(python_exe),
        app_parameters=f"-m uvicorn app.main:app --host 0.0.0.0 --port {cfg.backend_port}",
        app_directory=cfg.project_root / "backend",
        stdout_log=cfg.backend_log,
        stderr_log=cfg.backend_log,
    )


def _resolve_powershell_exe() -> str:
    candidates = [
        Path(r"C:\Program Files\PowerShell\7\pwsh.exe"),
        Path(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    found = shutil.which("pwsh.exe") or shutil.which("powershell.exe") or shutil.which("powershell")
    if found:
        return found
    raise RuntimeError("No se encontró PowerShell en el sistema.")


def install_project_bridge(cfg: LauncherConfig) -> CommandResult:
    script_path = cfg.project_root / "tools" / "project_bridge" / "install_bridge.ps1"
    if not script_path.exists():
        return CommandResult(ok=False, code=1, out="", err="No se encontró install_bridge.ps1.")
    try:
        ps_exe = _resolve_powershell_exe()
    except Exception as exc:
        return CommandResult(ok=False, code=1, out="", err=str(exc))
    return run_cmd([ps_exe, "-ExecutionPolicy", "Bypass", "-File", str(script_path)], cwd=cfg.project_root)


def uninstall_project_bridge(cfg: LauncherConfig) -> CommandResult:
    script_path = cfg.project_root / "tools" / "project_bridge" / "uninstall_bridge.ps1"
    if not script_path.exists():
        return CommandResult(ok=False, code=1, out="", err="No se encontró uninstall_bridge.ps1.")
    try:
        ps_exe = _resolve_powershell_exe()
    except Exception as exc:
        return CommandResult(ok=False, code=1, out="", err=str(exc))
    return run_cmd([ps_exe, "-ExecutionPolicy", "Bypass", "-File", str(script_path)], cwd=cfg.project_root)


def _frontend_service_spec(cfg: LauncherConfig) -> ServiceSpec:
    npm_cmd = _find_npm_cmd()
    node_dir = _nodejs_path_dir()
    prefix = f'set "PATH={node_dir};%PATH%" && ' if node_dir else ""
    return ServiceSpec(
        service_name=cfg.frontend_service_name,
        app=str(Path(r"C:\Windows\System32\cmd.exe")),
        app_parameters=f'/c {prefix}"{npm_cmd}" run preview -- --host 0.0.0.0 --port {cfg.frontend_ports[0]} --strictPort',
        app_directory=cfg.project_root / "frontend",
        stdout_log=cfg.frontend_log,
        stderr_log=cfg.frontend_log,
    )


def _clear_frontend_vite_cache(cfg: LauncherConfig) -> None:
    vite_cache = cfg.project_root / "frontend" / "node_modules" / ".vite"
    if vite_cache.exists():
        shutil.rmtree(vite_cache, ignore_errors=True)


def _build_frontend(cfg: LauncherConfig) -> CommandResult:
    npm_cmd = _find_npm_cmd()
    return run_cmd([npm_cmd, "run", "build"], cwd=cfg.project_root / "frontend")


def _check_postgres_connection(cfg: LauncherConfig) -> bool:
    python_candidates = [
        cfg.project_root / "backend" / ".venv" / "Scripts" / "python.exe",
        cfg.project_root / "backend" / "venv" / "Scripts" / "python.exe",
        cfg.project_root / ".venv" / "Scripts" / "python.exe",
        cfg.project_root / "venv" / "Scripts" / "python.exe",
    ]
    python_exe = next((candidate for candidate in python_candidates if candidate.exists()), None)
    if python_exe is None:
        python_exe = Path(shutil.which("python.exe") or sys.executable)
    res = run_cmd(
        [
            str(python_exe),
            "-c",
            "from app.core.database import engine; from sqlalchemy import text; "
            "print(engine.connect().execute(text('select 1')).scalar())",
        ],
        cwd=cfg.project_root / "backend",
    )
    return res.ok


def _validate_service_spec(spec: ServiceSpec) -> CommandResult:
    if not Path(spec.app).exists():
        return CommandResult(ok=False, code=1, out="", err=f"No existe ejecutable para servicio {spec.service_name}: {spec.app}")
    if not spec.app_directory.exists():
        return CommandResult(
            ok=False,
            code=1,
            out="",
            err=f"No existe AppDirectory para servicio {spec.service_name}: {spec.app_directory}",
        )
    spec.stdout_log.parent.mkdir(parents=True, exist_ok=True)
    spec.stderr_log.parent.mkdir(parents=True, exist_ok=True)
    return CommandResult(ok=True, code=0, out="", err="")


def _apply_nssm_settings(nssm: Path, spec: ServiceSpec) -> CommandResult:
    settings = [
        ("AppParameters", spec.app_parameters),
        ("AppDirectory", str(spec.app_directory)),
        ("DisplayName", spec.service_name.replace("-", " ")),
        ("Start", "SERVICE_AUTO_START"),
        ("AppStdout", str(spec.stdout_log)),
        ("AppStderr", str(spec.stderr_log)),
        # Evita fallos de inicio por bloqueos en renombrado de log (Event ID 1063).
        ("AppRotateFiles", "0"),
        ("AppRotateOnline", "0"),
    ]
    errs: list[str] = []
    for key, value in settings:
        res = _nssm_set(nssm, spec.service_name, key, value)
        if not res.ok and res.err:
            errs.append(f"{key}: {res.err}")
    if errs:
        return CommandResult(ok=False, code=1, out="", err="\n".join(errs))
    return CommandResult(ok=True, code=0, out=f"{spec.service_name} configurado", err="")


def _reinstall_service(nssm: Path, spec: ServiceSpec) -> CommandResult:
    run_cmd(["sc", "stop", spec.service_name])
    time.sleep(1.0)
    run_cmd(["sc", "delete", spec.service_name])
    time.sleep(1.0)
    install = run_cmd([str(nssm), "install", spec.service_name, spec.app])
    if not install.ok:
        return install
    cfg_res = _apply_nssm_settings(nssm, spec)
    if not cfg_res.ok:
        return cfg_res
    return CommandResult(ok=True, code=0, out=f"{spec.service_name} reinstalado", err="")


def _install_or_repair_service(nssm: Path, spec: ServiceSpec) -> CommandResult:
    valid = _validate_service_spec(spec)
    if not valid.ok:
        return valid
    if _service_exists(spec.service_name):
        if not _service_is_nssm(spec.service_name):
            return _reinstall_service(nssm, spec)
        cfg_res = _apply_nssm_settings(nssm, spec)
        if not cfg_res.ok:
            return cfg_res
        return CommandResult(ok=True, code=0, out=f"{spec.service_name} ya instalado (ajustes aplicados)", err="")

    install = run_cmd([str(nssm), "install", spec.service_name, spec.app])
    if not install.ok:
        return install
    cfg_res = _apply_nssm_settings(nssm, spec)
    if not cfg_res.ok:
        return cfg_res
    return CommandResult(ok=True, code=0, out=f"{spec.service_name} instalado", err="")


def run_cmd(cmd: list[str], cwd: Path | None = None) -> CommandResult:
    def _resolve_cmd(raw_cmd: list[str]) -> list[str]:
        if not raw_cmd:
            return raw_cmd
        exe = raw_cmd[0]
        # Si ya viene con ruta o extensión, no tocar.
        if Path(exe).suffix:
            return raw_cmd
        candidates = [exe]
        if sys.platform.startswith("win"):
            candidates.extend([f"{exe}.cmd", f"{exe}.exe", f"{exe}.bat"])
            node_dir = _nodejs_path_dir()
            if node_dir:
                candidates.extend([str(Path(node_dir) / f"{exe}.cmd"), str(Path(node_dir) / f"{exe}.exe")])
        for candidate in candidates:
            found = shutil.which(candidate)
            if not found and Path(candidate).exists():
                found = candidate
            if found:
                return [found, *raw_cmd[1:]]
        return raw_cmd

    def _decode_output(raw: bytes) -> str:
        # En Windows, herramientas como sc.exe suelen emitir en OEM/ANSI.
        for enc in (
            "utf-8",
            "utf-8-sig",
            "oem",
            locale.getpreferredencoding(False),
            "cp850",
            "cp437",
            "mbcs",
            "cp1252",
            "latin-1",
        ):
            if not enc:
                continue
            try:
                return raw.decode(enc)
            except Exception:
                continue
        return raw.decode("utf-8", errors="replace")

    resolved_cmd = _resolve_cmd(cmd)
    env = None
    node_dir = _nodejs_path_dir()
    if node_dir:
        env = dict(os.environ)
        env["PATH"] = f"{node_dir};{env.get('PATH', '')}"

    try:
        p = subprocess.run(
            resolved_cmd,
            cwd=str(cwd) if cwd else None,
            capture_output=True,
            text=False,
            shell=False,
            env=env,
        )
    except FileNotFoundError:
        return CommandResult(
            ok=False,
            code=1,
            out="",
            err=f"No se encontro el ejecutable: {cmd[0]}",
        )
    out = _decode_output(p.stdout).strip()
    err = _decode_output(p.stderr).strip()
    return CommandResult(ok=p.returncode == 0, code=p.returncode, out=out, err=err)


def query_service_state(name: str) -> str:
    res = run_cmd(["sc", "query", name])
    if not res.ok and "FAILED 1060" in (res.out + " " + res.err):
        return "NOT_INSTALLED"
    blob = (res.out + "\n" + res.err).upper()
    if "RUNNING" in blob:
        return "RUNNING"
    if "STOPPED" in blob:
        return "STOPPED"
    if "START_PENDING" in blob:
        return "START_PENDING"
    if "STOP_PENDING" in blob:
        return "STOP_PENDING"
    return "UNKNOWN"


def _wait_for_service_stop(name: str, timeout: int = 15) -> bool:
    start_t = time.time()
    while time.time() - start_t < timeout:
        state = query_service_state(name)
        if state in ("STOPPED", "NOT_INSTALLED"):
            return True
        time.sleep(1.0)
    return False


def _first_pid_on_port(port: int) -> int | None:
    for conn in psutil.net_connections(kind="tcp"):
        if conn.status == psutil.CONN_LISTEN and conn.laddr and conn.laddr.port == port:
            return conn.pid
    return None


def get_runtime_status(cfg: LauncherConfig) -> RuntimeStatus:
    backend_state = query_service_state(cfg.backend_service_name)
    frontend_state = query_service_state(cfg.frontend_service_name)
    backend_pid = _first_pid_on_port(cfg.backend_port)
    frontend_pids: dict[int, int] = {}
    for p in cfg.frontend_ports:
        pid = _first_pid_on_port(p)
        if pid:
            frontend_pids[p] = pid
    return RuntimeStatus(
        backend_service=backend_state,
        frontend_service=frontend_state,
        backend_port_pid=backend_pid,
        frontend_port_pids=frontend_pids,
    )


def start_services(cfg: LauncherConfig) -> CommandResult:
    cfg.log_dir.mkdir(parents=True, exist_ok=True)
    cleanup_messages = _kill_processes_on_ports([cfg.backend_port, *cfg.frontend_ports])
    _clear_frontend_vite_cache(cfg)
    build_res = _build_frontend(cfg)
    if not build_res.ok:
        return CommandResult(
            ok=False,
            code=build_res.code or 1,
            out=build_res.out,
            err=build_res.err or "No se pudo compilar el frontend antes de iniciar servicios.",
        )

    outs: list[str] = []
    errs: list[str] = []
    code = 0
    if cleanup_messages:
        outs.extend(cleanup_messages)

    try:
        nssm = _ensure_nssm(cfg)
        backend_spec = _backend_service_spec(cfg)
        frontend_spec = _frontend_service_spec(cfg)
    except Exception as exc:
        return CommandResult(ok=False, code=1, out="", err=f"No se pudo preparar NSSM: {exc}")

    i1 = _install_or_repair_service(nssm, backend_spec)
    if i1.out:
        outs.append(i1.out)
    if i1.err:
        errs.append(i1.err)
        code = i1.code or 1

    i2 = _install_or_repair_service(nssm, frontend_spec)
    if i2.out:
        outs.append(i2.out)
    if i2.err:
        errs.append(i2.err)
        code = i2.code or 1

    if errs:
        return CommandResult(ok=False, code=code or 1, out="\n".join(outs), err="\n".join(errs))

    s1 = run_cmd(["sc", "start", cfg.backend_service_name])
    s2 = run_cmd(["sc", "start", cfg.frontend_service_name])
    if s1.out:
        outs.append(s1.out)
    if s2.out:
        outs.append(s2.out)
    if s1.err:
        errs.append(s1.err)
    if s2.err:
        errs.append(s2.err)
    ok = s1.ok and s2.ok
    return CommandResult(ok=ok, code=0 if ok else 1, out="\n".join(outs), err="\n".join(errs))


def stop_services(cfg: LauncherConfig) -> CommandResult:
    outs: list[str] = []
    errs: list[str] = []
    s_front = run_cmd(["sc", "stop", cfg.frontend_service_name])
    s_back = run_cmd(["sc", "stop", cfg.backend_service_name])
    if s_front.out:
        outs.append(s_front.out)
    if s_back.out:
        outs.append(s_back.out)
    if s_front.err:
        errs.append(s_front.err)
    if s_back.err:
        errs.append(s_back.err)
    # stop puede devolver error si ya esta detenido; no lo tratamos fatal
    return CommandResult(ok=True, code=0, out="\n".join(outs) or "Solicitud de parada enviada.", err="\n".join(errs))


def delete_services(cfg: LauncherConfig) -> CommandResult:
    stop_services(cfg)
    time.sleep(1.5)
    outs: list[str] = []
    errs: list[str] = []
    d_front = run_cmd(["sc", "delete", cfg.frontend_service_name])
    d_back = run_cmd(["sc", "delete", cfg.backend_service_name])
    if d_front.out:
        outs.append(d_front.out)
    if d_back.out:
        outs.append(d_back.out)
    if d_front.err:
        errs.append(d_front.err)
    if d_back.err:
        errs.append(d_back.err)
    return CommandResult(ok=True, code=0, out="\n".join(outs) or "Solicitud de borrado enviada.", err="\n".join(errs))


def reinstall_services(cfg: LauncherConfig) -> CommandResult:
    stop = stop_services(cfg)
    time.sleep(1.0)
    delete = delete_services(cfg)
    time.sleep(1.2)
    start = start_services(cfg)

    out_parts = [p for p in [stop.out, delete.out, start.out] if p]
    err_parts = [p for p in [stop.err, delete.err, start.err] if p]
    ok = start.ok
    return CommandResult(
        ok=ok,
        code=0 if ok else (start.code or 1),
        out="\n".join(out_parts),
        err="\n".join(err_parts),
    )


def _kill_processes_on_ports(ports: list[int]) -> list[str]:
    killed = []
    for port in ports:
        for conn in psutil.net_connections(kind="tcp"):
            if conn.status == psutil.CONN_LISTEN and conn.laddr and conn.laddr.port == port:
                try:
                    p = psutil.Process(conn.pid)
                    pname = p.name()
                    p.terminate()
                    killed.append(f"Puerto {port}: Terminado {pname} (PID {conn.pid})")
                except Exception as e:
                    killed.append(f"Puerto {port}: No se pudo terminar PID {conn.pid}: {e}")
    return killed


def restart_services(cfg: LauncherConfig) -> CommandResult:
    outs = ["--- Iniciando reinicio limpio ---"]
    errs = []

    # 1. Parar servicios
    stop_res = stop_services(cfg)
    outs.append("Petición de parada enviada.")
    
    # 2. Esperar a que se detengan realmente
    ok_b = _wait_for_service_stop(cfg.backend_service_name)
    ok_f = _wait_for_service_stop(cfg.frontend_service_name)
    
    if not ok_b or not ok_f:
        outs.append("Advertencia: Los servicios tardan en detenerse. Forzando limpieza de puertos.")
    else:
        outs.append("Servicios detenidos correctamente.")
    
    # 3. Limpieza forzada de puertos (para asegurar)
    ports_to_clean = [cfg.backend_port] + list(cfg.frontend_ports)
    killed_info = _kill_processes_on_ports(ports_to_clean)
    if killed_info:
        outs.extend(killed_info)
    else:
        outs.append("No se detectaron procesos residuales en los puertos.")

    _clear_frontend_vite_cache(cfg)
    outs.append("Cache preoptimizada de Vite limpiada.")
    
    # 4. Iniciar servicios
    start_res = start_services(cfg)
    if start_res.ok:
        outs.append("Servicios reiniciados correctamente.")
    else:
        # Reintento rápido si falló
        time.sleep(1.0)
        start_res = start_services(cfg)
        if start_res.ok:
            outs.append("Servicios reiniciados (tras reintento).")
        else:
            outs.append("Error persistente al iniciar servicios.")
            if start_res.err:
                errs.append(start_res.err)
            
    return CommandResult(
        ok=start_res.ok,
        code=0 if start_res.ok else 1,
        out="\n".join(outs),
        err="\n".join(errs)
    )


def full_check(cfg: LauncherConfig) -> CommandResult:
    parts: list[str] = []
    fails = 0
    node_ok = run_cmd(["node", "-v"]).ok
    npm_ok = run_cmd(["npm", "-v"]).ok
    parts.append(f"node={'OK' if node_ok else 'FAIL'} npm={'OK' if npm_ok else 'FAIL'}")
    if not node_ok:
        fails += 1
    if not npm_ok:
        fails += 1

    backend_ok = run_cmd(
        [
            "powershell",
            "-NoProfile",
            "-Command",
            f"try {{ (Invoke-WebRequest -Uri '{_backend_openapi_url(cfg)}' -UseBasicParsing -TimeoutSec 3).StatusCode | Out-Null; exit 0 }} catch {{ exit 1 }}",
        ]
    ).ok
    parts.append(f"backend={'OK' if backend_ok else 'FAIL'}")
    if not backend_ok:
        fails += 1

    front_ok = False
    for p in cfg.frontend_ports:
        if run_cmd(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                f"try {{ (Invoke-WebRequest -Uri 'http://127.0.0.1:{p}' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 }} catch {{ exit 1 }}",
            ]
        ).ok:
            front_ok = True
            break
    parts.append(f"frontend={'OK' if front_ok else 'FAIL'}")
    if not front_ok:
        fails += 1

    db_ok = _check_postgres_connection(cfg)
    parts.append(f"db={'OK' if db_ok else 'FAIL'}")
    if not db_ok:
        fails += 1

    return CommandResult(ok=fails == 0, code=0 if fails == 0 else 1, out=" | ".join(parts), err="")


def _http_request(url: str, method: str = "GET", headers: dict[str, str] | None = None, data: bytes | None = None) -> tuple[int, bytes]:
    req = urllib.request.Request(url=url, method=method, headers=headers or {}, data=data)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status, resp.read()


def _backend_openapi_url(cfg: LauncherConfig) -> str:
    return f"http://127.0.0.1:{cfg.backend_port}/api/v1/openapi.json"


def api_health_checks(cfg: LauncherConfig) -> list[EndpointHealth]:
    base = f"http://127.0.0.1:{cfg.backend_port}"
    checks: list[EndpointHealth] = []

    # 1) OpenAPI publico
    t0 = time.perf_counter()
    try:
        status, _ = _http_request(_backend_openapi_url(cfg))
        checks.append(
            EndpointHealth(
                name="openapi",
                ok=status == 200,
                status_code=status,
                latency_ms=(time.perf_counter() - t0) * 1000,
            )
        )
    except Exception as exc:
        checks.append(EndpointHealth(name="openapi", ok=False, status_code=None, latency_ms=None, detail=str(exc)))
        return checks

    # 2) Tenantless/public health checks only.
    # The launcher must not authenticate with a real user account because the
    # backend enforces single-session consistency and that would invalidate the
    # active browser session of the operator.
    target_paths = [
        ("paises", "/api/v1/paises/"),
        ("empresas", "/api/v1/empresas/"),
    ]
    for name, path in target_paths:
        t = time.perf_counter()
        try:
            status, _ = _http_request(f"{base}{path}")
            checks.append(
                EndpointHealth(
                    name=name,
                    ok=200 <= status < 300,
                    status_code=status,
                    latency_ms=(time.perf_counter() - t) * 1000,
                )
            )
        except urllib.error.HTTPError as exc:
            checks.append(
                EndpointHealth(
                    name=name,
                    ok=False,
                    status_code=exc.code,
                    latency_ms=(time.perf_counter() - t) * 1000,
                    detail=str(exc),
                )
            )
        except Exception as exc:
            checks.append(EndpointHealth(name=name, ok=False, status_code=None, latency_ms=None, detail=str(exc)))

    return checks


def get_process_metrics(pid: int | None) -> ProcessMetrics | None:
    if not pid:
        return None
    try:
        p = psutil.Process(pid)
        return ProcessMetrics(
            pid=pid,
            name=p.name(),
            cpu_percent=p.cpu_percent(interval=None),
            rss_mb=p.memory_info().rss / (1024 * 1024),
            threads=p.num_threads(),
            uptime_seconds=max(0.0, time.time() - p.create_time()),
        )
    except Exception:
        return None


def get_system_metrics(cfg: LauncherConfig) -> SystemMetrics:
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory().percent

    disk_target = str(cfg.project_root.anchor) if cfg.project_root.anchor else str(cfg.project_root)
    try:
        disk = psutil.disk_usage(disk_target).percent
    except Exception:
        disk = psutil.disk_usage(str(cfg.project_root)).percent

    net = psutil.net_io_counters()
    sent_mb = net.bytes_sent / (1024 * 1024)
    recv_mb = net.bytes_recv / (1024 * 1024)

    clients: set[str] = set()
    for conn in psutil.net_connections(kind="tcp"):
        if conn.status != psutil.CONN_ESTABLISHED:
            continue
        if not conn.laddr or conn.laddr.port != cfg.backend_port:
            continue
        if conn.raddr:
            clients.add(f"{conn.raddr.ip}:{conn.raddr.port}")

    return SystemMetrics(
        cpu_percent=cpu,
        memory_percent=mem,
        disk_percent=disk,
        net_sent_mb=sent_mb,
        net_recv_mb=recv_mb,
        backend_connected_clients=sorted(clients),
    )


def run_platform_checks(cfg: LauncherConfig) -> PlatformCheckResult:
    node_ok = run_cmd(["node", "-v"]).ok
    npm_ok = run_cmd(["npm", "-v"]).ok
    backend_ok = run_cmd(
        [
            "powershell",
            "-NoProfile",
            "-Command",
            f"try {{ (Invoke-WebRequest -Uri '{_backend_openapi_url(cfg)}' -UseBasicParsing -TimeoutSec 3).StatusCode | Out-Null; exit 0 }} catch {{ exit 1 }}",
        ]
    ).ok
    db_ok = _check_postgres_connection(cfg)
    return PlatformCheckResult(
        node_ok=node_ok,
        npm_ok=npm_ok,
        db_ok=db_ok,
        backend_ok=backend_ok,
    )


def _nvidia_gpu_snapshot() -> tuple[str, float | None, float | None, float | None]:
    cmd = [
        "nvidia-smi",
        "--query-gpu=name,utilization.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits",
    ]
    res = run_cmd(cmd)
    if not res.ok or not res.out.strip():
        return ("No detectada", None, None, None)
    line = res.out.strip().splitlines()[0]
    parts = [p.strip() for p in line.split(",")]
    if len(parts) < 4:
        return (parts[0] if parts else "Detectada", None, None, None)
    try:
        util = float(parts[1])
    except Exception:
        util = None
    try:
        used = float(parts[2])
    except Exception:
        used = None
    try:
        total = float(parts[3])
    except Exception:
        total = None
    return (parts[0], util, used, total)


def get_local_ai_diagnostics(cfg: LauncherConfig) -> LocalIADiagnostics:
    base = f"http://127.0.0.1:{cfg.backend_port}"
    try:
        status, _ = _http_request(_backend_openapi_url(cfg))
        backend_reachable = status == 200
    except Exception as exc:
        return LocalIADiagnostics(
            backend_reachable=False,
            auth_ok=False,
            active_engine="desconocido",
            local_profile="desconocido",
            runtime_mode="desconocido",
            runtime_effective="desconocido",
            cuda_available=None,
            gpu_offload=None,
            gpu_name="No detectada",
            gpu_utilization_percent=None,
            gpu_memory_used_mb=None,
            gpu_memory_total_mb=None,
            efficiency="SIN_DATOS",
            detail=f"Backend no disponible: {exc}",
        )

    gpu_name, util, used, total = _nvidia_gpu_snapshot()
    return LocalIADiagnostics(
        backend_reachable=True,
        auth_ok=False,
        active_engine="desconocido",
        local_profile="desconocido",
        runtime_mode="desconocido",
        runtime_effective="desconocido",
        cuda_available=None,
        gpu_offload=None,
        gpu_name=gpu_name,
        gpu_utilization_percent=util,
        gpu_memory_used_mb=used,
        gpu_memory_total_mb=total,
        efficiency="SIN_DATOS",
        detail="Diagnóstico sin autenticación automática para proteger sesiones activas del sistema.",
    )


def get_log_health(log_path: Path, max_lines: int = 800) -> LogHealth:
    if not log_path.exists():
        return LogHealth(errors=0, warnings=0, total_lines=0)
    try:
        lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return LogHealth(errors=0, warnings=0, total_lines=0)
    recent = lines[-max_lines:]
    err = sum(1 for ln in recent if "ERROR" in ln.upper())
    warn = sum(1 for ln in recent if "WARN" in ln.upper() or "WARNING" in ln.upper())
    return LogHealth(errors=err, warnings=warn, total_lines=len(recent))


def parse_auth_activity(log_path: Path, max_lines: int = 4000) -> AuthActivity:
    if not log_path.exists():
        return AuthActivity(login_ok=0, login_fail=0, unique_client_ips=[], recent_events=[])
    try:
        lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return AuthActivity(login_ok=0, login_fail=0, unique_client_ips=[], recent_events=[])

    recent = lines[-max_lines:]
    login_ok = 0
    login_fail = 0
    ips: set[str] = set()
    recent_events: list[dict[str, str]] = []
    pattern = re.compile(
        r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3}):\d+ - "POST /api/v1/auth/login [^"]*" (?P<status>\d{3})',
        flags=re.IGNORECASE,
    )
    ts_pattern = re.compile(
        r"(?P<ts>\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}|\[\d{2}/\d{2}/\d{4}[^\]]+\]|\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\])"
    )

    for ln in recent:
        match = pattern.search(ln)
        if not match:
            continue
        ips.add(match.group("ip"))
        status = int(match.group("status"))
        if 200 <= status < 300:
            login_ok += 1
        else:
            login_fail += 1
        ts_match = ts_pattern.search(ln)
        ts_value = ts_match.group("ts") if ts_match else ""
        if not ts_value:
            # Fallback para logs de acceso sin timestamp (por ejemplo Uvicorn por defecto).
            ts_value = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        recent_events.append(
            {
                "ts": ts_value,
                "ip": match.group("ip"),
                "status": str(status),
            }
        )

    return AuthActivity(
        login_ok=login_ok,
        login_fail=login_fail,
        unique_client_ips=sorted(ips),
        recent_events=recent_events[-8:],
    )


def clear_runtime_logs(cfg: LauncherConfig) -> None:
    cfg.log_dir.mkdir(parents=True, exist_ok=True)
    for p in (cfg.backend_log, cfg.frontend_log, cfg.system_log):
        p.write_text("", encoding="utf-8")


def load_launcher_settings(cfg: LauncherConfig) -> LauncherSettings:
    path = cfg.settings_file
    if not path.exists():
        return LauncherSettings()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return LauncherSettings()

    defaults = LauncherSettings()
    return LauncherSettings(
        status_refresh_ms=int(raw.get("status_refresh_ms", defaults.status_refresh_ms)),
        health_refresh_ms=int(raw.get("health_refresh_ms", defaults.health_refresh_ms)),
        log_refresh_ms=int(raw.get("log_refresh_ms", defaults.log_refresh_ms)),
        cpu_warn_percent=float(raw.get("cpu_warn_percent", defaults.cpu_warn_percent)),
        memory_warn_percent=float(raw.get("memory_warn_percent", defaults.memory_warn_percent)),
        disk_warn_percent=float(raw.get("disk_warn_percent", defaults.disk_warn_percent)),
        latency_p95_warn_ms=float(raw.get("latency_p95_warn_ms", defaults.latency_p95_warn_ms)),
        endpoint_sla_warn_percent=float(raw.get("endpoint_sla_warn_percent", defaults.endpoint_sla_warn_percent)),
        endpoint_p95_warn_ms=float(raw.get("endpoint_p95_warn_ms", defaults.endpoint_p95_warn_ms)),
    )


def save_launcher_settings(cfg: LauncherConfig, settings: LauncherSettings) -> None:
    cfg.settings_file.parent.mkdir(parents=True, exist_ok=True)
    cfg.settings_file.write_text(
        json.dumps(settings.__dict__, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def append_metrics_snapshot(cfg: LauncherConfig, snapshot: dict) -> None:
    cfg.monitor_dir.mkdir(parents=True, exist_ok=True)
    with cfg.monitor_metrics_jsonl.open("a", encoding="utf-8", errors="replace") as f:
        f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")


def append_alert_events(cfg: LauncherConfig, alerts: list[AlertEvent]) -> None:
    if not alerts:
        return
    cfg.monitor_dir.mkdir(parents=True, exist_ok=True)
    with cfg.monitor_alerts_jsonl.open("a", encoding="utf-8", errors="replace") as f:
        for item in alerts:
            f.write(json.dumps(item.__dict__, ensure_ascii=False) + "\n")


def load_recent_alerts(cfg: LauncherConfig, limit: int = 200) -> list[AlertEvent]:
    path = cfg.monitor_alerts_jsonl
    if not path.exists():
        return []
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return []
    out: list[AlertEvent] = []
    for ln in lines[-limit:]:
        try:
            data = json.loads(ln)
            out.append(
                AlertEvent(
                    ts=str(data.get("ts", "")),
                    severity=str(data.get("severity", "INFO")),
                    source=str(data.get("source", "monitor")),
                    message=str(data.get("message", "")),
                )
            )
        except Exception:
            continue
    return out


def export_metrics_csv(cfg: LauncherConfig) -> Path:
    cfg.monitor_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = cfg.monitor_dir / f"metrics_{ts}.csv"
    if not cfg.monitor_metrics_jsonl.exists():
        csv_path.write_text("ts,cpu_percent,memory_percent,disk_percent,net_tx_mb,net_rx_mb,backend_clients\n", encoding="utf-8")
        return csv_path

    rows: list[dict] = []
    for ln in cfg.monitor_metrics_jsonl.read_text(encoding="utf-8", errors="replace").splitlines():
        try:
            rows.append(json.loads(ln))
        except Exception:
            continue

    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["ts", "cpu_percent", "memory_percent", "disk_percent", "net_tx_mb", "net_rx_mb", "backend_clients"],
        )
        writer.writeheader()
        for r in rows:
            writer.writerow(
                {
                    "ts": r.get("ts"),
                    "cpu_percent": r.get("cpu_percent"),
                    "memory_percent": r.get("memory_percent"),
                    "disk_percent": r.get("disk_percent"),
                    "net_tx_mb": r.get("net_tx_mb"),
                    "net_rx_mb": r.get("net_rx_mb"),
                    "backend_clients": r.get("backend_clients"),
                }
            )
    return csv_path


def export_alerts_json(cfg: LauncherConfig, limit: int = 500) -> Path:
    cfg.monitor_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = cfg.monitor_dir / f"alerts_{ts}.json"
    data = [a.__dict__ for a in load_recent_alerts(cfg, limit=limit)]
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def clear_monitor_history(cfg: LauncherConfig) -> None:
    for p in (cfg.monitor_alerts_jsonl, cfg.monitor_metrics_jsonl):
        if p.exists():
            p.unlink()


def export_executive_report(cfg: LauncherConfig) -> tuple[Path, Path]:
    cfg.monitor_reports_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = cfg.monitor_reports_dir / f"executive_report_{ts}.json"
    html_path = cfg.monitor_reports_dir / f"executive_report_{ts}.html"

    status = get_runtime_status(cfg)
    metrics = get_system_metrics(cfg)
    checks = api_health_checks(cfg)
    platform = run_platform_checks(cfg)
    alerts = load_recent_alerts(cfg, limit=120)

    sla_per_endpoint: dict[str, float] = {}
    if cfg.monitor_metrics_jsonl.exists():
        # Placeholder for future richer per-endpoint SLA series; current source is in-memory UI.
        sla_per_endpoint = {}

    payload = {
        "generated_at": datetime.now().isoformat(),
        "runtime_status": status.__dict__,
        "system_metrics": metrics.__dict__,
        "platform_checks": platform.__dict__,
        "api_health": [c.__dict__ for c in checks],
        "recent_alerts": [a.__dict__ for a in alerts],
        "notes": {
            "endpoint_sla_source": "ui_runtime_history",
            "report_scope": "launcher_monitor",
        },
    }
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    ok_checks = sum(1 for c in checks if c.ok)
    total_checks = len(checks)
    alert_warn = sum(1 for a in alerts if a.severity.upper() == "WARN")
    alert_crit = sum(1 for a in alerts if a.severity.upper() == "CRIT")

    html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>GiProy Executive Report</title>
  <style>
    body {{ font-family: Segoe UI, Arial, sans-serif; background:#0f172a; color:#e2e8f0; margin:24px; }}
    .card {{ background:#111827; border:1px solid #1e293b; border-radius:10px; padding:16px; margin-bottom:14px; }}
    h1,h2 {{ margin:0 0 10px; color:#bfdbfe; }}
    table {{ border-collapse:collapse; width:100%; }}
    th,td {{ border:1px solid #1e293b; padding:8px; text-align:left; }}
    th {{ background:#1e293b; }}
    .ok {{ color:#22c55e; font-weight:700; }}
    .bad {{ color:#ef4444; font-weight:700; }}
  </style>
</head>
<body>
  <h1>GiProy Control Center - Executive Report</h1>
  <div class="card">
    <h2>Resumen</h2>
    <p>Generado: {payload["generated_at"]}</p>
    <p>Servicios: backend={status.backend_service}, frontend={status.frontend_service}</p>
    <p>CPU={metrics.cpu_percent:.1f}% | RAM={metrics.memory_percent:.1f}% | Disco={metrics.disk_percent:.1f}%</p>
    <p>Health API: {ok_checks}/{total_checks} checks OK</p>
    <p>Alertas recientes: WARN={alert_warn}, CRIT={alert_crit}</p>
  </div>
  <div class="card">
    <h2>Health API</h2>
    <table>
      <tr><th>Endpoint</th><th>Estado</th><th>HTTP</th><th>Latencia ms</th><th>Detalle</th></tr>
      {''.join([f"<tr><td>{c.name}</td><td class='{'ok' if c.ok else 'bad'}'>{'OK' if c.ok else 'FAIL'}</td><td>{c.status_code}</td><td>{'' if c.latency_ms is None else f'{c.latency_ms:.0f}'}</td><td>{c.detail}</td></tr>" for c in checks])}
    </table>
  </div>
  <div class="card">
    <h2>Alertas recientes</h2>
    <table>
      <tr><th>Fecha</th><th>Nivel</th><th>Origen</th><th>Mensaje</th></tr>
      {''.join([f"<tr><td>{a.ts}</td><td>{a.severity}</td><td>{a.source}</td><td>{a.message}</td></tr>" for a in alerts[:80]])}
    </table>
  </div>
</body>
</html>
"""
    html_path.write_text(html, encoding="utf-8")
    return json_path, html_path


def percentile(values: list[float], q: float) -> float:
    if not values:
        return 0.0
    v = sorted(values)
    idx = (len(v) - 1) * q
    lo = math.floor(idx)
    hi = math.ceil(idx)
    if lo == hi:
        return v[lo]
    frac = idx - lo
    return v[lo] * (1.0 - frac) + v[hi] * frac


def export_diagnostics_zip(cfg: LauncherConfig) -> Path:
    out_dir = cfg.project_root / ".runtime" / "diagnostics"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_path = out_dir / f"nuria_diagnostics_{ts}.zip"

    status = get_runtime_status(cfg)
    metrics = get_system_metrics(cfg)
    checks = run_platform_checks(cfg)
    health = api_health_checks(cfg)

    summary = {
        "generated_at": datetime.now().isoformat(),
        "runtime_status": {
            "backend_service": status.backend_service,
            "frontend_service": status.frontend_service,
            "backend_port_pid": status.backend_port_pid,
            "frontend_port_pids": status.frontend_port_pids,
        },
        "system_metrics": {
            "cpu_percent": metrics.cpu_percent,
            "memory_percent": metrics.memory_percent,
            "disk_percent": metrics.disk_percent,
            "net_sent_mb": metrics.net_sent_mb,
            "net_recv_mb": metrics.net_recv_mb,
            "backend_connected_clients": metrics.backend_connected_clients,
        },
        "platform_checks": checks.__dict__,
        "api_health": [h.__dict__ for h in health],
    }

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("summary.json", json.dumps(summary, ensure_ascii=False, indent=2))
        for p in (cfg.backend_log, cfg.frontend_log, cfg.system_log):
            if p.exists():
                zf.write(p, arcname=f"logs/{p.name}")
    return zip_path
