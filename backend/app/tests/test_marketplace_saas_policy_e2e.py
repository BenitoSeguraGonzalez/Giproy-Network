from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.api.deps import get_current_active_user, get_current_user
from app.core.database import get_db
from app.main import app
from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.license_event import LicenseEvent
from app.models.license_notification_event import LicenseNotificationEvent
from app.models.marketplace import MarketplaceOrderItem, MarketplacePaymentMethod, MarketplaceProduct
from app.models.saas_conecta import SaasConectaSlot
from app.models.usuario import Usuario
from app.services.license import license_service
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories
from app.services.marketplace_catalog_bootstrap import bootstrap_system_marketplace_catalog


def _create_company(db, *, name: str, ruc: str, prefix: str) -> Empresa:
    company = Empresa(
        nombre=name,
        ruc=ruc,
        localidad="Cuenca",
        canton="Cuenca",
        provincia="Azuay",
        pais="Ecuador",
        telefono="0999999999",
        proy_prefijo=prefix,
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=9,
        marketplace_can_sell=True,
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def _create_user(db, *, email: str, company: Empresa, role: str = "administrador") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo=email.split("@")[0],
        nombres="Usuario",
        apellidos="E2E",
        alias=email.split("@")[0],
        ruc="0102030405001",
        nacionalidad="Ecuatoriana",
        profesion="Arquitecto",
        ciudad="Cuenca",
        provincia="Azuay",
        canton="Cuenca",
        pais="Ecuador",
        movil="0999999999",
        acepta_politica_privacidad=True,
        rol=role,
        empresa_id=company.id,
        activo=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _client(db, current_user_ref: dict):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_current_active_user] = lambda: current_user_ref["user"]
    app.dependency_overrides[get_current_user] = lambda: current_user_ref["user"]
    return TestClient(app)


def _bootstrap_saas_catalog(db, superadmin: Usuario) -> dict[str, MarketplaceProduct]:
    license_service.ensure_default_catalog(db)
    bootstrap_system_marketplace_categories(db)
    products = bootstrap_system_marketplace_catalog(db)
    db.commit()

    assert all(product.seller_user_id == superadmin.id for product in products)
    return {product.slug: product for product in products}


def _activate_bank_transfer(client) -> dict:
    response = client.put(
        "/api/v1/marketplace/admin/payment-methods/bank_transfer",
        json={
            "is_active": True,
            "environment_mode": "manual",
            "bank_name": "Banco Mockup GiProy",
            "account_holder": "GiProy Network",
            "account_number": "000-1894-0001",
            "instructions": "Transferencia bancaria habilitada para compras comerciales disponibles.",
            "public_text": "Realiza la transferencia y reporta la referencia para validacion administrativa.",
            "support_email": "pagos@giproy.test",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["slug"] == "bank_transfer"
    assert payload["is_active"] is True
    assert payload["readiness_status"] == "production_ready"
    return payload


def _purchase_by_bank_transfer(client, *, product_id: int, reference: str) -> dict:
    draft_response = client.post(
        "/api/v1/marketplace/checkout/drafts",
        json={
            "items": [{"product_id": product_id, "quantity": 1}],
            "payment_method": "bank_transfer",
            "notes": f"Certificacion {reference}",
        },
    )
    assert draft_response.status_code == 200, draft_response.text
    draft = draft_response.json()

    submit_response = client.post(
        "/api/v1/marketplace/checkout/bank-transfer",
        json={
            "checkout_draft_id": draft["id"],
            "transfer_reference": reference,
            "transfer_date": date.today().isoformat(),
            "notes": f"Transferencia mock {reference}",
        },
    )
    assert submit_response.status_code == 200, submit_response.text
    return submit_response.json()


def test_marketplace_saas_policy_full_app_flow_with_mock_company(db):
    admin_company = _create_company(
        db,
        name="GiProy Sistema E2E SaaS",
        ruc="1891000000001",
        prefix="SYS1891",
    )
    buyer_company = _create_company(
        db,
        name="Empresa Mockup Politica SaaS E2E",
        ruc="1891000000002",
        prefix="MCK1891",
    )
    superadmin = _create_user(
        db,
        email="superadmin-task1891@giproy.test",
        company=admin_company,
        role="superadministrador",
    )
    buyer_admin = _create_user(
        db,
        email="buyer-task1891@giproy.test",
        company=buyer_company,
        role="administrador",
    )
    products_by_slug = _bootstrap_saas_catalog(db, superadmin)
    standard_license = products_by_slug["sistema-licencia-estandar-mensual"]
    conecta_pack = products_by_slug["sistema-conecta-transferencias"]

    current_user_ref = {"user": buyer_admin}
    try:
        with _client(db, current_user_ref) as client:
            license_catalog = client.get("/api/v1/marketplace/products?product_type=licencia&limit=100")
            assert license_catalog.status_code == 200, license_catalog.text
            license_slugs = {item["slug"] for item in license_catalog.json()}
            assert standard_license.slug in license_slugs

            addon_catalog = client.get("/api/v1/marketplace/products?product_type=addon&limit=100")
            assert addon_catalog.status_code == 200, addon_catalog.text
            addon_slugs = {item["slug"] for item in addon_catalog.json()}
            assert conecta_pack.slug in addon_slugs

            blocked_edit = client.put(
                f"/api/v1/marketplace/admin/products/{conecta_pack.id}",
                json={"precio": "9.00"},
            )
            assert blocked_edit.status_code == 403

            inactive_draft = client.post(
                "/api/v1/marketplace/checkout/drafts",
                json={
                    "items": [{"product_id": standard_license.id, "quantity": 1}],
                    "payment_method": "bank_transfer",
                },
            )
            assert inactive_draft.status_code == 400
            assert "no esta activa" in inactive_draft.text

            current_user_ref["user"] = superadmin
            _activate_bank_transfer(client)

            current_user_ref["user"] = buyer_admin
            payment_methods = client.get("/api/v1/marketplace/payment-methods")
            assert payment_methods.status_code == 200, payment_methods.text
            active_payment_slugs = {item["slug"] for item in payment_methods.json()}
            assert active_payment_slugs == {"bank_transfer"}

            license_order = _purchase_by_bank_transfer(
                client,
                product_id=standard_license.id,
                reference="TASK1891-LIC-STD",
            )
            assert license_order["status"] == "awaiting_manual_validation"

            current_user_ref["user"] = superadmin
            confirmed_license = client.post(
                f"/api/v1/marketplace/admin/orders/{license_order['id']}/confirm-bank-transfer",
                json={"admin_notes": "Validacion E2E TASK-1891 licencia base."},
            )
            assert confirmed_license.status_code == 200, confirmed_license.text
            assert confirmed_license.json()["status"] == "completed"
            assert confirmed_license.json()["items"][0]["delivered_entity_type"] == "empresa_licencia"
            assert (
                db.query(LicenseNotificationEvent)
                .filter(
                    LicenseNotificationEvent.notification_type == "purchase_formalized",
                    LicenseNotificationEvent.dedupe_key == f"marketplace-order:{license_order['id']}:purchase_formalized:email:user:{buyer_admin.id}",
                )
                .count()
                == 1
            )

            current_user_ref["user"] = buyer_admin
            company_license = client.get("/api/v1/admin-licenses/me")
            assert company_license.status_code == 200, company_license.text
            assert company_license.json()["licencia_actual"] == "Estándar"

            conecta_order = _purchase_by_bank_transfer(
                client,
                product_id=conecta_pack.id,
                reference="TASK1891-PACK-CONECTA",
            )
            assert conecta_order["status"] == "awaiting_manual_validation"

            current_user_ref["user"] = superadmin
            confirmed_conecta = client.post(
                f"/api/v1/marketplace/admin/orders/{conecta_order['id']}/confirm-bank-transfer",
                json={"admin_notes": "Validacion E2E TASK-1891 Pack Conecta."},
            )
            assert confirmed_conecta.status_code == 200, confirmed_conecta.text
            assert confirmed_conecta.json()["status"] == "completed"
            assert confirmed_conecta.json()["items"][0]["delivered_entity_type"] == "transfer_extra_recipient_pack"
            assert (
                db.query(LicenseNotificationEvent)
                .filter(
                    LicenseNotificationEvent.notification_type == "purchase_formalized",
                    LicenseNotificationEvent.dedupe_key == f"marketplace-order:{conecta_order['id']}:purchase_formalized:email:user:{buyer_admin.id}",
                )
                .count()
                == 1
            )

            admin_summary = client.get("/api/v1/admin-licenses/summary")
            assert admin_summary.status_code == 200, admin_summary.text
            company_row = next(
                item
                for item in admin_summary.json()["items"]
                if item["empresa_id"] == buyer_company.id
            )
            assert company_row["licencia_actual"] == "Estándar"
            assert company_row["saas_products_count"] == 1
            assert company_row["saas_products"][0]["right_code"] == "PACK_CONECTA"
            assert company_row["commercial_capabilities"]["capabilities"]["conecta"] is True

            admin_edit = client.put(
                f"/api/v1/marketplace/admin/products/{conecta_pack.id}",
                json={"precio": "8.00"},
            )
            assert admin_edit.status_code == 200, admin_edit.text

            current_user_ref["user"] = buyer_admin
            conecta_limits = client.get("/api/v1/conecta/limits")
            assert conecta_limits.status_code == 200, conecta_limits.text
            limits_payload = conecta_limits.json()
            assert limits_payload["empresa_id"] == buyer_company.id
            assert limits_payload["total_slots"] == 2
            assert limits_payload["base_slots"] == 1
            assert limits_payload["pack_slots"] == 1
            assert "PACK_CONECTA" in limits_payload["effective_right_codes"]

            slot_response = client.post(
                "/api/v1/conecta/slots",
                json={"invited_email": "colaborador-task1891@giproy.test"},
            )
            assert slot_response.status_code == 200, slot_response.text
            assert slot_response.json()["source_right_code"] in {"PACK_CONECTA", "LICENSE_CONECTA_BASE"}

            slots_response = client.get("/api/v1/conecta/slots")
            assert slots_response.status_code == 200, slots_response.text
            assert slots_response.json()["limits"]["used_slots"] == 1
            assert len(slots_response.json()["items"]) == 1

            current_user_ref["user"] = superadmin
            conecta_summary = client.get("/api/v1/conecta/admin/summary")
            assert conecta_summary.status_code == 200, conecta_summary.text
            conecta_company = next(
                item
                for item in conecta_summary.json()["companies"]
                if item["empresa_id"] == buyer_company.id
            )
            assert conecta_company["enabled"] is True
            assert conecta_company["total_slots"] == 2
            assert conecta_company["used_slots"] == 1
    finally:
        app.dependency_overrides.clear()

    assignment = (
        db.query(EmpresaLicencia)
        .filter(EmpresaLicencia.empresa_id == buyer_company.id, EmpresaLicencia.source == "marketplace_order")
        .one()
    )
    assert assignment.starts_at <= date.today()
    assert assignment.ends_at >= date.today() + timedelta(days=25)

    delivered_items = (
        db.query(MarketplaceOrderItem.delivered_entity_type)
        .join(MarketplaceOrderItem.order)
        .filter(MarketplaceOrderItem.product_id.in_([standard_license.id, conecta_pack.id]))
        .all()
    )
    assert {row[0] for row in delivered_items} >= {"empresa_licencia", "transfer_extra_recipient_pack"}

    events = {
        row[0]
        for row in (
            db.query(LicenseEvent.event_type)
            .filter(LicenseEvent.empresa_id == buyer_company.id)
            .all()
        )
    }
    assert "license_marketplace_purchase_activated" in events
    assert "transfer_conecta_pack_marketplace_activated" in events
    assert "saas_conecta_slot_assigned" in events
    assert db.query(SaasConectaSlot).filter(SaasConectaSlot.empresa_id == buyer_company.id).count() == 1
    bank_transfer_method = (
        db.query(MarketplacePaymentMethod)
        .filter(MarketplacePaymentMethod.slug == "bank_transfer")
        .one()
    )
    assert bank_transfer_method.is_active is True
    assert bank_transfer_method.readiness_status == "production_ready"
