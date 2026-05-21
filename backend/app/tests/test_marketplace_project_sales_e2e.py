from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.marketplace import MarketplaceAssetOrigin, MarketplaceProduct
from app.models.presupuesto import Presupuesto
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.marketplace import (
    MarketplaceCheckoutItemRequest,
    MarketplaceCheckoutRequest,
    MarketplaceProductUpdate,
    MarketplaceRefundRequest,
)
from app.services.marketplace import marketplace_service
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories
from app.services.marketplace_checkout import marketplace_checkout_service
from app.services.project_marketplace_exporter import project_marketplace_exporter


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


def _create_admin_user(db, *, email: str, company: Empresa, role: str = "administrador") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo="Usuario Marketplace",
        nombres="Usuario",
        apellidos="Marketplace",
        alias="marketplace",
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


def _create_project(db, *, company: Empresa, code: str, total: Decimal, public_procurement: bool = False) -> Proyecto:
    trace = {
        "origin": "public_procurement_import",
        "technical_validation_status": "valid",
        "empty_apus_count": 0,
        "source_filename": f"{code}.pdf",
        "source_reference": f"{code}.pdf",
        "pais": "Ecuador",
        "provincia": "Azuay",
        "canton": "Cuenca",
        "codigo_proceso": f"SERCOP-{code}",
        "export_readiness": {"can_export_marketplace": True},
    } if public_procurement else {}
    project = Proyecto(
        nombre=f"Proyecto {code}",
        codigo=code,
        codigo_root=code,
        revision=0,
        descripcion=f"Proyecto clasico {code}",
        estado="Planificación",
        presupuesto_estimado=total,
        moneda="USD",
        empresa_id=company.id,
        plantillas_config={"public_procurement_import": trace} if trace else {},
    )
    db.add(project)
    db.flush()
    db.add(
        Presupuesto(
            codigo=f"{code}-P01",
            descripcion=f"Presupuesto {code}",
            proyecto_id=project.id,
            empresa_id=company.id,
            subtotal=total,
            total=total,
            moneda="USD",
        )
    )
    db.commit()
    db.refresh(project)
    return project


def _approve_product(db, *, product_id: int, superadmin: Usuario) -> MarketplaceProduct:
    product = marketplace_service.update_admin_product(
        db,
        product_id,
        MarketplaceProductUpdate(activo=True),
        superadmin,
    )
    assert product.estado == "approved"
    assert product.activo is True
    assert product.approved_by_user_id == superadmin.id
    return product


def _checkout_one(db, *, buyer: Usuario, product: MarketplaceProduct):
    return marketplace_checkout_service.checkout(
        db,
        MarketplaceCheckoutRequest(
            items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=1)],
            notes="Compra E2E Marketplace",
        ),
        buyer,
    )


def test_marketplace_project_sale_full_lifecycle_with_refund_and_withdrawal(db):
    bootstrap_system_marketplace_categories(db)
    seller_company = _create_company(db, name="Empresa Vendedora E2E", prefix="SELL", seq=101)
    buyer_company = _create_company(db, name="Empresa Compradora E2E", prefix="BUY", seq=202)
    admin_company = _create_company(db, name="Administradores Generales", prefix="ADM", seq=303)
    seller = _create_admin_user(db, email="seller-e2e@giproy.test", company=seller_company)
    buyer = _create_admin_user(db, email="buyer-e2e@giproy.test", company=buyer_company)
    superadmin = _create_admin_user(
        db,
        email="superadmin-e2e@giproy.test",
        company=admin_company,
        role="superadministrador",
    )
    project = _create_project(db, company=seller_company, code="SELL-E2E", total=Decimal("1250.00"))

    export_result = project_marketplace_exporter.export_project(
        db,
        project_id=project.id,
        empresa_id=seller_company.id,
        current_user=seller,
        overrides={"product_meta": {"precio_con_iva": "29.99"}},
    )
    product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == export_result["product_id"]).one()
    assert product.estado == "pending"
    assert product.activo is False

    status_map = project_marketplace_exporter.list_project_export_statuses(
        db,
        empresa_id=seller_company.id,
        current_user=seller,
    )
    assert status_map["projects"][str(project.id)]["can_edit"] is True

    product = _approve_product(db, product_id=product.id, superadmin=superadmin)
    with pytest.raises(HTTPException) as republish_error:
        project_marketplace_exporter.export_project(
            db,
            project_id=project.id,
            empresa_id=seller_company.id,
            current_user=seller,
        )
    assert republish_error.value.status_code == 409
    assert "ya fue publicado" in republish_error.value.detail

    order = _checkout_one(db, buyer=buyer, product=product)
    assert order.status == "completed"
    assert order.items[0].delivered_entity_type == "proyecto"
    cloned_project = db.query(Proyecto).filter(Proyecto.id == order.items[0].delivered_entity_id).one()
    assert cloned_project.empresa_id == buyer_company.id
    assert cloned_project.id != project.id
    origin = (
        db.query(MarketplaceAssetOrigin)
        .filter(
            MarketplaceAssetOrigin.empresa_id == buyer_company.id,
            MarketplaceAssetOrigin.entity_type == "proyecto",
            MarketplaceAssetOrigin.entity_id == cloned_project.id,
        )
        .one()
    )
    assert origin.ownership_kind == "acquired"
    assert origin.marketplace_order_id == order.id

    db.refresh(product)
    assert product.ventas_count == 1
    seller_stats = marketplace_service.get_seller_stats(db, seller)
    assert seller_stats["sales_count"] == 1
    assert seller_stats["net_income"] == Decimal("23.99")

    refunded = marketplace_checkout_service.request_order_refund(
        db,
        order.id,
        MarketplaceRefundRequest(reason="Validacion E2E de devolucion automatica."),
        buyer,
    )
    assert refunded.status == "refunded"
    refunded_sales = marketplace_service.list_seller_sales(db, seller)
    assert refunded_sales[0]["is_refunded"] is True
    assert refunded_sales[0]["net_amount"] == Decimal("0.00")
    seller_stats = marketplace_service.get_seller_stats(db, seller)
    assert seller_stats["sales_count"] == 0
    assert seller_stats["refunded_sales_count"] == 1
    assert seller_stats["refunded_amount"] == Decimal("29.99")
    assert marketplace_checkout_service.list_buyer_library(db, buyer) == []

    marketplace_service.delete_seller_product(db, product.id, seller)
    db.refresh(product)
    assert product.estado == "cancelled"
    assert product.activo is False
    assert product.vista_previa["sales_policy"]["seller_withdrawn"] is True
    with pytest.raises(HTTPException) as unavailable:
        _checkout_one(db, buyer=buyer, product=product)
    assert unavailable.value.status_code == 400


def test_marketplace_public_procurement_export_purchase_clones_source_project(db):
    bootstrap_system_marketplace_categories(db)
    admin_company = _create_company(db, name="Administradores Generales", prefix="ADM2", seq=404)
    buyer_company = _create_company(db, name="Compradora Portal E2E", prefix="PORTBUY", seq=505)
    superadmin = _create_admin_user(
        db,
        email="superadmin-portal-e2e@giproy.test",
        company=admin_company,
        role="superadministrador",
    )
    buyer = _create_admin_user(db, email="buyer-portal-e2e@giproy.test", company=buyer_company)
    source_project = _create_project(
        db,
        company=admin_company,
        code="PORT-E2E",
        total=Decimal("98000.00"),
        public_procurement=True,
    )

    preview = project_marketplace_exporter.preview_project_export(
        db,
        project_id=source_project.id,
        empresa_id=admin_company.id,
        current_user=superadmin,
        requested_product_type="portal_compras_publicas",
    )
    assert preview["can_choose_product_type"] is True
    assert preview["product_type"] == "portal_compras_publicas"

    export_result = project_marketplace_exporter.export_project(
        db,
        project_id=source_project.id,
        empresa_id=admin_company.id,
        current_user=superadmin,
        requested_product_type="portal_compras_publicas",
    )
    portal_product = _approve_product(db, product_id=export_result["product_id"], superadmin=superadmin)
    assert portal_product.product_type == "portal_compras_publicas"
    assert portal_product.product_kind == "manual"
    assert portal_product.vista_previa["portal_meta"]["project_delivery_policy"]["source_project_id"] == source_project.id

    order = _checkout_one(db, buyer=buyer, product=portal_product)
    assert order.status == "completed"
    assert order.items[0].product_type_snapshot == "portal_compras_publicas"
    assert order.items[0].delivered_entity_type == "proyecto"
    cloned_project = db.query(Proyecto).filter(Proyecto.id == order.items[0].delivered_entity_id).one()
    assert cloned_project.empresa_id == buyer_company.id
    assert cloned_project.nombre == source_project.nombre
    assert cloned_project.plantillas_config["marketplace_delivery"]["product_type"] == "portal_compras_publicas"

    with pytest.raises(HTTPException) as republish_error:
        project_marketplace_exporter.export_project(
            db,
            project_id=source_project.id,
            empresa_id=admin_company.id,
            current_user=superadmin,
            requested_product_type="portal_compras_publicas",
        )
    assert republish_error.value.status_code == 409
