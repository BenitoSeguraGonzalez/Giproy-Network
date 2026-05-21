MARKETPLACE_PERMISSION_GROUPS = {
    "marketplace_viewer": [
        "marketplace.view",
    ],
    "marketplace_buyer": [
        "marketplace.buy",
        "orders.view_own",
        "orders.download_invoice",
        "orders.access_resources",
        "reviews.create",
    ],
    "marketplace_seller": [
        "seller.publish",
        "seller.edit_own",
        "seller.delete_own",
        "seller.view_own_products",
        "seller.view_sales",
        "seller.view_stats",
        "seller.activate_product",
    ],
    "marketplace_admin": [
        "marketplace.manage_all_products",
        "marketplace.approve_products",
        "marketplace.delete_any_product",
        "marketplace.view_all_sales",
        "marketplace.view_commissions",
        "marketplace.view_analytics",
        "users.manage_roles_marketplace",
    ],
}


def _normalize_company_name(raw_name: str) -> str:
    return " ".join(str(raw_name or "").strip().lower().split())


def is_marketplace_beta_company_admin(user) -> bool:
    role = (getattr(user, "rol", "") or "").lower()
    if role != "administrador":
        return False

    company = getattr(user, "empresa", None)
    company_name = (
        getattr(company, "nombre", None)
        or getattr(company, "razon_social", None)
        or getattr(company, "nombre_comercial", None)
        or getattr(user, "empresa_nombre", None)
        or ""
    )
    return _normalize_company_name(company_name) == _normalize_company_name("Santiago Bermeo")


def _normalize_permissions(raw_permissions) -> list[str]:
    if not raw_permissions:
        return []
    if isinstance(raw_permissions, list):
        return sorted({str(item).strip() for item in raw_permissions if str(item).strip()})
    return []


def get_default_marketplace_permissions(user) -> list[str]:
    role = (getattr(user, "rol", "") or "").lower()
    permissions = set(MARKETPLACE_PERMISSION_GROUPS["marketplace_viewer"])
    if role == "administrador":
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_buyer"])
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_seller"])
    if role == "superadministrador":
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_buyer"])
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_seller"])
    if role == "superadministrador":
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_admin"])
    if is_marketplace_beta_company_admin(user):
        permissions.update(MARKETPLACE_PERMISSION_GROUPS["marketplace_admin"])
    return sorted(permissions)


def resolve_marketplace_permissions(user) -> list[str]:
    explicit_permissions = _normalize_permissions(getattr(user, "__dict__", {}).get("marketplace_permissions"))
    default_permissions = get_default_marketplace_permissions(user)
    if explicit_permissions:
        return sorted(set(default_permissions).union(explicit_permissions))
    return default_permissions


def has_marketplace_permission(user, permission_code: str) -> bool:
    return permission_code in resolve_marketplace_permissions(user)
