import io
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.services.reporting import reporting_service


TARGET_EMPRESA = "Santiago Bermeo"


def main() -> int:
    db = SessionLocal()
    try:
        empresa = (
            db.query(Empresa)
            .filter(Empresa.nombre == TARGET_EMPRESA)
            .first()
        )
        if not empresa:
            print(f"ERROR: Empresa no encontrada: {TARGET_EMPRESA}")
            return 1

        presupuesto = (
            db.query(Presupuesto)
            .filter(Presupuesto.empresa_id == empresa.id)
            .order_by(Presupuesto.id.asc())
            .first()
        )
        if not presupuesto:
            print(f"ERROR: No hay presupuestos para empresa {TARGET_EMPRESA}")
            return 1

        print(
            f"SMOKE: Empresa={empresa.nombre} Presupuesto={presupuesto.id} "
            f"Descripcion={presupuesto.descripcion}"
        )

        report_buffer = reporting_service.generate_presupuesto_report(
            db,
            presupuesto.id,
            empresa.id,
            "001",
        )
        report_bytes = report_buffer.getvalue()
        if len(report_bytes) == 0:
            print("ERROR: El Excel de presupuesto salió vacío")
            return 1
        print(f"OK: Excel presupuesto generado ({len(report_bytes)} bytes)")

        bundle_buffer = reporting_service.generate_presupuesto_report_bundle(
            db,
            presupuesto.id,
            empresa.id,
            "001",
        )
        bundle_bytes = bundle_buffer.getvalue()
        if len(bundle_bytes) == 0:
            print("ERROR: El Excel presupuesto + APUs salió vacío")
            return 1
        print(f"OK: Excel presupuesto + APUs generado ({len(bundle_bytes)} bytes)")

        print("SMOKE TEST: PASS")
        return 0
    except Exception as exc:
        print(f"SMOKE TEST: FAIL -> {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
