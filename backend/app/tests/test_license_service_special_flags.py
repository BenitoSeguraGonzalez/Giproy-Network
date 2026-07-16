from datetime import date, datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from app.models.empresa import Empresa
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa_licencia import EmpresaLicencia
from app.models.license_event import LicenseEvent
from app.models.licencia import Licencia
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderItem, MarketplaceProduct
from app.models.usuario import Usuario
from app.services.commercial_capabilities import commercial_capabilities_service
from app.services.license import license_service
from app.services.marketplace_checkout import marketplace_checkout_service


def _assign_license(
    db,
    empresa,
    *,
    limites,
    nombre="Academy",
    codigo="ACADEMY",
    plan_kind=None,
):
    licencia = Licencia(
        nombre=nombre,
        codigo=codigo,
        descripcion="Licencia especial de prueba",
        limites=limites,
        es_especial=True,
        activo=True,
        plan_kind=plan_kind,
    )
    db.add(licencia)
    db.flush()

    assignment = EmpresaLicencia(
        empresa_id=empresa.id,
        licencia_id=licencia.id,
        starts_at=date.today() - timedelta(days=1),
        ends_at=date.today() + timedelta(days=30),
        activa=True,
    )
    db.add(assignment)
    db.commit()
    return licencia


def test_get_company_special_flags_defaults_to_commercial(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={"usuarios": 5, "proyectos": 10, "almacenamiento_gb": 5},
        nombre="Profesional",
        codigo="PRO",
    )

    flags = license_service.get_company_special_flags(db, sample_empresa.id)

    assert flags == {
        "is_tester": False,
        "is_academic": False,
        "is_training": False,
        "is_commercial": True,
    }


def test_commercial_capabilities_standard_keeps_optional_packs_off_by_default(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        nombre="Estandar",
        codigo="STANDARD-CAP",
        limites={
            "usuarios": 5,
            "proyectos": -1,
            "almacenamiento_gb": 500,
            "modulos_permitidos": ["apus", "presupuestos"],
            "packs_opcionales": ["PACK_PLANIFICA", "PACK_LICITA", "PACK_CONECTA"],
            "conecta_base_slots": 1,
            "watermark_reports": False,
            "excel_exports": True,
        },
    )

    state = commercial_capabilities_service.resolve_company_capabilities(db, sample_empresa.id)
    capabilities = state["capabilities"]

    assert capabilities["apus"] is True
    assert capabilities["presupuestos"] is True
    assert capabilities["cronogramas"] is False
    assert capabilities["formula_polinomica"] is False
    assert capabilities["desagregacion"] is False
    assert capabilities["licitaciones"] is False
    assert capabilities["conecta"] is True
    assert capabilities["equipo"] is False
    assert capabilities["excel_exports"] is True
    assert capabilities["watermark_reports"] is False
    assert state["effective_right_codes"] == []


def test_commercial_capabilities_professional_includes_planifica_and_licita(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        nombre="Profesional",
        codigo="PRO-CAP",
        limites={
            "usuarios": 15,
            "proyectos": -1,
            "almacenamiento_gb": 500,
            "modulos_permitidos": ["*"],
            "packs_incluidos": ["PACK_PLANIFICA", "PACK_LICITA"],
            "packs_opcionales": ["PACK_CONECTA", "PACK_EQUIPO"],
            "conecta_base_slots": 2,
            "team_pack_available": True,
            "watermark_reports": False,
            "excel_exports": True,
        },
    )

    state = commercial_capabilities_service.resolve_company_capabilities(db, sample_empresa.id)
    capabilities = state["capabilities"]

    assert capabilities["cronogramas"] is True
    assert capabilities["formula_polinomica"] is True
    assert capabilities["desagregacion"] is True
    assert capabilities["licitaciones"] is True
    assert capabilities["conecta"] is True
    assert capabilities["equipo"] is False
    assert capabilities["equipo_available_for_purchase"] is True
    assert state["included_right_codes"] == ["PACK_LICITA", "PACK_PLANIFICA"]
    assert state["purchased_right_codes"] == []


@pytest.mark.parametrize(
    ("plan_kind", "flags"),
    [
        ("empresarial", {}),
        ("tester", {"is_tester": True}),
        ("academic", {"is_academic": True, "is_commercial": False}),
        ("training", {"is_training": True, "is_commercial": False}),
    ],
)
def test_bim_is_included_for_authorized_license_families(
    db,
    sample_empresa,
    plan_kind,
    flags,
):
    _assign_license(
        db,
        sample_empresa,
        nombre=f"BIM {plan_kind}",
        codigo=f"BIM-{plan_kind}",
        plan_kind=plan_kind,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "modulos_permitidos": ["*"],
            **flags,
        },
    )

    state = commercial_capabilities_service.resolve_company_capabilities(
        db,
        sample_empresa.id,
    )

    assert state["capabilities"]["bim"] is True
    assert state["bim_entitlement"] == {
        "included_by_license": True,
        "purchased": False,
        "source": "license",
    }


def test_bim_pack_requires_standard_or_professional_base_plan(db, sample_empresa):
    product = MarketplaceProduct(
        titulo="Módulo BIM Mensual",
        slug="bim-monthly-plan-check",
        product_type="addon",
        product_kind="manual",
        precio=99.99,
        moneda="USD",
        estado="approved",
        activo=True,
        vista_previa={
            "product_meta": {
                "commercial_code": "PACK_BIM_MONTHLY",
                "requires_base_plan": ["STANDARD", "PROFESSIONAL"],
                "delivery_kind": "saas_right",
            }
        },
    )
    with pytest.raises(HTTPException) as exc_info:
        marketplace_checkout_service._validate_product_base_plan(
            db,
            product,
            sample_empresa.id,
        )
    assert exc_info.value.status_code == 403

    standard = db.query(Licencia).filter(Licencia.codigo == "STANDARD").one()
    license_service.assign_license_to_company(
        db,
        empresa_id=sample_empresa.id,
        licencia_id=standard.id,
        months=1,
        force_immediate=True,
        source="test",
    )

    marketplace_checkout_service._validate_product_base_plan(
        db,
        product,
        sample_empresa.id,
    )


def test_bim_marketplace_purchase_grants_capability_to_standard(db, sample_empresa):
    buyer = Usuario(
        email="buyer-bim-right@test.local",
        hashed_password="x",
        nombre_completo="Buyer BIM",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller-bim-right@test.local",
        hashed_password="x",
        nombre_completo="Seller BIM",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()
    standard = _assign_license(
        db,
        sample_empresa,
        nombre="Estándar compra BIM",
        codigo="STANDARD-BIM-PURCHASE",
        plan_kind="estandar",
        limites={
            "usuarios": 5,
            "modulos_permitidos": ["apus", "presupuestos"],
        },
    )
    assert standard.plan_kind == "estandar"

    product = MarketplaceProduct(
        titulo="Módulo BIM Mensual",
        slug="bim-monthly-right-test",
        product_type="addon",
        product_kind="manual",
        precio=99.99,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={
            "product_meta": {
                "commercial_code": "PACK_BIM_MONTHLY",
                "billing_period": "monthly",
                "duration_months": 1,
                "requires_base_plan": ["STANDARD", "PROFESSIONAL"],
                "delivery_kind": "saas_right",
                "activation_policy": "marketplace_order_confirmed",
            }
        },
    )
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total=99.99,
        commission_amount=20,
        seller_amount=79.99,
        currency="USD",
        status="completed",
        created_at=datetime.now(timezone.utc),
    )
    db.add_all([product, order])
    db.flush()
    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=seller.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        source_type_snapshot=product.source_type,
        source_id_snapshot=product.source_id,
        price=product.precio,
    )
    db.add(item)
    db.flush()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=order.id,
        marketplace_order_item_id=item.id,
    )
    item.delivered_entity_type = delivered_type
    item.delivered_entity_id = delivered_id
    db.add(item)
    db.flush()

    state = commercial_capabilities_service.resolve_company_capabilities(
        db,
        sample_empresa.id,
    )

    assert delivered_type == "saas_right"
    assert "PACK_BIM" in state["purchased_right_codes"]
    assert state["capabilities"]["bim"] is True
    assert state["bim_entitlement"]["source"] == "marketplace"


def test_get_company_special_flags_reads_special_license_flags(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_tester": True,
            "is_academic": True,
            "is_commercial": False,
        },
        nombre="Campus",
        codigo="CAMPUS",
    )

    flags = license_service.get_company_special_flags(db, sample_empresa.id)

    assert flags["is_tester"] is True
    assert flags["is_academic"] is True
    assert flags["is_training"] is False
    assert flags["is_commercial"] is False
    assert license_service.can_use_experimental_features(db, sample_empresa.id) is True


def test_ensure_commercial_exports_allowed_blocks_non_commercial_license(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_training": True,
        },
    )

    with pytest.raises(HTTPException) as exc_info:
        license_service.ensure_commercial_exports_allowed(db, sample_empresa.id)

    assert exc_info.value.status_code == 403
    assert "no permite exportaciones comerciales" in exc_info.value.detail


def test_run_periodic_cleanup_resets_training_company_operational_state(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 20,
            "proyectos": 50,
            "almacenamiento_gb": 10,
            "is_training": True,
            "is_commercial": False,
            "reset_periodical": True,
        },
    )

    user = Usuario(
        email="academy@test.local",
        hashed_password="x",
        nombre_completo="Academy User",
        rol="usuario",
        activo=True,
        empresa_id=sample_empresa.id,
        current_session_id="session-1",
        current_session_device_id="device-1",
    )
    base = BaseTrabajo(
        codigo_unico="BT-2026-001",
        nombre="Base Academy",
        tipo="Base Maestra",
        empresa_id=sample_empresa.id,
        activa=True,
    )
    db.add_all([user, base])
    db.commit()

    result = license_service.run_periodic_cleanup(db, sample_empresa.id)

    db.refresh(user)
    db.refresh(base)

    assert result["empresa_id"] == sample_empresa.id
    assert result["active_bases_cleared"] == 1
    assert result["active_sessions_cleared"] == 1
    assert result["usage_recalculated"] is True
    assert user.current_session_id is None
    assert user.current_session_device_id is None
    assert base.activa is False


def test_run_periodic_cleanup_rejects_non_training_license(db, sample_empresa):
    _assign_license(
        db,
        sample_empresa,
        limites={
            "usuarios": 5,
            "proyectos": 10,
            "almacenamiento_gb": 5,
            "is_academic": True,
            "is_commercial": False,
        },
        nombre="Campus",
        codigo="CAMPUS",
    )

    with pytest.raises(HTTPException) as exc_info:
        license_service.run_periodic_cleanup(db, sample_empresa.id)

    assert exc_info.value.status_code == 400
    assert "limpieza periódica" in exc_info.value.detail


def test_run_license_housekeeping_for_all_companies_aggregates_changes(db, sample_empresa):
    second_empresa = Empresa(
        nombre="Empresa Dos",
        ruc="1234567890002",
        proy_prefijo="DOS",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3,
    )
    db.add(second_empresa)
    db.flush()

    professional = Licencia(
        nombre="Profesional",
        codigo="PRO-HK",
        descripcion="Licencia SaaS Profesional",
        limites={"usuarios": 15, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="profesional",
    )
    enterprise = Licencia(
        nombre="Empresarial",
        codigo="ENT-HK",
        descripcion="Licencia SaaS Empresarial",
        limites={"usuarios": -1, "proyectos": -1, "almacenamiento_gb": 500},
        activo=True,
        plan_kind="empresarial",
    )
    db.add_all([professional, enterprise])
    db.flush()

    expired_active = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=professional.id,
        starts_at=date.today() - timedelta(days=40),
        ends_at=date.today() - timedelta(days=1),
        status="active",
        activa=True,
    )
    queued_due = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=enterprise.id,
        starts_at=date.today(),
        ends_at=date.today() + timedelta(days=30),
        status="queued",
        activa=True,
    )
    db.add_all([expired_active, queued_due])
    db.commit()

    result = license_service.run_license_housekeeping_for_all_companies(db)

    db.refresh(expired_active)
    db.refresh(queued_due)

    assert result["totals"]["companies_processed"] >= 2
    assert result["totals"]["companies_changed"] == 1
    assert result["totals"]["expired"] == 1
    assert result["totals"]["activated"] == 1
    assert expired_active.status == "expired"
    assert queued_due.status == "active"


def test_run_license_housekeeping_for_all_companies_reports_zero_changes_cleanly(db, sample_empresa):
    result = license_service.run_license_housekeeping_for_all_companies(db)

    assert result["totals"]["companies_processed"] >= 1
    assert result["totals"]["companies_changed"] == 0
    assert result["totals"]["expired"] == 0
    assert result["totals"]["activated"] == 0
    assert result["items"] == []


def test_marketplace_license_product_creates_company_assignment(db, sample_empresa):
    buyer = Usuario(
        email="buyer@test.local",
        hashed_password="x",
        nombre_completo="Buyer User",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller@test.local",
        hashed_password="x",
        nombre_completo="Seller User",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    professional = Licencia(
        nombre="Profesional",
        codigo="PRO-MKT",
        descripcion="Licencia profesional comercial",
        limites={"usuarios": 15, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="profesional",
    )
    db.add(professional)
    db.flush()

    product = MarketplaceProduct(
        titulo="Licencia Profesional Mensual",
        slug="licencia-profesional-mensual-test",
        product_type="licencia",
        product_kind="manual",
        precio=69.99,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={
            "product_meta": {
                "license_offer": {
                    "plan_kind": "profesional",
                    "billing_cycle": "monthly",
                    "duration_months": 1,
                }
            }
        },
    )
    db.add(product)
    db.commit()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(db, product, buyer, None)
    db.refresh(sample_empresa)

    assert delivered_type == "empresa_licencia"
    assert delivered_id is not None

    assignment = db.query(EmpresaLicencia).filter(EmpresaLicencia.id == delivered_id).first()
    assert assignment is not None
    assert assignment.empresa_id == sample_empresa.id
    assert assignment.licencia_id == professional.id
    assert assignment.source == "marketplace_order"


def test_marketplace_license_delivery_is_idempotent_by_order_item(db, sample_empresa):
    buyer = Usuario(
        email="buyer-idempotent@test.local",
        hashed_password="x",
        nombre_completo="Buyer Idempotent",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller-idempotent@test.local",
        hashed_password="x",
        nombre_completo="Seller Idempotent",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    standard = Licencia(
        nombre="Estandar",
        codigo="STANDARD-IDEM",
        descripcion="Licencia estandar comercial",
        limites={"usuarios": 5, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="estandar",
    )
    db.add(standard)
    db.flush()

    product = MarketplaceProduct(
        titulo="Licencia Estandar Mensual",
        slug="licencia-estandar-mensual-idempotent-test",
        product_type="licencia",
        product_kind="manual",
        precio=25,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={
            "product_meta": {
                "commercial_code": "STANDARD_MONTHLY",
                "license_offer": {
                    "plan_kind": "estandar",
                    "billing_cycle": "monthly",
                    "duration_months": 1,
                },
            }
        },
    )
    db.add(product)
    db.flush()

    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total=25,
        commission_amount=5,
        seller_amount=20,
        currency="USD",
        status="completed",
    )
    db.add(order)
    db.flush()
    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=seller.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        source_type_snapshot=product.source_type,
        source_id_snapshot=product.source_id,
        price=product.precio,
    )
    db.add(item)
    db.flush()

    first_type, first_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=order.id,
        marketplace_order_item_id=item.id,
    )
    second_type, second_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=order.id,
        marketplace_order_item_id=item.id,
    )

    assignments = (
        db.query(EmpresaLicencia)
        .filter(EmpresaLicencia.empresa_id == sample_empresa.id, EmpresaLicencia.source == "marketplace_order")
        .all()
    )
    events = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_id == sample_empresa.id,
            LicenseEvent.event_type == "license_marketplace_purchase_activated",
        )
        .all()
    )

    assert first_type == "empresa_licencia"
    assert second_type == "empresa_licencia"
    assert first_id == second_id
    assert len(assignments) == 1
    assert assignments[0].detalles["marketplace_delivery"]["marketplace_order_item_id"] == item.id
    assert assignments[0].detalles["marketplace_delivery"]["marketplace_order_id"] == order.id
    assert len(events) == 1


def test_marketplace_license_upgrade_from_express_activates_immediately(db, sample_empresa):
    buyer = Usuario(
        email="buyer-upgrade@test.local",
        hashed_password="x",
        nombre_completo="Buyer Upgrade",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller-upgrade@test.local",
        hashed_password="x",
        nombre_completo="Seller Upgrade",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    express = Licencia(
        nombre="Express",
        codigo="EXPRESS-UP",
        descripcion="Trial Express",
        limites={"usuarios": 1, "proyectos": 1, "almacenamiento_gb": 0.05},
        activo=True,
        plan_kind="express",
        is_default_express=True,
    )
    standard = Licencia(
        nombre="Estandar",
        codigo="STANDARD-UP",
        descripcion="Licencia estandar comercial",
        limites={"usuarios": 5, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="estandar",
    )
    db.add_all([express, standard])
    db.flush()

    current = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=express.id,
        starts_at=date.today() - timedelta(days=1),
        ends_at=date.today() + timedelta(days=29),
        status="active",
        activa=True,
    )
    product = MarketplaceProduct(
        titulo="Licencia Estandar Mensual Upgrade",
        slug="licencia-estandar-upgrade-test",
        product_type="licencia",
        product_kind="manual",
        precio=25,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={"product_meta": {"license_offer": {"plan_kind": "estandar", "duration_months": 1}}},
    )
    db.add_all([current, product])
    db.flush()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=101,
        marketplace_order_item_id=1001,
    )
    db.refresh(current)
    assignment = db.query(EmpresaLicencia).filter(EmpresaLicencia.id == delivered_id).first()

    assert delivered_type == "empresa_licencia"
    assert current.status == "cancelled"
    assert current.activa is False
    assert assignment.status == "active"
    assert assignment.starts_at == date.today()
    assert assignment.detalles["marketplace_delivery"]["transition_kind"] == "upgrade_immediate"


def test_marketplace_license_downgrade_is_queued_for_next_period(db, sample_empresa):
    buyer = Usuario(
        email="buyer-downgrade@test.local",
        hashed_password="x",
        nombre_completo="Buyer Downgrade",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller-downgrade@test.local",
        hashed_password="x",
        nombre_completo="Seller Downgrade",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    professional = Licencia(
        nombre="Profesional",
        codigo="PRO-DOWN",
        descripcion="Licencia profesional comercial",
        limites={"usuarios": 15, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="profesional",
    )
    standard = Licencia(
        nombre="Estandar",
        codigo="STANDARD-DOWN",
        descripcion="Licencia estandar comercial",
        limites={"usuarios": 5, "proyectos": 100, "almacenamiento_gb": 80},
        activo=True,
        plan_kind="estandar",
    )
    db.add_all([professional, standard])
    db.flush()

    current_end = date.today() + timedelta(days=30)
    current = EmpresaLicencia(
        empresa_id=sample_empresa.id,
        licencia_id=professional.id,
        starts_at=date.today() - timedelta(days=1),
        ends_at=current_end,
        status="active",
        activa=True,
    )
    product = MarketplaceProduct(
        titulo="Licencia Estandar Mensual Downgrade",
        slug="licencia-estandar-downgrade-test",
        product_type="licencia",
        product_kind="manual",
        precio=25,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={"product_meta": {"license_offer": {"plan_kind": "estandar", "duration_months": 1}}},
    )
    db.add_all([current, product])
    db.flush()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=102,
        marketplace_order_item_id=1002,
    )
    db.refresh(current)
    assignment = db.query(EmpresaLicencia).filter(EmpresaLicencia.id == delivered_id).first()

    assert delivered_type == "empresa_licencia"
    assert current.status == "active"
    assert current.activa is True
    assert assignment.status == "queued"
    assert assignment.starts_at == current_end + timedelta(days=1)
    assert assignment.detalles["marketplace_delivery"]["transition_kind"] == "downgrade_queued"


def test_marketplace_saas_right_product_is_visible_in_company_admin_summary(db, sample_empresa):
    buyer = Usuario(
        email="buyer-saas-right@test.local",
        hashed_password="x",
        nombre_completo="Buyer SaaS Right",
        rol="administrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    seller = Usuario(
        email="seller-saas-right@test.local",
        hashed_password="x",
        nombre_completo="Seller SaaS Right",
        rol="superadministrador",
        activo=True,
        empresa_id=sample_empresa.id,
    )
    db.add_all([buyer, seller])
    db.flush()

    product = MarketplaceProduct(
        titulo="Pack Planifica Mensual",
        slug="pack-planifica-mensual-right-test",
        product_type="addon",
        product_kind="manual",
        precio=10,
        moneda="USD",
        estado="approved",
        activo=True,
        seller_user_id=seller.id,
        vista_previa={
            "product_meta": {
                "commercial_code": "PACK_PLANIFICA_MONTHLY",
                "billing_period": "monthly",
                "duration_months": 1,
                "delivery_kind": "saas_right",
                "activation_policy": "marketplace_order_confirmed",
            }
        },
    )
    order = MarketplaceOrder(
        buyer_user_id=buyer.id,
        total=10,
        commission_amount=2,
        seller_amount=8,
        currency="USD",
        status="completed",
        created_at=datetime(2026, 6, 8, 12, 0, tzinfo=timezone.utc),
    )
    db.add_all([product, order])
    db.flush()

    item = MarketplaceOrderItem(
        order_id=order.id,
        product_id=product.id,
        seller_user_id=seller.id,
        product_title_snapshot=product.titulo,
        product_type_snapshot=product.product_type,
        source_type_snapshot=product.source_type,
        source_id_snapshot=product.source_id,
        price=product.precio,
    )
    db.add(item)
    db.flush()

    delivered_type, delivered_id = marketplace_checkout_service._fulfill_product(
        db,
        product,
        buyer,
        None,
        marketplace_order_id=order.id,
        marketplace_order_item_id=item.id,
    )
    item.delivered_entity_type = delivered_type
    item.delivered_entity_id = delivered_id
    db.add(item)
    db.flush()

    products = commercial_capabilities_service.list_company_saas_products(db, sample_empresa.id)
    state = commercial_capabilities_service.resolve_company_capabilities(db, sample_empresa.id)
    events = (
        db.query(LicenseEvent)
        .filter(
            LicenseEvent.empresa_id == sample_empresa.id,
            LicenseEvent.event_type == "saas_right_marketplace_purchase_activated",
        )
        .all()
    )

    assert delivered_type == "saas_right"
    assert delivered_id == item.id
    assert len(events) == 1
    assert products == [
        {
            "order_item_id": item.id,
            "product_id": product.id,
            "title": "Pack Planifica Mensual",
            "product_type": "addon",
            "commercial_code": "PACK_PLANIFICA_MONTHLY",
            "right_code": "PACK_PLANIFICA",
            "billing_period": "monthly",
            "duration_months": 1,
            "activation_policy": "marketplace_order_confirmed",
            "status": "active",
            "starts_at": order.created_at.date(),
            "ends_at": order.created_at.date() + timedelta(days=30),
            "source": "marketplace_order",
        }
    ]
    assert "PACK_PLANIFICA" in state["purchased_right_codes"]
    assert state["capabilities"]["cronogramas"] is True
    assert state["capabilities"]["formula_polinomica"] is True
    assert state["capabilities"]["desagregacion"] is True
