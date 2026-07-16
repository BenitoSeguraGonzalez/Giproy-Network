from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.main import app
from app.models.license_event import LicenseEvent
from app.models.license_notification_event import LicenseNotificationEvent
from app.models.licencia import Licencia
from app.models.empresa_licencia import EmpresaLicencia
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderItem, MarketplaceProduct
from app.models.usuario import Usuario
from app.services.license import license_service
from app.services.license_notifications import license_notification_service


def _admin_user(db, empresa_id: int) -> Usuario:
    user = Usuario(
        email="admin-license-notices@giproy.test",
        hashed_password="x",
        nombre_completo="Admin Licencias",
        rol="administrador",
        empresa_id=empresa_id,
        activo=True,
    )
    db.add(user)
    db.flush()
    return user


def _client(db, current_user: Usuario):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user
    return TestClient(app)


def test_paid_commercial_license_queues_admin_welcome_notifications(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()

    assignment = license_service.assign_license_to_company(
        db,
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        months=12,
        actor_usuario_id=admin.id,
        payment_confirmed_at=datetime.now(timezone.utc),
        source="marketplace_order",
    )

    events = (
        db.query(LicenseNotificationEvent)
        .filter(LicenseNotificationEvent.empresa_licencia_id == assignment.id)
        .order_by(LicenseNotificationEvent.channel.asc())
        .all()
    )

    assert {event.channel for event in events} == {"email", "in_app"}
    assert {event.notification_type for event in events} == {"license_welcome"}
    assert all(event.status == "pending" for event in events)
    assert all(event.recipient_usuario_id == admin.id for event in events)
    assert all(event.payload["licencia_codigo"] == "STANDARD" for event in events)
    assert all(event.payload["subject"] == "Licencia Estándar activada - GiProy" for event in events)
    assert all("La licencia Estándar fue activada" in event.payload["body"] for event in events)
    assert all(event.payload["severity"] == "success" for event in events)

    audit_event = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_licencia_id == assignment.id,
            LicenseEvent.event_type == "license_welcome_notifications_queued",
        )
        .one()
    )
    assert sorted(audit_event.payload["channels"]) == ["email", "in_app"]


def test_welcome_notification_queue_is_idempotent(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    assignment = license_service.assign_license_to_company(
        db,
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        months=12,
        actor_usuario_id=admin.id,
        payment_confirmed_at=datetime.now(timezone.utc),
        source="marketplace_order",
    )

    first = license_notification_service.queue_paid_license_welcome(db, assignment, licencia=standard, actor_usuario_id=admin.id)
    second = license_notification_service.queue_paid_license_welcome(db, assignment, licencia=standard, actor_usuario_id=admin.id)

    assert [event.id for event in first] == [event.id for event in second]
    assert (
        db.query(LicenseNotificationEvent)
        .filter(LicenseNotificationEvent.empresa_licencia_id == assignment.id)
        .count()
        == 2
    )


def test_purchase_formalized_queue_is_general_and_idempotent(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="25.00",
        commission_amount="5.00",
        seller_amount="20.00",
        currency="USD",
        status="completed",
        notes="Compra general formalizada",
    )
    db.add(order)
    db.flush()
    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=None,
        seller_user_id=buyer.id,
        product_title_snapshot="Pack SaaS de prueba",
        product_type_snapshot="addon",
        price="25.00",
    )
    db.add(item)
    db.flush()
    db.refresh(order)

    first = license_notification_service.queue_purchase_formalized(db, order, buyer=buyer, payment_method="bank_transfer")
    second = license_notification_service.queue_purchase_formalized(db, order, buyer=buyer, payment_method="bank_transfer")

    assert [event.id for event in first] == [event.id for event in second]
    assert {event.channel for event in first} == {"email", "in_app"}
    assert {event.notification_type for event in first} == {"purchase_formalized"}
    assert all(event.payload["marketplace_order_id"] == order.id for event in first)
    assert all(event.payload["items"][0]["product_title"] == "Pack SaaS de prueba" for event in first)
    assert all(event.payload["subject"] == f"Compra formalizada #{order.id} - GiProy" for event in first)
    assert all("Pack SaaS de prueba" in event.payload["body"] for event in first)
    assert all(event.payload["severity"] == "info" for event in first)


def test_purchase_lifecycle_end_queue_uses_product_duration_and_is_idempotent(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    product = MarketplaceProduct(
        titulo="Pack con vigencia",
        slug="pack-vigencia-test",
        resumen="Pack con fecha de fin",
        product_type="addon",
        product_kind="system",
        precio="15.00",
        moneda="USD",
        estado="approved",
        activo=True,
        requiere_aprobacion=False,
        seller_user_id=buyer.id,
        vista_previa={
            "product_meta": {
                "duration_months": 1,
                "delivery_kind": "saas_right",
                "commercial_code": "PACK_TEST",
            }
        },
    )
    db.add(product)
    db.flush()
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="15.00",
        commission_amount="3.00",
        seller_amount="12.00",
        currency="USD",
        status="completed",
        created_at=datetime.now(timezone.utc) - timedelta(days=31),
    )
    db.add(order)
    db.flush()
    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=buyer.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        delivered_entity_type="saas_right",
        delivered_entity_id=1,
        price="15.00",
    )
    db.add(item)
    db.flush()
    db.refresh(item)

    first = license_notification_service.queue_purchase_lifecycle_ended(db, item, buyer=buyer)
    second = license_notification_service.queue_purchase_lifecycle_ended(db, item, buyer=buyer)

    assert [event.id for event in first] == [event.id for event in second]
    assert {event.channel for event in first} == {"email", "in_app"}
    assert {event.notification_type for event in first} == {"purchase_lifecycle_ended"}
    assert all(event.payload["marketplace_order_item_id"] == item.id for event in first)
    assert all(event.payload["product_title"] == "Pack con vigencia" for event in first)
    assert all(event.payload["subject"] == "Finalizo Pack con vigencia - GiProy" for event in first)
    assert all("Revisa si necesitas renovar" in event.payload["body"] for event in first)
    assert all(event.payload["severity"] == "warning" for event in first)


def test_purchase_lifecycle_end_does_not_queue_before_end_date(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    product = MarketplaceProduct(
        titulo="Pack vigente",
        slug="pack-vigente-test",
        product_type="addon",
        product_kind="system",
        precio="15.00",
        moneda="USD",
        estado="approved",
        activo=True,
        requiere_aprobacion=False,
        seller_user_id=buyer.id,
        vista_previa={"product_meta": {"duration_months": 1, "delivery_kind": "saas_right"}},
    )
    db.add(product)
    db.flush()
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="15.00",
        commission_amount="3.00",
        seller_amount="12.00",
        currency="USD",
        status="completed",
        created_at=datetime.now(timezone.utc),
    )
    db.add(order)
    db.flush()
    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=buyer.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        delivered_entity_type="saas_right",
        delivered_entity_id=1,
        price="15.00",
    )
    db.add(item)
    db.flush()
    db.refresh(item)

    assert license_notification_service.queue_purchase_lifecycle_ended(db, item, buyer=buyer) == []


def test_in_app_endpoint_lists_and_acknowledges_customer_notification(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="25.00",
        commission_amount="5.00",
        seller_amount="20.00",
        currency="USD",
        status="completed",
    )
    db.add(order)
    db.flush()
    db.add(
        MarketplaceOrderItem(
            order_id=order.id,
            product_id=None,
            seller_user_id=buyer.id,
            product_title_snapshot="Compra visible",
            product_type_snapshot="addon",
            price="25.00",
        )
    )
    db.flush()
    license_notification_service.queue_purchase_formalized(db, order, buyer=buyer)
    db.commit()

    try:
        with _client(db, buyer) as client:
            list_response = client.get("/api/v1/license-notifications/me")
            assert list_response.status_code == 200, list_response.text
            items = list_response.json()["items"]
            assert len(items) == 1
            assert items[0]["notification_type"] == "purchase_formalized"
            assert items[0]["title"] == "Compra formalizada"
            assert "Compra visible" in items[0]["body"]

            ack_response = client.post(f"/api/v1/license-notifications/{items[0]['id']}/ack")
            assert ack_response.status_code == 200, ack_response.text
            assert ack_response.json()["status"] == "acknowledged"

            empty_response = client.get("/api/v1/license-notifications/me")
            assert empty_response.status_code == 200, empty_response.text
            assert empty_response.json()["items"] == []
    finally:
        app.dependency_overrides.clear()


def test_full_notification_housekeeping_endpoint_queues_license_expiry_and_dispatches_email(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    superadmin = Usuario(
        email="super-full-housekeeping@giproy.test",
        hashed_password="x",
        nombre_completo="Super Full Housekeeping",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
        activo=True,
    )
    db.add(superadmin)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    today = date.today()
    assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        starts_at=today - timedelta(days=23),
        ends_at=today + timedelta(days=7),
        status="active",
        source="manual_admin",
        payment_confirmed_at=datetime.now(timezone.utc),
        activa=True,
    )
    db.add(assignment)
    db.commit()

    try:
        with _client(db, admin) as client:
            forbidden = client.post("/api/v1/license-notifications/housekeeping/run")
            assert forbidden.status_code == 403

        with _client(db, superadmin) as client:
            response = client.post(
                f"/api/v1/license-notifications/housekeeping/run?empresa_id={sample_empresa.id}&dispatch_email=true&notification_type=license_expiring_soon"
            )
            assert response.status_code == 200, response.text
            payload = response.json()
            assert payload["queued_purchase_count"] == 0
            assert payload["queued_license_count"] == 4
            assert payload["queued_count"] == 4
            assert payload["dispatched_count"] == 2
            assert {item["notification_type"] for item in payload["queued_license_items"]} == {"license_expiring_soon"}
            assert payload["dispatched_items"][0]["notification_type"] == "license_expiring_soon"
            assert payload["dispatched_items"][0]["status"] == "sent"

        with _client(db, admin) as client:
            list_response = client.get("/api/v1/license-notifications/me")
            assert list_response.status_code == 200, list_response.text
            items = list_response.json()["items"]
            assert len(items) == 1
            assert items[0]["notification_type"] == "license_expiring_soon"
            assert items[0]["payload"]["display_once"] is False
    finally:
        app.dependency_overrides.clear()


def test_integrated_housekeeping_expires_license_before_readonly_notifications(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    today = date(2026, 6, 10)
    assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        starts_at=today - timedelta(days=30),
        ends_at=today - timedelta(days=1),
        status="active",
        source="manual_admin",
        activated_at=datetime.now(timezone.utc) - timedelta(days=30),
        payment_confirmed_at=datetime.now(timezone.utc) - timedelta(days=30),
        read_only_mode=False,
        activa=True,
    )
    db.add(assignment)
    db.flush()

    result = license_notification_service.run_notification_housekeeping(
        db,
        today=today,
        dispatch_email=True,
    )
    db.refresh(assignment)

    assert assignment.status == "expired"
    assert assignment.read_only_mode is True
    assert assignment.grace_ends_at is not None
    assert {event.notification_type for event in result["queued_license_events"]} == {"license_readonly"}
    assert {event.channel for event in result["queued_license_events"]} == {"email", "in_app"}
    assert any(event.status == "sent" for event in result["dispatched_events"])
    assert any(event.recipient_usuario_id == admin.id for event in result["queued_license_events"])


def test_license_expiry_window_queues_email_to_admin_and_recurrent_in_app(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    user = Usuario(
        email="user-license-expiry@giproy.test",
        hashed_password="x",
        nombre_completo="Usuario Caducidad",
        rol="usuario",
        empresa_id=sample_empresa.id,
        activo=True,
    )
    db.add(user)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    today = date(2026, 6, 9)
    assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        starts_at=today - timedelta(days=23),
        ends_at=today + timedelta(days=7),
        status="active",
        source="manual_admin",
        payment_confirmed_at=datetime.now(timezone.utc),
        activa=True,
    )
    db.add(assignment)
    db.flush()

    events = license_notification_service.queue_due_license_lifecycle_notifications(db, today=today)

    assert len(events) == 3
    assert {event.notification_type for event in events} == {"license_expiring_soon"}
    assert len([event for event in events if event.channel == "email"]) == 1
    in_app_events = [event for event in events if event.channel == "in_app"]
    assert {event.recipient_usuario_id for event in in_app_events} == {admin.id, user.id}
    assert all(event.payload["display_once"] is False for event in in_app_events)
    assert events[0].payload["days_remaining"] == 7


def test_license_readonly_queues_reminder_email_every_five_days_and_final_day(db, sample_empresa):
    admin = _admin_user(db, sample_empresa.id)
    license_service.ensure_default_catalog(db)
    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    today = date(2026, 6, 9)
    assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        starts_at=today - timedelta(days=35),
        ends_at=today - timedelta(days=5),
        grace_ends_at=today + timedelta(days=10),
        status="readonly",
        source="manual_admin",
        read_only_mode=True,
        activa=True,
    )
    db.add(assignment)
    db.flush()

    events = license_notification_service.queue_due_license_lifecycle_notifications(db, today=today)

    email_events = [event for event in events if event.channel == "email"]
    in_app_events = [event for event in events if event.channel == "in_app"]
    assert len(email_events) == 1
    assert email_events[0].recipient_usuario_id == admin.id
    assert email_events[0].notification_type == "license_readonly"
    assert len(in_app_events) == 1
    assert in_app_events[0].payload["display_once"] is False
    assert in_app_events[0].payload["days_until_delete"] == 10

    final_day_assignment = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        starts_at=today - timedelta(days=45),
        ends_at=today - timedelta(days=15),
        grace_ends_at=today,
        status="readonly",
        source="manual_admin",
        read_only_mode=True,
        activa=True,
    )
    db.add(final_day_assignment)
    db.flush()

    final_events = license_notification_service.queue_license_readonly_notifications(
        db,
        final_day_assignment,
        today=today,
    )

    final_email = [event for event in final_events if event.channel == "email"][0]
    assert final_email.notification_type == "license_data_deletion_today"
    assert final_email.payload["days_until_delete"] == 0


def test_email_dispatch_endpoint_is_superadmin_only_and_marks_pending_as_sent(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    superadmin = Usuario(
        email="super-license-notices@giproy.test",
        hashed_password="x",
        nombre_completo="Super Licencias",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
        activo=True,
    )
    db.add(superadmin)
    db.flush()
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="25.00",
        commission_amount="5.00",
        seller_amount="20.00",
        currency="USD",
        status="completed",
    )
    db.add(order)
    db.flush()
    license_notification_service.queue_purchase_formalized(db, order, buyer=buyer)
    db.commit()

    try:
        with _client(db, buyer) as client:
            forbidden = client.post("/api/v1/license-notifications/dispatch-email")
            assert forbidden.status_code == 403

        with _client(db, superadmin) as client:
            response = client.post("/api/v1/license-notifications/dispatch-email?limit=10")
            assert response.status_code == 200, response.text
            payload = response.json()
            assert payload["dispatched_count"] == 1
            assert payload["items"][0]["channel"] == "email"
            assert payload["items"][0]["status"] == "sent"
            assert payload["items"][0]["sent_at"] is not None
            assert payload["items"][0]["payload"]["email_dispatch"]["success"] is True
            assert payload["items"][0]["payload"]["email_dispatch"]["backend"] == "mock"
    finally:
        app.dependency_overrides.clear()


def test_email_dispatch_endpoint_retries_failed_events_only_when_requested(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    superadmin = Usuario(
        email="super-retry-license-notices@giproy.test",
        hashed_password="x",
        nombre_completo="Super Retry Licencias",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
        activo=True,
    )
    db.add(superadmin)
    db.flush()
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="25.00",
        commission_amount="5.00",
        seller_amount="20.00",
        currency="USD",
        status="completed",
    )
    db.add(order)
    db.flush()
    license_notification_service.queue_purchase_formalized(db, order, buyer=buyer)
    email_event = (
        db.query(LicenseNotificationEvent)
        .filter(
            LicenseNotificationEvent.channel == "email",
            LicenseNotificationEvent.notification_type == "purchase_formalized",
        )
        .one()
    )
    email_event.status = "failed"
    email_event.last_error = "smtp temporalmente no disponible"
    db.add(email_event)
    db.commit()

    try:
        with _client(db, superadmin) as client:
            normal_response = client.post("/api/v1/license-notifications/dispatch-email?limit=10")
            assert normal_response.status_code == 200, normal_response.text
            assert normal_response.json()["dispatched_count"] == 0

            retry_response = client.post("/api/v1/license-notifications/dispatch-email?limit=10&retry_failed=true")
            assert retry_response.status_code == 200, retry_response.text
            payload = retry_response.json()
            assert payload["dispatched_count"] == 1
            assert payload["items"][0]["id"] == email_event.id
            assert payload["items"][0]["status"] == "sent"
            assert payload["items"][0]["payload"]["email_dispatch"]["backend"] == "mock"

        db.refresh(email_event)
        assert email_event.status == "sent"
        assert email_event.last_error is None
    finally:
        app.dependency_overrides.clear()


def test_purchase_lifecycle_housekeeping_endpoint_queues_and_dispatches_expired_product(db, sample_empresa):
    buyer = _admin_user(db, sample_empresa.id)
    superadmin = Usuario(
        email="super-housekeeping@giproy.test",
        hashed_password="x",
        nombre_completo="Super Housekeeping",
        rol="superadministrador",
        empresa_id=sample_empresa.id,
        activo=True,
    )
    db.add(superadmin)
    product = MarketplaceProduct(
        titulo="Pack caducado housekeeping",
        slug="pack-caducado-housekeeping-test",
        product_type="addon",
        product_kind="system",
        precio="15.00",
        moneda="USD",
        estado="approved",
        activo=True,
        requiere_aprobacion=False,
        seller_user_id=buyer.id,
        vista_previa={"product_meta": {"duration_months": 1, "delivery_kind": "saas_right"}},
    )
    db.add(product)
    db.flush()
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total="15.00",
        commission_amount="3.00",
        seller_amount="12.00",
        currency="USD",
        status="completed",
        created_at=datetime.now(timezone.utc) - timedelta(days=31),
    )
    db.add(order)
    db.flush()
    db.add(
        MarketplaceOrderItem(
            order_id=order.id,
            product_id=product.id,
            seller_user_id=buyer.id,
            product_title_snapshot=product.titulo,
            product_type_snapshot=product.product_type,
            delivered_entity_type="saas_right",
            delivered_entity_id=1,
            price="15.00",
        )
    )
    db.commit()

    try:
        with _client(db, buyer) as client:
            forbidden = client.post("/api/v1/license-notifications/housekeeping/purchase-lifecycle")
            assert forbidden.status_code == 403

        with _client(db, superadmin) as client:
            response = client.post(
                f"/api/v1/license-notifications/housekeeping/purchase-lifecycle?empresa_id={sample_empresa.id}&dispatch_email=true"
            )
            assert response.status_code == 200, response.text
            payload = response.json()
            assert payload["queued_count"] == 2
            assert payload["dispatched_count"] == 1
            assert payload["dispatched_items"][0]["notification_type"] == "purchase_lifecycle_ended"
            assert payload["dispatched_items"][0]["status"] == "sent"

        with _client(db, buyer) as client:
            list_response = client.get("/api/v1/license-notifications/me")
            assert list_response.status_code == 200, list_response.text
            items = list_response.json()["items"]
            assert len(items) == 1
            assert items[0]["notification_type"] == "purchase_lifecycle_ended"
            assert items[0]["title"] == "Producto finalizado"
            assert "Pack caducado housekeeping" in items[0]["body"]
    finally:
        app.dependency_overrides.clear()
