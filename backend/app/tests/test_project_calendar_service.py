from datetime import date, datetime

from app.models.project_calendar import ProjectCalendarOverride
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.schemas.cronograma_trabajo import CronogramaTrabajoConfig
from app.services.cronograma_trabajo import cronograma_trabajo_service
from app.services.project_calendar import project_calendar_service


def test_generate_ecuador_national_holidays_2025_uses_verified_dates():
    holidays = project_calendar_service._generate_ecuador_national_holidays(2025)
    observed = {(item["holiday_name"], item["observed_date"]) for item in holidays}

    assert ("Día del Trabajo", date(2025, 5, 2)) in observed
    assert ("Batalla del Pichincha", date(2025, 5, 23)) in observed
    assert ("Día de Difuntos", date(2025, 11, 4)) in observed


def test_generate_ecuador_national_holidays_2026_adds_exceptional_non_working_days():
    holidays = project_calendar_service._generate_ecuador_national_holidays(2026)
    observed = {(item["holiday_name"], item["observed_date"]) for item in holidays}

    assert ("Suspensión jornada por puente de Año Nuevo", date(2026, 1, 2)) in observed
    assert ("Suspensión jornada por puente del Día del Trabajo", date(2026, 4, 30)) in observed


def test_is_workday_respects_project_holiday_dates():
    config = CronogramaTrabajoConfig(dias_laborables_semana=5)
    holiday_dates = {date(2026, 5, 1)}

    assert cronograma_trabajo_service._is_workday(datetime(2026, 5, 1, 8, 0, 0), config, holiday_dates) is False
    assert cronograma_trabajo_service._is_workday(datetime(2026, 5, 4, 8, 0, 0), config, holiday_dates) is True


def test_rebuild_project_snapshot_persists_first_snapshot_without_null_dates(db, sample_empresa):
    proyecto = Proyecto(
        nombre="Proyecto Calendario",
        codigo="TEST-2026-001",
        codigo_root="TEST-2026-001",
        empresa_id=sample_empresa.id,
    )
    db.add(proyecto)
    db.flush()
    db.add(
        ProyectoDetalle(
            codigo_root=proyecto.codigo_root,
            empresa_id=sample_empresa.id,
            pais="Ecuador",
            provincia="Azuay",
            canton="Cuenca",
            fecha_inicio=datetime(2026, 3, 24, 0, 0, 0),
            plazo_ejecucion=180,
        )
    )
    db.commit()
    db.refresh(proyecto)

    calendar = project_calendar_service.rebuild_project_snapshot(
        db,
        proyecto=proyecto,
        start_date=date(2026, 3, 24),
        end_date=date(2026, 9, 20),
    )

    assert calendar.start_date == date(2026, 3, 24)
    assert calendar.end_date == date(2026, 9, 20)
    assert any(item.scope_type == "national" for item in calendar.items)


def test_rebuild_project_snapshot_includes_new_supported_local_holiday(db, sample_empresa):
    proyecto = Proyecto(
        nombre="Proyecto Guayaquil",
        codigo="TEST-2026-002",
        codigo_root="TEST-2026-002",
        empresa_id=sample_empresa.id,
    )
    db.add(proyecto)
    db.flush()
    db.add(
        ProyectoDetalle(
            codigo_root=proyecto.codigo_root,
            empresa_id=sample_empresa.id,
            pais="Ecuador",
            provincia="Guayas",
            canton="Guayaquil",
            fecha_inicio=datetime(2026, 7, 1, 0, 0, 0),
            plazo_ejecucion=60,
        )
    )
    db.commit()
    db.refresh(proyecto)

    calendar = project_calendar_service.rebuild_project_snapshot(
        db,
        proyecto=proyecto,
        start_date=date(2026, 7, 1),
        end_date=date(2026, 8, 31),
    )

    observed = {(item.holiday_name, item.observed_date) for item in calendar.items}
    assert ("Fundación de Guayaquil", date(2026, 7, 24)) in observed
    assert calendar.local_source_status == "resolved"


def test_rebuild_project_snapshot_includes_ambato_local_holiday(db, sample_empresa):
    proyecto = Proyecto(
        nombre="Proyecto Ambato",
        codigo="TEST-2026-003",
        codigo_root="TEST-2026-003",
        empresa_id=sample_empresa.id,
    )
    db.add(proyecto)
    db.flush()
    db.add(
        ProyectoDetalle(
            codigo_root=proyecto.codigo_root,
            empresa_id=sample_empresa.id,
            pais="Ecuador",
            provincia="Tungurahua",
            canton="Ambato",
            fecha_inicio=datetime(2026, 11, 1, 0, 0, 0),
            plazo_ejecucion=30,
        )
    )
    db.commit()
    db.refresh(proyecto)

    calendar = project_calendar_service.rebuild_project_snapshot(
        db,
        proyecto=proyecto,
        start_date=date(2026, 11, 1),
        end_date=date(2026, 11, 30),
    )

    observed = {(item.holiday_name, item.observed_date) for item in calendar.items}
    assert ("Independencia de Ambato", date(2026, 11, 14)) in observed
    assert calendar.local_source_status == "resolved"


def test_manual_holidays_are_shared_across_project_revisions_by_root(db, sample_empresa):
    root_project = Proyecto(
        nombre="Proyecto Raiz Calendario",
        codigo="TEST-2026-010",
        codigo_root="TEST-2026-010",
        revision=0,
        empresa_id=sample_empresa.id,
    )
    revision_project = Proyecto(
        nombre="Proyecto Revision Calendario",
        codigo="TEST-2026-010-R1",
        codigo_root="TEST-2026-010",
        revision=1,
        empresa_id=sample_empresa.id,
    )
    db.add_all([root_project, revision_project])
    db.flush()
    db.add(
        ProyectoDetalle(
            codigo_root=root_project.codigo_root,
            empresa_id=sample_empresa.id,
            pais="Ecuador",
            provincia="Azuay",
            canton="Cuenca",
            fecha_inicio=datetime(2026, 4, 1, 0, 0, 0),
            plazo_ejecucion=60,
        )
    )
    db.commit()
    db.refresh(root_project)
    db.refresh(revision_project)

    project_calendar_service.add_manual_holiday(
        db,
        proyecto=revision_project,
        holiday_date=date(2026, 4, 15),
        holiday_name="Festivo manual QA",
    )
    db.commit()

    overrides = db.query(ProjectCalendarOverride).filter(ProjectCalendarOverride.empresa_id == sample_empresa.id).all()
    assert len(overrides) == 1
    assert overrides[0].proyecto_id == root_project.id

    revision_calendar = project_calendar_service.get_snapshot_calendar(
        db,
        proyecto=revision_project,
        start_date=date(2026, 4, 1),
        end_date=date(2026, 5, 31),
        force_refresh=True,
    )
    root_calendar = project_calendar_service.get_snapshot_calendar(
        db,
        proyecto=root_project,
        start_date=date(2026, 4, 1),
        end_date=date(2026, 5, 31),
        force_refresh=True,
    )

    revision_items = {(item.holiday_name, item.observed_date, item.origin_type) for item in revision_calendar.items}
    root_items = {(item.holiday_name, item.observed_date, item.origin_type) for item in root_calendar.items}
    assert ("Festivo manual QA", date(2026, 4, 15), "manual_add") in revision_items
    assert ("Festivo manual QA", date(2026, 4, 15), "manual_add") in root_items
