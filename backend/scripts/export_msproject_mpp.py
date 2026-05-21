from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _run_export(xml_path: Path, mpp_path: Path, open_after_export: bool) -> int:
    try:
        import pythoncom  # type: ignore
        from win32com.client import DispatchEx  # type: ignore
    except Exception as exc:  # pragma: no cover - defensive runtime path
        print(f"No se pudo cargar pywin32 para automatizar Microsoft Project: {exc}", file=sys.stderr)
        return 2

    project = None
    pythoncom.CoInitialize()
    try:
        project = DispatchEx("MSProject.Application")
        project.Visible = False
        project.DisplayAlerts = False
        project.FileOpen(str(xml_path))
        project.FileSaveAs(str(mpp_path))
        if not mpp_path.exists():
            print("Microsoft Project no generó el archivo .mpp esperado.", file=sys.stderr)
            return 3

        if open_after_export:
            project.Visible = True
            project.DisplayAlerts = True
            project.WindowState = 1
            project = None
        else:
            try:
                project.FileCloseAllEx(0)
            except Exception:
                try:
                    project.FileCloseAll(0)
                except Exception:
                    pass
        return 0
    except Exception as exc:  # pragma: no cover - depends on local MS Project/COM state
        print(
            f"Microsoft Project no pudo generar o abrir el archivo .mpp desde el cronograma: {exc}",
            file=sys.stderr,
        )
        return 1
    finally:
        if project is not None:
            try:
                project.Quit()
            except Exception:
                pass
        pythoncom.CoUninitialize()


def main() -> int:
    parser = argparse.ArgumentParser(description="Exporta un XML MSPDI a MPP usando Microsoft Project.")
    parser.add_argument("--xml", required=True, help="Ruta del archivo XML fuente")
    parser.add_argument("--mpp", required=True, help="Ruta del archivo MPP de salida")
    parser.add_argument("--open-after-export", action="store_true", help="Dejar Microsoft Project abierto con el MPP cargado")
    args = parser.parse_args()

    return _run_export(Path(args.xml), Path(args.mpp), args.open_after_export)


if __name__ == "__main__":
    raise SystemExit(main())
