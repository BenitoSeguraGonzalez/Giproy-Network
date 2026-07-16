from decimal import Decimal

from app.api.endpoints.apus import _resolve_project_apu_price_overrides
from app.api.endpoints.apus import _register_apu_functional_modifications
from app.models.apu import APU
from app.models.cronograma_gantt_control import CronogramaGanttDraft
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.presupuesto import Presupuesto
from app.models.presupuesto import PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.services.project_functional_modification import project_functional_modification_service


def test_project_apu_price_overlay_reads_active_functional_modification(db):
    proyecto = Proyecto(
        id=77,
        codigo="PR-77",
        nombre="Proyecto prueba",
        empresa_id=33,
        base_trabajo_id=34,
        revision=2,
    )
    presupuesto = Presupuesto(
        id=901,
        descripcion="Presupuesto prueba",
        proyecto_id=proyecto.id,
        empresa_id=proyecto.empresa_id,
        revision=proyecto.revision,
    )
    apu = APU(
        id=501,
        codigo="1.1.4",
        descripcion="Hormigon ciclopeo",
        descripcion_normalizada="hormigon ciclopeo",
        unidad="m3",
        costo_directo=Decimal("109.74"),
        precio_unitario_total=Decimal("132.79"),
        empresa_id=proyecto.empresa_id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
    )
    db.add(proyecto)
    db.add(presupuesto)
    db.add(apu)
    db.flush()

    project_functional_modification_service.create_active(
        db,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
        source="gantt",
        patch={
            "intentions": [
                {
                    "type": "resource_editor",
                    "linea_presupuesto_id": 9901,
                    "apu_id": apu.id,
                    "price_preview": {
                        "total_unit_price": "100.65",
                    },
                }
            ]
        },
    )

    overrides, official_source = _resolve_project_apu_price_overrides(
        db,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
    )

    assert overrides == {apu.id: Decimal("100.65")}
    assert official_source["source"] == "modificacion_activa"
    assert official_source["origin"] == "gantt"


def test_apu_direct_update_registers_official_source_and_invalidates_related_gantt_only(db):
    proyecto = Proyecto(
        id=78,
        codigo="PR-78",
        nombre="Proyecto prueba APU",
        empresa_id=33,
        base_trabajo_id=34,
        revision=2,
    )
    presupuesto = Presupuesto(
        id=902,
        descripcion="Presupuesto prueba APU",
        proyecto_id=proyecto.id,
        empresa_id=proyecto.empresa_id,
        revision=proyecto.revision,
        subtotal=Decimal("200.00"),
        total=Decimal("200.00"),
    )
    apu = APU(
        id=502,
        codigo="1.1.5",
        descripcion="APU editado",
        descripcion_normalizada="apu editado",
        unidad="m3",
        costo_directo=Decimal("80.00"),
        precio_unitario_total=Decimal("100.00"),
        empresa_id=proyecto.empresa_id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
    )
    line = PresupuestoDetalle(
        id=9902,
        presupuesto_id=presupuesto.id,
        edt_id=7002,
        apu_id=apu.id,
        descripcion=apu.descripcion,
        unidad=apu.unidad,
        cantidad=Decimal("2.0000"),
        precio_unitario=Decimal("100.00"),
        precio_total=Decimal("200.00"),
    )
    schedule = CronogramaTrabajo(
        id=6002,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        presupuesto_id=presupuesto.id,
        schedule_data={},
    )
    draft = CronogramaGanttDraft(
        id=7002,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        presupuesto_id=presupuesto.id,
        cronograma_id=schedule.id,
        status="draft",
        version=1,
        intentions=[
            {"type": "resource_editor", "apu_id": apu.id, "status": "pending"},
            {"type": "resource_editor", "apu_id": 9999, "status": "pending"},
        ],
    )
    db.add_all([proyecto, presupuesto, apu, line, schedule, draft])
    db.flush()

    _register_apu_functional_modifications(
        db,
        empresa_id=proyecto.empresa_id,
        apu=apu,
        affected_apu_ids={apu.id},
        source_ref={"action": "apu_actualizado", "apu_id": apu.id},
        user_id=42,
    )

    active = project_functional_modification_service.get_active(
        db,
        empresa_id=proyecto.empresa_id,
        proyecto_id=proyecto.id,
        presupuesto_id=presupuesto.id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
    )

    assert active is not None
    assert active.source == "apu"
    assert active.patch["affected_apu_ids"] == [apu.id]
    assert active.patch["intentions"][0]["price_preview"]["total_unit_price"] == "100.00"
    assert draft.intentions[0]["status"] == "invalidated"
    assert draft.intentions[0]["invalidated_reason"] == "apu_modificado"
    assert draft.intentions[1]["status"] == "pending"
