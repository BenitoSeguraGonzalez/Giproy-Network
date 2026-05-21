from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.public_procurement_project_import_access import (
    can_access_public_procurement_project_importer,
    normalize_public_procurement_company_name,
    resolve_user_company_name,
    validate_public_procurement_project_importer_access,
)


def _user(role="superadministrador", company_name="Administradores Generales"):
    return SimpleNamespace(
        rol=role,
        empresa=SimpleNamespace(nombre=company_name),
        empresa_nombre=company_name,
    )


def test_public_procurement_project_importer_allows_only_superadmin_in_admin_generales():
    assert can_access_public_procurement_project_importer(_user()) is True


@pytest.mark.parametrize(
    ("role", "company_name"),
    [
        ("administrador", "Administradores Generales"),
        ("superadministrador", "Santiago Bermeo"),
        ("usuario", "Administradores Generales"),
    ],
)
def test_public_procurement_project_importer_blocks_other_roles_or_companies(role, company_name):
    assert can_access_public_procurement_project_importer(_user(role, company_name)) is False


def test_public_procurement_project_importer_normalizes_company_name():
    user = _user("SuperAdministrador", "  administradores   generales ")

    assert can_access_public_procurement_project_importer(user) is True


def test_public_procurement_company_name_normalization_handles_empty_and_spacing():
    assert normalize_public_procurement_company_name(None) == ""
    assert normalize_public_procurement_company_name("  Administradores    Generales  ") == "administradores generales"


def test_public_procurement_company_name_resolution_prefers_company_fields():
    user = SimpleNamespace(
        empresa=SimpleNamespace(
            nombre="",
            razon_social="Razon Social Admin",
            nombre_comercial="Comercial Admin",
        ),
        empresa_nombre="Empresa directa",
    )

    assert resolve_user_company_name(user) == "Razon Social Admin"


def test_public_procurement_company_name_resolution_falls_back_to_user_field():
    user = SimpleNamespace(
        empresa=SimpleNamespace(nombre="", razon_social="", nombre_comercial=""),
        empresa_nombre="Administradores Generales",
    )

    assert resolve_user_company_name(user) == "Administradores Generales"


def test_public_procurement_project_importer_blocks_missing_user_safely():
    assert can_access_public_procurement_project_importer(None) is False


def test_public_procurement_project_importer_validator_raises_clear_403():
    with pytest.raises(HTTPException) as exc_info:
        validate_public_procurement_project_importer_access(_user("administrador", "Administradores Generales"))

    assert exc_info.value.status_code == 403
    assert "Administradores Generales" in exc_info.value.detail


def test_public_procurement_project_importer_validator_allows_authorized_user():
    assert validate_public_procurement_project_importer_access(_user()) is None
