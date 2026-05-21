from __future__ import annotations

import re
import unicodedata
from typing import Optional


_EXACT_ALIASES = {
    "und": "u",
    "unid": "u",
    "unidad": "u",
    "unidades": "u",
    "un": "u",
    "ud": "u",
    "hrs": "h",
    "hr": "h",
    "hora": "h",
    "horas": "h",
    "dia": "d",
    "dias": "d",
    "día": "d",
    "días": "d",
    "semana": "sem",
    "semanas": "sem",
    "minuto": "min",
    "minutos": "min",
    "segundo": "s",
    "segundos": "s",
    "kilogramo": "kg",
    "kilometro": "km",
    "kilómetro": "km",
    "tonelada": "t",
}

_COMPACT_ALIASES = {
    "hh": "h-h",
    "horahombre": "h-h",
    "hora-hombre": "h-h",
    "hm": "h-m",
    "horamaquina": "h-m",
    "hora-maquina": "h-m",
    "horamáquina": "h-m",
}


def _strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char))


def canonicalize_unit_symbol(value: Optional[str]) -> str:
    if value is None:
        return ""

    text = str(value).strip()
    if not text:
        return ""

    text = text.replace("²", "2").replace("³", "3")
    text = re.sub(r"\s*/\s*", "/", text)
    text = re.sub(r"\s*-\s*", "-", text)
    text = re.sub(r"\s+", " ", text)

    lowered = _strip_accents(text).lower()
    if lowered in _EXACT_ALIASES:
        return _EXACT_ALIASES[lowered]

    compact = lowered.replace(" ", "")
    if compact in _COMPACT_ALIASES:
        return _COMPACT_ALIASES[compact]

    return lowered
