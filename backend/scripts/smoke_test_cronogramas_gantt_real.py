import argparse
import json
import sys
from pathlib import Path
from time import perf_counter
from datetime import datetime, timedelta

from sqlalchemy.orm import joinedload


ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.api.endpoints.cronogramas import _serialize_cronograma
from app.core.database import SessionLocal
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto
from app.services.cronograma_trabajo import cronograma_trabajo_service


DEFAULT_EMPRESA = "Santiago Bermeo"
DEFAULT_PROYECTO = "SantiagoBermeo-2026-001"
DEFAULT_PRESUPUESTO_ID = 13


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


def _metric(label: str, seconds: float, threshold: float):
    if seconds > threshold:
        raise AssertionError(
            f"{label}: {seconds:.3f}s excede el umbral permitido de {threshold:.3f}s"
        )


def _read_payload_value(payload, key: str):
    if isinstance(payload, dict):
        return payload.get(key)
    return getattr(payload, key, None)


def _row_is_calculable(row) -> bool:
    explicit_flag = _read_payload_value(row, "is_calculable")
    if explicit_flag is not None:
        return bool(explicit_flag)
    return bool(_read_payload_value(row, "apu_id"))


def _row_metadata(row) -> dict:
    value = _read_payload_value(row, "metadata")
    return dict(value or {})


def _as_datetime(value):
    if value is None:
        return None
    if hasattr(value, "replace") and hasattr(value, "isoformat"):
        return value.replace(tzinfo=None, microsecond=0)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.replace(tzinfo=None, microsecond=0)
    except Exception:
        return None


def _duration_delta(days: float, config) -> timedelta:
    jornada = max(float(getattr(config, "jornada_laboral_horas", 8.0) or 8.0), 1.0)
    return timedelta(hours=float(days or 0.0) * jornada)


def _validate_dependency_governance(rows, config):
    row_map = {
        int(_read_payload_value(row, "presupuesto_linea_id") or 0): row
        for row in rows
        if int(_read_payload_value(row, "presupuesto_linea_id") or 0)
    }
    failures = []
    tolerance = timedelta(seconds=1)

    for target_id, target in row_map.items():
        dependencies = list(_read_payload_value(target, "dependencies") or [])
        if not dependencies:
            continue
        target_start = _as_datetime(_read_payload_value(target, "start_date"))
        target_finish = _as_datetime(_read_payload_value(target, "end_date"))
        if target_start is None or target_finish is None:
            failures.append(f"Línea {target_id}: sin fechas calculadas pese a tener dependencias")
            continue

        for dependency in dependencies:
            source_id = int(_read_payload_value(dependency, "source_id") or 0)
            source = row_map.get(source_id)
            if not source:
                continue
            relation_type = str(_read_payload_value(dependency, "type") or "FS").upper()
            lag_days = float(_read_payload_value(dependency, "lag_days") or 0.0)
            source_start = _as_datetime(_read_payload_value(source, "start_date"))
            source_finish = _as_datetime(_read_payload_value(source, "end_date"))
            if source_start is None or source_finish is None:
                failures.append(f"Línea {target_id}: origen {source_id} sin fechas calculadas")
                continue

            if relation_type == "SS":
                expected = source_start + _duration_delta(lag_days, config)
                if target_start + tolerance < expected:
                    failures.append(f"Línea {target_id} CC/SS inicia {target_start} antes de {expected}")
            elif relation_type == "FF":
                expected = source_finish + _duration_delta(lag_days, config)
                if abs((target_finish - expected).total_seconds()) > tolerance.total_seconds():
                    failures.append(f"Línea {target_id} FF termina {target_finish} y debía terminar {expected}")
            elif relation_type == "SF":
                expected = source_start + _duration_delta(lag_days, config)
                if abs((target_finish - expected).total_seconds()) > tolerance.total_seconds():
                    failures.append(f"Línea {target_id} CF/SF termina {target_finish} y debía terminar {expected}")
            else:
                expected = source_finish + _duration_delta(lag_days, config)
                if target_start + tolerance < expected:
                    failures.append(f"Línea {target_id} FC/FS inicia {target_start} antes de {expected}")

    if failures:
        raise AssertionError("Serialización Gantt inválida: " + " | ".join(failures[:8]))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Smoke test real del Gantt clásico sobre Santiago Bermeo."
    )
    parser.add_argument("--empresa", default=DEFAULT_EMPRESA)
    parser.add_argument("--proyecto", default=DEFAULT_PROYECTO)
    parser.add_argument("--presupuesto-id", type=int, default=DEFAULT_PRESUPUESTO_ID)
    parser.add_argument("--max-schedule-seconds", type=float, default=8.0)
    parser.add_argument("--max-valuado-seconds", type=float, default=8.0)
    parser.add_argument("--max-reset-seconds", type=float, default=8.0)
    args = parser.parse_args()

    db = SessionLocal()
    try:
        empresa, presupuesto = _resolve_budget(
            db,
            empresa_nombre=args.empresa,
            proyecto_nombre=args.proyecto,
            presupuesto_id=args.presupuesto_id,
        )

        cronograma = (
            db.query(CronogramaValorado)
            .filter(
                CronogramaValorado.empresa_id == empresa.id,
                CronogramaValorado.presupuesto_id == presupuesto.id,
            )
            .first()
        )
        if not cronograma:
            raise RuntimeError(
                f"Cronograma Valorado no encontrado para presupuesto {presupuesto.id}"
            )

        schedule = (
            db.query(CronogramaTrabajo)
            .filter(
                CronogramaTrabajo.empresa_id == empresa.id,
                CronogramaTrabajo.presupuesto_id == presupuesto.id,
            )
            .first()
        )
        if not schedule:
            raise RuntimeError(
                f"Cronograma Trabajo no encontrado para presupuesto {presupuesto.id}"
            )

        started = perf_counter()
        schedule_response = cronograma_trabajo_service._build_response(db, schedule)
        schedule_seconds = perf_counter() - started
        _metric("get_schedule/_build_response", schedule_seconds, args.max_schedule_seconds)

        started = perf_counter()
        serialized_cronograma = _serialize_cronograma(db, presupuesto, cronograma)
        valorado_seconds = perf_counter() - started
        _metric("serialize_cronograma", valorado_seconds, args.max_valuado_seconds)

        started = perf_counter()
        factory_reset_schedule_data = cronograma_trabajo_service.build_factory_reset_schedule_data(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=presupuesto.proyecto_id,
            empresa_id=empresa.id,
        )
        reset_seconds = perf_counter() - started
        _metric("build_factory_reset_schedule_data", reset_seconds, args.max_reset_seconds)

        calculable_rows = [
            row
            for row in list(schedule_response.rows or [])
            if _row_is_calculable(row)
        ]
        if not calculable_rows:
            raise AssertionError("El cronograma real no devolvió líneas calculables")

        _validate_dependency_governance(calculable_rows, schedule_response.config)

        reset_lines = {
            str(key): value
            for key, value in dict(factory_reset_schedule_data or {}).items()
            if str(key) != "__config__"
        }
        if len(reset_lines) != len(calculable_rows):
            raise AssertionError(
                f"Factory reset inconsistente: líneas calculables={len(calculable_rows)} semillas={len(reset_lines)}"
            )

        for row in calculable_rows:
            line_id = str(getattr(row, "presupuesto_linea_id", "")).strip()
            payload = reset_lines.get(line_id) or {}
            metadata = dict(payload.get("metadata") or {})
            subbars = list(metadata.get("gantt_subbars") or [])
            if len(subbars) != 1:
                raise AssertionError(
                    f"Línea {line_id}: se esperaba exactamente una subbarra de factory reset y llegaron {len(subbars)}"
                )
            subbar = subbars[0]
            if round(float(subbar.get("percent") or 0.0), 4) != 100.0:
                raise AssertionError(
                    f"Línea {line_id}: el factory reset debe sembrar 100% y llegó {subbar.get('percent')!r}"
                )
            if str(subbar.get("source") or "").strip().lower() != "factory_reset_seed":
                raise AssertionError(
                    f"Línea {line_id}: source inválido en factory reset -> {subbar.get('source')!r}"
                )
            if str(subbar.get("status") or "").strip().lower() != "confirmed_against_budget":
                raise AssertionError(
                    f"Línea {line_id}: status inválido en factory reset -> {subbar.get('status')!r}"
                )
            if not subbar.get("starts_at") or not subbar.get("ends_at"):
                raise AssertionError(
                    f"Línea {line_id}: la subbarra de factory reset debe tener inicio y fin reales"
                )

        metrics = {
            "empresa_id": empresa.id,
            "empresa": empresa.nombre,
            "proyecto_id": presupuesto.proyecto_id,
            "proyecto": getattr(presupuesto.proyecto, "nombre", None),
            "presupuesto_id": presupuesto.id,
            "schedule_seconds": round(schedule_seconds, 3),
            "valuado_seconds": round(valorado_seconds, 3),
            "reset_seed_seconds": round(reset_seconds, 3),
            "calculable_rows": len(calculable_rows),
            "current_distribution_mode": _read_payload_value(serialized_cronograma, "distribution_mode"),
            "current_period_type": _read_payload_value(serialized_cronograma, "period_type"),
            "current_rows_with_subbars": sum(
                1
                for row in calculable_rows
                if bool(
                    (
                        _row_metadata(row)
                        .get("gantt_operational", {})
                        .get("has_subbars")
                    )
                )
            ),
        }
        print("SMOKE TEST CRONOGRAMAS GANTT REAL: PASS")
        print(json.dumps(metrics, ensure_ascii=False, indent=2))
        return 0
    except Exception as exc:
        print(f"SMOKE TEST CRONOGRAMAS GANTT REAL: FAIL -> {exc}")
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
