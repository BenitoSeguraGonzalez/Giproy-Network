from app.services.marketplace_asset_origin import MarketplaceAssetOriginService


def test_asset_origin_company_ownership_metadata_preserves_purchase_scope():
    service = MarketplaceAssetOriginService()

    metadata = service.build_company_ownership_metadata(
        owner_company_id=42,
        product_type="proyecto",
        marketplace_product_id=7,
        marketplace_order_id=9,
        extra={"custom_flag": True},
    )

    assert metadata["purchase_scope"] == {
        "source": "marketplace_purchase",
        "owner_company_id": 42,
        "requires_company_ownership": True,
        "product_type": "proyecto",
        "marketplace_product_id": 7,
        "marketplace_order_id": 9,
        "marketplace_order_item_id": None,
        "custom_flag": True,
    }


def test_asset_origin_usage_policy_blocks_acquired_marketplace_publish():
    service = MarketplaceAssetOriginService()

    policy = service.get_usage_policy("acquired", "marketplace")

    assert policy["editable_internal"] is True
    assert policy["duplicable_internal"] is True
    assert policy["publishable_marketplace"] is False
    assert policy["requires_origin_traceability"] is True


def test_asset_origin_usage_policy_respects_revoked_and_metadata_overrides():
    service = MarketplaceAssetOriginService()

    revoked = service.get_usage_policy("owned", "native", {"revoked": True})
    overridden = service.get_usage_policy(
        "owned",
        "native",
        {"usage_policy": {"publishable_marketplace": False, "export_allowed": False}},
    )

    assert revoked["editable_internal"] is False
    assert revoked["duplicable_internal"] is False
    assert revoked["publishable_marketplace"] is False
    assert revoked["revoked"] is True
    assert overridden["publishable_marketplace"] is False
    assert overridden["export_allowed"] is False


def test_asset_origin_enrich_metadata_does_not_drop_existing_fields():
    service = MarketplaceAssetOriginService()

    metadata = service.enrich_metadata_with_usage_policy(
        ownership_kind="owned",
        origin_kind="native",
        metadata_json={"source": "qa"},
    )

    assert metadata["source"] == "qa"
    assert metadata["usage_policy"]["publishable_marketplace"] is True
