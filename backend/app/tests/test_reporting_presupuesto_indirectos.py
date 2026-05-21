from decimal import Decimal
from types import SimpleNamespace

from app.services.reporting import ReportingService


def _budget_with_operational_subtotal():
    indirecto = SimpleNamespace(
        categoria_codigo="1.2",
        concepto_codigo="IND-001",
        nombre="Gastos tecnicos generales",
        porcentaje=Decimal("21.0000"),
        observaciones="",
        fijo=True,
        usuario=False,
        custom=False,
    )
    return SimpleNamespace(
        id=13,
        codigo="PRES-13",
        descripcion="Proyecto prueba compartir 1",
        subtotal=Decimal("93489.01"),
        iva_aplicado=Decimal("15.00"),
        dec_moneda=2,
        indirectos=[indirecto],
        indirectos_porcentaje=Decimal("21.0000"),
        revision=0,
        proyecto=SimpleNamespace(
            nombre="Proyecto prueba compartir 1",
            codigo="SantiagoBermeo-2026-001",
        ),
    )


def test_presupuesto_indirectos_preview_uses_direct_base_not_operational_total():
    service = ReportingService()
    preview = service._build_presupuesto_indirectos_preview(_budget_with_operational_subtotal())

    assert preview["summary_cards"][0]["label"] == "Total sin indirectos"
    assert preview["summary_cards"][0]["value"] == 77263.64
    assert preview["summary_cards"][2]["value"] == 16225.37
    assert preview["fields"][4]["label"] == "Base con indirectos"
    assert preview["fields"][4]["value"] == "93,489.01"
    assert preview["fields"][5]["value"] == "14,023.35"
    assert preview["summary_cards"][3]["value"] == 107512.36


def test_presupuesto_indirectos_rows_apply_percent_to_unrounded_direct_base():
    service = ReportingService()
    rows = service._build_presupuesto_indirectos_rows(_budget_with_operational_subtotal())
    account_row = next(row for row in rows if not row["is_structural"])
    subtotal_row = next(row for row in rows if row["is_structural"])

    assert Decimal(str(account_row["base_calculo"])) == Decimal("77263.64")
    assert Decimal(str(account_row["costo_aplicado"])) == Decimal("16225.37")
    assert Decimal(str(subtotal_row["costo_aplicado"])) == Decimal("16225.37")
