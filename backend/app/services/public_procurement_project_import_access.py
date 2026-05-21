from __future__ import annotations

from fastapi import HTTPException


PUBLIC_PROCUREMENT_IMPORT_COMPANY_NAME = "Administradores Generales"


def normalize_public_procurement_company_name(raw_name: str | None) -> str:
    return " ".join(str(raw_name or "").strip().lower().split())


def resolve_user_company_name(user) -> str:
    company = getattr(user, "empresa", None)
    return (
        getattr(company, "nombre", None)
        or getattr(company, "razon_social", None)
        or getattr(company, "nombre_comercial", None)
        or getattr(user, "empresa_nombre", None)
        or ""
    )


def can_access_public_procurement_project_importer(user) -> bool:
    role = (getattr(user, "rol", "") or "").strip().lower()
    if role != "superadministrador":
        return False

    company_name = resolve_user_company_name(user)
    return normalize_public_procurement_company_name(company_name) == normalize_public_procurement_company_name(
        PUBLIC_PROCUREMENT_IMPORT_COMPANY_NAME
    )


def validate_public_procurement_project_importer_access(user) -> None:
    if can_access_public_procurement_project_importer(user):
        return
    raise HTTPException(
        status_code=403,
        detail=(
            "El importador de compras publicas en Proyectos esta restringido "
            "a Superadministrador de Administradores Generales."
        ),
    )

