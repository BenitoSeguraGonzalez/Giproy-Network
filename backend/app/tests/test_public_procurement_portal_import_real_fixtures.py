from pathlib import Path

import pytest

from app.services.public_procurement_import_certifier import is_invalid_imported_resource_description
from app.services.public_procurement_import_certifier import public_procurement_import_certifier
from app.services.public_procurement_portal_import import PublicProcurementPortalImportService
from app.services.public_procurement_project_materializer import public_procurement_project_materializer
from app.models.apu import APU, APULinea
from app.models.presupuesto import PresupuestoDetalle
from app.models.recurso import Recurso
from app.models.unidad import Unidad


def _find_nested_apu_cycles(resources):
    adjacency = {}
    for resource in resources:
        if not resource.get("is_nested_apu") or not resource.get("nested_apu_target"):
            continue
        adjacency.setdefault(resource.get("apu_temp_id"), []).append(resource.get("nested_apu_target"))

    cycles = []

    def walk(node, path):
        if node in path:
            cycles.append([*path[path.index(node):], node])
            return
        for child in adjacency.get(node, []):
            walk(child, [*path, node])

    for node in adjacency:
        walk(node, [])
    return cycles


@pytest.mark.parametrize(
    ("filename", "expected_rubros"),
    [
        ("compras publicas prueba1.pdf", 224),
        ("compras publicas prueba2.pdf", 224),
    ],
)
def test_public_procurement_pdf_fixtures_do_not_emit_phantom_resources(filename, expected_rubros):
    fixture_path = Path(__file__).resolve().parents[3] / "tmp" / filename
    if not fixture_path.exists():
        pytest.skip(f"Fixture local no disponible: {fixture_path}")

    analysis = PublicProcurementPortalImportService().analyze_upload(filename, fixture_path.read_bytes())
    bundle = analysis.get("analysis_bundle") or {}
    resources = list(bundle.get("resources") or [])
    invalid_resources = [
        resource
        for resource in resources
        if is_invalid_imported_resource_description(resource.get("descripcion"))
    ]
    nested_cycles = _find_nested_apu_cycles(resources)

    assert len(analysis.get("rubros") or []) == expected_rubros
    assert resources
    assert invalid_resources == []
    assert nested_cycles == []


def test_public_procurement_prueba1_full_materialization_passes_certification(db, sample_empresa):
    fixture_path = Path(__file__).resolve().parents[3] / "tmp" / "compras publicas prueba1.pdf"
    if not fixture_path.exists():
        pytest.skip(f"Fixture local no disponible: {fixture_path}")

    for category, description in (
        (1, "Hora"),
        (2, "u"),
        (2, "m"),
        (2, "m2"),
        (2, "m3"),
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

    analysis = PublicProcurementPortalImportService().analyze_upload(
        "compras publicas prueba1.pdf",
        fixture_path.read_bytes(),
    )
    result = public_procurement_project_materializer.materialize(
        db,
        analysis=analysis,
        empresa_id=sample_empresa.id,
        current_user_id=None,
    )

    base_id = result["base_trabajo_id"]
    presupuesto_id = result["presupuesto_id"]

    assert result["summary"]["certification_status"] == "valid"
    assert result["summary"]["rubros_count"] == 224
    assert result["summary"]["apus_count"] == 212
    assert result["summary"]["resources_count"] == 305
    assert result["summary"]["empty_apus_count"] == 0
    assert result["summary"]["presupuesto_subtotal"] == 86083.97
    assert result["summary"]["presupuesto_total"] == 98996.57

    certification = public_procurement_import_certifier.certify_materialized_project(
        db,
        empresa_id=sample_empresa.id,
        base_trabajo_id=base_id,
        presupuesto_id=presupuesto_id,
    )
    assert certification["status"] == "valid"
    assert certification["issue_counts"] == {}
    assert certification["summary"] == {
        "budget_lines_count": 224,
        "root_apus_count": 202,
        "nested_apus_count": 15,
        "reachable_apus_count": 212,
        "reachable_resources_count": 305,
        "total_apus_count": 212,
        "total_resources_count": 305,
    }

    assert db.query(PresupuestoDetalle).filter(
        PresupuestoDetalle.presupuesto_id == presupuesto_id,
        PresupuestoDetalle.tipo == "RUBRO",
    ).count() == 224
    assert db.query(APU).filter(APU.base_trabajo_id == base_id).count() == 212
    assert db.query(Recurso).filter(Recurso.base_trabajo_id == base_id).count() == 305
    assert db.query(Recurso).filter(
        Recurso.base_trabajo_id == base_id,
        Recurso.descripcion == "Camioneta desde 2200 hasta 3500 cc",
    ).count() >= 1
    assert db.query(APULinea).join(APU, APULinea.apu_id == APU.id).filter(APU.base_trabajo_id == base_id).count() == 1556
