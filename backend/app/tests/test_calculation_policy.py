from decimal import Decimal
from pathlib import Path

from app.core.calculation_policy import (
    as_decimal,
    calculate_apu_line_subtotal,
    calculate_budget_line_functional_unit_price,
    calculate_budget_line_total,
    round_operational_calc,
    round_operational_money,
)


def test_calculation_policy_rounds_budget_line_total_with_direct_rounding():
    total = calculate_budget_line_total(
        quantity=Decimal("0.500000"),
        unit_price=Decimal("0.5700"),
        money_decimals=2,
        calc_decimals=4,
    )
    assert total == Decimal("0.29")


def test_calculation_policy_rounds_apu_line_subtotal_with_direct_rounding():
    subtotal = calculate_apu_line_subtotal(
        unit_price=Decimal("0.5700"),
        quantity=Decimal("0.500000"),
        rendimiento=Decimal("1.000000"),
        money_decimals=2,
        calc_decimals=4,
    )
    assert subtotal == Decimal("0.29")


def test_calculation_policy_rounds_functional_budget_unit_price():
    price = calculate_budget_line_functional_unit_price(
        direct_cost=Decimal("1.73"),
        indirect_percentage=Decimal("21"),
        money_decimals=2,
        calc_decimals=4,
    )
    assert price == Decimal("2.09")


def test_calculation_policy_uses_standard_direct_rounding():
    rounded = round_operational_money(
        value=Decimal("0.0846"),
        money_decimals=2,
        calc_decimals=4,
    )
    assert rounded == Decimal("0.08")


def test_calculation_policy_as_decimal_uses_safe_defaults():
    assert as_decimal(None) == Decimal("0")
    assert as_decimal("") == Decimal("0")
    assert as_decimal(None, "1") == Decimal("1")
    assert as_decimal("2.500") == Decimal("2.500")


def test_calculation_policy_rounds_operational_calc_precision():
    assert round_operational_calc(Decimal("1.23456"), calc_decimals=4) == Decimal("1.2346")
    assert round_operational_calc("", calc_decimals=3) == Decimal("0.000")


def test_calculation_policy_apu_line_defaults_rendimiento_to_one():
    subtotal = calculate_apu_line_subtotal(
        unit_price=Decimal("10.00"),
        quantity=Decimal("2.5"),
        rendimiento=None,
        money_decimals=2,
        calc_decimals=4,
    )
    assert subtotal == Decimal("25.00")


def test_frontend_critical_modules_must_use_operational_number_policy():
    repo_root = Path(__file__).resolve().parents[3]
    helper_path = repo_root / "frontend" / "src" / "utils" / "operationalNumbers.js"
    assert helper_path.exists(), "La politica obligatoria de calculo en frontend debe existir"
    decimal_helper_path = repo_root / "frontend" / "src" / "utils" / "decimalNumbers.js"
    assert decimal_helper_path.exists(), "La aritmetica decimal segura de frontend debe existir"

    forbidden_frontend_token = "redondeoCascada"
    forbidden_backend_token = "redondeo_cascada"
    text_suffixes = {".js", ".jsx", ".ts", ".tsx", ".css", ".json"}
    frontend_sources = [
        path for path in (repo_root / "frontend" / "src").rglob("*.*")
        if path.suffix.lower() in text_suffixes
    ]
    backend_sources = [
        path for path in (repo_root / "backend" / "app").rglob("*.py")
        if path.name != "test_calculation_policy.py"
    ]

    for path in frontend_sources:
        content = path.read_text(encoding="utf-8")
        if path.name == "math.js":
            compatibility_alias = "export const redondeoCascada = roundDecimal;"
            sanitized = content.replace(compatibility_alias, "")
            assert forbidden_frontend_token not in sanitized, f"{path.name} no debe depender del helper legacy {forbidden_frontend_token} fuera del alias temporal de compatibilidad"
            continue
        assert forbidden_frontend_token not in content, f"{path.name} no debe depender del helper legacy {forbidden_frontend_token}"

    for path in backend_sources:
        content = path.read_text(encoding="utf-8")
        assert forbidden_backend_token not in content, f"{path.name} no debe depender del helper legacy {forbidden_backend_token}"

    critical_files = [
        repo_root / "frontend" / "src" / "components" / "presupuestos" / "LineasPresupuestoTab.jsx",
        repo_root / "frontend" / "src" / "components" / "presupuestos" / "EdtValoradaModal.jsx",
        repo_root / "frontend" / "src" / "components" / "presupuestos" / "TanteoTab.jsx",
        repo_root / "frontend" / "src" / "pages" / "APUs.jsx",
        repo_root / "frontend" / "src" / "components" / "presupuestos" / "ApuBudgetEditor.jsx",
    ]

    for path in critical_files:
        content = path.read_text(encoding="utf-8")
        assert "operationalNumbers" in content, f"{path.name} debe consumir la politica numerica comun"

    lineas_content = critical_files[0].read_text(encoding="utf-8")
    assert "priceToUse * quantity" not in lineas_content
    assert "price * quantity" not in lineas_content
    assert "parseNumericInput(linea.precio_unitario))) * parseFloat(parseNumericInput(linea.cantidad || 0))" not in lineas_content

    edt_content = critical_files[1].read_text(encoding="utf-8")
    assert "unitPrice * parseFloat" not in edt_content

    tanteo_content = critical_files[2].read_text(encoding="utf-8")
    assert "r.precio_base * r.cantidad * r.rendimiento" not in tanteo_content

    apus_content = critical_files[3].read_text(encoding="utf-8")
    assert "preferPersistedSubtotal: false" in apus_content
    assert "parseFloat(parseNumericInput(cantidadRaw))" not in apus_content
    assert "parseFloat(parseNumericInput(rendimientoRaw))" not in apus_content
    assert "sumDecimalNumber" in apus_content

    apu_budget_editor_content = critical_files[4].read_text(encoding="utf-8")
    assert "preferPersistedSubtotal: false" in apu_budget_editor_content
    assert "item?.costo_directo ?? item?.precio_unitario_total" in apu_budget_editor_content
    assert "item?.precio ?? item?.precio_unitario_total ?? item?.costo_directo" not in apu_budget_editor_content
    assert "sumDecimalNumber" in apu_budget_editor_content

    cronograma_helper_path = repo_root / "frontend" / "src" / "utils" / "cronogramaNumbers.js"
    assert cronograma_helper_path.exists(), "La politica obligatoria de cronogramas debe existir"
    cronograma_helper_content = cronograma_helper_path.read_text(encoding="utf-8")
    assert "sumDecimalNumber" in cronograma_helper_content

    cronograma_content = (repo_root / "frontend" / "src" / "components" / "projects" / "Cronogramas.jsx").read_text(encoding="utf-8")
    assert "cronogramaNumbers" in cronograma_content

    desagregacion_content = (repo_root / "frontend" / "src" / "components" / "projects" / "DesagregacionTab.jsx").read_text(encoding="utf-8")
    assert "operationalNumbers" in desagregacion_content

    cronograma_backend_content = (repo_root / "backend" / "app" / "api" / "endpoints" / "cronogramas.py").read_text(encoding="utf-8")
    assert "strict=False" not in cronograma_backend_content

    edt_valuation_content = (repo_root / "frontend" / "src" / "utils" / "edtValuation.js").read_text(encoding="utf-8")
    assert "sumBudgetOperationalSubtotals" in edt_valuation_content
    assert "unitPrice * parseFloat" not in edt_valuation_content
    assert "sumDecimalNumber" in edt_valuation_content

    polinomica_tab_content = (repo_root / "frontend" / "src" / "components" / "projects" / "FormulaPolinomicaTab.jsx").read_text(encoding="utf-8")
    assert "parseFloat(m.coeficiente) * parseFloat(formulaData.costo_directo_total)" not in polinomica_tab_content

    reporting_content = (repo_root / "backend" / "app" / "services" / "reporting.py").read_text(encoding="utf-8")
    assert '"costo_directo": float(formula.coeficiente_fijo or 0)' not in reporting_content

    apu_schema_content = (repo_root / "backend" / "app" / "schemas" / "apu.py").read_text(encoding="utf-8")
    assert "costo_directo: Decimal" in apu_schema_content

    tanteo_content = (repo_root / "frontend" / "src" / "components" / "presupuestos" / "TanteoTab.jsx").read_text(encoding="utf-8")
    assert "sumDecimalNumber" in tanteo_content
    assert "roundDecimal(Number(value || 0)" not in tanteo_content
    assert "EDITABLE_TANTEO_SUBCATEGORY_CODES" in tanteo_content
    assert "Rendimiento fijo 1,0000" in tanteo_content

    presupuesto_endpoint_content = (repo_root / "backend" / "app" / "api" / "endpoints" / "presupuestos.py").read_text(encoding="utf-8")
    assert "editable_subcategoria_codigos = {1, 4}" in presupuesto_endpoint_content
    assert "Solo se permite tantear recursos de Equipos y herramientas o Mano de obra" in presupuesto_endpoint_content

    budget_context_content = (repo_root / "frontend" / "src" / "context" / "PresupuestoContext.jsx").read_text(encoding="utf-8")
    assert "sumDecimalNumber" in budget_context_content
