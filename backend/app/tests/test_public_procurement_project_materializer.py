from decimal import Decimal

from app.models.apu import APU, APULinea
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.unidad import Unidad
from app.services.proyecto import ProyectoService
from app.services.presupuesto import refresh_presupuesto_prices
from app.services.public_procurement_project_materializer import (
    public_procurement_project_materializer,
)


def _seed_global_units(db):
    for category, description in (
        (1, "Hora"),
        (2, "u"),
        (3, "km"),
        (4, "Hora"),
        (5, "u"),
    ):
        db.add(
            Unidad(
                descripcion=description,
                descripcion_completa=description,
                subcategoria_codigo=category,
                es_global=True,
            )
        )
    db.commit()


def test_public_procurement_materializer_preserves_classic_rendimientos(db, sample_empresa):
    _seed_global_units(db)

    analysis = {
        "title": "Prueba rendimiento SOCE",
        "analysis_bundle": {
            "summary": {},
            "budget_items": [
                {
                    "codigo": "513060",
                    "descripcion": "Rubro con rendimiento",
                    "unidad": "u",
                    "cantidad": 1,
                    "precio_unitario": 10,
                    "precio_total": 10,
                    "matched_apu_temp_id": "apu-1",
                    "capitulo": "General",
                }
            ],
            "apus": [
                {
                    "temp_id": "apu-1",
                    "codigo": "513060",
                    "descripcion": "Rubro con rendimiento",
                    "unidad": "u",
                    "precio_unitario": 10,
                    "resources": [],
                }
            ],
            "resources": [
                {
                    "temp_id": "eq-1",
                    "apu_temp_id": "apu-1",
                    "codigo": "102004",
                    "descripcion": "Retroexcavadora",
                    "unidad": "Hora",
                    "resource_type": "equipo",
                    "cantidad": "1",
                    "precio": "30",
                    "rendimiento": "0.0385",
                },
                {
                    "temp_id": "mat-1",
                    "apu_temp_id": "apu-1",
                    "codigo": "2EA073",
                    "descripcion": "Agua",
                    "unidad": "u",
                    "resource_type": "material",
                    "cantidad": "4",
                    "precio": "0.01",
                    "rendimiento": "0.04",
                },
                {
                    "temp_id": "mo-1",
                    "apu_temp_id": "apu-1",
                    "codigo": "402015",
                    "descripcion": "Peon",
                    "unidad": "Hora",
                    "resource_type": "mano_obra",
                    "cantidad": "3",
                    "precio": "4.34",
                    "rendimiento": "0.0385",
                },
            ],
        },
    }

    result = public_procurement_project_materializer.materialize(
        db,
        analysis=analysis,
        empresa_id=sample_empresa.id,
        current_user_id=None,
    )

    apu = db.query(APU).filter(APU.base_trabajo_id == result["base_trabajo_id"]).one()
    lines = (
        db.query(APULinea)
        .filter(APULinea.apu_id == apu.id)
        .order_by(APULinea.orden.asc())
        .all()
    )

    assert [line.rendimiento for line in lines] == [
        Decimal("0.0385"),
        Decimal("1.000000"),
        Decimal("0.0385"),
    ]
    assert [line.rendimiento_original for line in lines] == [line.rendimiento for line in lines]
    assert apu.costo_directo == Decimal("1.6963")

    presupuesto = db.query(Presupuesto).filter(Presupuesto.id == result["presupuesto_id"]).one()
    linea_presupuesto = (
        db.query(PresupuestoDetalle)
        .filter(PresupuestoDetalle.presupuesto_id == presupuesto.id, PresupuestoDetalle.apu_id == apu.id)
        .one()
    )
    assert linea_presupuesto.precio_unitario == Decimal("10.000000")
    assert linea_presupuesto.precio_total == Decimal("10.000000")

    refresh_presupuesto_prices(db, presupuesto.id)
    db.refresh(linea_presupuesto)
    db.refresh(presupuesto)

    assert linea_presupuesto.precio_unitario == Decimal("10.000000")
    assert linea_presupuesto.precio_total == Decimal("10.000000")
    assert presupuesto.subtotal == Decimal("10.0000")


def test_public_procurement_materializer_blocks_phantom_resource_descriptions(db, sample_empresa):
    _seed_global_units(db)
    empresa_id = sample_empresa.id

    analysis = {
        "title": "Prueba recurso fantasma",
        "analysis_bundle": {
            "summary": {},
            "budget_items": [
                {
                    "codigo": "513060",
                    "descripcion": "Rubro contaminado",
                    "unidad": "u",
                    "cantidad": 1,
                    "precio_unitario": 10,
                    "precio_total": 10,
                    "matched_apu_temp_id": "apu-1",
                    "capitulo": "General",
                }
            ],
            "apus": [
                {
                    "temp_id": "apu-1",
                    "codigo": "513060",
                    "descripcion": "Rubro contaminado",
                    "unidad": "u",
                    "precio_unitario": 10,
                    "resource_count": 1,
                }
            ],
            "resources": [
                {
                    "temp_id": "eq-1",
                    "apu_temp_id": "apu-1",
                    "codigo": "101001",
                    "descripcion": "Hora 1,00000 0,35000",
                    "unidad": "Hora",
                    "resource_type": "equipo",
                    "cantidad": "1",
                    "precio": "0.35",
                    "rendimiento": "1",
                },
            ],
        },
    }

    try:
        public_procurement_project_materializer.materialize(
            db,
            analysis=analysis,
            empresa_id=empresa_id,
            current_user_id=None,
        )
        assert False, "Expected certification error for phantom resource"
    except ValueError as exc:
        assert "invalid_resource_description" in str(exc)

    assert db.query(Proyecto).filter(Proyecto.empresa_id == empresa_id).count() == 0
    assert db.query(APU).filter(APU.empresa_id == empresa_id).count() == 0


def test_delete_full_project_cleans_imported_project_operational_dependents(db, sample_empresa):
    _seed_global_units(db)

    analysis = {
        "title": "Proyecto importado para borrar",
        "analysis_bundle": {
            "summary": {},
            "budget_items": [
                {
                    "codigo": "RUB-1",
                    "descripcion": "Rubro simple",
                    "unidad": "u",
                    "cantidad": 1,
                    "precio_unitario": 1,
                    "precio_total": 1,
                    "matched_apu_temp_id": "apu-1",
                    "capitulo": "General",
                }
            ],
            "apus": [
                {
                    "temp_id": "apu-1",
                    "codigo": "RUB-1",
                    "descripcion": "Rubro simple",
                    "unidad": "u",
                    "precio_unitario": 1,
                    "resource_count": 1,
                }
            ],
            "resources": [
                {
                    "temp_id": "mat-1",
                    "apu_temp_id": "apu-1",
                    "codigo": "MAT-1",
                    "descripcion": "Material simple",
                    "unidad": "u",
                    "resource_type": "material",
                    "cantidad": 1,
                    "precio_unitario": 1,
                }
            ],
        },
    }
    result = public_procurement_project_materializer.materialize(
        db,
        analysis=analysis,
        empresa_id=sample_empresa.id,
        current_user_id=None,
    )
    proyecto_id = result["proyecto_id"]
    presupuesto_id = result["presupuesto_id"]
    db.add_all([
        CronogramaValorado(
            empresa_id=sample_empresa.id,
            proyecto_id=proyecto_id,
            presupuesto_id=presupuesto_id,
            global_distribution=[],
            line_distribution_overrides={},
        ),
        CronogramaTrabajo(
            empresa_id=sample_empresa.id,
            proyecto_id=proyecto_id,
            presupuesto_id=presupuesto_id,
            schedule_data={},
        ),
    ])
    db.commit()

    assert ProyectoService().delete_full_project(db, proyecto_id, sample_empresa.id) is True
    assert db.query(Proyecto).filter(Proyecto.id == proyecto_id).first() is None
    assert db.query(CronogramaValorado).filter(CronogramaValorado.proyecto_id == proyecto_id).count() == 0
    assert db.query(CronogramaTrabajo).filter(CronogramaTrabajo.proyecto_id == proyecto_id).count() == 0
