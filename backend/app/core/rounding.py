from decimal import Decimal, ROUND_HALF_UP


def round_decimal(valor: float | int | str | Decimal | None, precision: int = 2) -> Decimal:
    """
    Redondeo oficial del sistema.

    Regla:
    - Redondeo directo al decimal objetivo.
    - No existe redondeo sucesivo ni "en cascada".
    - La decision se toma una sola vez sobre el valor original.
    """
    if valor is None or valor == "":
        valor = 0
    quantizer = Decimal("1").scaleb(-precision)
    return Decimal(str(valor)).quantize(quantizer, rounding=ROUND_HALF_UP)
