import copy
import json
import sys
from pathlib import Path
from datetime import datetime

from sqlalchemy.orm import joinedload


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.schemas.cronograma_trabajo import CronogramaTrabajoLinea, CronogramaTrabajoUpdate
from app.services.cronograma_trabajo import cronograma_trabajo_service


EMPRESA = "Santiago Bermeo"
PRESUPUESTO_ID = 13
SOURCE_CODE = "1.1.6"
TARGET_CODE = "1.1.7"


def _resolve_budget(db):
    empresa = db.query(Empresa).filter(Empresa.nombre == EMPRESA).first()
    if not empresa:
        raise RuntimeError(f"Empresa no encontrada: {EMPRESA}")
    presupuesto = (
        db.query(Presupuesto)
        .options(joinedload(Presupuesto.proyecto))
        .filter(Presupuesto.id == PRESUPUESTO_ID, Presupuesto.empresa_id == empresa.id)
        .first()
    )
    if not presupuesto:
        raise RuntimeError(f"Presupuesto no encontrado: {PRESUPUESTO_ID}")
    return empresa, presupuesto


def _load_schedule(db, empresa_id):
    schedule = (
        db.query(CronogramaTrabajo)
        .filter(
            CronogramaTrabajo.empresa_id == empresa_id,
            CronogramaTrabajo.presupuesto_id == PRESUPUESTO_ID,
        )
        .first()
    )
    if not schedule:
        raise RuntimeError(f"Cronograma Trabajo no encontrado para presupuesto {PRESUPUESTO_ID}")
    return schedule


def _row_payload(row):
    return {
        "line_id": int(row.presupuesto_linea_id),
        "item": getattr(row, "item", None),
        "codigo": getattr(row, "codigo_item", None),
        "descripcion": getattr(row, "descripcion", None),
        "start_date": str(getattr(row, "start_date", None)),
        "end_date": str(getattr(row, "end_date", None)),
        "duration": float(getattr(row, "dias_calendario", 0) or 0),
        "predecessors": list(getattr(row, "predecessors", []) or []),
        "dependencies": [
            dependency.model_dump(mode="json") if hasattr(dependency, "model_dump") else dict(dependency)
            for dependency in list(getattr(row, "dependencies", []) or [])
        ],
    }


def _parse_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00").replace("+00:00", ""))


def _is_calculable(row):
    explicit = getattr(row, "is_calculable", None)
    if explicit is not None:
        return bool(explicit)
    return bool(getattr(row, "apu_id", None))


def _find_row_by_code(rows, code):
    for row in rows:
        if str(getattr(row, "codigo_item", "") or "").strip() == code:
            return row
    raise RuntimeError(f"No se encontro la fila con codigo_item={code!r}")


def main() -> int:
    db = SessionLocal()
    original_schedule_data = None
    try:
        empresa, presupuesto = _resolve_budget(db)
        schedule = _load_schedule(db, empresa.id)
        original_schedule_data = copy.deepcopy(schedule.schedule_data or {})

        baseline = cronograma_trabajo_service._build_response(db, schedule)
        source_row = _find_row_by_code(baseline.rows, SOURCE_CODE)
        target_row = _find_row_by_code(baseline.rows, TARGET_CODE)

        target_line_id = int(target_row.presupuesto_linea_id)
        source_line_id = int(source_row.presupuesto_linea_id)
        previous_lineas = cronograma_trabajo_service._split_schedule_payload(schedule.schedule_data or {})[1]
        previous_target = cronograma_trabajo_service._resolve_line_override(previous_lineas.get(str(target_line_id)))
        update = CronogramaTrabajoUpdate(
            schedule_data={
                str(target_line_id): CronogramaTrabajoLinea(
                    assumed_resource_units=previous_target.assumed_resource_units,
                    progress_pct=previous_target.progress_pct,
                    start_date=previous_target.start_date,
                    end_date=previous_target.end_date,
                    duration=previous_target.duration,
                    predecessors=[source_line_id],
                    dependencies=[
                        {
                            "source_id": source_line_id,
                            "target_id": target_line_id,
                            "type": "FF",
                            "lag_days": 0,
                            "lag_unit": "day",
                            "lag_mode": "duration",
                            "metadata": {"diagnostic": "item10_9FF"},
                        }
                    ],
                    metadata=previous_target.metadata or {},
                )
            }
        )

        result = {
            "empresa": empresa.nombre,
            "presupuesto_id": presupuesto.id,
            "project_start": str(
                getattr(baseline.config, "fecha_inicio_proyecto", None)
                or getattr(presupuesto.proyecto, "fecha_inicio", None)
            ),
            "source_before": _row_payload(source_row),
            "target_before": _row_payload(target_row),
            "target_line_id": target_line_id,
            "source_line_id": source_line_id,
        }
        try:
            updated = cronograma_trabajo_service.update_schedule_delta(
                db,
                presupuesto_id=presupuesto.id,
                proyecto_id=presupuesto.proyecto_id,
                empresa_id=empresa.id,
                obj_in=update,
            )
            updated_full = cronograma_trabajo_service.get_schedule(
                db,
                presupuesto_id=presupuesto.id,
                proyecto_id=presupuesto.proyecto_id,
                empresa_id=empresa.id,
            )
            result["ok"] = True
            result["source_after"] = _row_payload(
                _find_row_by_code(updated_full.rows, SOURCE_CODE)
            )
            result["target_after"] = _row_payload(
                _find_row_by_code(updated_full.rows, TARGET_CODE)
            )
            project_start = _parse_datetime(result["project_start"])
            target_start = _parse_datetime(result["target_after"]["start_date"])
            if project_start and target_start and target_start < project_start:
                raise RuntimeError(
                    f"El target quedo antes del inicio del proyecto: {target_start} < {project_start}"
                )
        except Exception as error:
            db.rollback()
            result["ok"] = False
            result["error"] = str(error)

        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0 if result["ok"] else 1
    finally:
        if original_schedule_data is not None:
            try:
                schedule = _load_schedule(db, _resolve_budget(db)[0].id)
                schedule.schedule_data = original_schedule_data
                db.add(schedule)
                db.commit()
            except Exception:
                db.rollback()
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
