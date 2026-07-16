from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.marketplace import MarketplaceProduct
from app.models.transferencia import TransferExtraRecipientPack
from app.models.usuario import Usuario
from app.schemas.marketplace import MarketplaceCheckoutItemRequest, MarketplaceCheckoutRequest
from app.services.marketplace_bootstrap import bootstrap_system_marketplace_categories
from app.services.marketplace_catalog_bootstrap import bootstrap_system_marketplace_catalog
from app.services.marketplace_checkout import marketplace_checkout_service
from app.services.transferencias import FIXED_RECIPIENT_LIMIT, TransferPolicyError, transferencias_service


def _create_company(db, *, name: str, seq: int) -> Empresa:
    company = Empresa(
        nombre=name,
        ruc=f"299{seq:010d}",
        localidad="Cuenca",
        canton="Cuenca",
        provincia="Azuay",
        pais="Ecuador",
        telefono="0999999999",
        proy_prefijo="CNX",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=6,
        marketplace_can_sell=True,
    )
    db.add(company)
    db.flush()
    return company


def _create_user(db, *, email: str, company: Empresa, role: str = "administrador") -> Usuario:
    user = Usuario(
        email=email,
        hashed_password="x",
        nombre_completo="Usuario Conecta",
        nombres="Usuario",
        apellidos="Conecta",
        alias="conecta",
        ruc=f"01020304{abs(hash(email)) % 100000:05d}",
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
    db.flush()
    return user


def _assign_transfer_license(db, empresa: Empresa) -> None:
    licencia = db.query(Licencia).filter(Licencia.codigo == "STANDARD").first()
    if not licencia:
        licencia = Licencia(
            nombre="Standard Conecta Transfer",
            codigo="STANDARD",
            plan_kind="estandar",
            limites={"usuarios": 5},
            activo=True,
        )
        db.add(licencia)
        db.flush()
    db.add(
        EmpresaLicencia(
            empresa_id=empresa.id,
            licencia_id=licencia.id,
            starts_at=date.today() - timedelta(days=1),
            ends_at=date.today() + timedelta(days=30),
            status="active",
            activa=True,
        )
    )
    db.flush()


def _bootstrap_conecta(db) -> MarketplaceProduct:
    admin_company = _create_company(db, name="Sistema Conecta", seq=9001)
    _create_user(db, email="superadmin-conecta@giproy.test", company=admin_company, role="superadministrador")
    bootstrap_system_marketplace_categories(db)
    bootstrap_system_marketplace_catalog(db)
    return db.query(MarketplaceProduct).filter(MarketplaceProduct.slug == "sistema-conecta-transferencias").one()


def _create_recipient_company_with_code(db, index: int) -> tuple[Empresa, str]:
    company = _create_company(db, name=f"Destino Conecta {index}", seq=9100 + index)
    admin = _create_user(db, email=f"destino-conecta-{index}@giproy.test", company=company)
    code = transferencias_service.ensure_admin_public_code(db, admin)
    return company, code.public_code


def test_conecta_marketplace_catalog_is_unique_and_configured(db):
    product = _bootstrap_conecta(db)
    product_meta = product.vista_previa["product_meta"]

    assert product.titulo == "Conecta"
    assert product.resumen == "Amplia empresas destino para Envios y Transferencias."
    assert product.precio == Decimal("24.99")
    assert product.moneda == "USD"
    assert product.activo is True
    assert product_meta["commercial_code"] == "CONECTA_TRANSFERENCIAS"
    assert product_meta["recipient_slots"] == 3
    assert product_meta["duration_days"] == 30
    assert product.vista_previa["sales_config"]["max_quantity"] == 20

    conecta_products = [
        item
        for item in db.query(MarketplaceProduct).all()
        if ((item.vista_previa or {}).get("product_meta") or {}).get("commercial_code") == "CONECTA_TRANSFERENCIAS"
    ]
    assert len(conecta_products) == 1


def test_conecta_checkout_creates_independent_accumulative_packs(db):
    product = _bootstrap_conecta(db)
    buyer_company = _create_company(db, name="Compradora Conecta", seq=9201)
    buyer = _create_user(db, email="buyer-conecta@giproy.test", company=buyer_company)

    order = marketplace_checkout_service.checkout(
        db,
        MarketplaceCheckoutRequest(
            items=[MarketplaceCheckoutItemRequest(product_id=product.id, quantity=2)],
            notes="Compra Conecta x2",
        ),
        buyer,
    )

    packs = db.query(TransferExtraRecipientPack).filter_by(empresa_id=buyer_company.id).order_by(TransferExtraRecipientPack.id.asc()).all()
    assert order.status == "completed"
    assert len(order.items) == 2
    assert len(packs) == 2
    assert {item.delivered_entity_type for item in order.items} == {"transfer_extra_recipient_pack"}
    assert all(pack.product_code == "CONECTA_TRANSFERENCIAS" for pack in packs)
    assert all(pack.slots_total == 3 and pack.slots_used == 0 for pack in packs)
    assert packs[0].marketplace_order_item_id != packs[1].marketplace_order_item_id
    assert all(29 <= (pack.expires_at - pack.purchased_at).days <= 30 for pack in packs)


def test_expired_conecta_pack_does_not_reactivate_additional_recipient(db):
    sender_company = _create_company(db, name="Sender Expira Conecta", seq=9301)
    _assign_transfer_license(db, sender_company)
    sender_admin = _create_user(db, email="sender-expira-conecta@giproy.test", company=sender_company)

    for index in range(FIXED_RECIPIENT_LIMIT):
        _, code = _create_recipient_company_with_code(db, index)
        transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=sender_company.id,
            public_code=code,
            actor_user_id=sender_admin.id,
            confirm=True,
        )

    expired_pack = TransferExtraRecipientPack(
        empresa_id=sender_company.id,
        marketplace_order_item_id=None,
        product_code="CONECTA_TRANSFERENCIAS",
        status="active",
        slots_total=3,
        slots_used=0,
        purchased_at=datetime.now(timezone.utc) - timedelta(days=31),
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
    )
    db.add(expired_pack)
    db.flush()

    _, blocked_code = _create_recipient_company_with_code(db, 99)
    with pytest.raises(TransferPolicyError) as exc:
        transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=sender_company.id,
            public_code=blocked_code,
            actor_user_id=sender_admin.id,
            confirm=True,
        )
    assert exc.value.code == "transfer_recipient_slots_exhausted"

    active_pack = TransferExtraRecipientPack(
        empresa_id=sender_company.id,
        marketplace_order_item_id=None,
        product_code="CONECTA_TRANSFERENCIAS",
        status="active",
        slots_total=3,
        slots_used=0,
        purchased_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=30),
    )
    db.add(active_pack)
    db.flush()

    recipient = transferencias_service.create_recipient_from_code(
        db,
        sender_empresa_id=sender_company.id,
        public_code=blocked_code,
        actor_user_id=sender_admin.id,
        confirm=True,
    )

    assert recipient.recipient_kind == "additional"
    assert recipient.source_pack_id == active_pack.id
    assert active_pack.slots_used == 1
    assert expired_pack.slots_used == 0
