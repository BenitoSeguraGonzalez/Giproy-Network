from decimal import Decimal

from app.core.rounding import round_decimal


def test_round_decimal_treats_empty_values_as_zero():
    assert round_decimal(None) == Decimal("0.00")
    assert round_decimal("") == Decimal("0.00")


def test_round_decimal_uses_half_up_direct_rounding():
    assert round_decimal("1.235", 2) == Decimal("1.24")
    assert round_decimal("1.234", 2) == Decimal("1.23")
    assert round_decimal(Decimal("0.0846"), 2) == Decimal("0.08")


def test_round_decimal_supports_variable_precision_and_negative_values():
    assert round_decimal("2.5555", 3) == Decimal("2.556")
    assert round_decimal("-1.235", 2) == Decimal("-1.24")
    assert round_decimal("5", 0) == Decimal("5")
