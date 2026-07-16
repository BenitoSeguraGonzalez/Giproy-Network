from __future__ import annotations

from typing import Any


APU_RESOURCE_MODIFICATIONS_CONFIG_KEY = "apu_resource_modifications_v1"
APU_RESOURCE_MODIFICATION_SOURCE = "apu_resource_modifications_v1"
APU_RESOURCE_MODIFICATION_DEFAULT_STATE = "confirmada"


def _resolve_config_mapping(config: Any) -> dict[str, Any]:
    if config is None:
        return {}
    if isinstance(config, dict):
        value = config.get(APU_RESOURCE_MODIFICATIONS_CONFIG_KEY)
    else:
        value = getattr(config, APU_RESOURCE_MODIFICATIONS_CONFIG_KEY, None)
    return value if isinstance(value, dict) else {}


def resolve_active_apu_resource_modification(
    *,
    config: Any,
    apu_id: Any,
) -> dict[str, Any] | None:
    resolved_apu_id = str(apu_id or "").strip()
    if not resolved_apu_id:
        return None

    modifications = _resolve_config_mapping(config)
    active_modification = modifications.get(resolved_apu_id)
    if not isinstance(active_modification, dict):
        return None
    if active_modification.get("active") is not True:
        return None

    snapshot = active_modification.get("apu_operativo_snapshot")
    if not isinstance(snapshot, dict) or not isinstance(snapshot.get("resources"), list):
        return None

    resolved = dict(snapshot)
    resolved["status"] = resolved.get("status") or "modificacion_activa"
    resolved["modification_state"] = (
        active_modification.get("state")
        or APU_RESOURCE_MODIFICATION_DEFAULT_STATE
    )
    resolved["source"] = APU_RESOURCE_MODIFICATION_SOURCE
    resolved["active_modification_id"] = active_modification.get("id")
    return resolved
