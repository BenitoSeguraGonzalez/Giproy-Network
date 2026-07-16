"""Sanea cronogramas Gantt existentes para APUs anidados operativos.

La operacion no modifica APUs, presupuestos ni cantidades de obra. Solo
normaliza `cronogramas_trabajo.schedule_data` para que cada linea calculable
persistida incluya el snapshot `apu_operational_resources_v1` generado por el
servicio canonico de Cronograma Trabajo.
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.services.cronograma_trabajo import (
    APU_OPERATIONAL_RESOURCES_METADATA_KEY,
    cronograma_trabajo_service,
)


def _json_default(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, default=_json_default, ensure_ascii=False)


def _lineas_from_response(response) -> dict:
    return {
        str(key): value.model_dump(mode="json") if hasattr(value, "model_dump") else dict(value or {})
        for key, value in (response.schedule_data or {}).items()
    }


def _count_operational_lines(lineas: dict) -> dict:
    total = 0
    with_snapshot = 0
    nested = 0
    for raw_value in (lineas or {}).values():
        if not isinstance(raw_value, dict):
            continue
        total += 1
        metadata = raw_value.get("metadata") if isinstance(raw_value.get("metadata"), dict) else {}
        snapshot = metadata.get(APU_OPERATIONAL_RESOURCES_METADATA_KEY)
        if isinstance(snapshot, dict) and isinstance(snapshot.get("resources"), list):
            with_snapshot += 1
            if snapshot.get("has_nested") is True:
                nested += 1
    return {
        "lineas": total,
        "lineas_con_snapshot": with_snapshot,
        "lineas_con_anidados_explotados": nested,
    }


def _operational_snapshot_digest(lineas: dict) -> dict:
    digest = {}
    for raw_key, raw_value in (lineas or {}).items():
        if not isinstance(raw_value, dict):
            continue
        metadata = raw_value.get("metadata") if isinstance(raw_value.get("metadata"), dict) else {}
        snapshot = metadata.get(APU_OPERATIONAL_RESOURCES_METADATA_KEY)
        if isinstance(snapshot, dict):
            digest[str(raw_key)] = snapshot
    return digest


def _write_backup(schedules: list[CronogramaTrabajo]) -> Path:
    backup_dir = ROOT / "tmp"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_dir / f"gantt_operational_apu_snapshot_backup_task_1976_{timestamp}.json"
    payload = {
        "generated_at": datetime.utcnow().isoformat(),
        "task": "TASK-1976",
        "description": "Backup previo al saneamiento global de snapshots operativos APU en Gantt.",
        "cronogramas": [
            {
                "id": schedule.id,
                "empresa_id": schedule.empresa_id,
                "proyecto_id": schedule.proyecto_id,
                "presupuesto_id": schedule.presupuesto_id,
                "schedule_data": copy.deepcopy(schedule.schedule_data or {}),
            }
            for schedule in schedules
        ],
    }
    backup_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, default=_json_default),
        encoding="utf-8",
    )
    return backup_path


def run(*, apply: bool) -> dict:
    db = SessionLocal()
    try:
        schedules = (
            db.query(CronogramaTrabajo)
            .order_by(
                CronogramaTrabajo.empresa_id.asc(),
                CronogramaTrabajo.proyecto_id.asc(),
                CronogramaTrabajo.presupuesto_id.asc(),
                CronogramaTrabajo.id.asc(),
            )
            .all()
        )
        backup_path = _write_backup(schedules)
        summary = {
            "mode": "apply" if apply else "dry-run",
            "backup_path": str(backup_path),
            "cronogramas_revisados": len(schedules),
            "cronogramas_actualizados": 0,
            "lineas_con_snapshot_antes": 0,
            "lineas_con_snapshot_despues": 0,
            "lineas_con_anidados_explotados_despues": 0,
            "items": [],
        }

        for schedule in schedules:
            original_schedule_data = copy.deepcopy(schedule.schedule_data or {})
            original_config, original_lineas = cronograma_trabajo_service._split_schedule_payload(
                original_schedule_data
            )
            before_counts = _count_operational_lines(original_lineas)
            response = cronograma_trabajo_service._build_response(db, schedule)
            next_lineas = _lineas_from_response(response)
            next_config = response.config.model_dump(mode="json")
            next_schedule_data = cronograma_trabajo_service._join_schedule_payload(
                next_config,
                next_lineas,
            )
            after_counts = _count_operational_lines(next_lineas)
            changed = _stable_json(_operational_snapshot_digest(original_lineas)) != _stable_json(
                _operational_snapshot_digest(next_lineas)
            )

            summary["lineas_con_snapshot_antes"] += before_counts["lineas_con_snapshot"]
            summary["lineas_con_snapshot_despues"] += after_counts["lineas_con_snapshot"]
            summary["lineas_con_anidados_explotados_despues"] += after_counts[
                "lineas_con_anidados_explotados"
            ]
            if changed:
                summary["cronogramas_actualizados"] += 1
                if apply:
                    schedule.schedule_data = next_schedule_data
                    db.add(schedule)

            summary["items"].append(
                {
                    "cronograma_id": schedule.id,
                    "empresa_id": schedule.empresa_id,
                    "proyecto_id": schedule.proyecto_id,
                    "presupuesto_id": schedule.presupuesto_id,
                    "changed": changed,
                    "before": before_counts,
                    "after": after_counts,
                }
            )

        if apply:
            db.commit()
        else:
            db.rollback()
        return summary
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sanea snapshots operativos APU en todos los cronogramas Gantt existentes."
    )
    parser.add_argument("--apply", action="store_true", help="Persiste los cambios. Sin esto solo audita.")
    args = parser.parse_args()
    summary = run(apply=args.apply)
    print(json.dumps(summary, indent=2, ensure_ascii=False, default=_json_default))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
