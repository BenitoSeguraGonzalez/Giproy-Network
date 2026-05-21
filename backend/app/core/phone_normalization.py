COUNTRY_PREFIX_MAP = {
    "ecuador": "593",
    "colombia": "57",
    "peru": "51",
    "perú": "51",
}


def resolve_country_phone_prefix(country_name: str | None) -> str:
    if not country_name:
        return ""
    return COUNTRY_PREFIX_MAP.get(str(country_name).strip().lower(), "")


def is_valid_phone(phone: str | None) -> bool:
    if not phone:
        return False
    cleaned = "".join(ch for ch in str(phone) if ch.isdigit())
    return len(cleaned) >= 7


def normalize_phone(phone: str | None, country_name: str | None = None) -> str | None:
    if not phone:
        return None

    cleaned = "".join(ch for ch in str(phone) if ch.isdigit())
    if not cleaned:
        return None

    prefix = resolve_country_phone_prefix(country_name)
    if not prefix:
        return cleaned

    if cleaned.startswith(prefix):
        national = cleaned[len(prefix):]
    else:
        national = cleaned
        if prefix == "593" and national.startswith("0"):
            national = national[1:]

    if len(national) == 9:
        formatted = f"{national[:2]} {national[2:5]} {national[5:7]} {national[7:9]}"
    elif len(national) == 10:
        formatted = f"{national[:3]} {national[3:6]} {national[6:8]} {national[8:10]}"
    else:
        formatted = national

    return f"+{prefix} {formatted}".strip()
