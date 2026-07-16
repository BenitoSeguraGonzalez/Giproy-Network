from types import SimpleNamespace

from app.services.functional_source import resolve_active_apu_resource_modification


def test_resolve_active_apu_resource_modification_from_schema_like_config():
    config = SimpleNamespace(
        apu_resource_modifications_v1={
            "100": {
                "id": "mod-100",
                "active": True,
                "state": "confirmada",
                "apu_operativo_snapshot": {
                    "has_nested": True,
                    "resources": [{"recurso_id": 7, "cantidad": 2}],
                },
            }
        }
    )

    resolved = resolve_active_apu_resource_modification(config=config, apu_id=100)

    assert resolved["source"] == "apu_resource_modifications_v1"
    assert resolved["active_modification_id"] == "mod-100"
    assert resolved["modification_state"] == "confirmada"
    assert resolved["resources"] == [{"recurso_id": 7, "cantidad": 2}]


def test_resolve_active_apu_resource_modification_ignores_inactive_or_invalid_entries():
    config = {
        "apu_resource_modifications_v1": {
            "100": {
                "id": "mod-100",
                "active": False,
                "apu_operativo_snapshot": {"resources": [{"recurso_id": 7}]},
            },
            "101": {
                "id": "mod-101",
                "active": True,
                "apu_operativo_snapshot": {"resources": "invalid"},
            },
        }
    }

    assert resolve_active_apu_resource_modification(config=config, apu_id=100) is None
    assert resolve_active_apu_resource_modification(config=config, apu_id=101) is None
    assert resolve_active_apu_resource_modification(config=config, apu_id=None) is None
