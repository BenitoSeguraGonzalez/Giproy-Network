from sqlalchemy.orm import Session

from app.models.usuario import Usuario


FIELD_LABELS = {
    "nombre_completo": "nombre completo",
    "ruc": "identificacion fiscal",
    "nombres": "nombres",
    "apellidos": "apellidos",
    "alias": "alias",
    "nacionalidad": "nacionalidad",
    "profesion": "profesion",
    "ciudad": "ciudad",
    "provincia": "provincia",
    "canton": "canton",
    "pais": "pais",
    "movil": "movil",
    "acepta_politica_privacidad": "aceptacion de politica de privacidad",
}


def _has_text(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _is_empty(value) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def seed_admin_marketplace_profile_from_company(db: Session, user: Usuario) -> bool:
    """Completa huecos heredados del administrador con datos de su empresa.

    La empresa es la fuente inicial de ubicación/contacto en el alta. Solo se
    rellenan campos vacíos del usuario administrador para no pisar edición manual.
    """
    role = (getattr(user, "rol", "") or "").strip().lower()
    empresa = getattr(user, "empresa", None)
    if role != "administrador" or not empresa:
        return False

    field_pairs = {
        "ruc": "ruc",
        "alias": "nombre",
        "ciudad": "localidad",
        "provincia": "provincia",
        "canton": "canton",
        "pais": "pais",
        "movil": "telefono",
    }
    changed = False
    for user_field, company_field in field_pairs.items():
        if _is_empty(getattr(user, user_field, None)):
            value = getattr(empresa, company_field, None)
            if _has_text(value):
                setattr(user, user_field, value.strip())
                changed = True

    if _is_empty(getattr(user, "ciudad", None)) and _has_text(getattr(empresa, "canton", None)):
        user.ciudad = empresa.canton.strip()
        changed = True
    if _is_empty(getattr(user, "canton", None)) and _has_text(getattr(empresa, "localidad", None)):
        user.canton = empresa.localidad.strip()
        changed = True

    if changed:
        db.add(user)
        db.commit()
        db.refresh(user)
    return changed


def evaluate_marketplace_profile(user: Usuario) -> dict:
    missing_fields: list[str] = []
    required_text_fields = [
        "nombre_completo",
        "ruc",
        "nombres",
        "apellidos",
        "alias",
        "nacionalidad",
        "profesion",
        "ciudad",
        "provincia",
        "pais",
        "movil",
    ]

    for field in required_text_fields:
        if not _has_text(getattr(user, field, None)):
            missing_fields.append(field)

    if (getattr(user, "pais", "") or "").strip().lower() == "ecuador" and not _has_text(getattr(user, "canton", None)):
        missing_fields.append("canton")

    if not bool(getattr(user, "acepta_politica_privacidad", False)):
        missing_fields.append("acepta_politica_privacidad")

    return {
        "complete": len(missing_fields) == 0,
        "missing_fields": missing_fields,
        "missing_labels": [FIELD_LABELS.get(field, field) for field in missing_fields],
    }
