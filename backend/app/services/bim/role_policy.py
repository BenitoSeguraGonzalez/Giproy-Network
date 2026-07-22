"""Canonical role policy for tenant-scoped BIM operations."""

BIM_COMPANY_OPERATOR_ROLES = frozenset({"administrador", "superadministrador"})


def normalize_role(role: str | None) -> str:
    return (role or "").strip().lower()


def is_bim_company_operator(role: str | None) -> bool:
    """Return whether a role may administer BIM inside an authorized tenant."""

    return normalize_role(role) in BIM_COMPANY_OPERATOR_ROLES
