from decimal import Decimal

from app.core.rounding import round_decimal

"""
POLITICA OBLIGATORIA DE CALCULO NUMERICO

Esta politica es de cumplimiento estricto para todo calculo economico operativo.
No puede obviarse bajo ningun concepto en backend ni en contratos que alimenten UI.

Reglas:
1. El backend es la fuente de verdad de importes operativos persistidos.
2. Todo importe monetario operativo se calcula con Decimal y se redondea de forma directa.
3. Queda prohibido persistir o comparar importes monetarios operativos calculados con float.
4. Queda prohibido recalcular en otros modulos un total persistido sin pasar por esta politica.
5. La UI solo puede recalcular numeros cuando el flujo sea simulacion explicita.
"""

CALCULATION_POLICY_VERSION = "v2_direct_rounding"


def as_decimal(value: Decimal | int | float | str | None, default: str = "0") -> Decimal:
    if value is None or value == "":
        return Decimal(default)
    return Decimal(str(value))


def round_operational_money(
    value: Decimal | int | float | str | None,
    money_decimals: int = 2,
    calc_decimals: int = 4,
) -> Decimal:
    del calc_decimals
    return round_decimal(as_decimal(value), money_decimals)


def round_operational_calc(
    value: Decimal | int | float | str | None,
    calc_decimals: int = 4,
) -> Decimal:
    return round_decimal(as_decimal(value), calc_decimals)


def calculate_budget_line_total(
    quantity: Decimal | int | float | str | None,
    unit_price: Decimal | int | float | str | None,
    money_decimals: int = 2,
    calc_decimals: int = 4,
) -> Decimal:
    raw_total = as_decimal(quantity, "0") * as_decimal(unit_price, "0")
    return round_operational_money(raw_total, money_decimals, calc_decimals)


def calculate_budget_line_functional_unit_price(
    direct_cost: Decimal | int | float | str | None,
    indirect_percentage: Decimal | int | float | str | None,
    money_decimals: int = 2,
    calc_decimals: int = 4,
) -> Decimal:
    factor = Decimal("1.0") + (as_decimal(indirect_percentage, "0") / Decimal("100.0"))
    raw_price = as_decimal(direct_cost, "0") * factor
    return round_operational_money(raw_price, money_decimals, calc_decimals)


def calculate_apu_line_subtotal(
    unit_price: Decimal | int | float | str | None,
    quantity: Decimal | int | float | str | None,
    rendimiento: Decimal | int | float | str | None = 1,
    money_decimals: int = 2,
    calc_decimals: int = 4,
) -> Decimal:
    raw_total = as_decimal(unit_price, "0") * as_decimal(quantity, "0") * as_decimal(rendimiento, "1")
    return round_operational_money(raw_total, money_decimals, calc_decimals)
