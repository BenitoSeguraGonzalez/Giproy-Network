import argparse
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.services.formula_polinomica import formula_polinomica_service


DEFAULT_EMPRESA_ID = 3
DEFAULT_PROJECT_NAME = "PROYECTO PRUEBA COMPARTIR 1"
DEFAULT_TEMP_SYMBOL = "X"


def _resolve_budget(db, empresa_id: int, project_name: str):
    proyecto = (
        db.query(Proyecto)
        .filter(
            Proyecto.empresa_id == empresa_id,
            Proyecto.nombre.ilike(f"%{project_name}%"),
        )
        .order_by(Proyecto.id.desc())
        .first()
    )
    if proyecto is None:
        raise RuntimeError(f"Proyecto no encontrado para empresa {empresa_id}: {project_name}")

    presupuesto = (
        db.query(Presupuesto)
        .filter(Presupuesto.proyecto_id == proyecto.id)
        .order_by(Presupuesto.revision.desc(), Presupuesto.id.desc())
        .first()
    )
    if presupuesto is None:
        raise RuntimeError(f"Presupuesto no encontrado para proyecto {proyecto.id}")

    return proyecto, presupuesto


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke real reversible para Formula Polinomica sobre Santiago Bermeo."
    )
    parser.add_argument("--empresa-id", type=int, default=DEFAULT_EMPRESA_ID)
    parser.add_argument("--project-name", default=DEFAULT_PROJECT_NAME)
    parser.add_argument("--temp-symbol", default=DEFAULT_TEMP_SYMBOL)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        proyecto, presupuesto = _resolve_budget(db, args.empresa_id, args.project_name)
        resources_before = formula_polinomica_service.get_formula_resources(db, presupuesto.id)
        pending_before = [r for r in resources_before if not (r.get("termino_actual") or "").strip()]
        formula_before = formula_polinomica_service.get_formula(db, presupuesto.id)
        if formula_before is not None:
            formula_before = formula_polinomica_service.decorate_formula_view(db, presupuesto.id, formula_before)

        print(f"project_id={proyecto.id}")
        print(f"budget_id={presupuesto.id}")
        print(f"resources_detected_before={len(resources_before)}")
        print(f"resources_pending_before={len(pending_before)}")
        print(f"formula_exists_before={formula_before is not None}")
        print(
            "formula_complete_before="
            f"{getattr(formula_before, 'is_complete', False) if formula_before else False}"
        )
        print(
            "formula_general_before="
            f"{getattr(formula_before, 'formula_general', '') if formula_before else ''}"
        )

        if not pending_before:
            print("no_pending_resources_for_temp_assignment=true")
            return 0

        original_assignments = [
            {
                "recurso_id": resource["recurso_id"],
                "simbolo": resource.get("termino_actual") or "",
            }
            for resource in pending_before
        ]
        pending_ids = [resource["recurso_id"] for resource in pending_before]

        try:
            formula_polinomica_service.save_assignments(
                db,
                presupuesto.id,
                [{"recurso_id": recurso_id, "simbolo": args.temp_symbol} for recurso_id in pending_ids],
            )
            formula_after = formula_polinomica_service.regenerate_formula(
                db,
                presupuesto.id,
                tipo=(formula_before.tipo if formula_before and formula_before.tipo else "SIN_DESGLOSE"),
            )

            print(f"resources_pending_after={getattr(formula_after, 'resources_pending', None)}")
            print(f"formula_complete_after={getattr(formula_after, 'is_complete', False)}")
            print(f"formula_general_after={getattr(formula_after, 'formula_general', '')}")
            print("monomios_after=")
            for monomio in formula_after.monomios:
                print(
                    "  "
                    f"{monomio.simbolo}|coef={monomio.coeficiente}|"
                    f"indice_codigo={getattr(monomio, 'indice_codigo', None)}|"
                    f"indice_descripcion={getattr(monomio, 'indice_descripcion', None)}|"
                    f"subtotal={getattr(monomio, 'subtotal_termino', None)}"
                )
            print("cuadrilla_after=")
            for item in formula_after.cuadrilla_tipo[:5]:
                print(
                    "  "
                    f"recurso={item.recurso_id}|codigo={getattr(item, 'recurso_codigo', None)}|"
                    f"indice_codigo={getattr(item, 'indice_codigo', None)}|"
                    f"indice_descripcion={getattr(item, 'indice_descripcion', None)}|"
                    f"coef={item.coeficiente_incidencia}"
                )
        finally:
            formula_polinomica_service.save_assignments(db, presupuesto.id, original_assignments)
            restored = formula_polinomica_service.regenerate_formula(
                db,
                presupuesto.id,
                tipo=(formula_before.tipo if formula_before and formula_before.tipo else "SIN_DESGLOSE"),
            )
            print(f"state_restored_pending={getattr(restored, 'resources_pending', None)}")
            print(f"state_restored_complete={getattr(restored, 'is_complete', False)}")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
