import hashlib
import hmac
import json
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.main import app
from app.models.bim_integration_gateway import BimIntegrationDelivery, BimIntegrationSubscription
from app.schemas.bim_erp_exchange import BimErpExchangeCreate, BimErpExchangeTransition
from app.schemas.bim_integration_gateway import BimIntegrationSubscriptionCreate
from app.services.bim.erp_exchange_service import create_erp_exchange_package, transition_erp_exchange_package
from app.services.bim.integration_gateway_service import create_integration_subscription, dispatch_integration_delivery, list_integration_deliveries, list_integration_subscriptions
from app.tests.test_bim_erp_exchange import _context


def test_bim_integration_gateway_endpoints_are_registered():
    routes = {(path, method.upper()) for path, operations in app.openapi()["paths"].items() for method in operations}
    base = "/api/v1/bim/projects/{project_id}/integration"
    assert (f"{base}/subscriptions", "GET") in routes
    assert (f"{base}/subscriptions", "POST") in routes
    assert (f"{base}/subscriptions/{{subscription_id}}/transition", "POST") in routes
    assert (f"{base}/deliveries", "GET") in routes
    assert (f"{base}/deliveries/{{delivery_id}}/retry", "POST") in routes


def test_gateway_encrypts_secret_queues_signed_delivery_and_is_tenant_scoped(db, sample_empresa, monkeypatch):
    monkeypatch.setattr("app.services.bim.integration_gateway_service._resolve_target_addresses", lambda _host: {"8.8.8.8"})
    project, user = _context(db, sample_empresa.id)
    subscription = create_integration_subscription(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimIntegrationSubscriptionCreate(label="ERP corporativo", target_url="https://erp.example.com/giproy", event_types=["erp.package.published"]),
    )
    assert subscription.secret_once and subscription.secret_hint == subscription.secret_once[-8:]
    stored = db.query(BimIntegrationSubscription).filter(BimIntegrationSubscription.id == subscription.id).one()
    assert subscription.secret_once not in stored.encrypted_secret
    assert list_integration_subscriptions(db, project_id=project.id, company_id=sample_empresa.id)[0].secret_once is None

    package = create_erp_exchange_package(
        db,
        project=project,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimErpExchangeCreate(cutoff_at=datetime(2026, 7, 20, 23, 59, tzinfo=timezone.utc), justification="Corte contractual para gateway."),
    )
    transition_erp_exchange_package(
        db,
        package_id=package.id,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimErpExchangeTransition(action="publish", reason="Publicacion aprobada para integracion.", expected_lock_version=1),
    )
    delivery = db.query(BimIntegrationDelivery).filter(BimIntegrationDelivery.subscription_id == subscription.id).one()
    assert delivery.status == "pending" and delivery.event_type == "erp.package.published"
    assert delivery.payload_json["data"]["checksum_sha256"] == package.checksum_sha256

    captured = {}
    def sender(url, body, headers):
        captured.update(url=url, body=body, headers=headers)
        return 204

    result = dispatch_integration_delivery(db, delivery_id=delivery.id, project_id=project.id, company_id=sample_empresa.id, sender=sender)
    expected = hmac.new(subscription.secret_once.encode("utf-8"), captured["body"], hashlib.sha256).hexdigest()
    assert result.status == "delivered" and result.attempt_count == 1
    assert captured["headers"]["X-GiProy-Signature"] == f"sha256={expected}"
    assert hashlib.sha256(captured["body"]).hexdigest() == result.payload_checksum_sha256
    assert json.loads(captured["body"])["event_id"] == result.event_id
    assert list_integration_deliveries(db, project_id=project.id, company_id=sample_empresa.id + 999) == []


def test_gateway_retries_http_failure_and_rejects_private_target(db, sample_empresa, monkeypatch):
    monkeypatch.setattr("app.services.bim.integration_gateway_service._resolve_target_addresses", lambda _host: {"8.8.4.4"})
    project, user = _context(db, sample_empresa.id)
    subscription = create_integration_subscription(
        db,
        project_id=project.id,
        company_id=sample_empresa.id,
        user_id=user.id,
        payload=BimIntegrationSubscriptionCreate(label="ERP retry", target_url="https://hooks.example.com/bim", event_types=["erp.package.published"]),
    )
    package = create_erp_exchange_package(db, project=project, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeCreate(cutoff_at=datetime(2026, 7, 20, 23, 59, tzinfo=timezone.utc), justification="Corte para probar reintento."))
    transition_erp_exchange_package(db, package_id=package.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeTransition(action="publish", reason="Publicacion para prueba controlada.", expected_lock_version=1))
    delivery = db.query(BimIntegrationDelivery).filter(BimIntegrationDelivery.subscription_id == subscription.id).one()
    failed = dispatch_integration_delivery(db, delivery_id=delivery.id, project_id=project.id, company_id=sample_empresa.id, sender=lambda *_args: 500)
    assert failed.status == "retry" and failed.last_error_code == "http_500" and failed.attempt_count == 1
    recovered = dispatch_integration_delivery(db, delivery_id=delivery.id, project_id=project.id, company_id=sample_empresa.id, force=True, sender=lambda *_args: 202)
    assert recovered.status == "delivered" and recovered.attempt_count == 2

    second = create_erp_exchange_package(db, project=project, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeCreate(cutoff_at=datetime(2026, 7, 21, 23, 59, tzinfo=timezone.utc), justification="Segundo corte para excepcion de transporte."))
    transition_erp_exchange_package(db, package_id=second.id, project_id=project.id, company_id=sample_empresa.id, user_id=user.id, payload=BimErpExchangeTransition(action="publish", reason="Publicacion para transporte interrumpido.", expected_lock_version=1))
    second_delivery = db.query(BimIntegrationDelivery).filter(BimIntegrationDelivery.subscription_id == subscription.id, BimIntegrationDelivery.id != delivery.id).one()
    def unexpected_transport_error(*_args):
        raise Exception("detalle sensible del transporte")
    normalized = dispatch_integration_delivery(db, delivery_id=second_delivery.id, project_id=project.id, company_id=sample_empresa.id, sender=unexpected_transport_error)
    assert normalized.status == "retry" and normalized.last_error_code == "transport_error"

    monkeypatch.setattr("app.services.bim.integration_gateway_service._resolve_target_addresses", lambda _host: {"127.0.0.1"})
    with pytest.raises(HTTPException) as blocked:
        create_integration_subscription(
            db,
            project_id=project.id,
            company_id=sample_empresa.id,
            user_id=user.id,
            payload=BimIntegrationSubscriptionCreate(label="Destino privado", target_url="https://localhost/internal", event_types=["erp.package.published"]),
        )
    assert blocked.value.status_code == 422
