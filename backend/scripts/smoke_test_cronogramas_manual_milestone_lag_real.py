import argparse
import copy
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import joinedload


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.schemas.cronograma_trabajo import CronogramaTrabajoConfig, CronogramaTrabajoUpdate
from app.services.cronograma_trabajo import cronograma_trabajo_service


DEFAULT_EMPRESA = "Santiago Bermeo"
DEFAULT_PROYECTO = "SantiagoBermeo-2026-001"
DEFAULT_PRESUPUESTO_ID = 13
DEFAULT_ANCHOR = "49"
DEFAULT_TARGET = "271"
DEFAULT_LAG_FROM = 0.0
DEFAULT_LAG_TO = 3.0


def _resolve_budget(db, empresa_nombre: str, proyecto_nombre: str, presupuesto_id: int | None):
    empresa = db.query(Empresa).filter(Empresa.nombre == empresa_nombre).first()
    if not empresa:
        raise RuntimeError(f"Empresa no encontrada: {empresa_nombre}")

    presupuesto_query = (
        db.query(Presupuesto)
        .options(joinedload(Presupuesto.proyecto))
        .filter(Presupuesto.empresa_id == empresa.id)
    )

    presupuesto = None
    if presupuesto_id:
        presupuesto = presupuesto_query.filter(Presupuesto.id == presupuesto_id).first()
    if presupuesto is None and proyecto_nombre:
        presupuesto = (
            presupuesto_query
            .filter(Presupuesto.proyecto.has(nombre=proyecto_nombre))
            .order_by(Presupuesto.id.asc())
            .first()
        )
    if presupuesto is None:
        presupuesto = presupuesto_query.order_by(Presupuesto.id.asc()).first()
    if presupuesto is None:
        raise RuntimeError(f"No se encontró presupuesto operativo para {empresa_nombre}")
    return empresa, presupuesto


def _load_schedule(db, empresa_id: int, presupuesto_id: int) -> CronogramaTrabajo:
    schedule = (
        db.query(CronogramaTrabajo)
        .filter(
            CronogramaTrabajo.empresa_id == empresa_id,
            CronogramaTrabajo.presupuesto_id == presupuesto_id,
        )
        .first()
    )
    if not schedule:
        raise RuntimeError(f"Cronograma Trabajo no encontrado para presupuesto {presupuesto_id}")
    return schedule


def _split_schedule_payload(schedule_data: dict):
    return cronograma_trabajo_service._split_schedule_payload(schedule_data or {})


def _save_config(db, *, presupuesto_id: int, proyecto_id: int, empresa_id: int, raw_config: dict):
    config_model = CronogramaTrabajoConfig(**raw_config)
    update_model = CronogramaTrabajoUpdate(config=config_model, schedule_data={})
    response = cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto_id,
        proyecto_id=proyecto_id,
        empresa_id=empresa_id,
        obj_in=update_model,
    )
    if response is None:
        raise RuntimeError("update_schedule devolvió None")
    return response


def _assert(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)


def main() -> int:
    parser = argparse.ArgumentParser(description="Prueba real de persistencia de lag en dependencias de hitos manuales.")
    parser.add_argument("--empresa", default=DEFAULT_EMPRESA)
    parser.add_argument("--proyecto", default=DEFAULT_PROYECTO)
    parser.add_argument("--presupuesto-id", type=int, default=DEFAULT_PRESUPUESTO_ID)
    parser.add_argument("--anchor", default=DEFAULT_ANCHOR)
    parser.add_argument("--target", default=DEFAULT_TARGET)
    parser.add_argument("--lag-from", type=float, default=DEFAULT_LAG_FROM)
    parser.add_argument("--lag-to", type=float, default=DEFAULT_LAG_TO)
    args = parser.parse_args()

    db = SessionLocal()
    original_schedule_data = None
    presupuesto = None
    empresa = None
    milestone_id = f"smoke-lag-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    try:
        empresa, presupuesto = _resolve_budget(
            db,
            empresa_nombre=args.empresa,
            proyecto_nombre=args.proyecto,
            presupuesto_id=args.presupuesto_id,
        )
        schedule = _load_schedule(db, empresa.id, presupuesto.id)
        original_schedule_data = copy.deepcopy(schedule.schedule_data or {})
        raw_config, _ = _split_schedule_payload(original_schedule_data)
        manual_milestones = list(raw_config.get("manual_milestones") or [])
        baseline_start = raw_config.get("fecha_inicio_proyecto") or raw_config.get("fecha_inicio") or "2026-03-24T08:00:00"

        temporary_milestone = {
            "id": milestone_id,
            "after_line_id": str(args.anchor),
            "display_after_line_id": str(args.anchor),
            "descripcion": "Smoke lag milestone Santiago Bermeo",
            "start_date": baseline_start,
            "predecessors": [],
            "dependencies": [],
            "successor_dependencies": [
                {
                    "source_id": f"manual-milestone:{milestone_id}",
                    "target_id": str(args.target),
                    "type": "FS",
                    "lag_days": float(args.lag_from),
                    "lag_unit": "day",
                    "lag_mode": "duration",
                    "metadata": {"manual_milestone_sequence": True, "smoke": "lag"},
                }
            ],
        }

        create_config = {**raw_config, "manual_milestones": [*manual_milestones, temporary_milestone]}
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=create_config,
        )
        db.expire_all()
        created_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        created_config, _ = _split_schedule_payload(created_schedule.schedule_data or {})
        created_entry = next((entry for entry in created_config.get("manual_milestones", []) if str(entry.get("id")) == milestone_id), None)
        _assert(created_entry is not None, "No se persistió el hito temporal para prueba de lag.")
        _assert(
            float(created_entry["successor_dependencies"][0]["lag_days"]) == float(args.lag_from),
            f"Lag inicial inesperado: {created_entry['successor_dependencies']!r}",
        )

        updated_entry = copy.deepcopy(created_entry)
        updated_entry["successor_dependencies"][0]["lag_days"] = float(args.lag_to)
        update_config = {
            **created_config,
            "manual_milestones": [
                updated_entry if str(entry.get("id")) == milestone_id else entry
                for entry in created_config.get("manual_milestones", [])
            ],
        }
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=update_config,
        )
        db.expire_all()
        updated_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        updated_config, _ = _split_schedule_payload(updated_schedule.schedule_data or {})
        updated_saved_entry = next((entry for entry in updated_config.get("manual_milestones", []) if str(entry.get("id")) == milestone_id), None)
        _assert(updated_saved_entry is not None, "El hito temporal desapareció tras actualizar lag.")
        _assert(
            float(updated_saved_entry["successor_dependencies"][0]["lag_days"]) == float(args.lag_to),
            f"El lag final no persistió correctamente: {updated_saved_entry['successor_dependencies']!r}",
        )

        print({
            "empresa": empresa.nombre,
            "presupuesto_id": presupuesto.id,
            "milestone_id": milestone_id,
            "target_line_id": str(args.target),
            "lag_before": float(args.lag_from),
            "lag_after": float(updated_saved_entry["successor_dependencies"][0]["lag_days"]),
            "persisted": True,
        })
        return 0
    finally:
        if original_schedule_data is not None and presupuesto is not None and empresa is not None:
            try:
                raw_config, _ = _split_schedule_payload(original_schedule_data)
                _save_config(
                    db,
                    presupuesto_id=presupuesto.id,
                    proyecto_id=presupuesto.proyecto_id,
                    empresa_id=empresa.id,
                    raw_config=raw_config,
                )
                db.commit()
            except Exception:
                db.rollback()
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
