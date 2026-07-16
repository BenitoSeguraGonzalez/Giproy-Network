from decimal import Decimal

from app.api.endpoints.cronogramas_trabajo import (
    _apply_gantt_operational_snapshots_to_apu_lines,
    _apply_gantt_price_previews_to_budget,
)
from app.api.endpoints.presupuestos import _register_presupuesto_functional_modification
from app.core.calculation_policy import calculate_budget_line_total
from app.models.apu import APU, APULinea
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.recurso import Recurso
from app.services.presupuesto import refresh_presupuesto_prices
from app.services.project_functional_modification import project_functional_modification_service


def _create_budget_with_line(db, *, presupuesto_id=901, line_id=9901):
    presupuesto = Presupuesto(
        id=presupuesto_id,
        descripcion="Presupuesto de prueba",
        proyecto_id=77,
        empresa_id=33,
        moneda="USD",
        dec_moneda=2,
        dec_calculos=4,
        iva_aplicado=0,
    )
    line = PresupuestoDetalle(
        id=line_id,
        presupuesto_id=presupuesto_id,
        edt_id=7001,
        apu_id=501,
        descripcion="Hormigon ciclopeo",
        unidad="m3",
        cantidad=Decimal("16.5800"),
        precio_unitario=Decimal("132.79"),
        precio_total=Decimal("2201.66"),
        tanteo_activo=False,
    )
    db.add(presupuesto)
    db.add(line)
    db.flush()
    return presupuesto, line


def test_gantt_price_preview_updates_budget_line_with_official_policy(db):
    presupuesto, line = _create_budget_with_line(db)

    result = _apply_gantt_price_previews_to_budget(
        db,
        presupuesto=presupuesto,
        intentions=[
            {
                "type": "resource_editor",
                "linea_presupuesto_id": line.id,
                "price_preview": {
                    "total_unit_price": "100.65",
                    "budget_line_total_before": "2201.66",
                    "budget_line_total_after": "1668.78",
                },
            }
        ],
    )

    expected_total = calculate_budget_line_total(
        quantity=Decimal("16.5800"),
        unit_price=Decimal("100.65"),
        money_decimals=2,
        calc_decimals=4,
    )
    db.refresh(line)
    db.refresh(presupuesto)

    assert result["updated_line_ids"] == [line.id]
    assert result["count"] == 1
    assert line.precio_unitario == Decimal("100.65")
    assert line.precio_total == expected_total
    assert line.tanteo_activo is True
    assert presupuesto.subtotal == expected_total
    assert presupuesto.total == expected_total


def test_gantt_price_preview_does_not_update_other_budget_lines(db):
    presupuesto, line = _create_budget_with_line(db)
    other_presupuesto, other_line = _create_budget_with_line(
        db,
        presupuesto_id=902,
        line_id=9902,
    )

    result = _apply_gantt_price_previews_to_budget(
        db,
        presupuesto=presupuesto,
        intentions=[
            {
                "type": "resource_editor",
                "linea_presupuesto_id": other_line.id,
                "price_preview": {"total_unit_price": "100.65"},
            }
        ],
    )

    db.refresh(line)
    db.refresh(other_line)
    db.refresh(other_presupuesto)

    assert result["updated_line_ids"] == []
    assert result["count"] == 0
    assert line.precio_unitario == Decimal("132.79")
    assert other_line.precio_unitario == Decimal("132.79")


def test_gantt_operational_snapshot_updates_apu_lines_with_inherited_factor(db):
    presupuesto, _ = _create_budget_with_line(db)
    parent_apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    child_apu = APU(
        id=502,
        codigo="5-0005-0002",
        descripcion="Hormigon simple",
        descripcion_normalizada="hormigon simple",
        unidad="m3",
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    peon = Recurso(
        id=9001,
        codigo="4-0001-00001",
        descripcion="Peon",
        descripcion_normalizada="peon",
        precio=Decimal("4.00"),
        unidad_id=1,
        subcategoria_item_id=1,
        base_trabajo_id=34,
        empresa_id=presupuesto.empresa_id,
    )
    parent_peon_line = APULinea(
        id=7001,
        apu_id=parent_apu.id,
        recurso_id=peon.id,
        cantidad=Decimal("2.000000"),
        rendimiento=Decimal("0.500000"),
        orden=1,
    )
    child_reference_line = APULinea(
        id=7002,
        apu_id=parent_apu.id,
        apu_hijo_id=child_apu.id,
        cantidad=Decimal("0.620000"),
        rendimiento=Decimal("1.000000"),
        orden=2,
    )
    child_peon_line = APULinea(
        id=7003,
        apu_id=child_apu.id,
        recurso_id=peon.id,
        cantidad=Decimal("3.000000"),
        rendimiento=Decimal("0.500000"),
        orden=1,
    )
    db.add_all([
        parent_apu,
        child_apu,
        peon,
        parent_peon_line,
        child_reference_line,
        child_peon_line,
    ])
    db.flush()

    result = _apply_gantt_operational_snapshots_to_apu_lines(
        db,
        presupuesto=presupuesto,
        intentions=[
            {
                "type": "resource_editor",
                "linea_presupuesto_id": 9901,
                "apu_id": parent_apu.id,
                "operational_snapshot": {
                    "status": "anidados_explotados",
                    "has_nested": True,
                    "resources": [
                        {
                            "recurso_id": peon.id,
                            "work_policy": "fixed",
                            "source_lines": [
                                {
                                    "linea_id": parent_peon_line.id,
                                    "apu_id": parent_apu.id,
                                    "nested": False,
                                    "inherited_factor": "1",
                                    "native_cantidad": "2.000000",
                                    "original_cantidad": "2.000000",
                                    "cantidad": "1.000000",
                                    "rendimiento": "1.000000",
                                },
                                {
                                    "linea_id": child_peon_line.id,
                                    "apu_id": child_apu.id,
                                    "nested": True,
                                    "inherited_factor": "0.620000",
                                    "native_cantidad": "3.000000",
                                    "original_cantidad": "3.000000",
                                    "cantidad": "2.000000",
                                    "rendimiento": "0.750000",
                                },
                            ],
                        }
                    ],
                },
            }
        ],
    )

    db.refresh(parent_peon_line)
    db.refresh(child_peon_line)
    db.refresh(parent_apu)
    db.refresh(child_apu)

    assert result["updated_line_ids"] == [parent_peon_line.id, child_peon_line.id]
    assert result["count"] == 2
    assert parent_peon_line.cantidad == Decimal("1.000000")
    assert parent_peon_line.rendimiento == Decimal("1.000000")
    assert child_peon_line.cantidad == Decimal("2.000000")
    assert child_peon_line.rendimiento == Decimal("0.750000")
    assert child_apu.costo_directo > 0
    assert parent_apu.costo_directo > child_apu.costo_directo


def test_gantt_operational_snapshot_infers_inherited_factor_for_legacy_source_lines(db):
    presupuesto, line = _create_budget_with_line(db)
    parent_apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    child_apu = APU(
        id=502,
        codigo="5-0005-0002",
        descripcion="Hormigon simple",
        descripcion_normalizada="hormigon simple",
        unidad="m3",
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    peon = Recurso(
        id=9001,
        codigo="4-0001-00001",
        descripcion="Peon",
        descripcion_normalizada="peon",
        precio=Decimal("4.00"),
        unidad_id=1,
        subcategoria_item_id=1,
        base_trabajo_id=34,
        empresa_id=presupuesto.empresa_id,
    )
    child_reference_line = APULinea(
        id=7002,
        apu_id=parent_apu.id,
        apu_hijo_id=child_apu.id,
        cantidad=Decimal("0.620000"),
        rendimiento=Decimal("1.000000"),
        orden=1,
    )
    child_peon_line = APULinea(
        id=7003,
        apu_id=child_apu.id,
        recurso_id=peon.id,
        cantidad=Decimal("3.000000"),
        rendimiento=Decimal("0.500000"),
        orden=1,
    )
    db.add_all([parent_apu, child_apu, peon, child_reference_line, child_peon_line])
    db.flush()

    result = _apply_gantt_operational_snapshots_to_apu_lines(
        db,
        presupuesto=presupuesto,
        intentions=[
            {
                "type": "resource_editor",
                "linea_presupuesto_id": line.id,
                "operational_snapshot": {
                    "status": "anidados_explotados",
                    "has_nested": True,
                    "resources": [
                        {
                            "recurso_id": peon.id,
                            "work_policy": "fixed",
                            "source_lines": [
                                {
                                    "linea_id": child_peon_line.id,
                                    "apu_id": child_apu.id,
                                    "nested": True,
                                    "cantidad": "1.240000",
                                    "rendimiento": "0.750000",
                                },
                            ],
                        }
                    ],
                },
            }
        ],
    )

    db.refresh(child_peon_line)

    assert result["updated_line_ids"] == [child_peon_line.id]
    assert child_peon_line.cantidad == Decimal("2.000000")
    assert child_peon_line.rendimiento == Decimal("0.750000")


def test_budget_refresh_preserves_active_gantt_functional_price(db):
    presupuesto, line = _create_budget_with_line(db)
    apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        costo_directo=Decimal("109.74"),
        precio_unitario_total=Decimal("132.79"),
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    db.add(apu)
    db.flush()

    project_functional_modification_service.create_active(
        db,
        empresa_id=presupuesto.empresa_id,
        proyecto_id=presupuesto.proyecto_id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
        source="gantt",
        patch={
            "intentions": [
                {
                    "type": "resource_editor",
                    "linea_presupuesto_id": line.id,
                    "apu_id": apu.id,
                    "price_preview": {
                        "total_unit_price": "100.65",
                        "budget_line_total_before": "2201.66",
                        "budget_line_total_after": "1668.78",
                    },
                }
            ]
        },
    )

    refresh_presupuesto_prices(db, presupuesto.id, commit=False, sanitize_scope=False)
    expected_total = calculate_budget_line_total(
        quantity=line.cantidad,
        unit_price=Decimal("100.65"),
        money_decimals=presupuesto.dec_moneda,
        calc_decimals=presupuesto.dec_calculos,
    )
    db.refresh(line)
    db.refresh(presupuesto)

    assert line.precio_unitario == Decimal("100.65")
    assert line.precio_total == expected_total
    assert line.tanteo_activo is True
    assert presupuesto.subtotal == expected_total


def test_budget_refresh_can_ignore_previous_active_price_for_new_deterministic_change(db):
    presupuesto, line = _create_budget_with_line(db)
    apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        costo_directo=Decimal("80.00"),
        precio_unitario_total=Decimal("80.00"),
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    db.add(apu)
    db.flush()

    project_functional_modification_service.create_active(
        db,
        empresa_id=presupuesto.empresa_id,
        proyecto_id=presupuesto.proyecto_id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
        source="gantt",
        patch={
            "intentions": [
                {
                    "type": "resource_editor",
                    "linea_presupuesto_id": line.id,
                    "apu_id": apu.id,
                    "price_preview": {"total_unit_price": "100.65"},
                }
            ]
        },
    )

    refresh_presupuesto_prices(
        db,
        presupuesto.id,
        commit=False,
        sanitize_scope=False,
        apply_active_functional_overlay=False,
    )
    db.refresh(line)

    assert line.precio_unitario == Decimal("80.000000")
    assert line.tanteo_activo is False


def test_budget_change_registers_official_modification_over_previous_gantt(db):
    presupuesto, line = _create_budget_with_line(db)
    apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        costo_directo=Decimal("109.74"),
        precio_unitario_total=Decimal("132.79"),
        empresa_id=presupuesto.empresa_id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )
    db.add(apu)
    db.flush()

    previous = project_functional_modification_service.create_active(
        db,
        empresa_id=presupuesto.empresa_id,
        proyecto_id=presupuesto.proyecto_id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
        source="gantt",
        patch={"affected_line_ids": [line.id]},
    )

    line.cantidad = Decimal("20")
    line.precio_total = calculate_budget_line_total(
        quantity=line.cantidad,
        unit_price=line.precio_unitario,
        money_decimals=presupuesto.dec_moneda,
        calc_decimals=presupuesto.dec_calculos,
    )
    presupuesto.subtotal = line.precio_total
    presupuesto.total = line.precio_total
    _register_presupuesto_functional_modification(
        db,
        presupuesto=presupuesto,
        lineas=[line],
        source_ref={"action": "linea_actualizada", "linea_id": line.id},
        user_id=42,
    )

    active = project_functional_modification_service.get_active(
        db,
        empresa_id=presupuesto.empresa_id,
        proyecto_id=presupuesto.proyecto_id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=34,
        revision=presupuesto.revision,
    )

    assert active.id != previous.id
    assert active.source == "presupuesto"
    assert active.patch["affected_line_ids"] == [line.id]
    assert active.patch["intentions"][0]["price_preview"]["total_unit_price"] == "132.79"
    assert active.snapshot["budget_totals"]["total"] == str(line.precio_total)
