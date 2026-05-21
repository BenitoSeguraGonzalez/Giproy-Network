import re
from typing import Optional


def normalize_internal_spaces(value: Optional[str]) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def normalize_sentence_case(value: Optional[str]) -> str:
    normalized = normalize_internal_spaces(value)
    if not normalized:
        return ""
    lowered = normalized.lower()
    return lowered[:1].upper() + lowered[1:]


def normalize_uppercase_label(value: Optional[str]) -> str:
    normalized = normalize_internal_spaces(value)
    if not normalized:
        return ""
    return normalized.upper()


def normalize_lowercase_label(value: Optional[str]) -> str:
    normalized = normalize_internal_spaces(value)
    if not normalized:
        return ""
    return normalized.lower()
