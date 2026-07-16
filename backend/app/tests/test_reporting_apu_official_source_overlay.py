from decimal import Decimal

from app.models.apu import APU
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.services.project_functional_modification import project_functional_modification_service
from app.services.reporting import reporting_service


def test_apu_report_overlay_uses_official_project_price_without_mutating_base(db):
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
                    "price_preview": {"total_unit_price": "100.65"},
                }
            ]
        },
    )

    report_apu = reporting_service._apply_official_apu_report_overlay(
        db,
        apu,
        proyecto.empresa_id,
        project_id=proyecto.id,
        base_trabajo_id=proyecto.base_trabajo_id,
        revision=proyecto.revision,
    )

    assert report_apu.precio_unitario_total == Decimal("100.65")
    assert apu.precio_unitario_total == Decimal("132.79")
