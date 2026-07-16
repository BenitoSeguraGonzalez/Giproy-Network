from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.cronograma_recursos import cronograma_recursos_service


def test_cronograma_recursos_read_model_explodes_nested_apus_and_keeps_zero_periods():
    unidad_m3 = SimpleNamespace(simbolo="m3")
    unidad_h = SimpleNamespace(simbolo="h")
    subcat_materiales = SimpleNamespace(subcategoria_codigo=2, codigo="2-001", descripcion="Materiales petreos")
    subcat_mano_obra = SimpleNamespace(subcategoria_codigo=4, codigo="4-001", descripcion="Albanileria")

    cement = SimpleNamespace(
        id=101,
        codigo="2-001-001",
        descripcion="Cemento portland",
        precio="10",
        unidad=unidad_m3,
        subcategoria_item=subcat_materiales,
    )
    mason = SimpleNamespace(
        id=102,
        codigo="4-001-001",
        descripcion="Maestro mayor",
        precio="12",
        unidad=unidad_h,
        subcategoria_item=subcat_mano_obra,
    )
    child_apu = SimpleNamespace(
        id=202,
        lineas=[
            SimpleNamespace(id=3, orden=1, cantidad="3", rendimiento="1", recurso=cement, recurso_id=cement.id),
            SimpleNamespace(id=4, orden=2, cantidad="2", rendimiento="1", recurso=mason, recurso_id=mason.id),
        ],
    )
    parent_apu = SimpleNamespace(
        id=201,
        lineas=[
            SimpleNamespace(id=1, orden=1, cantidad="2", rendimiento="1", recurso=cement, recurso_id=cement.id),
            SimpleNamespace(id=2, orden=2, cantidad="0.5", rendimiento="1", apu_hijo=child_apu, apu_hijo_id=child_apu.id),
        ],
    )
    presupuesto = SimpleNamespace(
        id=77,
        detalle=[
            SimpleNamespace(id=10, apu_id=parent_apu.id, apu=parent_apu, cantidad="10"),
        ],
    )
    cronograma = SimpleNamespace(
        period_type="mensual",
        distribution_mode="gantt",
        periods=[
            SimpleNamespace(id="P1", label="P1"),
            SimpleNamespace(id="P2", label="P2"),
            SimpleNamespace(id="P3", label="P3"),
        ],
        rows=[
            SimpleNamespace(linea_id=10, apu_id=parent_apu.id, cantidad="10", distribution=[50, 0, 50]),
        ],
    )

    demand = cronograma_recursos_service.build_resource_demand(None, presupuesto, cronograma, empresa_id=3)
    rows_by_resource = {row["recurso"]: row for row in demand["recursos"]}

    assert demand["mode"] == "read_only"
    assert demand["source"] == "cronograma_valorado"
    assert demand["summary"]["recursos"] == 2
    assert demand["summary"]["periodos"] == 3
    assert [period["label"] for period in demand["periodos"]] == ["P1", "P2", "P3"]
    assert rows_by_resource["Cemento portland"]["cantidad_total"] == 35.0
    assert [period["cantidad"] for period in rows_by_resource["Cemento portland"]["periodos"]] == [17.5, 0.0, 17.5]
    assert [period["costo"] for period in rows_by_resource["Cemento portland"]["periodos"]] == [175.0, 0.0, 175.0]
    assert rows_by_resource["Maestro mayor"]["cantidad_total"] == 2.0
    assert [period["cantidad"] for period in rows_by_resource["Maestro mayor"]["periodos"]] == [1.0, 0.0, 1.0]
    assert [period["costo"] for period in rows_by_resource["Maestro mayor"]["periodos"]] == [12.0, 0.0, 12.0]


def test_cronograma_recursos_read_model_avoids_nested_apu_cycles():
    unidad = SimpleNamespace(simbolo="u")
    subcat = SimpleNamespace(subcategoria_codigo=2, codigo="2-001", descripcion="Materiales")
    resource = SimpleNamespace(
        id=101,
        codigo="2-001-001",
        descripcion="Material principal",
        precio="3",
        unidad=unidad,
        subcategoria_item=subcat,
    )
    parent_apu = SimpleNamespace(id=201, lineas=[])
    child_apu = SimpleNamespace(id=202, lineas=[])
    parent_apu.lineas = [
        SimpleNamespace(id=1, orden=1, cantidad="1", rendimiento="1", recurso=resource, recurso_id=resource.id),
        SimpleNamespace(id=2, orden=2, cantidad="1", rendimiento="1", apu_hijo=child_apu, apu_hijo_id=child_apu.id),
    ]
    child_apu.lineas = [
        SimpleNamespace(id=3, orden=1, cantidad="1", rendimiento="1", apu_hijo=parent_apu, apu_hijo_id=parent_apu.id),
    ]
    presupuesto = SimpleNamespace(id=77, detalle=[SimpleNamespace(id=10, apu_id=parent_apu.id, apu=parent_apu)])
    cronograma = SimpleNamespace(
        period_type="mensual",
        distribution_mode="gantt",
        periods=[SimpleNamespace(id="P1", label="P1")],
        rows=[SimpleNamespace(linea_id=10, apu_id=parent_apu.id, cantidad="2", distribution=[100])],
    )

    demand = cronograma_recursos_service.build_resource_demand(None, presupuesto, cronograma, empresa_id=3)

    assert len(demand["recursos"]) == 1
    assert demand["recursos"][0]["cantidad_total"] == 2.0
    assert demand["recursos"][0]["periodos"][0]["cantidad"] == 2.0


def test_cronograma_recursos_prefers_operational_apu_snapshot():
    unidad = SimpleNamespace(simbolo="h")
    subcat_mano_obra = SimpleNamespace(subcategoria_codigo=4, codigo="4-001", descripcion="Albanileria")
    mason = SimpleNamespace(
        id=102,
        codigo="4-001-001",
        descripcion="Maestro mayor",
        precio="12",
        unidad=unidad,
        subcategoria_item=subcat_mano_obra,
    )
    parent_apu = SimpleNamespace(
        id=201,
        lineas=[
            SimpleNamespace(id=1, orden=1, cantidad="1", rendimiento="1", recurso=mason, recurso_id=mason.id),
        ],
    )
    presupuesto = SimpleNamespace(
        id=77,
        detalle=[SimpleNamespace(id=10, apu_id=parent_apu.id, apu=parent_apu, cantidad="10")],
    )
    cronograma = SimpleNamespace(
        period_type="mensual",
        distribution_mode="gantt",
        periods=[SimpleNamespace(id="P1", label="P1")],
        rows=[
            SimpleNamespace(
                linea_id=10,
                apu_id=parent_apu.id,
                cantidad="10",
                distribution=[100],
                metadata={
                    "apu_operational_resources_v1": {
                        "resources": [
                            {
                                "recurso_id": mason.id,
                                "codigo": mason.codigo,
                                "descripcion": mason.descripcion,
                                "categoria_id": 4,
                                "categoria": "mano_obra",
                                "unidad": "h",
                                "precio_unitario": 12,
                                "cantidad": 3.5,
                            }
                        ]
                    }
                },
            ),
        ],
    )

    demand = cronograma_recursos_service.build_resource_demand(None, presupuesto, cronograma, empresa_id=3)

    assert len(demand["recursos"]) == 1
    assert demand["recursos"][0]["cantidad_total"] == 35.0
    assert demand["recursos"][0]["periodos"][0]["cantidad"] == 35.0
    assert demand["recursos"][0]["costo_total"] == 420.0


def test_cronograma_recursos_blocks_apu_without_reachable_resources():
    empty_apu = SimpleNamespace(id=201, codigo="5-001", descripcion="APU sin recursos", lineas=[])
    presupuesto = SimpleNamespace(
        id=77,
        detalle=[SimpleNamespace(id=10, apu_id=empty_apu.id, apu=empty_apu, cantidad="10")],
    )
    cronograma = SimpleNamespace(
        period_type="mensual",
        distribution_mode="gantt",
        periods=[SimpleNamespace(id="P1", label="P1")],
        rows=[SimpleNamespace(linea_id=10, apu_id=empty_apu.id, cantidad="10", distribution=[100])],
    )

    with pytest.raises(HTTPException) as exc:
        cronograma_recursos_service.build_resource_demand(None, presupuesto, cronograma, empresa_id=3)

    assert exc.value.status_code == 422
    assert exc.value.detail["code"] == "apu_resources_incomplete"
    assert exc.value.detail["issues"][0]["apu_id"] == empty_apu.id


def test_cronograma_recursos_reads_materialized_parent_and_child_apu_lines_after_gantt_apply():
    unidad = SimpleNamespace(simbolo="h")
    subcat_mano_obra = SimpleNamespace(subcategoria_codigo=4, codigo="4-001", descripcion="Albanileria")
    peon = SimpleNamespace(
        id=102,
        codigo="4-001-001",
        descripcion="Peon",
        precio="4",
        unidad=unidad,
        subcategoria_item=subcat_mano_obra,
    )
    child_apu = SimpleNamespace(
        id=202,
        lineas=[
            SimpleNamespace(id=3, orden=1, cantidad="2", rendimiento="0.75", recurso=peon, recurso_id=peon.id),
        ],
    )
    parent_apu = SimpleNamespace(
        id=201,
        lineas=[
            SimpleNamespace(id=1, orden=1, cantidad="1", rendimiento="1", recurso=peon, recurso_id=peon.id),
            SimpleNamespace(id=2, orden=2, cantidad="0.62", rendimiento="1", apu_hijo=child_apu, apu_hijo_id=child_apu.id),
        ],
    )
    presupuesto = SimpleNamespace(
        id=77,
        detalle=[SimpleNamespace(id=10, apu_id=parent_apu.id, apu=parent_apu, cantidad="10")],
    )
    cronograma = SimpleNamespace(
        period_type="mensual",
        distribution_mode="gantt",
        periods=[SimpleNamespace(id="P1", label="P1"), SimpleNamespace(id="P2", label="P2")],
        rows=[SimpleNamespace(linea_id=10, apu_id=parent_apu.id, cantidad="10", distribution=[25, 75])],
    )

    demand = cronograma_recursos_service.build_resource_demand(None, presupuesto, cronograma, empresa_id=3)

    assert len(demand["recursos"]) == 1
    assert demand["recursos"][0]["recurso"] == "Peon"
    assert demand["recursos"][0]["cantidad_total"] == 12.0
    assert demand["recursos"][0]["costo_total"] == 48.0
    assert demand["recursos"][0]["periodos"][0]["cantidad"] == 3.0
    assert demand["recursos"][0]["periodos"][1]["cantidad"] == 9.0


def test_cronograma_recursos_state_uses_optimistic_version_lock():
    state = SimpleNamespace(
        presupuesto_id=77,
        proyecto_id=44,
        empresa_id=3,
        version=2,
        adjustments={},
        updated_by_id=None,
        updated_at=None,
    )
    presupuesto = SimpleNamespace(id=77, proyecto_id=44, empresa_id=3)

    class Query:
        def filter(self, *_args, **_kwargs):
            return self

        def first(self):
            return state

    class Db:
        def query(self, _model):
            return Query()

        def add(self, item):
            self.added = item

        def commit(self):
            self.committed = True

        def refresh(self, item):
            self.refreshed = item

    db = Db()

    with pytest.raises(HTTPException) as exc:
        cronograma_recursos_service.update_resource_state(
            db,
            presupuesto,
            adjustments={"manual_limits": {}},
            expected_version=1,
            updated_by_id=9,
        )

    assert exc.value.status_code == 409
    updated = cronograma_recursos_service.update_resource_state(
        db,
        presupuesto,
        adjustments={"manual_limits": {"101": {"P1": 8}}},
        expected_version=2,
        updated_by_id=9,
    )

    assert updated["version"] == 3
    assert updated["adjustments"] == {"manual_limits": {"101": {"P1": 8}}}
    assert updated["updated_by_id"] == 9
