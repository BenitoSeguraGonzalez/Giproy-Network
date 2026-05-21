from __future__ import annotations

import argparse
import sys
import os
import ctypes
from pathlib import Path

from PySide6.QtGui import QFont, QIcon
from PySide6.QtCore import QLockFile
from PySide6.QtWidgets import QApplication, QMessageBox

from launcher_app.config import default_config
from launcher_app.ops import delete_services, elevate_self, install_project_bridge, is_admin, reinstall_services, restart_services, start_services, stop_services, uninstall_project_bridge
from launcher_app.ui.main_window import MainWindow
from launcher_app.ui.styles import APP_QSS


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="GiProy Control Center")
    parser.add_argument(
        "--elevated-action",
        choices=["start_services", "stop_services", "restart_services", "delete_services", "reinstall_services", "install_project_bridge", "uninstall_project_bridge"],
        default=None,
    )
    return parser.parse_args()


def run_elevated_action(action: str) -> int:
    cfg = default_config()
    if not is_admin():
        print("Esta accion requiere ejecutar la aplicacion como administrador.")
        return 1

    if action == "start_services":
        result = start_services(cfg)
    elif action == "stop_services":
        result = stop_services(cfg)
    elif action == "restart_services":
        result = restart_services(cfg)
    elif action == "delete_services":
        result = delete_services(cfg)
    elif action == "install_project_bridge":
        result = install_project_bridge(cfg)
    elif action == "uninstall_project_bridge":
        result = uninstall_project_bridge(cfg)
    else:
        result = reinstall_services(cfg)

    cfg.log_dir.mkdir(parents=True, exist_ok=True)
    with cfg.system_log.open("a", encoding="utf-8", errors="replace") as f:
        f.write(f"[elevated] action={action} code={result.code}\n")
        if result.out:
            for ln in result.out.splitlines():
                f.write(f"[elevated][out] {ln}\n")
        if result.err:
            for ln in result.err.splitlines():
                f.write(f"[elevated][err] {ln}\n")

    print(result.out)
    if result.err:
        print(result.err)
    return 0 if result.ok else result.code


def main() -> int:
    # 0. Mitigar errores de fuentes DirectWrite (8514oem) en Windows
    if sys.platform == 'win32':
        os.environ["QT_DIRECTWRITE_SYSTEMFONTS"] = "0"
        os.environ["QT_LOGGING_RULES"] = "qt.qpa.fonts.warning=false"
        # Forzar sustitucion de fuente problematica
        QFont.insertSubstitution("8514oem", "Segoe UI")

    # 1. Forzar Elevacion de Privilegios (Admin)
    if not is_admin():
        if elevate_self(sys.argv[1:]):
            return 0
        else:
            print("Error: Privilegios de administrador requeridos.")
            return 1

    args = parse_args()
    if args.elevated_action:
        return run_elevated_action(args.elevated_action)

    cfg = default_config()
    cfg.log_dir.mkdir(parents=True, exist_ok=True)
    lock_path = str(Path(cfg.log_dir / "launcher.lock").resolve())
    lock = QLockFile(lock_path)
    lock.setStaleLockTime(30_000)
    if not lock.tryLock(100):
        app = QApplication(sys.argv)
        QMessageBox.warning(
            None,
            "Instancia en ejecucion",
            "GiProy Control Center ya esta abierto en este equipo.\nCierra la instancia actual antes de abrir otra.",
        )
        return 1

    # Fix taskbar icon on Windows (must be called BEFORE any window is created)
    if sys.platform == 'win32':
        # Refresh ID to force Windows to re-evaluate the process icon identity
        myappid = u'giproy.erp.controlcenter.v1.1' 
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    app.setApplicationName("GiProy Control Center")
    
    # Set application icon globally
    logo_path = cfg.project_root / "assets" / "LogoSoft.png"
    if logo_path.exists():
        icon = QIcon(str(logo_path))
        app.setWindowIcon(icon)
    else:
        # Fallback search if path is different in dev
        alt_logo = Path(__file__).parent / "assets" / "LogoSoft.png"
        if alt_logo.exists():
            app.setWindowIcon(QIcon(str(alt_logo)))
    
    app.setFont(QFont("Segoe UI", 10))
    app.setStyleSheet(APP_QSS)
    app._single_instance_lock = lock

    w = MainWindow(cfg)
    if logo_path.exists():
        w.setWindowIcon(QIcon(str(logo_path)))
    w.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
