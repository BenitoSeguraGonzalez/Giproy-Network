from datetime import date, timedelta

from sqlalchemy.orm import Session, joinedload

from app.models.marketplace import MarketplaceOrder, MarketplaceOrderItem, MarketplaceProduct
from app.models.usuario import Usuario
from app.services.license import license_service


RIGHT_CODE_ALIASES = {
    "PACK_PLANIFICA_MONTHLY": "PACK_PLANIFICA",
    "PACK_PLANIFICA_ANNUAL": "PACK_PLANIFICA",
    "PACK_LICITA_MONTHLY": "PACK_LICITA",
    "PACK_LICITA_ANNUAL": "PACK_LICITA",
    "PACK_CONECTA_MONTHLY": "PACK_CONECTA",
    "PACK_CONECTA_ANNUAL": "PACK_CONECTA",
    "PACK_EQUIPO_COLLAB_MONTHLY": "PACK_EQUIPO",
    "PACK_EQUIPO_COLLAB_ANNUAL": "PACK_EQUIPO",
    "PACK_BIM_MONTHLY": "PACK_BIM",
    "MOD_FUSION": "MOD_FUSION",
    "MOD_MIGRACION": "MOD_MIGRACION",
}


class CommercialCapabilitiesService:
    @staticmethod
    def _extract_saas_product_meta(product: MarketplaceProduct | None) -> dict:
        preview = product.vista_previa if product and isinstance(product.vista_previa, dict) else {}
        return dict(preview.get("product_meta") or {})

    @classmethod
    def _is_saas_right_item(cls, item: MarketplaceOrderItem) -> bool:
        if (item.product_type_snapshot or "").strip().lower() == "licencia":
            return False
        if (item.delivered_entity_type or "").strip().lower() == "saas_right":
            return True
        product_meta = cls._extract_saas_product_meta(item.product)
        delivery_kind = str(product_meta.get("delivery_kind") or "").strip().lower()
        return "saas_right" in delivery_kind

    @staticmethod
    def canonical_right_code(code: str | None) -> str | None:
        normalized = str(code or "").strip().upper()
        if not normalized:
            return None
        return RIGHT_CODE_ALIASES.get(normalized, normalized)

    @classmethod
    def list_company_saas_products(cls, db: Session, empresa_id: int) -> list[dict]:
        rows = (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .join(Usuario, Usuario.id == MarketplaceOrder.buyer_user_id)
            .options(joinedload(MarketplaceOrderItem.product), joinedload(MarketplaceOrderItem.order))
            .filter(
                Usuario.empresa_id == empresa_id,
                MarketplaceOrder.status == "completed",
            )
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrderItem.id.desc())
            .all()
        )

        products = []
        seen_keys = set()
        for item in rows:
            if not cls._is_saas_right_item(item):
                continue
            product_meta = cls._extract_saas_product_meta(item.product)
            commercial_code = product_meta.get("commercial_code") or item.product_title_snapshot
            right_code = cls.canonical_right_code(commercial_code)
            key = (commercial_code, item.product_id, item.delivered_entity_id or item.id)
            if key in seen_keys:
                continue
            seen_keys.add(key)

            duration_months = product_meta.get("duration_months")
            purchased_at = item.order.created_at if item.order else None
            starts_at = purchased_at.date() if purchased_at else None
            ends_at = None
            if starts_at and duration_months:
                try:
                    ends_at = starts_at + timedelta(days=30 * int(duration_months))
                except (TypeError, ValueError):
                    ends_at = None

            status = "active"
            if right_code == "PACK_BIM" and ends_at and ends_at < date.today():
                status = "expired"

            products.append({
                "order_item_id": item.id,
                "product_id": item.product_id,
                "title": item.product_title_snapshot,
                "product_type": item.product_type_snapshot,
                "commercial_code": commercial_code,
                "right_code": right_code,
                "billing_period": product_meta.get("billing_period"),
                "duration_months": duration_months,
                "activation_policy": product_meta.get("activation_policy"),
                "status": status,
                "starts_at": starts_at,
                "ends_at": ends_at,
                "source": "marketplace_order",
            })

        return products

    def resolve_company_capabilities(self, db: Session, empresa_id: int) -> dict:
        snapshot = license_service.get_company_license_snapshot(db, empresa_id)
        assignment = snapshot["current_assignment"]
        licencia = assignment.licencia if assignment else None
        limits = license_service.get_company_license_limits(db, empresa_id) if licencia else {}
        flags = license_service.get_company_special_flags(db, empresa_id) if licencia else {
            "is_tester": False,
            "is_academic": False,
            "is_training": False,
            "is_commercial": True,
        }

        modules = set(limits.get("modulos_permitidos") or [])
        has_all_modules = "*" in modules
        included_right_codes = {
            self.canonical_right_code(code)
            for code in (limits.get("packs_incluidos") or [])
        }
        included_right_codes.discard(None)

        saas_products = self.list_company_saas_products(db, empresa_id)
        purchased_right_codes = {
            self.canonical_right_code(product.get("right_code") or product.get("commercial_code"))
            for product in saas_products
            if product.get("status") == "active"
        }
        purchased_right_codes.discard(None)
        effective_right_codes = included_right_codes | purchased_right_codes

        license_key = str(
            (licencia.plan_kind if licencia else None)
            or (licencia.codigo if licencia else None)
            or ""
        ).strip().lower()
        bim_included_by_license = license_key in {
            "empresarial",
            "enterprise",
            "tester",
            "academic",
            "academica",
            "training",
            "capacitacion",
        } or any(
            bool(flags.get(flag))
            for flag in ("is_tester", "is_academic", "is_training")
        )
        bim_purchased = "PACK_BIM" in purchased_right_codes

        is_commercial = bool(flags.get("is_commercial", True))
        excel_exports = bool(limits.get("excel_exports", True)) and is_commercial
        conecta_base_slots = int(limits.get("conecta_base_slots") or 0)

        capabilities = {
            "apus": has_all_modules or "apus" in modules,
            "presupuestos": has_all_modules or "presupuestos" in modules,
            "cronogramas": has_all_modules or "PACK_PLANIFICA" in effective_right_codes,
            "formula_polinomica": has_all_modules or "PACK_PLANIFICA" in effective_right_codes,
            "desagregacion": has_all_modules or "PACK_PLANIFICA" in effective_right_codes,
            "licitaciones": has_all_modules or "PACK_LICITA" in effective_right_codes,
            "conecta": conecta_base_slots > 0 or "PACK_CONECTA" in effective_right_codes,
            "equipo": "PACK_EQUIPO" in effective_right_codes,
            "equipo_available_for_purchase": bool(limits.get("team_pack_available", False)),
            "bim": bim_included_by_license or bim_purchased,
            "bim_available_for_purchase": license_key in {
                "standard",
                "estandar",
                "professional",
                "profesional",
            },
            "mod_fusion": "MOD_FUSION" in effective_right_codes,
            "mod_migracion": "MOD_MIGRACION" in effective_right_codes,
            "excel_exports": excel_exports,
            "pdf_exports": True,
            "commercial_exports": excel_exports,
            "watermark_reports": bool(limits.get("watermark_reports", False)) or not is_commercial,
        }

        return {
            "license": {
                "id": licencia.id if licencia else None,
                "nombre": licencia.nombre if licencia else "Sin Licencia",
                "codigo": licencia.codigo if licencia else None,
                "plan_kind": licencia.plan_kind if licencia else None,
            },
            "license_status": snapshot["license_status"],
            "access_mode": snapshot["access_mode"],
            "grace_days_remaining": snapshot["grace_days_remaining"],
            "limits": limits,
            "flags": flags,
            "included_right_codes": sorted(included_right_codes),
            "purchased_right_codes": sorted(purchased_right_codes),
            "effective_right_codes": sorted(effective_right_codes),
            "saas_products": saas_products,
            "capabilities": capabilities,
            "bim_entitlement": {
                "included_by_license": bim_included_by_license,
                "purchased": bim_purchased,
                "source": (
                    "license"
                    if bim_included_by_license
                    else "marketplace"
                    if bim_purchased
                    else None
                ),
            },
            "restrictions": {
                "readonly": snapshot["access_mode"] != "full",
                "requires_watermark": capabilities["watermark_reports"],
                "non_commercial": not is_commercial,
            },
        }


commercial_capabilities_service = CommercialCapabilitiesService()
