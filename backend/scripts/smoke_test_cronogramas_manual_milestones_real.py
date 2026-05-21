import argparse
import copy
import json
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
from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoConfig,
    CronogramaTrabajoUpdate,
)
from app.services.cronograma_trabajo import cronograma_trabajo_service


DEFAULT_EMPRESA = "Santiago Bermeo"
DEFAULT_PROYECTO = "SantiagoBermeo-2026-001"
DEFAULT_PRESUPUESTO_ID = 13
DEFAULT_MOVE_FROM_ANCHOR = "49"
DEFAULT_MOVE_TO_ANCHOR = "76"
DEFAULT_SUCCESSOR_TARGET = "271"
DEFAULT_PREDECESSOR_SOURCE = "49"


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
        raise RuntimeError(
            f"No se encontró presupuesto operativo para {empresa_nombre}"
        )

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
        raise RuntimeError(
            f"Cronograma Trabajo no encontrado para presupuesto {presupuesto_id}"
        )
    return schedule


def _split_schedule_payload(schedule_data: dict):
    return cronograma_trabajo_service._split_schedule_payload(schedule_data or {})


def _save_config(
    db,
    *,
    presupuesto_id: int,
    proyecto_id: int,
    empresa_id: int,
    raw_config: dict,
):
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


def _read_manual_milestones(schedule_data: dict):
    config, _ = _split_schedule_payload(schedule_data)
    return list(config.get("manual_milestones") or [])


def _find_milestone(manual_milestones: list[dict], milestone_id: str):
    for milestone in manual_milestones:
        if str(milestone.get("id") or "").strip() == milestone_id:
            return milestone
    return None


def _assert(condition: bool, message: str):
    if not condition:
        raise AssertionError(message)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prueba real de persistencia de hitos manuales sobre Santiago Bermeo."
    )
    parser.add_argument("--empresa", default=DEFAULT_EMPRESA)
    parser.add_argument("--proyecto", default=DEFAULT_PROYECTO)
    parser.add_argument("--presupuesto-id", type=int, default=DEFAULT_PRESUPUESTO_ID)
    parser.add_argument("--move-from-anchor", default=DEFAULT_MOVE_FROM_ANCHOR)
    parser.add_argument("--move-to-anchor", default=DEFAULT_MOVE_TO_ANCHOR)
    parser.add_argument("--successor-target", default=DEFAULT_SUCCESSOR_TARGET)
    parser.add_argument("--predecessor-source", default=DEFAULT_PREDECESSOR_SOURCE)
    args = parser.parse_args()

    db = SessionLocal()
    original_schedule_data = None
    milestone_id = f"smoke-{datetime.now().strftime('%Y%m%d%H%M%S')}"
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
        existing_manual_milestones = list(raw_config.get("manual_milestones") or [])

        baseline_start = (
            raw_config.get("fecha_inicio_proyecto")
            or raw_config.get("fecha_inicio")
            or "2026-03-24T08:00:00"
        )

        temporary_milestone = {
            "id": milestone_id,
            "after_line_id": str(args.move_from_anchor),
            "display_after_line_id": str(args.move_from_anchor),
            "descripcion": "Smoke milestone Santiago Bermeo",
            "start_date": baseline_start,
            "predecessors": [],
            "dependencies": [],
            "successor_dependencies": [],
        }

        create_config = {
            **raw_config,
            "manual_milestones": [*existing_manual_milestones, temporary_milestone],
        }
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=create_config,
        )
        db.expire_all()
        created_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        created_milestones = _read_manual_milestones(created_schedule.schedule_data or {})
        created_entry = _find_milestone(created_milestones, milestone_id)
        _assert(created_entry is not None, "El hito temporal no se persistió en la creación.")
        _assert(
            str(created_entry.get("after_line_id")) == str(args.move_from_anchor),
            f"El hito temporal se creó con after_line_id inesperado: {created_entry!r}",
        )

        moved_milestone = {
            **created_entry,
            "after_line_id": str(args.move_to_anchor),
            "display_after_line_id": str(args.move_to_anchor),
        }
        moved_config = {
            **create_config,
            "manual_milestones": [
                moved_milestone if str(entry.get("id")) == milestone_id else entry
                for entry in created_milestones
            ],
        }
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=moved_config,
        )
        db.expire_all()
        moved_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        moved_milestones = _read_manual_milestones(moved_schedule.schedule_data or {})
        moved_entry = _find_milestone(moved_milestones, milestone_id)
        _assert(moved_entry is not None, "El hito temporal desapareció al moverlo.")
        _assert(
            str(moved_entry.get("after_line_id")) == str(args.move_to_anchor)
            and str(moved_entry.get("display_after_line_id")) == str(args.move_to_anchor),
            f"El movimiento del hito no persistió correctamente: {moved_entry!r}",
        )

        hito_to_tarea_dependency = {
            "source_id": f"manual-milestone:{milestone_id}",
            "target_id": str(args.successor_target),
            "type": "FS",
            "lag_days": 0.0,
            "lag_unit": "day",
            "metadata": {"manual_milestone_sequence": True, "smoke": "hito->tarea"},
        }
        successor_entry = {
            **moved_entry,
            "successor_dependencies": [hito_to_tarea_dependency],
        }
        successor_config = {
            **moved_config,
            "manual_milestones": [
                successor_entry if str(entry.get("id")) == milestone_id else entry
                for entry in moved_milestones
            ],
        }
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=successor_config,
        )
        db.expire_all()
        successor_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        successor_milestones = _read_manual_milestones(successor_schedule.schedule_data or {})
        successor_saved_entry = _find_milestone(successor_milestones, milestone_id)
        _assert(successor_saved_entry is not None, "El hito temporal desapareció tras secuenciar hito->tarea.")
        saved_successors = list(successor_saved_entry.get("successor_dependencies") or [])
        _assert(
            len(saved_successors) == 1
            and str(saved_successors[0].get("target_id")) == str(args.successor_target),
            f"La secuenciación hito->tarea no persistió correctamente: {saved_successors!r}",
        )

        tarea_to_hito_dependency = {
            "source_id": str(args.predecessor_source),
            "target_id": f"manual-milestone:{milestone_id}",
            "type": "FS",
            "lag_days": 0.0,
            "lag_unit": "day",
            "metadata": {"manual_milestone_sequence": True, "smoke": "tarea->hito"},
        }
        bidirectional_entry = {
            **successor_saved_entry,
            "dependencies": [tarea_to_hito_dependency],
            "predecessors": [str(args.predecessor_source)],
        }
        bidirectional_config = {
            **successor_config,
            "manual_milestones": [
                bidirectional_entry if str(entry.get("id")) == milestone_id else entry
                for entry in successor_milestones
            ],
        }
        _save_config(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
            raw_config=bidirectional_config,
        )
        db.expire_all()
        final_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        final_milestones = _read_manual_milestones(final_schedule.schedule_data or {})
        final_entry = _find_milestone(final_milestones, milestone_id)
        _assert(final_entry is not None, "El hito temporal desapareció tras secuenciar tarea->hito.")
        final_dependencies = list(final_entry.get("dependencies") or [])
        final_predecessors = list(final_entry.get("predecessors") or [])
        _assert(
            len(final_dependencies) == 1
            and str(final_dependencies[0].get("source_id")) == str(args.predecessor_source),
            f"La secuenciación tarea->hito no persistió correctamente: {final_dependencies!r}",
        )
        _assert(
            final_predecessors == [str(args.predecessor_source)],
            f"Los predecesores del hito no se guardaron correctamente: {final_predecessors!r}",
        )

        print(
            json.dumps(
                {
                    "empresa": args.empresa,
                    "empresa_id": empresa.id,
                    "proyecto": getattr(presupuesto.proyecto, "nombre", None),
                    "proyecto_id": presupuesto.proyecto_id,
                    "presupuesto_id": presupuesto.id,
                    "milestone_id": milestone_id,
                    "results": {
                        "create": {
                            "after_line_id": created_entry.get("after_line_id"),
                            "display_after_line_id": created_entry.get("display_after_line_id"),
                        },
                        "move": {
                            "after_line_id": moved_entry.get("after_line_id"),
                            "display_after_line_id": moved_entry.get("display_after_line_id"),
                        },
                        "hito_to_tarea": saved_successors,
                        "tarea_to_hito": {
                            "dependencies": final_dependencies,
                            "predecessors": final_predecessors,
                        },
                    },
                    "status": "ok",
                },
                ensure_ascii=False,
                indent=2,
                default=str,
            )
        )
        return 0
    finally:
        if original_schedule_data is not None:
            try:
                schedule = _load_schedule(db, empresa.id, presupuesto.id)
                schedule.schedule_data = original_schedule_data
                db.add(schedule)
                db.commit()
            except Exception:
                db.rollback()
                raise
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
