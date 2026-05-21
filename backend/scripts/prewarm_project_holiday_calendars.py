from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import SessionLocal
from app.models.project_calendar import CalendarHoliday, CalendarHolidaySource, ProjectCalendarSnapshot
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.services.project_calendar import ECUADOR_LOCAL_FIXED_HOLIDAYS, project_calendar_service


DEFAULT_YEARS = (2025, 2026, 2027, 2028)


@dataclass
class CandidateProject:
    proyecto: Proyecto
    detail: ProyectoDetalle
    start_date: date
    end_date: date
    local_status: str


def _parse_years(raw: str | None) -> tuple[int, ...]:
    if not raw:
        return DEFAULT_YEARS
    years: list[int] = []
    for chunk in raw.split(","):
        token = chunk.strip()
        if not token:
            continue
        years.append(int(token))
    return tuple(sorted(set(years))) or DEFAULT_YEARS


def _resolve_window(proyecto: Proyecto, detail: ProyectoDetalle) -> tuple[date, date] | None:
    start_dt = getattr(detail, "fecha_inicio", None) or getattr(proyecto, "fecha_inicio", None)
    if not start_dt:
        return None

    start_date = start_dt.date() if isinstance(start_dt, datetime) else start_dt
    if not isinstance(start_date, date):
        return None

    explicit_end = getattr(detail, "fecha_finalizacion", None) or getattr(proyecto, "fecha_fin_estimada", None)
    if explicit_end:
        end_date = explicit_end.date() if isinstance(explicit_end, datetime) else explicit_end
        if isinstance(end_date, date) and end_date >= start_date:
            return start_date, end_date

    plazo = int(getattr(detail, "plazo_ejecucion", 0) or 0)
    if plazo > 0:
        return start_date, start_date + timedelta(days=plazo)

    return start_date, start_date + timedelta(days=365)


def _collect_candidates(db, *, project_id: int | None = None, empresa_id: int | None = None) -> list[CandidateProject]:
    supported = {(provincia, canton) for provincia, canton in ECUADOR_LOCAL_FIXED_HOLIDAYS.keys()}
    query = (
        db.query(Proyecto, ProyectoDetalle)
        .join(
            ProyectoDetalle,
            (ProyectoDetalle.codigo_root == Proyecto.codigo_root)
            & (ProyectoDetalle.empresa_id == Proyecto.empresa_id),
        )
    )
    if project_id is not None:
        query = query.filter(Proyecto.id == project_id)
    if empresa_id is not None:
        query = query.filter(Proyecto.empresa_id == empresa_id)

    candidates: list[CandidateProject] = []
    for proyecto, detail in query.all():
        country = str(getattr(detail, "pais", "Ecuador") or "Ecuador").strip().lower()
        if country != "ecuador":
            continue
        window = _resolve_window(proyecto, detail)
        if not window:
            continue
        provincia = str(getattr(detail, "provincia", "") or "").strip().lower() or None
        canton = str(getattr(detail, "canton", "") or "").strip().lower() or None
        if not canton:
            local_status = "missing"
        elif (provincia, canton) in supported:
            local_status = "resolved"
        else:
            local_status = "partial"
        start_date, end_date = window
        candidates.append(
            CandidateProject(
                proyecto=proyecto,
                detail=detail,
                start_date=start_date,
                end_date=end_date,
                local_status=local_status,
            )
        )
    candidates.sort(key=lambda item: (item.local_status, item.proyecto.empresa_id, item.proyecto.id))
    return candidates


def main() -> int:
    parser = argparse.ArgumentParser(description="Precarga el calendario maestro y snapshots de proyectos para el Gantt clásico.")
    parser.add_argument("--years", help="Lista separada por comas. Ej: 2025,2026,2027,2028")
    parser.add_argument("--project-id", type=int, help="Precargar solo un proyecto.")
    parser.add_argument("--empresa-id", type=int, help="Filtrar por empresa.")
    parser.add_argument("--force-refresh", action="store_true", help="Recalcular snapshots aunque ya existan.")
    args = parser.parse_args()

    years = _parse_years(args.years)
    db = SessionLocal()
    try:
        project_calendar_service.ensure_ecuador_master_holidays(db, years)
        db.commit()

        candidates = _collect_candidates(db, project_id=args.project_id, empresa_id=args.empresa_id)
        print(f"Maestro Ecuador actualizado para años: {', '.join(str(year) for year in years)}")
        print(f"Proyectos candidatos encontrados: {len(candidates)}")

        prewarmed = 0
        by_status = {"resolved": 0, "partial": 0, "missing": 0}
        for candidate in candidates:
            by_status[candidate.local_status] = by_status.get(candidate.local_status, 0) + 1
            calendar = project_calendar_service.get_snapshot_calendar(
                db,
                proyecto=candidate.proyecto,
                start_date=candidate.start_date,
                end_date=candidate.end_date,
                force_refresh=args.force_refresh,
            )
            db.commit()
            prewarmed += 1
            print(
                " - "
                f"Proyecto {candidate.proyecto.id} | empresa {candidate.proyecto.empresa_id} | "
                f"{candidate.proyecto.nombre} | {candidate.detail.provincia or '-'} / {candidate.detail.canton or '-'} | "
                f"{candidate.start_date.isoformat()} -> {candidate.end_date.isoformat()} | "
                f"estado local={calendar.local_source_status} | festivos={len(calendar.items)}"
            )

        source_count = db.query(CalendarHolidaySource).count()
        holiday_count = db.query(CalendarHoliday).count()
        snapshot_count = db.query(ProjectCalendarSnapshot).count()
        print("Resumen:")
        print(f" - fuentes oficiales: {source_count}")
        print(f" - festivos maestros: {holiday_count}")
        print(f" - snapshots de proyecto: {snapshot_count}")
        print(f" - proyectos precalentados: {prewarmed}")
        print(
            " - cobertura local: "
            f"resolved={by_status.get('resolved', 0)} "
            f"partial={by_status.get('partial', 0)} "
            f"missing={by_status.get('missing', 0)}"
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
