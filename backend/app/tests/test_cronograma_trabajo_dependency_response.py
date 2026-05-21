from decimal import Decimal
from datetime import datetime, timedelta

import pytest

from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.schemas.cronograma_trabajo import (
    CronogramaTrabajoDependency,
    CronogramaTrabajoLinea,
    CronogramaTrabajoUpdate,
)
from app.services.cronograma_trabajo import cronograma_trabajo_service


def _build_dependency_fixture(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-DEPENDENCY-QA",
        nombre="Base Dependency QA",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    proyecto = Proyecto(
        nombre="Proyecto Dependency QA",
        codigo="DEP-QA",
        codigo_root="DEP-QA",
        revision=1,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    edt = EdtNode(
        proyecto_id=proyecto.id,
        tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
        orden=0,
        codigo="1",
        nombre="Capítulo Dependency QA",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    apu_source = APU(
        codigo="5-DEP-0001",
        descripcion="Origen QA",
        descripcion_normalizada="origen qa",
        unidad="u",
        costo_directo=Decimal("1.0000"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    apu_target = APU(
        codigo="5-DEP-0002",
        descripcion="Destino QA",
        descripcion_normalizada="destino qa",
        unidad="u",
        costo_directo=Decimal("1.0000"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add_all([apu_source, apu_target])
    db.commit()
    db.refresh(apu_source)
    db.refresh(apu_target)

    presupuesto = Presupuesto(
        codigo="PRES-DEP-QA",
        revision=1,
        descripcion="Presupuesto Dependency QA",
        subtotal=Decimal("2.0000"),
        total=Decimal("2.0000"),
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    line_source = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=apu_source.id,
        edt_id=edt.id,
        codigo_item="1.1",
        descripcion=apu_source.descripcion,
        unidad="u",
        cantidad=Decimal("1.000000"),
        precio_unitario=Decimal("1.0000"),
        precio_total=Decimal("1.0000"),
        orden=1,
    )
    line_target = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=apu_target.id,
        edt_id=edt.id,
        codigo_item="1.2",
        descripcion=apu_target.descripcion,
        unidad="u",
        cantidad=Decimal("1.000000"),
        precio_unitario=Decimal("1.0000"),
        precio_total=Decimal("1.0000"),
        orden=2,
    )
    db.add_all([line_source, line_target])
    db.commit()
    db.refresh(line_source)
    db.refresh(line_target)

    return proyecto, presupuesto, line_source, line_target


@pytest.mark.parametrize(
    ("dependency_type", "source_start", "source_finish", "stale_target_start", "stale_target_finish", "expected_anchor"),
    [
        (
            "FS",
            "2026-04-20T08:00:00",
            "2026-04-20T16:00:00",
            "2026-01-01T08:00:00",
            "2026-01-01T16:00:00",
            "start_matches_source_finish",
        ),
        (
            "SS",
            "2026-04-20T09:30:00",
            "2026-04-21T10:30:00",
            "2026-01-02T08:00:00",
            "2026-01-03T16:00:00",
            "start_matches_source_start",
        ),
        (
            "FF",
            "2026-04-20T11:00:00",
            "2026-04-22T15:45:00",
            "2026-01-05T08:00:00",
            "2026-01-06T16:00:00",
            "finish_matches_source_finish",
        ),
        (
            "SF",
            "2026-04-20T16:00:00",
            "2026-04-21T09:15:00",
            "2026-01-07T08:00:00",
            "2026-01-08T16:00:00",
            "finish_matches_source_start",
        ),
    ],
)
def test_get_schedule_returns_dependency_governed_dates_in_rows(
    db,
    sample_empresa,
    dependency_type,
    source_start,
    source_finish,
    stale_target_start,
    stale_target_finish,
    expected_anchor,
):
    proyecto, presupuesto, line_source, line_target = _build_dependency_fixture(db, sample_empresa)
    proyecto.fecha_inicio = datetime.fromisoformat("2026-04-20T08:00:00")
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    dependency = CronogramaTrabajoDependency(
        source_id=line_source.id,
        target_id=line_target.id,
        type=dependency_type,
        lag_days=0,
        lag_unit="day",
    )

    cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            schedule_data={
                str(line_source.id): CronogramaTrabajoLinea(
                    start_date=source_start,
                    end_date=source_finish,
                    duration=1,
                    progress_pct=0,
                ),
                str(line_target.id): CronogramaTrabajoLinea(
                    start_date=stale_target_start,
                    end_date=stale_target_finish,
                    duration=1,
                    progress_pct=0,
                    predecessors=[line_source.id],
                    dependencies=[dependency],
                ),
            }
        ),
    )

    response = cronograma_trabajo_service.get_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    rows = response.model_dump()["rows"]
    rows_by_id = {row["linea_id"]: row for row in rows}
    source_row = rows_by_id[line_source.id]
    target_row = rows_by_id[line_target.id]

    assert target_row["dependencies"], "La respuesta visible debe conservar la relación persistida"

    source_start_value = source_row["start_date"]
    source_finish_value = source_row["end_date"]
    target_start_value = target_row["start_date"]
    target_finish_value = target_row["end_date"]
    stale_target_start_value = datetime.fromisoformat(stale_target_start)
    stale_target_finish_value = datetime.fromisoformat(stale_target_finish)

    assert target_start_value != stale_target_start_value
    assert target_finish_value != stale_target_finish_value

    if expected_anchor == "start_matches_source_finish":
        assert abs(target_start_value - source_finish_value) <= timedelta(seconds=1)
    elif expected_anchor == "start_matches_source_start":
        assert abs(target_start_value - source_start_value) <= timedelta(seconds=1)
    elif expected_anchor == "finish_matches_source_finish":
        assert abs(target_finish_value - source_finish_value) <= timedelta(seconds=1)
    elif expected_anchor == "finish_matches_source_start":
        assert abs(target_finish_value - source_start_value) <= timedelta(seconds=1)
    else:
        raise AssertionError(f"Ancla no soportada en test: {expected_anchor}")


def test_update_schedule_rejects_task_before_project_start(db, sample_empresa):
    proyecto, presupuesto, line_source, line_target = _build_dependency_fixture(db, sample_empresa)
    proyecto.fecha_inicio = datetime.fromisoformat("2026-04-20T08:00:00")
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    with pytest.raises(ValueError, match="ninguna tarea puede iniciar antes de la fecha/hora de inicio del proyecto"):
        cronograma_trabajo_service.update_schedule(
            db,
            presupuesto_id=presupuesto.id,
            proyecto_id=proyecto.id,
            empresa_id=sample_empresa.id,
            obj_in=CronogramaTrabajoUpdate(
                schedule_data={
                    str(line_source.id): CronogramaTrabajoLinea(
                    start_date="2026-04-17T08:00:00",
                    end_date="2026-04-17T16:00:00",
                        duration=1,
                        progress_pct=0,
                    ),
                }
            ),
        )


def test_update_schedule_floors_ff_dependency_that_would_start_before_project_start(db, sample_empresa):
    proyecto, presupuesto, line_source, line_target = _build_dependency_fixture(db, sample_empresa)
    proyecto.fecha_inicio = datetime.fromisoformat("2026-04-20T08:00:00")
    db.add(proyecto)
    db.commit()
    db.refresh(proyecto)

    dependency = CronogramaTrabajoDependency(
        source_id=line_source.id,
        target_id=line_target.id,
        type="FF",
        lag_days=0,
        lag_unit="day",
    )

    response = cronograma_trabajo_service.update_schedule(
        db,
        presupuesto_id=presupuesto.id,
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
        obj_in=CronogramaTrabajoUpdate(
            schedule_data={
                str(line_source.id): CronogramaTrabajoLinea(
                    start_date="2026-04-20T08:00:00",
                    end_date="2026-04-20T09:15:00",
                    duration=0.1563,
                    progress_pct=0,
                ),
                str(line_target.id): CronogramaTrabajoLinea(
                    start_date="2026-04-20T08:00:00",
                    end_date="2026-04-20T16:00:00",
                    duration=1,
                    progress_pct=0,
                    predecessors=[line_source.id],
                    dependencies=[dependency],
                ),
            }
        ),
    )

    rows_by_id = {row.linea_id: row for row in response.rows}
    source_row = rows_by_id[line_source.id]
    target_row = rows_by_id[line_target.id]

    assert target_row.start_date >= proyecto.fecha_inicio
    assert target_row.end_date >= source_row.end_date
    assert target_row.dependencies[0].type == "FF"
