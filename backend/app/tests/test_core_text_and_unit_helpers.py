from app.core.phone_normalization import (
    is_valid_phone,
    normalize_phone,
    resolve_country_phone_prefix,
)
from app.core.text_formatting import (
    normalize_internal_spaces,
    normalize_lowercase_label,
    normalize_sentence_case,
    normalize_uppercase_label,
)
from app.core.unit_normalization import canonicalize_unit_symbol
from app.core.utils import normalize_string


def test_text_formatting_normalizes_empty_and_spacing_values():
    assert normalize_internal_spaces(None) == ""
    assert normalize_internal_spaces("  Hormigón    premezclado\t  210 kg/cm2  ") == "Hormigón premezclado 210 kg/cm2"


def test_text_formatting_applies_label_case_without_losing_accents():
    assert normalize_sentence_case("  HORMIGÓN   ARMADO  ") == "Hormigón armado"
    assert normalize_uppercase_label("  instalación eléctrica  ") == "INSTALACIÓN ELÉCTRICA"
    assert normalize_lowercase_label("  MANO   DE OBRA  ") == "mano de obra"


def test_unit_normalization_maps_common_aliases_and_accents():
    assert canonicalize_unit_symbol(None) == ""
    assert canonicalize_unit_symbol("  Unidades  ") == "u"
    assert canonicalize_unit_symbol("DÍAS") == "d"
    assert canonicalize_unit_symbol("Hora Máquina") == "h-m"
    assert canonicalize_unit_symbol("m ²") == "m 2"
    assert canonicalize_unit_symbol("KG / M3") == "kg/m3"


def test_core_utils_normalize_string_preserves_punctuation_contract():
    assert normalize_string("") == ""
    assert normalize_string("  Hormigón   Armado  ") == "hormigon armado"
    assert normalize_string("Código APU-001") == "codigo apu-001"


def test_phone_normalization_formats_known_countries_conservatively():
    assert resolve_country_phone_prefix("Ecuador") == "593"
    assert resolve_country_phone_prefix("Perú") == "51"
    assert resolve_country_phone_prefix("Chile") == ""

    assert is_valid_phone("0991234567") is True
    assert is_valid_phone("123") is False

    assert normalize_phone("0991234567", "Ecuador") == "+593 99 123 45 67"
    assert normalize_phone("+593991234567", "Ecuador") == "+593 99 123 45 67"
    assert normalize_phone("3216549870", "Colombia") == "+57 321 654 98 70"
    assert normalize_phone("3216549870", None) == "3216549870"
