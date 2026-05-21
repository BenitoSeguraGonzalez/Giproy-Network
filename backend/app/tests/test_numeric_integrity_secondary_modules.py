from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.endpoints.cronogramas import (
    _build_cash_flow_with_resource_categories,
    _build_cash_flow_from_footer,
    _build_gantt_distribution_for_periods,
    _build_periods,
    _resolve_valued_line_distribution,
    _resolve_schedule_temporal_status,
    _validate_distribution,
)
from app.api.endpoints.cronogramas_trabajo import _build_cronograma_trabajo_pareto_response
from app.schemas.cronograma import CronogramaFooter, CronogramaLineaValorada
from app.schemas.cronograma_trabajo import CronogramaTrabajoComputedRow
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.unidad import Unidad
from app.services.formula_polinomica import formula_polinomica_service
from app.services.reporting import reporting_service


def _build_formula_budget_fixture(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-TEST",
        nombre="Base Test",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=False,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
    )
    db.add(unidad)
    db.commit()
    db.refresh(unidad)

    subcategoria = SubcategoriaItem(
        codigo="2-0008",
        descripcion="Instalaciones Sanitarias",
        subcategoria_codigo=2,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(subcategoria)
    db.commit()
    db.refresh(subcategoria)

    recurso = Recurso(
        codigo="2-0008-00002",
        descripcion="Teflón en rollo",
        descripcion_normalizada="teflon en rollo",
        precio=Decimal("0.9900"),
        unidad_id=unidad.id,
        subcategoria_item_id=subcategoria.id,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
        revisado=True,
    )
    db.add(recurso)
    db.commit()
    db.refresh(recurso)

    proyecto = Proyecto(
        nombre="Proyecto Test",
        codigo="PROJ-TEST",
        codigo_root="PROJ-TEST",
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
        nombre="Capitulo Test",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    apu = APU(
        codigo="5-011-0004",
        descripcion='Neplo HG D=3/4"',
        descripcion_normalizada='neplo hg d=3/4"',
        unidad="u",
        costo_directo=Decimal("0.5800"),
        precio_unitario_total=Decimal("1.0000"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(apu)
    db.commit()
    db.refresh(apu)

    apu_line = APULinea(
        apu_id=apu.id,
        recurso_id=recurso.id,
        cantidad=Decimal("0.500000"),
        rendimiento=Decimal("1.000000"),
        orden=0,
        precio_congelado=Decimal("0.5700"),
        subtotal=Decimal("0.2900"),
    )
    db.add(apu_line)
    db.commit()
    db.refresh(apu_line)

    presupuesto = Presupuesto(
        codigo="PRES-TEST",
        revision=1,
        descripcion="Presupuesto Test",
        subtotal=Decimal("0.5800"),
        indirectos_total=Decimal("0.4200"),
        total=Decimal("1.0000"),
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    detalle = PresupuestoDetalle(
        presupuesto_id=presupuesto.id,
        apu_id=apu.id,
        edt_id=edt.id,
        codigo_item="1 - 5-011-0004",
        descripcion=apu.descripcion,
        unidad="u",
        cantidad=Decimal("2.000000"),
        precio_unitario=Decimal("0.2900"),
        precio_total=Decimal("0.5800"),
        orden=0,
    )
    db.add(detalle)
    db.commit()
    db.refresh(detalle)

    db.refresh(presupuesto)
    return presupuesto, recurso


def _build_formula_excel_fixture(db, sample_empresa):
    base = BaseTrabajo(
        codigo_unico="BASE-FPOL-EXCEL",
        nombre="Base FPol Excel",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add(base)
    db.commit()
    db.refresh(base)

    unidad = Unidad(
        descripcion="u",
        descripcion_completa="Unidad",
        subcategoria_codigo=2,
        es_global=False,
        base_trabajo_id=base.id,
        empresa_id=sample_empresa.id,
    )
    db.add(unidad)
    db.commit()
    db.refresh(unidad)

    subcats = {}
    for code, desc in [
        (1, "Equipos y herramientas"),
        (2, "Materiales"),
        (4, "Mano de obra"),
    ]:
        subcat = SubcategoriaItem(
            codigo=f"{code}-0001",
            descripcion=desc,
            subcategoria_codigo=code,
            base_trabajo_id=base.id,
            empresa_id=sample_empresa.id,
            revisado=True,
        )
        db.add(subcat)
        db.commit()
        db.refresh(subcat)
        subcats[code] = subcat

    resource_specs = [
        ("EQ", "Equipo y maquinaria", 1, "456.2600", "E"),
        ("LAB", "Cuadrilla tipo", 4, "714.7400", "B"),
        ("D", "Cemento Portland", 2, "147.5400", "D"),
        ("M", "Bloque", 2, "661.3800", "M"),
        ("P", "Petreos Azuay", 2, "187.5100", "P"),
        ("X", "Agua y disposicion", 2, "406.5500", "X"),
    ]

    resources = {}
    apu = APU(
        codigo="FPOL-EXCEL",
        descripcion="Caso patron formula polinomica",
        descripcion_normalizada="caso patron formula polinomica",
        unidad="u",
        costo_directo=Decimal("2573.9800"),
        precio_unitario_total=Decimal("2573.9800"),
        empresa_id=sample_empresa.id,
        base_trabajo_id=base.id,
    )
    db.add(apu)
    db.commit()
    db.refresh(apu)

    for order, (code, description, category, amount, symbol) in enumerate(resource_specs, start=1):
        recurso = Recurso(
            codigo=f"{category}-0001-{order:05d}",
            descripcion=description,
            descripcion_normalizada=description.lower(),
            precio=Decimal(amount),
            unidad_id=unidad.id,
            subcategoria_item_id=subcats[category].id,
            base_trabajo_id=base.id,
            empresa_id=sample_empresa.id,
            revisado=True,
        )
        db.add(recurso)
        db.commit()
        db.refresh(recurso)
        resources[symbol] = recurso

        db.add(
            APULinea(
                apu_id=apu.id,
                recurso_id=recurso.id,
                cantidad=Decimal("1.000000"),
                rendimiento=Decimal("1.000000"),
                orden=order,
                precio_congelado=Decimal(amount),
                subtotal=Decimal(amount),
            )
        )
    db.commit()

    proyecto = Proyecto(
        nombre="Proyecto Formula Polinomica Excel",
        codigo="PROJ-FPOL-EXCEL",
        codigo_root="PROJ-FPOL-EXCEL",
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
        nombre="Formula Polinomica",
        empresa_id=sample_empresa.id,
    )
    db.add(edt)
    db.commit()
    db.refresh(edt)

    presupuesto = Presupuesto(
        codigo="PRES-FPOL-EXCEL",
        revision=1,
        descripcion="Presupuesto Formula Polinomica Excel",
        subtotal=Decimal("2573.9800"),
        indirectos_total=Decimal("0.0000"),
        total=Decimal("2573.9800"),
        proyecto_id=proyecto.id,
        empresa_id=sample_empresa.id,
    )
    db.add(presupuesto)
    db.commit()
    db.refresh(presupuesto)

    db.add(
        PresupuestoDetalle(
            presupuesto_id=presupuesto.id,
            apu_id=apu.id,
            edt_id=edt.id,
            codigo_item="1 - FPOL-EXCEL",
            descripcion=apu.descripcion,
            unidad="u",
            cantidad=Decimal("1.000000"),
            precio_unitario=Decimal("2573.9800"),
            precio_total=Decimal("2573.9800"),
            orden=0,
        )
    )
    db.commit()
    db.refresh(presupuesto)
    return presupuesto, resources


def test_formula_polinomica_uses_operational_apu_costs_instead_of_master_prices(db, sample_empresa):
    presupuesto, recurso = _build_formula_budget_fixture(db, sample_empresa)

    totals = formula_polinomica_service._aggregate_resources(db, presupuesto)

    assert totals[recurso.id]["costo_total"] == Decimal("0.5800")
    assert totals[recurso.id]["costo_total"] != Decimal("0.9900")


def test_formula_polinomica_persists_real_direct_cost_reference(db, sample_empresa):
    presupuesto, recurso = _build_formula_budget_fixture(db, sample_empresa)

    formula_polinomica_service.save_assignments(db, presupuesto.id, [{"recurso_id": recurso.id, "simbolo": "D"}])
    formula = formula_polinomica_service.regenerate_formula(db, presupuesto.id, tipo="SIN_DESGLOSE")

    assert formula.costo_directo_total == Decimal("0.5800")
    assert formula.coeficiente_fijo == Decimal("0.000")
    assert sum((monomio.coeficiente for monomio in formula.monomios), Decimal("0.000")) == Decimal("1.000")


def test_formula_polinomica_matches_excel_without_equipment_breakdown(db, sample_empresa):
    presupuesto, resources = _build_formula_excel_fixture(db, sample_empresa)
    formula_polinomica_service.save_assignments(
        db,
        presupuesto.id,
        [
            {"recurso_id": resources["D"].id, "simbolo": "D"},
            {"recurso_id": resources["M"].id, "simbolo": "M"},
            {"recurso_id": resources["P"].id, "simbolo": "P"},
            {"recurso_id": resources["X"].id, "simbolo": "X"},
        ],
    )

    formula = formula_polinomica_service.regenerate_formula(db, presupuesto.id, tipo="SIN_DESGLOSE")

    expected = {
        "B": Decimal("0.278"),
        "D": Decimal("0.057"),
        "E": Decimal("0.177"),
        "M": Decimal("0.257"),
        "P": Decimal("0.073"),
        "X": Decimal("0.158"),
    }
    assert {monomio.simbolo: monomio.coeficiente for monomio in formula.monomios} == expected
    assert formula.coeficiente_fijo == Decimal("0.000")
    assert formula.formula_general == "PR = P0 (0.278B1/B0 + 0.057D1/D0 + 0.177E1/E0 + 0.257M1/M0 + 0.073P1/P0 + 0.158X1/X0)"


def test_formula_polinomica_matches_excel_with_equipment_breakdown(db, sample_empresa):
    presupuesto, resources = _build_formula_excel_fixture(db, sample_empresa)
    formula_polinomica_service.save_assignments(
        db,
        presupuesto.id,
        [
            {"recurso_id": resources["D"].id, "simbolo": "D"},
            {"recurso_id": resources["M"].id, "simbolo": "M"},
            {"recurso_id": resources["P"].id, "simbolo": "P"},
            {"recurso_id": resources["X"].id, "simbolo": "X"},
        ],
    )

    formula = formula_polinomica_service.regenerate_formula(db, presupuesto.id, tipo="CON_DESGLOSE")

    expected = {
        "B": Decimal("0.295"),
        "C": Decimal("0.018"),
        "D": Decimal("0.057"),
        "E": Decimal("0.124"),
        "M": Decimal("0.257"),
        "P": Decimal("0.073"),
        "R": Decimal("0.018"),
        "X": Decimal("0.158"),
    }
    assert {monomio.simbolo: monomio.coeficiente for monomio in formula.monomios} == expected
    assert formula.config_desglose == {"B": 0.1, "C": 0.1, "E": 0.7, "R": 0.1, "X": 0.0}
    assert any(getattr(item, "recurso_descripcion", "") == "Mecanico mantenimiento" for item in formula.cuadrilla_tipo)


def test_formula_polinomica_allows_x_as_remainder_term(db, sample_empresa):
    presupuesto, recurso = _build_formula_budget_fixture(db, sample_empresa)
    formula_polinomica_service.save_assignments(db, presupuesto.id, [{"recurso_id": recurso.id, "simbolo": "X"}])

    updated = formula_polinomica_service.regenerate_formula(db, presupuesto.id, tipo="SIN_DESGLOSE")

    assert updated.tipo == "SIN_DESGLOSE"
    assert [(monomio.simbolo, monomio.coeficiente) for monomio in updated.monomios] == [("X", Decimal("1.000"))]


def test_cronograma_distribution_is_canonicalized_to_100():
    distribution = _validate_distribution([33.33, 33.33, 33.33], 3, detail="Distribución inválida")

    assert len(distribution) == 3
    assert round(sum(distribution), 6) == 100.0
    assert distribution[-1] == 33.34


def test_cronograma_distribution_rejects_large_deviation():
    with pytest.raises(HTTPException):
        _validate_distribution([50, 40, 0], 3, detail="Distribución inválida")


def test_cronograma_valorado_monthly_periods_follow_operational_span():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 9, 20, 23, 59, 59, tzinfo=timezone.utc)

    periods = _build_periods(start_at, end_at, "mensual", plazo_days=180)

    assert len(periods) == 7
    assert periods[0].starts_at.date().isoformat() == "2026-03-24"
    assert periods[0].ends_at.date().isoformat() == "2026-03-31"
    assert periods[1].starts_at.date().isoformat() == "2026-04-01"
    assert periods[-1].ends_at.date().isoformat() == "2026-09-20"


def test_cronograma_valorado_periods_anchor_to_workday_start_hour():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 4, 22, 16, 0, 0, tzinfo=timezone.utc)

    periods = _build_periods(start_at, end_at, "mensual", plazo_days=30, start_hour=7.5, workday_hours=8)

    assert periods[0].starts_at.hour == 7
    assert periods[0].starts_at.minute == 30
    assert periods[-1].ends_at.hour == 16
    assert periods[-1].ends_at.minute == 0


def test_cronograma_valorado_period_type_recalculates_count_by_span():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 9, 20, 23, 59, 59, tzinfo=timezone.utc)

    assert len(_build_periods(start_at, end_at, "semanal", plazo_days=180)) == 26
    assert len(_build_periods(start_at, end_at, "bimestral", plazo_days=180)) == 4
    assert len(_build_periods(start_at, end_at, "semestral", plazo_days=180)) == 2


def test_cronograma_valorado_quincenal_periods_follow_calendar_boundaries():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 4, 22, 16, 0, 0, tzinfo=timezone.utc)

    periods = _build_periods(start_at, end_at, "quincenal", plazo_days=30, start_hour=8, workday_hours=8)

    assert len(periods) == 3
    assert periods[0].starts_at.date().isoformat() == "2026-03-24"
    assert periods[0].ends_at.date().isoformat() == "2026-03-31"
    assert periods[1].starts_at.date().isoformat() == "2026-04-01"
    assert periods[1].ends_at.date().isoformat() == "2026-04-15"
    assert periods[2].starts_at.date().isoformat() == "2026-04-16"
    assert periods[2].ends_at.date().isoformat() == "2026-04-22"


def test_cronograma_valorado_gantt_distribution_uses_temporal_overlap():
    start_at = datetime(2026, 3, 24, 8, 0, 0, tzinfo=timezone.utc)
    end_at = datetime(2026, 5, 22, 16, 0, 0, tzinfo=timezone.utc)
    periods = _build_periods(start_at, end_at, "mensual", plazo_days=60, start_hour=8, workday_hours=8)

    distribution = _build_gantt_distribution_for_periods(
        periods,
        datetime(2026, 4, 18, 8, 0, 0, tzinfo=timezone.utc),
        datetime(2026, 4, 27, 16, 0, 0, tzinfo=timezone.utc),
        start_hour=8,
        workday_hours=8,
    )

    assert len(distribution) == 3
    assert distribution == [0.0, 100.0, 0.0]
    assert round(sum(distribution), 6) == 100.0


def test_cronograma_valorado_gantt_distribution_allocates_milestone_to_containing_period():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 5, 22, 23, 59, 59, tzinfo=timezone.utc)
    periods = _build_periods(start_at, end_at, "mensual", plazo_days=60)

    distribution = _build_gantt_distribution_for_periods(
        periods,
        datetime(2026, 5, 1, tzinfo=timezone.utc),
        datetime(2026, 5, 1, tzinfo=timezone.utc),
    )

    assert distribution == [0.0, 0.0, 100.0]


def test_material_only_line_without_manual_window_requires_manual_schedule():
    row = SimpleNamespace(
        recurso_gobernante_categoria_detalle="materiales",
        start_date=datetime(2026, 5, 1, 8, 0, 0, tzinfo=timezone.utc),
        end_date=datetime(2026, 5, 1, 16, 0, 0, tzinfo=timezone.utc),
        duracion_horas=0.0,
        metadata={},
    )

    temporal_status = _resolve_schedule_temporal_status(row, None)

    assert temporal_status["is_material_only"] is True
    assert temporal_status["requires_manual_schedule"] is True
    assert temporal_status["is_temporally_derivable"] is False
    assert temporal_status["temporal_source"] == "manual_schedule_required_material_only"


def test_material_only_line_with_manual_window_uses_manual_temporal_source():
    row = SimpleNamespace(
        recurso_gobernante_categoria_detalle="materiales",
        start_date=datetime(2026, 5, 1, 8, 0, 0, tzinfo=timezone.utc),
        end_date=datetime(2026, 5, 5, 16, 0, 0, tzinfo=timezone.utc),
        duracion_horas=0.0,
        metadata={},
    )
    override = SimpleNamespace(
        start_date=datetime(2026, 5, 1, 8, 0, 0, tzinfo=timezone.utc),
        end_date=datetime(2026, 5, 5, 16, 0, 0, tzinfo=timezone.utc),
        duration=5.0,
    )

    temporal_status = _resolve_schedule_temporal_status(row, override)

    assert temporal_status["is_material_only"] is True
    assert temporal_status["requires_manual_schedule"] is False
    assert temporal_status["is_temporally_derivable"] is True
    assert temporal_status["temporal_source"] == "manual_temporal_material_only"


def test_manual_schedule_required_line_uses_zero_distribution_until_window_exists():
    distribution = _resolve_valued_line_distribution(
        3,
        derived_distribution=None,
        global_distribution=[33.333333, 33.333333, 33.333334],
        requires_manual_schedule=True,
    )

    assert distribution == [0.0, 0.0, 0.0]


def test_valued_line_distribution_uses_global_distribution_when_manual_schedule_not_required():
    distribution = _resolve_valued_line_distribution(
        3,
        derived_distribution=None,
        global_distribution=[33.333333, 33.333333, 33.333334],
        requires_manual_schedule=False,
    )

    assert distribution == [33.333333, 33.333333, 33.333334]


def test_cronograma_cash_flow_is_derived_from_valorado_footer():
    start_at = datetime(2026, 3, 24, tzinfo=timezone.utc)
    end_at = datetime(2026, 5, 22, 23, 59, 59, tzinfo=timezone.utc)
    periods = _build_periods(start_at, end_at, "mensual", plazo_days=60)
    footer = CronogramaFooter(
        inversion_parcial=[50.0, 100.0, 150.0],
        inversion_acumulada=[50.0, 150.0, 300.0],
        avance_parcial_pct=[16.6667, 33.3333, 50.0],
        avance_acumulado_pct=[16.6667, 50.0, 100.0],
    )

    cash_flow = _build_cash_flow_from_footer(periods, footer)

    assert [item.cost for item in cash_flow] == [50.0, 100.0, 150.0]
    assert [item.cumulative_cost for item in cash_flow] == [50.0, 150.0, 300.0]
    assert cash_flow[-1].cumulative_pct == 100.0


def test_cronograma_cash_flow_preserves_effective_work_hours():
    start_at = datetime(2026, 3, 24, 7, 30, 0, tzinfo=timezone.utc)
    end_at = datetime(2026, 4, 22, 15, 30, 0, tzinfo=timezone.utc)
    periods = _build_periods(start_at, end_at, "mensual", plazo_days=30, start_hour=7.5, workday_hours=8)
    footer = CronogramaFooter(
        inversion_parcial=[25.0, 75.0],
        inversion_acumulada=[25.0, 100.0],
        avance_parcial_pct=[25.0, 75.0],
        avance_acumulado_pct=[25.0, 100.0],
    )

    cash_flow = _build_cash_flow_from_footer(periods, footer, start_hour=7.5, workday_hours=8)

    assert len(cash_flow) == 2
    assert cash_flow[0].work_hours == 64.0
    assert cash_flow[1].work_hours == 176.0


def test_cronograma_cash_flow_allocates_costs_by_real_resource_categories():
    periods = _build_periods(
        datetime(2026, 3, 24, 8, 0, 0, tzinfo=timezone.utc),
        datetime(2026, 4, 22, 16, 0, 0, tzinfo=timezone.utc),
        "semestral",
        plazo_days=30,
    )
    footer = CronogramaFooter(
        inversion_parcial=[100.0],
        inversion_acumulada=[100.0],
        avance_parcial_pct=[100.0],
        avance_acumulado_pct=[100.0],
    )
    rows = [
        CronogramaLineaValorada(
            linea_id=10,
            descripcion="Partida QA",
            precio_total=100.0,
            distribution=[100.0],
        )
    ]
    schedule_row_map = {
        "10": CronogramaTrabajoComputedRow(
            linea_id=10,
            presupuesto_linea_id=10,
            edt_id=1,
            descripcion="Partida QA",
            horas_equipos=6.0,
            horas_mano_obra=2.0,
            horas_transporte=2.0,
            horas_total=10.0,
        )
    }

    cash_flow = _build_cash_flow_with_resource_categories(periods, footer, rows, schedule_row_map=schedule_row_map)

    assert cash_flow[0].category_costs["Equipos"] == pytest.approx(60.0)
    assert cash_flow[0].category_costs["Mano de obra"] == pytest.approx(20.0)
    assert cash_flow[0].category_costs["Transporte"] == pytest.approx(20.0)
    assert cash_flow[0].dominant_category == "Equipos"


def test_cronograma_trabajo_pareto_integrates_cost_and_time():
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=101,
            presupuesto_linea_id=101,
            edt_id=1,
            apu_id=11,
            codigo_item="1.1.1",
            descripcion="Replanteo",
            trabajo_total=120.0,
            duracion_horas=80.0,
            dias_calendario=10.0,
        ),
        CronogramaTrabajoComputedRow(
            linea_id=102,
            presupuesto_linea_id=102,
            edt_id=1,
            apu_id=12,
            codigo_item="1.1.2",
            descripcion="Excavación",
            trabajo_total=40.0,
            duracion_horas=24.0,
            dias_calendario=3.0,
        ),
    ]

    response = _build_cronograma_trabajo_pareto_response(
        presupuesto_id=7,
        rows=rows,
        price_map={101: 1000.0, 102: 250.0},
        view="integrated",
        top=20,
    )

    assert response.total_items == 2
    assert response.items[0].linea_id == 101
    assert round(response.items[0].cost_pct, 2) == 80.0
    assert round(response.items[0].time_pct, 2) == 75.0
    assert response.items[0].porcentaje_acumulado >= response.items[0].porcentaje
    assert round(sum(item.porcentaje for item in response.items), 4) == 100.0


def test_cronograma_trabajo_pareto_supports_edt_and_window_filters():
    rows = [
        CronogramaTrabajoComputedRow(
            linea_id=101,
            presupuesto_linea_id=101,
            edt_id=1,
            apu_id=11,
            codigo_item="1.1.1",
            descripcion="Replanteo",
            trabajo_total=120.0,
            start_date=datetime(2026, 4, 1, tzinfo=timezone.utc),
            end_date=datetime(2026, 4, 5, tzinfo=timezone.utc),
            dias_calendario=5.0,
        ),
        CronogramaTrabajoComputedRow(
            linea_id=102,
            presupuesto_linea_id=102,
            edt_id=2,
            apu_id=12,
            codigo_item="2.1.1",
            descripcion="Estructura",
            trabajo_total=40.0,
            start_date=datetime(2026, 5, 1, tzinfo=timezone.utc),
            end_date=datetime(2026, 5, 3, tzinfo=timezone.utc),
            dias_calendario=3.0,
        ),
    ]

    response = _build_cronograma_trabajo_pareto_response(
        presupuesto_id=7,
        rows=rows,
        price_map={101: 1000.0, 102: 250.0},
        view="time",
        top=20,
        edt_id=1,
        start_from=date(2026, 4, 1),
        end_to=date(2026, 4, 30),
    )

    assert response.total_items == 1
    assert response.items[0].linea_id == 101


def test_reporting_polinomica_preview_uses_budget_amounts(db, sample_empresa):
    presupuesto, recurso = _build_formula_budget_fixture(db, sample_empresa)
    formula_polinomica_service.save_assignments(db, presupuesto.id, [{"recurso_id": recurso.id, "simbolo": "D"}])
    formula = formula_polinomica_service.regenerate_formula(db, presupuesto.id, tipo="SIN_DESGLOSE")

    preview = reporting_service._build_polinomica_preview(presupuesto, formula)

    assert preview["costo_directo"] == 0.58
    assert preview["costo_indirecto"] == 0.42
    assert preview["precio_total"] == 1.0
    assert preview["lineas"][0]["precio"] == 0.58
    assert preview["lineas"][0]["subtotal"] == float(formula.monomios[0].coeficiente) * 0.58
