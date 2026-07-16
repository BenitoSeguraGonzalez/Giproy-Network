from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.marketplace import (
    MarketplaceCheckoutDraft,
    MarketplaceOrder,
    MarketplaceOrderItem,
    MarketplaceProduct,
    MarketplaceProductCategory,
)
from app.models.usuario import Usuario
from app.schemas.marketplace import (
    MarketplaceCheckoutDraftCreate,
    MarketplaceCheckoutItemRequest,
    MarketplaceCheckoutRequest,
    MarketplaceProductCreate,
    MarketplaceProductUpdate,
    MarketplaceRefundRequest,
)
from app.services.marketplace import marketplace_service
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories
from app.services.marketplace_checkout import marketplace_checkout_service


def _create_company(db, *, name: str, prefix: str, seq: int = 1) -> Empresa:
    company = Empresa(
        nombre=name,
        ruc=f"{seq:013d}",
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
        nombre_completo="Usuario Test",
        nombres="Usuario",
        apellidos="Test",
        alias="test",
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


def _create_simple_product(
    db, *, superadmin: Usuario, title: str = "Producto Test", price: Decimal = Decimal("49.99")
) -> MarketplaceProduct:
    product = marketplace_service.create_admin_product(
        db,
        MarketplaceProductCreate(
            titulo=title,
            descripcion="Descripcion test",
            product_type="apu",
            product_kind="manual",
            precio=price,
            moneda="USD",
            product_meta={
                "fecha_inicio_publicacion": "2026-01-01",
                "fecha_fin_publicacion": "2027-12-31",
                "descripcion_corta": "Descripcion corta para activacion",
                "descripcion_larga": "Descripcion larga para activacion del producto",
                "descripcion_completa": "Descripcion completa para activacion del producto en el marketplace",
            },
        ),
        superadmin,
    )
    fixed_category = (
        db.query(MarketplaceProductCategory)
        .filter(MarketplaceProductCategory.slug == "tienda-apus")
        .first()
    )
    if fixed_category:
        product.category_id = fixed_category.id
    product = marketplace_service.update_admin_product(
        db,
        product.id,
        MarketplaceProductUpdate(activo=True),
        superadmin,
    )
    assert product.estado == "approved"
    assert product.activo is True
    return product


class TestMarketplaceCheckoutDraft:
    def test_create_and_list_drafts(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=601)
        seller_company = _create_company(db, name="Vendedora", prefix="SEL", seq=602)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=603)
        buyer = _create_user(db, email="buyer-draft@test.test", company=company)
        seller = _create_user(db, email="seller-draft@test.test", company=seller_company)
        superadmin = _create_user(
            db, email="superadmin-draft@test.test", company=admin_company, role="superadministrador"
        )
        product = _create_simple_product(db, superadmin=superadmin)

        draft = marketplace_checkout_service.create_checkout_draft(
            db,
            MarketplaceCheckoutDraftCreate(
                items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
                notes="Draft test",
            ),
            buyer,
        )
        assert draft.id is not None
        assert draft.user_id == buyer.id
        assert draft.status == "open"
        assert draft.snapshot_json is not None
        assert len(draft.snapshot_json.get("items") or []) == 1

        drafts = marketplace_checkout_service.list_own_checkout_drafts(db, buyer)
        draft_ids = [d.id for d in drafts]
        assert draft.id in draft_ids

    def test_create_draft_with_invalid_product(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=604)
        buyer = _create_user(db, email="buyer-draft-invalid@test.test", company=company)

        with pytest.raises(HTTPException) as exc:
            marketplace_checkout_service.create_checkout_draft(
                db,
                MarketplaceCheckoutDraftCreate(
                    items=[MarketplaceCheckoutItemRequest(product_id=99999, quantity=1)],
                ),
                buyer,
            )
        assert exc.value.status_code == 400

    def test_create_draft_empty_items(self, db):
        company = _create_company(db, name="Compradora", prefix="CMP", seq=605)
        buyer = _create_user(db, email="buyer-draft-empty@test.test", company=company)

        with pytest.raises(HTTPException) as exc:
            marketplace_checkout_service.create_checkout_draft(
                db,
                MarketplaceCheckoutDraftCreate(items=[]),
                buyer,
            )
        assert exc.value.status_code == 400


class TestMarketplaceCheckoutFlow:
    def test_checkout_direct_success(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=606)
        seller_company = _create_company(db, name="Vendedora", prefix="SEL", seq=607)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=608)
        buyer = _create_user(db, email="buyer-direct@test.test", company=company)
        seller = _create_user(db, email="seller-direct@test.test", company=seller_company)
        superadmin = _create_user(
            db, email="superadmin-direct@test.test", company=admin_company, role="superadministrador"
        )
        product = _create_simple_product(db, superadmin=superadmin)

        order = marketplace_checkout_service.checkout(
            db,
            MarketplaceCheckoutRequest(
                items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
                notes="Compra directa test",
            ),
            buyer,
        )
        assert order.id is not None
        assert order.buyer_user_id == buyer.id
        assert order.status == "completed"
        assert len(order.items) == 1
        assert order.items[0].product_id == product.id
        assert order.items[0].price == Decimal("49.99")

        db.refresh(product)
        assert product.ventas_count == 1

    def test_checkout_requires_at_least_one_item(self, db):
        company = _create_company(db, name="Compradora", prefix="CMP", seq=609)
        buyer = _create_user(db, email="buyer-no-items@test.test", company=company)

        with pytest.raises(HTTPException) as exc:
            marketplace_checkout_service.checkout(
                db,
                MarketplaceCheckoutRequest(items=[]),
                buyer,
            )
        assert exc.value.status_code == 400

    def test_checkout_inactive_product_fails(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=610)
        seller_company = _create_company(db, name="Vendedora", prefix="SEL", seq=611)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=612)
        buyer = _create_user(db, email="buyer-inactive@test.test", company=company)
        seller = _create_user(db, email="seller-inactive@test.test", company=seller_company)
        superadmin = _create_user(
            db, email="superadmin-inactive@test.test", company=admin_company, role="superadministrador"
        )

        product = _create_simple_product(db, superadmin=superadmin)
        product.activo = False
        db.add(product)
        db.commit()

        with pytest.raises(HTTPException) as exc:
            marketplace_checkout_service.checkout(
                db,
                MarketplaceCheckoutRequest(
                    items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
                ),
                buyer,
            )
        assert exc.value.status_code == 400


class TestMarketplaceRefund:
    def test_refund_own_order(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=616)
        seller_company = _create_company(db, name="Vendedora", prefix="SEL", seq=617)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=618)
        buyer = _create_user(db, email="buyer-refund@test.test", company=company)
        seller = _create_user(db, email="seller-refund@test.test", company=seller_company)
        superadmin = _create_user(
            db, email="superadmin-refund@test.test", company=admin_company, role="superadministrador"
        )
        product = _create_simple_product(db, superadmin=superadmin)

        order = marketplace_checkout_service.checkout(
            db,
            MarketplaceCheckoutRequest(
                items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
            ),
            buyer,
        )
        assert order.status == "completed"

        refunded = marketplace_checkout_service.request_order_refund(
            db,
            order.id,
            MarketplaceRefundRequest(reason="Test refund"),
            buyer,
        )
        assert refunded.status == "refunded"
        assert refunded.id == order.id

    def test_refund_non_buyer_fails(self, db):
        bootstrap_system_marketplace_categories(db)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=619)
        seller_company = _create_company(db, name="Vendedora", prefix="SEL", seq=620)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=621)
        buyer = _create_user(db, email="buyer-other@test.test", company=company)
        other = _create_user(db, email="other-user@test.test", company=company)
        seller = _create_user(db, email="seller-other@test.test", company=seller_company)
        superadmin = _create_user(
            db, email="superadmin-other@test.test", company=admin_company, role="superadministrador"
        )
        product = _create_simple_product(db, superadmin=superadmin)

        order = marketplace_checkout_service.checkout(
            db,
            MarketplaceCheckoutRequest(
                items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
            ),
            buyer,
        )

        with pytest.raises(HTTPException) as exc:
            marketplace_checkout_service.request_order_refund(
                db,
                order.id,
                MarketplaceRefundRequest(reason="Other user refund"),
                other,
            )
        assert exc.value.status_code in (403, 404)


class TestMarketplaceOrderDetail:
    def test_order_returned_from_checkout_has_items(self, db):
        bootstrap_system_marketplace_categories(db)
        admin_company = _create_company(db, name="Admin", prefix="ADM", seq=622)
        company = _create_company(db, name="Compradora", prefix="CMP", seq=623)
        superadmin = _create_user(
            db, email="superadmin-returned@test.test", company=admin_company, role="superadministrador"
        )
        buyer = _create_user(db, email="buyer-returned@test.test", company=company)
        product = _create_simple_product(db, superadmin=superadmin)

        order = marketplace_checkout_service.checkout(
            db,
            MarketplaceCheckoutRequest(
                items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
            ),
            buyer,
        )

        assert order.id is not None
        assert order.buyer_user_id == buyer.id
        assert order.status == "completed"
        assert len(order.items) == 1
        assert order.items[0].product_id == product.id
        assert order.items[0].price == Decimal("49.99")
