from app.services.public_procurement_portal_import import _extract_apu_resource_pairs
from app.services.public_procurement_portal_import import _normalize_detected_resource


def test_detected_resource_preserves_numeric_range_before_unit():
    resource = _normalize_detected_resource(
        {
            "codigo": "TRA-00001",
            "descripcion": "Camioneta desde 0 a 10 km Hora 1,00000 0,33 1,00000 0,33 1,23%",
            "resource_type": "transporte",
        }
    )

    assert resource["descripcion"] == "Camioneta desde 0 a 10 km"
    assert resource["unidad"] == "Hora"
    assert resource["cantidad"] == "1.00000"
    assert resource["precio"] == "0.33"
    assert resource["total"] == "0.33"
    assert resource["weight_percentage"] == "1.23"


def test_split_resource_rows_preserve_prefix_and_suffix_description():
    lines = [
        "Análisis de Precios Unitarios",
        "Código: 523266",
        "Descrip.: Provisión y montaje de luces de emergencia",
        "Unidad: u",
        "COSTOS DIRECTOS",
        "Equipo y herramienta",
        "Código Descripción Unidad Cantidad Precio Rendim. Total %",
        "Camioneta desde 2200",
        "104003 Hora 1,00000 0,33333",
        "hasta 3500 cc 8,00 2,67 2,44%",
        "Subtotal de Equipo: 2,67 2,44%",
    ]

    _apus, resources = _extract_apu_resource_pairs(lines)

    assert len(resources) == 1
    assert resources[0]["codigo"] == "104003"
    assert resources[0]["descripcion"] == "Camioneta desde 2200 hasta 3500 cc"
    assert resources[0]["unidad"] == "Hora"
    assert resources[0]["cantidad"] == 1.0
    assert resources[0]["precio"] == 0.33333
