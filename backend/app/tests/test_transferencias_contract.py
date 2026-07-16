from fastapi.testclient import TestClient

from app.main import app
from app.schemas.transferencia import (
    TRANSFER_BLOCKED_LICENSES,
    TRANSFER_CONTRACT_VERSION,
    TRANSFER_SHIPMENT_STATES,
)


def test_transferencias_contract_exposes_classic_foundation():
    with TestClient(app) as client:
        response = client.get("/api/v1/transferencias/contract")

    assert response.status_code == 200
    payload = response.json()

    assert payload["contract_version"] == TRANSFER_CONTRACT_VERSION
    assert payload["asset_types"] == ["proyecto", "base_trabajo"]
    assert payload["authorized_roles"] == ["administrador", "superadministrador"]
    assert payload["allowed_licenses"] == ["STANDARD", "PROFESSIONAL"]
    assert payload["blocked_licenses"] == TRANSFER_BLOCKED_LICENSES
    assert payload["features"] == {
        "dry_run_preflight": True,
        "snapshot_hash_required": True,
        "transfer_adapter_required": True,
        "marketplace_full_purchase_required": True,
        "import_idempotency_required": True,
        "blocked_license_guard_required": True,
    }


def test_transferencias_contract_keeps_approved_states_ordered():
    with TestClient(app) as client:
        response = client.get("/api/v1/transferencias/contract")

    assert response.status_code == 200
    states = response.json()["states"]

    assert [item["code"] for item in states] == TRANSFER_SHIPMENT_STATES
    assert [item["code"] for item in states if item["recoverable"]] == ["fallo_importacion"]
