from types import SimpleNamespace

from app.services.marketplace_permissions import (
    has_marketplace_permission,
    is_marketplace_beta_company_admin,
    resolve_marketplace_permissions,
)


def _user(role, *, company_name="", explicit_permissions=None):
    company = SimpleNamespace(nombre=company_name)
    user = SimpleNamespace(rol=role, empresa=company)
    if explicit_permissions is not None:
        user.marketplace_permissions = explicit_permissions
    return user


def test_marketplace_permissions_for_standard_roles_are_conservative():
    viewer = _user("usuario")
    admin = _user("administrador", company_name="Empresa Regular")
    superadmin = _user("superadministrador")

    assert resolve_marketplace_permissions(viewer) == ["marketplace.view"]
    assert has_marketplace_permission(admin, "seller.publish") is True
    assert has_marketplace_permission(admin, "marketplace.manage_all_products") is False
    assert has_marketplace_permission(superadmin, "marketplace.manage_all_products") is True


def test_marketplace_beta_company_admin_gets_admin_permissions_by_company_name():
    user = _user("administrador", company_name="  Santiago   Bermeo  ")

    assert is_marketplace_beta_company_admin(user) is True
    assert has_marketplace_permission(user, "marketplace.manage_all_products") is True


def test_marketplace_explicit_permissions_are_sanitized_and_merged():
    user = _user(
        "usuario",
        explicit_permissions=[
            " marketplace.buy ",
            "",
            "marketplace.buy",
            "reviews.create",
        ],
    )

    assert resolve_marketplace_permissions(user) == [
        "marketplace.buy",
        "marketplace.view",
        "reviews.create",
    ]
