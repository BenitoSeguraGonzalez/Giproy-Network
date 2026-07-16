from datetime import date
from decimal import Decimal

from app.services.marketplace_bootstrap import FIXED_MARKETPLACE_CATEGORIES
from app.services.marketplace_catalog_bootstrap import (
    SYSTEM_MARKETPLACE_PRODUCTS,
    build_sample_publication_window,
    build_sample_sales_config,
)


def test_fixed_marketplace_categories_have_unique_ordered_slugs():
    slugs = [item["slug"] for item in FIXED_MARKETPLACE_CATEGORIES]
    sort_orders = [item["sort_order"] for item in FIXED_MARKETPLACE_CATEGORIES]

    assert slugs == [
        "tienda-licencias",
        "tienda-packs-saas",
        "tienda-modulos-servicios",
        "tienda-apus",
        "tienda-bases-maestras",
        "tienda-proyectos",
        "tienda-portal-compras-publicas",
    ]
    assert len(slugs) == len(set(slugs))
    assert sort_orders == sorted(sort_orders)


def test_fixed_marketplace_categories_are_active_and_global():
    for category in FIXED_MARKETPLACE_CATEGORIES:
        assert category["activa"] is True
        assert category["visibility_scope"] == "all"
        assert category["nombre"].strip()
        assert category["descripcion"].strip()


def test_system_marketplace_products_reference_existing_fixed_categories():
    fixed_slugs = {item["slug"] for item in FIXED_MARKETPLACE_CATEGORIES}
    product_category_slugs = {item["category_slug"] for item in SYSTEM_MARKETPLACE_PRODUCTS}

    assert product_category_slugs
    assert product_category_slugs.issubset(fixed_slugs)


def test_system_marketplace_products_have_unique_slugs_and_known_types():
    slugs = [item["slug"] for item in SYSTEM_MARKETPLACE_PRODUCTS]
    product_types = {item["product_type"] for item in SYSTEM_MARKETPLACE_PRODUCTS}

    assert slugs
    assert len(slugs) == len(set(slugs))
    assert product_types == {"licencia", "addon", "adicional"}


def test_system_marketplace_products_match_approved_saas_catalog():
    slugs = {item["slug"] for item in SYSTEM_MARKETPLACE_PRODUCTS}

    assert {
        "sistema-licencia-express-trial-control",
        "sistema-licencia-estandar-mensual",
        "sistema-licencia-estandar-anual",
        "sistema-licencia-profesional-mensual",
        "sistema-licencia-profesional-anual",
        "sistema-licencia-tester-control",
        "sistema-licencia-academica-control",
        "sistema-licencia-capacitacion-control",
        "sistema-pack-planifica-mensual",
        "sistema-pack-planifica-anual",
        "sistema-pack-licita-mensual",
        "sistema-pack-licita-anual",
        "sistema-pack-bim-mensual",
        "sistema-conecta-transferencias",
        "sistema-pack-equipo-colaborador-mensual",
        "sistema-pack-equipo-colaborador-anual",
        "sistema-modulo-fusion",
        "sistema-modulo-migracion",
    }.issubset(slugs)


def test_system_marketplace_products_are_superadmin_controlled():
    for item in SYSTEM_MARKETPLACE_PRODUCTS:
        commercial_meta = dict(item.get("commercial_meta") or {})

        assert commercial_meta["requires_superadmin_edit"] is True
        assert commercial_meta["commercial_code"]
        assert commercial_meta["activation_policy"]


def test_system_marketplace_products_reuse_legacy_products_when_possible():
    reusable = {
        legacy_slug
        for item in SYSTEM_MARKETPLACE_PRODUCTS
        for legacy_slug in item.get("legacy_slugs", [])
    }

    assert "sistema-addon-actualizacion-presupuestos" in reusable
    assert "sistema-addon-pack-migracion-clasica" in reusable
    assert "sistema-servicio-onboarding-equipo" in reusable
    assert "sistema-licencia-profesional-plus" in reusable


def test_saas_license_sale_prices_follow_approved_plan():
    products = {item["slug"]: item for item in SYSTEM_MARKETPLACE_PRODUCTS}

    assert products["sistema-licencia-estandar-mensual"]["precio"] == 25
    assert products["sistema-licencia-estandar-anual"]["precio"] == 250
    assert products["sistema-licencia-profesional-mensual"]["precio"] == 40
    assert products["sistema-licencia-profesional-anual"]["precio"] == 400
    assert products["sistema-pack-planifica-mensual"]["precio"] == 10
    assert products["sistema-pack-planifica-anual"]["precio"] == 100
    assert products["sistema-conecta-transferencias"]["precio"] == Decimal("24.99")
    assert products["sistema-pack-equipo-colaborador-mensual"]["precio"] == 15
    assert products["sistema-pack-equipo-colaborador-anual"]["precio"] == 150
    assert products["sistema-pack-bim-mensual"]["precio"] == Decimal("99.99")
    assert products["sistema-pack-bim-mensual"]["commercial_meta"]["requires_base_plan"] == [
        "STANDARD",
        "PROFESSIONAL",
    ]
    assert products["sistema-modulo-fusion"]["precio"] == 150
    assert products["sistema-modulo-migracion"]["precio"] == 200


def test_build_sample_sales_config_is_conservative_for_licenses():
    for product_type in ("licencia", "LICENCIA", " licencia "):
        config = build_sample_sales_config(index=0, product_type=product_type)

        assert config == {
            "sale_mode": "unit",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 1,
        }


def test_build_sample_sales_config_forces_unit_sale_every_third_sample():
    for product_type in ("addon", "adicional", "otro"):
        config = build_sample_sales_config(index=3, product_type=product_type)

        assert config == {
            "sale_mode": "unit",
            "min_quantity": 1,
            "default_quantity": 1,
            "quantity_step": 1,
            "max_quantity": 1,
        }


def test_build_sample_sales_config_uses_pack_variants_for_non_unit_samples():
    first_pack = build_sample_sales_config(index=1, product_type="addon")
    wrapped_pack = build_sample_sales_config(index=4, product_type="adicional")

    assert first_pack == {
        "sale_mode": "pack",
        "min_quantity": 3,
        "default_quantity": 3,
        "quantity_step": 3,
        "max_quantity": 24,
    }
    assert wrapped_pack == {
        "sale_mode": "pack",
        "min_quantity": 2,
        "default_quantity": 2,
        "quantity_step": 1,
        "max_quantity": 10,
    }


def test_build_sample_publication_window_is_ordered_and_bounded():
    start_raw, end_raw = build_sample_publication_window(index=3)
    start_date = date.fromisoformat(start_raw)
    end_date = date.fromisoformat(end_raw)

    assert start_date < end_date
    assert 14 <= (end_date - start_date).days <= 180
