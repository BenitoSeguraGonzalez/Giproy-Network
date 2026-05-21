from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta
from hashlib import sha1
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.models.project_calendar import (
    CalendarHoliday,
    CalendarHolidaySource,
    ProjectCalendarOverride,
    ProjectCalendarSnapshot,
    ProjectCalendarSnapshotDay,
)
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.schemas.project_calendar import (
    ProjectHolidayCalendarItem,
    ProjectHolidayCalendarResponse,
)


ECUADOR_SOURCE_URLS = {
    "registro_feriados": "https://www.registroficial.gob.ec/suplemento-al-registro-oficial-no-906/",
    "asamblea_feriados": "https://www.asambleanacional.gob.ec/es/noticia/47479-en-vigencia-ley-que-regula-los-feriados-se-aplicara",
    "mintur_2025": "https://www.turismo.gob.ec/wp-content/uploads/2022/12/CALENDARIO-FERIADOS-2023-2025-06-12-2022-.pdf",
    "decreto_249_2026": "https://www.registroficial.gob.ec/suplemento-no-187/",
    "decreto_354_2026": "https://www.registroficial.gob.ec/tercer-suplemento-no-258/",
    "quito_local": "https://pasajeros.quito.gob.ec/?p=12636",
    "cuenca_local": "https://www.cuenca.gob.ec/content/control-orden-y-seguridad-establece-el-plan-de-contingencia-para-el-feriado-por-la",
    "guayaquil_local": "https://guayaquil.gob.ec/civismo-identidad-alegria-perla-pacifico-celebra-fundacion/",
    "manta_local": "https://manta.gob.ec/la-trayectoria-de-la-uef-san-jose-durante-80-anos-sera-reconocida-el-4-de-noviembre/",
    "paute_local": "https://www.paute.gob.ec/centro-cantonal-de-paute/",
    "daule_local": "https://www.daule.gob.ec/gracias-la-aurora-por-regalarnos-una-noche-inolvidable-llena-de-energia-entusiasmo-y-alegria/",
    "ambato_local": "https://ambato.gob.ec/jornada-laboral-se-mantiene-con-normalidad-durante-el-feriado-de-noviembre/",
    "santo_domingo_local": "https://www.santodomingo.gob.ec/?p=16191",
}


ECUADOR_LOCAL_FIXED_HOLIDAYS = {
    ("pichincha", "quito"): {
        "name": "Fundación de Quito",
        "month": 12,
        "day": 6,
        "source_name": "Municipio de Quito",
        "source_url": ECUADOR_SOURCE_URLS["quito_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("azuay", "cuenca"): {
        "name": "Fundación de Cuenca",
        "month": 4,
        "day": 12,
        "source_name": "Municipio de Cuenca",
        "source_url": ECUADOR_SOURCE_URLS["cuenca_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("guayas", "guayaquil"): {
        "name": "Fundación de Guayaquil",
        "month": 7,
        "day": 25,
        "source_name": "Alcaldía de Guayaquil",
        "source_url": ECUADOR_SOURCE_URLS["guayaquil_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("manabi", "manta"): {
        "name": "Creación Cantonal de Manta",
        "month": 11,
        "day": 4,
        "source_name": "Alcaldía del cantón Manta",
        "source_url": ECUADOR_SOURCE_URLS["manta_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("azuay", "paute"): {
        "name": "Cantonización de Paute",
        "month": 2,
        "day": 26,
        "source_name": "Municipio de Paute",
        "source_url": ECUADOR_SOURCE_URLS["paute_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("guayas", "daule"): {
        "name": "Instalación del Primer Cabildo Patriótico Popular de Daule",
        "month": 11,
        "day": 26,
        "source_name": "GAD Municipalidad de Daule",
        "source_url": ECUADOR_SOURCE_URLS["daule_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("tungurahua", "ambato"): {
        "name": "Independencia de Ambato",
        "month": 11,
        "day": 12,
        "source_name": "GAD Municipalidad de Ambato",
        "source_url": ECUADOR_SOURCE_URLS["ambato_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
    ("santo domingo de los tsachilas", "santo domingo"): {
        "name": "Cantonización de Santo Domingo",
        "month": 7,
        "day": 3,
        "source_name": "Municipio de Santo Domingo",
        "source_url": ECUADOR_SOURCE_URLS["santo_domingo_local"],
        "legal_reference": "Feriado local cantonal validado por fuente oficial municipal",
    },
}


@dataclass
class ProjectCalendarContext:
    country_code: str
    province_code: Optional[str]
    canton_code: Optional[str]
    start_date: date
    end_date: date
    local_source_status: str
    local_source_message: Optional[str]


class ProjectCalendarService:
    SOURCE_KEYS = {
        "national": {
            "source_name": "Registro Oficial / Asamblea Nacional / MINTUR",
            "source_url": ECUADOR_SOURCE_URLS["registro_feriados"],
            "source_kind": "official_registry",
            "priority": 1,
        },
        "quito_local": {
            "source_name": "Municipio de Quito",
            "source_url": ECUADOR_SOURCE_URLS["quito_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "quito",
        },
        "cuenca_local": {
            "source_name": "Municipio de Cuenca",
            "source_url": ECUADOR_SOURCE_URLS["cuenca_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "cuenca",
        },
        "guayaquil_local": {
            "source_name": "Alcaldía de Guayaquil",
            "source_url": ECUADOR_SOURCE_URLS["guayaquil_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "guayaquil",
        },
        "manta_local": {
            "source_name": "Alcaldía del cantón Manta",
            "source_url": ECUADOR_SOURCE_URLS["manta_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "manta",
        },
        "paute_local": {
            "source_name": "Municipio de Paute",
            "source_url": ECUADOR_SOURCE_URLS["paute_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "paute",
        },
        "daule_local": {
            "source_name": "GAD Municipalidad de Daule",
            "source_url": ECUADOR_SOURCE_URLS["daule_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "daule",
        },
        "ambato_local": {
            "source_name": "GAD Municipalidad de Ambato",
            "source_url": ECUADOR_SOURCE_URLS["ambato_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "ambato",
        },
        "santo_domingo_local": {
            "source_name": "Municipio de Santo Domingo",
            "source_url": ECUADOR_SOURCE_URLS["santo_domingo_local"],
            "source_kind": "municipio",
            "priority": 10,
            "scope_type": "cantonal",
            "scope_code": "santo domingo",
        },
    }

    VERIFIED_NATIONAL_2025 = [
        ("Año Nuevo", date(2025, 1, 1), date(2025, 1, 1), "MINTUR 2025"),
        ("Carnaval", date(2025, 3, 3), date(2025, 3, 3), "MINTUR 2025"),
        ("Carnaval", date(2025, 3, 4), date(2025, 3, 4), "MINTUR 2025"),
        ("Viernes Santo", date(2025, 4, 18), date(2025, 4, 18), "MINTUR 2025"),
        ("Día del Trabajo", date(2025, 5, 1), date(2025, 5, 2), "MINTUR 2025"),
        ("Batalla del Pichincha", date(2025, 5, 24), date(2025, 5, 23), "MINTUR 2025"),
        ("Primer Grito de Independencia", date(2025, 8, 10), date(2025, 8, 11), "MINTUR 2025"),
        ("Independencia de Guayaquil", date(2025, 10, 9), date(2025, 10, 10), "MINTUR 2025"),
        ("Día de Difuntos", date(2025, 11, 2), date(2025, 11, 4), "MINTUR 2025"),
        ("Independencia de Cuenca", date(2025, 11, 3), date(2025, 11, 3), "MINTUR 2025"),
        ("Navidad", date(2025, 12, 25), date(2025, 12, 25), "MINTUR 2025"),
    ]

    EXCEPTIONAL_NON_WORKING_DAYS = {
        2026: [
            ("Suspensión jornada por puente de Año Nuevo", date(2026, 1, 2), ECUADOR_SOURCE_URLS["decreto_249_2026"], "Decreto 249 / Registro Oficial"),
            ("Suspensión jornada por puente del Día del Trabajo", date(2026, 4, 30), ECUADOR_SOURCE_URLS["decreto_354_2026"], "Decreto 354 / Registro Oficial"),
        ],
    }

    def _normalize_geo_key(self, value: Optional[str]) -> Optional[str]:
        raw = str(value or "").strip().lower()
        return raw or None

    def _resolve_project_detail(self, db: Session, proyecto: Proyecto) -> Optional[ProyectoDetalle]:
        if not proyecto or not getattr(proyecto, "codigo_root", None):
            return None
        return (
            db.query(ProyectoDetalle)
            .filter(
                ProyectoDetalle.codigo_root == proyecto.codigo_root,
                ProyectoDetalle.empresa_id == proyecto.empresa_id,
            )
            .first()
        )

    def _resolve_calendar_scope_project(self, db: Session, proyecto: Proyecto) -> Proyecto:
        if not proyecto:
            return proyecto
        root_code = getattr(proyecto, "codigo_root", None) or getattr(proyecto, "codigo", None)
        if not root_code:
            return proyecto
        root_project = (
            db.query(Proyecto)
            .filter(
                Proyecto.codigo_root == root_code,
                Proyecto.empresa_id == proyecto.empresa_id,
            )
            .order_by(Proyecto.revision.asc(), Proyecto.id.asc())
            .first()
        )
        return root_project or proyecto

    def _standard_observed_date(self, holiday_date: date) -> date:
        weekday = holiday_date.weekday()
        if weekday == 1:
            return holiday_date - timedelta(days=1)
        if weekday in {2, 3}:
            return holiday_date + timedelta(days=2)
        if weekday == 5:
            return holiday_date - timedelta(days=1)
        if weekday == 6:
            return holiday_date + timedelta(days=1)
        return holiday_date

    def _compute_easter_sunday(self, year: int) -> date:
        a = year % 19
        b = year // 100
        c = year % 100
        d = b // 4
        e = b % 4
        f = (b + 8) // 25
        g = (b - f + 1) // 3
        h = (19 * a + b - d - g + 15) % 30
        i = c // 4
        k = c % 4
        l = (32 + 2 * e + 2 * i - h - k) % 7
        m = (a + 11 * h + 22 * l) // 451
        month = (h + l - 7 * m + 114) // 31
        day = ((h + l - 7 * m + 114) % 31) + 1
        return date(year, month, day)

    def _generate_ecuador_national_holidays(self, year: int) -> list[dict]:
        if year == 2025:
            return [
                {
                    "holiday_name": name,
                    "holiday_date": holiday_date,
                    "observed_date": observed_date,
                    "legal_reference": legal_reference,
                    "source_url": ECUADOR_SOURCE_URLS["mintur_2025"],
                }
                for name, holiday_date, observed_date, legal_reference in self.VERIFIED_NATIONAL_2025
            ]

        easter = self._compute_easter_sunday(year)
        carnival_monday = easter - timedelta(days=48)
        carnival_tuesday = easter - timedelta(days=47)
        good_friday = easter - timedelta(days=2)

        base_holidays = [
            ("Año Nuevo", date(year, 1, 1)),
            ("Día del Trabajo", date(year, 5, 1)),
            ("Batalla del Pichincha", date(year, 5, 24)),
            ("Primer Grito de Independencia", date(year, 8, 10)),
            ("Independencia de Guayaquil", date(year, 10, 9)),
            ("Navidad", date(year, 12, 25)),
        ]

        generated = [
            {
                "holiday_name": "Carnaval",
                "holiday_date": carnival_monday,
                "observed_date": carnival_monday,
                "legal_reference": "Ley de Feriados Ecuador",
                "source_url": ECUADOR_SOURCE_URLS["asamblea_feriados"],
            },
            {
                "holiday_name": "Carnaval",
                "holiday_date": carnival_tuesday,
                "observed_date": carnival_tuesday,
                "legal_reference": "Ley de Feriados Ecuador",
                "source_url": ECUADOR_SOURCE_URLS["asamblea_feriados"],
            },
            {
                "holiday_name": "Viernes Santo",
                "holiday_date": good_friday,
                "observed_date": good_friday,
                "legal_reference": "Ley de Feriados Ecuador",
                "source_url": ECUADOR_SOURCE_URLS["asamblea_feriados"],
            },
        ]

        for holiday_name, holiday_date in base_holidays:
            generated.append(
                {
                    "holiday_name": holiday_name,
                    "holiday_date": holiday_date,
                    "observed_date": self._standard_observed_date(holiday_date),
                    "legal_reference": "Ley de Feriados Ecuador",
                    "source_url": ECUADOR_SOURCE_URLS["registro_feriados"],
                }
            )

        difuntos = {
            "holiday_name": "Día de Difuntos",
            "holiday_date": date(year, 11, 2),
            "observed_date": self._standard_observed_date(date(year, 11, 2)),
            "legal_reference": "Ley de Feriados Ecuador",
            "source_url": ECUADOR_SOURCE_URLS["registro_feriados"],
        }
        cuenca = {
            "holiday_name": "Independencia de Cuenca",
            "holiday_date": date(year, 11, 3),
            "observed_date": self._standard_observed_date(date(year, 11, 3)),
            "legal_reference": "Ley de Feriados Ecuador",
            "source_url": ECUADOR_SOURCE_URLS["registro_feriados"],
        }
        if difuntos["observed_date"] == cuenca["observed_date"]:
            cuenca["observed_date"] = cuenca["observed_date"] + timedelta(days=1)
        generated.extend([difuntos, cuenca])

        for holiday_name, observed_date, source_url, legal_reference in self.EXCEPTIONAL_NON_WORKING_DAYS.get(year, []):
            generated.append(
                {
                    "holiday_name": holiday_name,
                    "holiday_date": observed_date,
                    "observed_date": observed_date,
                    "legal_reference": legal_reference,
                    "source_url": source_url,
                }
            )
        return generated

    def _ensure_source(
        self,
        db: Session,
        *,
        source_name: str,
        source_url: str,
        source_kind: str,
        priority: int,
        scope_type: str = "national",
        scope_code: Optional[str] = None,
    ) -> CalendarHolidaySource:
        existing = (
            db.query(CalendarHolidaySource)
            .filter(
                CalendarHolidaySource.country_code == "EC",
                CalendarHolidaySource.scope_type == scope_type,
                CalendarHolidaySource.scope_code == scope_code,
                CalendarHolidaySource.source_url == source_url,
            )
            .first()
        )
        if existing:
            existing.source_name = source_name
            existing.source_kind = source_kind
            existing.priority = priority
            existing.is_active = True
            return existing
        source = CalendarHolidaySource(
            country_code="EC",
            scope_type=scope_type,
            scope_code=scope_code,
            source_name=source_name,
            source_url=source_url,
            source_kind=source_kind,
            priority=priority,
            is_active=True,
        )
        db.add(source)
        db.flush()
        return source

    def ensure_ecuador_master_holidays(self, db: Session, years: Iterable[int]) -> None:
        national_source = self._ensure_source(db, **self.SOURCE_KEYS["national"])
        for local_key in (
            "quito_local",
            "cuenca_local",
            "guayaquil_local",
            "manta_local",
            "paute_local",
            "daule_local",
            "ambato_local",
            "santo_domingo_local",
        ):
            self._ensure_source(db, **self.SOURCE_KEYS[local_key])

        for year in sorted({int(value) for value in years if value}):
            for holiday in self._generate_ecuador_national_holidays(year):
                existing = (
                    db.query(CalendarHoliday)
                    .filter(
                        CalendarHoliday.country_code == "EC",
                        CalendarHoliday.year == year,
                        CalendarHoliday.observed_date == holiday["observed_date"],
                        CalendarHoliday.scope_type == "national",
                        CalendarHoliday.scope_code == None,
                        CalendarHoliday.holiday_name == holiday["holiday_name"],
                    )
                    .first()
                )
                if existing:
                    existing.holiday_date = holiday["holiday_date"]
                    existing.legal_reference = holiday["legal_reference"]
                    existing.source_id = national_source.id
                    existing.notes = "Catálogo maestro oficial Ecuador"
                    continue
                db.add(
                    CalendarHoliday(
                        source_id=national_source.id,
                        country_code="EC",
                        year=year,
                        holiday_date=holiday["holiday_date"],
                        observed_date=holiday["observed_date"],
                        holiday_name=holiday["holiday_name"],
                        scope_type="national",
                        scope_code=None,
                        province_code=None,
                        canton_code=None,
                        is_official=True,
                        legal_reference=holiday["legal_reference"],
                        notes="Catálogo maestro oficial Ecuador",
                    )
                )

            for (province_code, canton_code), local_meta in ECUADOR_LOCAL_FIXED_HOLIDAYS.items():
                holiday_date = date(year, local_meta["month"], local_meta["day"])
                observed_date = self._standard_observed_date(holiday_date)
                source = self._ensure_source(
                    db,
                    source_name=local_meta["source_name"],
                    source_url=local_meta["source_url"],
                    source_kind="municipio",
                    priority=10,
                    scope_type="cantonal",
                    scope_code=canton_code,
                )
                existing = (
                    db.query(CalendarHoliday)
                    .filter(
                        CalendarHoliday.country_code == "EC",
                        CalendarHoliday.year == year,
                        CalendarHoliday.observed_date == observed_date,
                        CalendarHoliday.scope_type == "cantonal",
                        CalendarHoliday.scope_code == canton_code,
                        CalendarHoliday.holiday_name == local_meta["name"],
                    )
                    .first()
                )
                if existing:
                    existing.holiday_date = holiday_date
                    existing.province_code = province_code
                    existing.canton_code = canton_code
                    existing.legal_reference = local_meta["legal_reference"]
                    existing.source_id = source.id
                    continue
                db.add(
                    CalendarHoliday(
                        source_id=source.id,
                        country_code="EC",
                        year=year,
                        holiday_date=holiday_date,
                        observed_date=observed_date,
                        holiday_name=local_meta["name"],
                        scope_type="cantonal",
                        scope_code=canton_code,
                        province_code=province_code,
                        canton_code=canton_code,
                        is_official=True,
                        legal_reference=local_meta["legal_reference"],
                        notes="Catálogo maestro oficial local Ecuador",
                    )
                )
        db.flush()

    def _compute_master_signature(self, holidays: list[CalendarHoliday], overrides: list[ProjectCalendarOverride]) -> str:
        parts = [
            f"{holiday.id}:{holiday.observed_date.isoformat()}:{holiday.holiday_name}:{holiday.scope_type}:{holiday.scope_code or ''}"
            for holiday in holidays
        ]
        parts.extend(
            f"override:{override.override_date.isoformat()}:{override.holiday_name}:{override.action}"
            for override in overrides
        )
        return sha1("|".join(sorted(parts)).encode("utf-8")).hexdigest()

    def resolve_context(
        self,
        db: Session,
        *,
        proyecto: Proyecto,
        start_date: date,
        end_date: date,
    ) -> ProjectCalendarContext:
        detail = self._resolve_project_detail(db, proyecto)
        country_code = "EC" if str(getattr(detail, "pais", "Ecuador") or "Ecuador").strip().lower() == "ecuador" else "EC"
        province_code = self._normalize_geo_key(getattr(detail, "provincia", None))
        canton_code = self._normalize_geo_key(getattr(detail, "canton", None))

        local_source_status = "missing"
        local_source_message = None
        if not canton_code:
            local_source_message = "El proyecto no tiene cantón definido; se cargan solo festivos nacionales."
        elif (province_code, canton_code) in ECUADOR_LOCAL_FIXED_HOLIDAYS:
            local_source_status = "resolved"
            local_source_message = "Festivos locales oficiales disponibles para el cantón del proyecto."
        else:
            local_source_status = "partial"
            local_source_message = "No existe aún una fuente local oficial registrada para este cantón; se cargan nacionales y se permiten ajustes manuales."

        return ProjectCalendarContext(
            country_code=country_code,
            province_code=province_code,
            canton_code=canton_code,
            start_date=start_date,
            end_date=end_date,
            local_source_status=local_source_status,
            local_source_message=local_source_message,
        )

    def _query_applicable_master_holidays(self, db: Session, context: ProjectCalendarContext) -> list[CalendarHoliday]:
        query = (
            db.query(CalendarHoliday)
            .filter(
                CalendarHoliday.country_code == context.country_code,
                CalendarHoliday.observed_date >= context.start_date,
                CalendarHoliday.observed_date <= context.end_date,
            )
        )
        holidays = []
        for holiday in query.all():
            if holiday.scope_type == "national":
                holidays.append(holiday)
            elif holiday.scope_type == "provincial" and context.province_code and holiday.province_code == context.province_code:
                holidays.append(holiday)
            elif holiday.scope_type == "cantonal" and context.canton_code and holiday.canton_code == context.canton_code:
                holidays.append(holiday)
        holidays.sort(key=lambda item: (item.observed_date, item.scope_type, item.holiday_name))
        return holidays

    def _query_overrides(self, db: Session, proyecto_id: int, empresa_id: int) -> list[ProjectCalendarOverride]:
        return (
            db.query(ProjectCalendarOverride)
            .filter(
                ProjectCalendarOverride.proyecto_id == proyecto_id,
                ProjectCalendarOverride.empresa_id == empresa_id,
            )
            .all()
        )

    def rebuild_project_snapshot(
        self,
        db: Session,
        *,
        proyecto: Proyecto,
        start_date: date,
        end_date: date,
    ) -> ProjectHolidayCalendarResponse:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        context = self.resolve_context(db, proyecto=scope_project, start_date=start_date, end_date=end_date)
        self.ensure_ecuador_master_holidays(db, range(start_date.year, end_date.year + 1))

        holidays = self._query_applicable_master_holidays(db, context)
        overrides = self._query_overrides(db, scope_project.id, scope_project.empresa_id)
        disabled = {
            (override.override_date, override.holiday_name)
            for override in overrides
            if override.action == "disable"
        }
        manual_adds = [override for override in overrides if override.action == "add"]

        snapshot = (
            db.query(ProjectCalendarSnapshot)
            .filter(
                ProjectCalendarSnapshot.proyecto_id == scope_project.id,
                ProjectCalendarSnapshot.empresa_id == scope_project.empresa_id,
            )
            .first()
        )
        if not snapshot:
            snapshot = ProjectCalendarSnapshot(
                proyecto_id=scope_project.id,
                empresa_id=scope_project.empresa_id,
                country_code=context.country_code,
                province_code=context.province_code,
                canton_code=context.canton_code,
                start_date=start_date,
                end_date=end_date,
            )
            db.add(snapshot)
            db.flush()

        snapshot.country_code = context.country_code
        snapshot.province_code = context.province_code
        snapshot.canton_code = context.canton_code
        snapshot.start_date = start_date
        snapshot.end_date = end_date
        snapshot.generated_at = datetime.utcnow()
        snapshot.master_signature = self._compute_master_signature(holidays, overrides)
        db.query(ProjectCalendarSnapshotDay).filter(ProjectCalendarSnapshotDay.snapshot_id == snapshot.id).delete()

        source_map = {
            source.id: source
            for source in db.query(CalendarHolidaySource).filter(CalendarHolidaySource.is_active == True).all()
        }

        day_rows: list[ProjectCalendarSnapshotDay] = []
        for holiday in holidays:
            if (holiday.observed_date, holiday.holiday_name) in disabled:
                continue
            source = source_map.get(holiday.source_id)
            day_rows.append(
                ProjectCalendarSnapshotDay(
                    snapshot_id=snapshot.id,
                    holiday_date=holiday.holiday_date,
                    observed_date=holiday.observed_date,
                    holiday_name=holiday.holiday_name,
                    scope_type=holiday.scope_type,
                    scope_code=holiday.scope_code,
                    province_code=holiday.province_code,
                    canton_code=holiday.canton_code,
                    origin_type="official",
                    source_id=holiday.source_id,
                    master_holiday_id=holiday.id,
                    source_url=getattr(source, "source_url", None),
                    is_working_day=False,
                    notes=holiday.legal_reference,
                )
            )

        for override in manual_adds:
            if override.override_date < start_date or override.override_date > end_date:
                continue
            day_rows.append(
                ProjectCalendarSnapshotDay(
                    snapshot_id=snapshot.id,
                    holiday_date=override.override_date,
                    observed_date=override.override_date,
                    holiday_name=override.holiday_name,
                    scope_type="project",
                    scope_code=str(scope_project.id),
                    province_code=context.province_code,
                    canton_code=context.canton_code,
                    origin_type="manual_add",
                    source_id=None,
                    master_holiday_id=None,
                    source_url=None,
                    is_working_day=False,
                    notes=override.notes,
                )
            )

        if day_rows:
            db.bulk_save_objects(day_rows)
        db.flush()

        persisted_days = (
            db.query(ProjectCalendarSnapshotDay)
            .filter(ProjectCalendarSnapshotDay.snapshot_id == snapshot.id)
            .order_by(ProjectCalendarSnapshotDay.observed_date.asc(), ProjectCalendarSnapshotDay.holiday_name.asc())
            .all()
        )
        items = [
            ProjectHolidayCalendarItem(
                id=day.id,
                holiday_date=day.holiday_date,
                observed_date=day.observed_date,
                holiday_name=day.holiday_name,
                scope_type=day.scope_type if day.scope_type in {"national", "provincial", "cantonal", "project"} else "project",
                scope_label={
                    "national": "Nacional",
                    "provincial": "Provincial",
                    "cantonal": "Cantonal",
                    "project": "Proyecto",
                }.get(day.scope_type, "Proyecto"),
                origin_type=day.origin_type if day.origin_type in {"official", "manual_add", "manual_disable"} else "official",
                source_name=getattr(source_map.get(day.source_id), "source_name", None),
                source_url=day.source_url,
                is_working_day=bool(day.is_working_day),
                editable=True,
                notes=day.notes,
            )
            for day in persisted_days
        ]
        return ProjectHolidayCalendarResponse(
            country_code=context.country_code,
            province_code=context.province_code,
            canton_code=context.canton_code,
            start_date=start_date,
            end_date=end_date,
            generated_at=snapshot.generated_at,
            local_source_status=context.local_source_status if context.local_source_status in {"resolved", "partial", "missing"} else "missing",
            local_source_message=context.local_source_message,
            items=items,
        )

    def get_snapshot_calendar(
        self,
        db: Session,
        *,
        proyecto: Proyecto,
        start_date: date,
        end_date: date,
        force_refresh: bool = False,
    ) -> ProjectHolidayCalendarResponse:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        snapshot = (
            db.query(ProjectCalendarSnapshot)
            .filter(
                ProjectCalendarSnapshot.proyecto_id == scope_project.id,
                ProjectCalendarSnapshot.empresa_id == scope_project.empresa_id,
            )
            .first()
        )
        if (
            force_refresh
            or snapshot is None
            or snapshot.start_date != start_date
            or snapshot.end_date != end_date
        ):
            return self.rebuild_project_snapshot(db, proyecto=scope_project, start_date=start_date, end_date=end_date)

        persisted_days = (
            db.query(ProjectCalendarSnapshotDay)
            .filter(ProjectCalendarSnapshotDay.snapshot_id == snapshot.id)
            .order_by(ProjectCalendarSnapshotDay.observed_date.asc(), ProjectCalendarSnapshotDay.holiday_name.asc())
            .all()
        )
        source_map = {
            source.id: source
            for source in db.query(CalendarHolidaySource).filter(CalendarHolidaySource.is_active == True).all()
        }
        context = self.resolve_context(db, proyecto=scope_project, start_date=start_date, end_date=end_date)
        return ProjectHolidayCalendarResponse(
            country_code=context.country_code,
            province_code=context.province_code,
            canton_code=context.canton_code,
            start_date=start_date,
            end_date=end_date,
            generated_at=snapshot.generated_at,
            local_source_status=context.local_source_status if context.local_source_status in {"resolved", "partial", "missing"} else "missing",
            local_source_message=context.local_source_message,
            items=[
                ProjectHolidayCalendarItem(
                    id=day.id,
                    holiday_date=day.holiday_date,
                    observed_date=day.observed_date,
                    holiday_name=day.holiday_name,
                    scope_type=day.scope_type if day.scope_type in {"national", "provincial", "cantonal", "project"} else "project",
                    scope_label={
                        "national": "Nacional",
                        "provincial": "Provincial",
                        "cantonal": "Cantonal",
                        "project": "Proyecto",
                    }.get(day.scope_type, "Proyecto"),
                    origin_type=day.origin_type if day.origin_type in {"official", "manual_add", "manual_disable"} else "official",
                    source_name=getattr(source_map.get(day.source_id), "source_name", None),
                    source_url=day.source_url,
                    is_working_day=bool(day.is_working_day),
                    editable=True,
                    notes=day.notes,
                )
                for day in persisted_days
            ],
        )

    def _invalidate_project_snapshot(self, db: Session, *, proyecto: Proyecto) -> None:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        snapshot = (
            db.query(ProjectCalendarSnapshot)
            .filter(
                ProjectCalendarSnapshot.proyecto_id == scope_project.id,
                ProjectCalendarSnapshot.empresa_id == scope_project.empresa_id,
            )
            .first()
        )
        if snapshot:
            db.delete(snapshot)
            db.flush()

    def add_manual_holiday(
        self,
        db: Session,
        *,
        proyecto: Proyecto,
        holiday_date: date,
        holiday_name: str,
        created_by: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> None:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        existing = (
            db.query(ProjectCalendarOverride)
            .filter(
                ProjectCalendarOverride.proyecto_id == scope_project.id,
                ProjectCalendarOverride.empresa_id == scope_project.empresa_id,
                ProjectCalendarOverride.override_date == holiday_date,
                ProjectCalendarOverride.holiday_name == holiday_name,
                ProjectCalendarOverride.action == "add",
            )
            .first()
        )
        if existing:
            existing.notes = notes
            return
        db.add(
            ProjectCalendarOverride(
                proyecto_id=scope_project.id,
                empresa_id=scope_project.empresa_id,
                override_date=holiday_date,
                holiday_name=holiday_name,
                action="add",
                scope_type="project",
                notes=notes,
                created_by=created_by,
            )
        )
        db.flush()
        self._invalidate_project_snapshot(db, proyecto=scope_project)

    def remove_holiday(
        self,
        db: Session,
        *,
        proyecto: Proyecto,
        holiday_date: date,
        holiday_name: str,
        created_by: Optional[int] = None,
    ) -> None:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        manual_add = (
            db.query(ProjectCalendarOverride)
            .filter(
                ProjectCalendarOverride.proyecto_id == scope_project.id,
                ProjectCalendarOverride.empresa_id == scope_project.empresa_id,
                ProjectCalendarOverride.override_date == holiday_date,
                ProjectCalendarOverride.holiday_name == holiday_name,
                ProjectCalendarOverride.action == "add",
            )
            .first()
        )
        if manual_add:
            db.delete(manual_add)
            db.flush()
            self._invalidate_project_snapshot(db, proyecto=scope_project)
            return

        disabled = (
            db.query(ProjectCalendarOverride)
            .filter(
                ProjectCalendarOverride.proyecto_id == scope_project.id,
                ProjectCalendarOverride.empresa_id == scope_project.empresa_id,
                ProjectCalendarOverride.override_date == holiday_date,
                ProjectCalendarOverride.holiday_name == holiday_name,
                ProjectCalendarOverride.action == "disable",
            )
            .first()
        )
        if disabled:
            return
        db.add(
            ProjectCalendarOverride(
                proyecto_id=scope_project.id,
                empresa_id=scope_project.empresa_id,
                override_date=holiday_date,
                holiday_name=holiday_name,
                action="disable",
                scope_type="project",
                notes="Desactivado manualmente para este proyecto",
                created_by=created_by,
            )
        )
        db.flush()
        self._invalidate_project_snapshot(db, proyecto=scope_project)

    def reset_project_calendar(self, db: Session, *, proyecto: Proyecto) -> None:
        scope_project = self._resolve_calendar_scope_project(db, proyecto)
        db.query(ProjectCalendarOverride).filter(
            ProjectCalendarOverride.proyecto_id == scope_project.id,
            ProjectCalendarOverride.empresa_id == scope_project.empresa_id,
        ).delete()
        db.flush()
        self._invalidate_project_snapshot(db, proyecto=scope_project)


project_calendar_service = ProjectCalendarService()
