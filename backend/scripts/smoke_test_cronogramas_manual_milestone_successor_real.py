import argparse
import copy
import json
import sys
from pathlib import Path


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
DEFAULT_PRESUPUESTO_ID = 13
DEFAULT_TARGET_LINE_ID = "49"


def _assert(condition, message):
    if not condition:
        raise AssertionError(message)


def _resolve_budget(db, empresa_nombre, presupuesto_id):
    empresa = db.query(Empresa).filter(Empresa.nombre == empresa_nombre).first()
    if not empresa:
        raise RuntimeError(f"Empresa no encontrada: {empresa_nombre}")
    presupuesto = (
        db.query(Presupuesto)
        .filter(Presupuesto.empresa_id == empresa.id, Presupuesto.id == presupuesto_id)
        .first()
    )
    if not presupuesto:
        raise RuntimeError(f"Presupuesto no encontrado: {presupuesto_id}")
    return empresa, presupuesto


def _load_schedule(db, empresa_id, presupuesto_id):
    schedule = (
        db.query(CronogramaTrabajo)
        .filter(
            CronogramaTrabajo.empresa_id == empresa_id,
            CronogramaTrabajo.presupuesto_id == presupuesto_id,
        )
        .first()
    )
    if not schedule:
        raise RuntimeError("Cronograma de trabajo no encontrado.")
    return schedule


def _save_config(db, presupuesto, empresa, raw_config):
    response = cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=presupuesto.proyecto_id,
        empresa_id=empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            config=CronogramaTrabajoConfig(**raw_config),
            schedule_data={},
        ),
    )
    if response is None:
        raise RuntimeError("update_schedule devolvio None")
    return response


def _manual_milestones_from_schedule_data(schedule_data):
    config, _lineas = cronograma_trabajo_service._split_schedule_payload(schedule_data or {})
    return config, list(config.get("manual_milestones") or [])


def _find_milestone(milestones, milestone_id):
    return next(
        (entry for entry in milestones if str(entry.get("id") or "").strip() == milestone_id),
        None,
    )


def main():
    parser = argparse.ArgumentParser(
        description="Smoke real reversible: hito manual existente -> tarea real en Santiago Bermeo."
    )
    parser.add_argument("--empresa", default=DEFAULT_EMPRESA)
    parser.add_argument("--presupuesto-id", type=int, default=DEFAULT_PRESUPUESTO_ID)
    parser.add_argument("--target-line-id", default=DEFAULT_TARGET_LINE_ID)
    parser.add_argument("--milestone-id", default="")
    args = parser.parse_args()

    db = SessionLocal()
    original_schedule_data = None
    empresa = None
    presupuesto = None
    try:
        empresa, presupuesto = _resolve_budget(db, args.empresa, args.presupuesto_id)
        schedule = _load_schedule(db, empresa.id, presupuesto.id)
        original_schedule_data = copy.deepcopy(schedule.schedule_data or {})
        raw_config, manual_milestones = _manual_milestones_from_schedule_data(original_schedule_data)
        _assert(manual_milestones, "No hay hitos manuales reales para probar.")

        milestone = (
            _find_milestone(manual_milestones, args.milestone_id)
            if args.milestone_id
            else manual_milestones[0]
        )
        _assert(milestone is not None, f"Hito manual no encontrado: {args.milestone_id}")

        milestone_id = str(milestone.get("id") or "").strip()
        target_line_id = str(args.target_line_id).strip()
        dependency = {
            "source_id": f"manual-milestone:{milestone_id}",
            "target_id": target_line_id,
            "type": "FS",
            "lag_days": 0.0,
            "lag_unit": "day",
            "metadata": {
                "manual_milestone_sequence": True,
                "smoke": "existing-hito-to-real-task",
            },
        }
        next_milestone = {
            **milestone,
            "successor_dependencies": [
                dep
                for dep in list(milestone.get("successor_dependencies") or [])
                if str(dep.get("target_id") or dep.get("targetId") or "") != target_line_id
            ]
            + [dependency],
        }
        next_config = {
            **raw_config,
            "manual_milestones": [
                next_milestone if str(entry.get("id") or "").strip() == milestone_id else entry
                for entry in manual_milestones
            ],
        }

        update_response = _save_config(db, presupuesto, empresa, next_config)
        response_milestone = _find_milestone(update_response.config.manual_milestones, milestone_id)
        _assert(response_milestone is not None, "El hito no volvio en la respuesta del servicio.")
        response_successors = list(response_milestone.get("successor_dependencies") or [])
        _assert(
            any(
                str(dep.get("source_id") or "") == f"manual-milestone:{milestone_id}"
                and str(dep.get("target_id") or "") == target_line_id
                for dep in response_successors
            ),
            f"La respuesta del servicio no contiene successor_dependencies esperada: {response_successors!r}",
        )

        db.expire_all()
        persisted_schedule = _load_schedule(db, empresa.id, presupuesto.id)
        persisted_config, persisted_milestones = _manual_milestones_from_schedule_data(
            persisted_schedule.schedule_data or {}
        )
        persisted_milestone = _find_milestone(persisted_milestones, milestone_id)
        _assert(persisted_milestone is not None, "El hito no se encontro tras releer base.")
        persisted_successors = list(persisted_milestone.get("successor_dependencies") or [])
        _assert(
            any(
                str(dep.get("source_id") or "") == f"manual-milestone:{milestone_id}"
                and str(dep.get("target_id") or "") == target_line_id
                for dep in persisted_successors
            ),
            f"La base no contiene successor_dependencies esperada: {persisted_successors!r}",
        )

        print(
            json.dumps(
                {
                    "empresa": args.empresa,
                    "empresa_id": empresa.id,
                    "proyecto_id": presupuesto.proyecto_id,
                    "presupuesto_id": presupuesto.id,
                    "milestone_id": milestone_id,
                    "target_line_id": target_line_id,
                    "response_successors": response_successors,
                    "persisted_successors": persisted_successors,
                    "status": "ok",
                },
                ensure_ascii=False,
                indent=2,
                default=str,
            )
        )
        return 0
    finally:
        if original_schedule_data is not None and empresa is not None and presupuesto is not None:
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
