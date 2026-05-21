from dataclasses import asdict, dataclass

from app.core.config import settings
from app.services.system_bim_setting import (
    get_or_create_system_bim_setting,
    system_bim_settings_table_ready,
)


def _parse_csv_ids(raw_value: str) -> list[int]:
    values: list[int] = []
    for chunk in (raw_value or "").split(","):
        token = chunk.strip()
        if not token:
            continue
        try:
            values.append(int(token))
        except ValueError:
            continue
    return values


@dataclass
class BimFeatureAccess:
    feature: str
    enabled: bool
    environment_enabled: bool
    scoped: bool
    company_match: bool
    user_match: bool
    allowed_company_ids: list[int]
    allowed_user_ids: list[int]
    resolved_company_id: int | None
    resolved_user_id: int | None
    resolved_role: str | None

    def to_dict(self) -> dict:
        return asdict(self)


def resolve_bim_feature_access(
    *,
    db=None,
    user_id: int | None,
    company_id: int | None,
    role: str | None,
) -> BimFeatureAccess:
    role_normalized = (role or "").lower()
    allowed_company_ids = _parse_csv_ids(settings.BIM_ALLOWED_EMPRESA_IDS)
    allowed_user_ids = _parse_csv_ids(settings.BIM_ALLOWED_USER_IDS)
    environment_enabled = settings.BIM_ENABLED
    superadmin_only = False

    if db is not None and system_bim_settings_table_ready(db):
        config = get_or_create_system_bim_setting(db)
        allowed_company_ids = _parse_csv_ids(config.allowed_company_ids)
        allowed_user_ids = []
        environment_enabled = bool(config.is_enabled)
        superadmin_only = bool(config.superadmin_only)

    company_match = company_id in allowed_company_ids if company_id is not None else False
    user_match = user_id in allowed_user_ids if user_id is not None else False
    scoped = bool(allowed_company_ids or allowed_user_ids)
    role_match = role_normalized == "superadministrador" if superadmin_only else True

    enabled = environment_enabled and role_match and (not scoped or company_match or user_match or (superadmin_only and role_match and not scoped))

    return BimFeatureAccess(
        feature="bim",
        enabled=enabled,
        environment_enabled=environment_enabled,
        scoped=scoped,
        company_match=company_match,
        user_match=user_match,
        allowed_company_ids=allowed_company_ids,
        allowed_user_ids=allowed_user_ids,
        resolved_company_id=company_id,
        resolved_user_id=user_id,
        resolved_role=role_normalized or None,
    )
