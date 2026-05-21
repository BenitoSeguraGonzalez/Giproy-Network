from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceAssetOrigin


class MarketplaceAssetOriginService:
    PURCHASE_BOUND_BLOCK_REASON = "Los activos adquiridos en marketplace son solo para uso interno y no pueden republicarse."

    def build_company_ownership_metadata(
        self,
        *,
        owner_company_id: int,
        source: str = "marketplace_purchase",
        product_type: Optional[str] = None,
        marketplace_product_id: Optional[int] = None,
        marketplace_order_id: Optional[int] = None,
        marketplace_order_item_id: Optional[int] = None,
        extra: Optional[dict] = None,
    ) -> dict:
        payload = {
            "purchase_scope": {
                "source": source,
                "owner_company_id": owner_company_id,
                "requires_company_ownership": True,
                "product_type": product_type,
                "marketplace_product_id": marketplace_product_id,
                "marketplace_order_id": marketplace_order_id,
                "marketplace_order_item_id": marketplace_order_item_id,
            }
        }
        if isinstance(extra, dict):
            payload["purchase_scope"].update(extra)
        return payload

    def get_usage_policy(self, ownership_kind: str, origin_kind: str, metadata_json: Optional[dict] = None) -> dict:
        metadata = metadata_json if isinstance(metadata_json, dict) else {}
        if metadata.get("revoked"):
            return {
                "editable_internal": False,
                "duplicable_internal": False,
                "publishable_marketplace": False,
                "requires_origin_traceability": True,
                "revoked": True,
            }

        policy = {
            "editable_internal": True,
            "duplicable_internal": True,
            "publishable_marketplace": True,
            "requires_origin_traceability": origin_kind == "marketplace",
        }
        if ownership_kind == "acquired" and origin_kind == "marketplace":
            policy.update(
                {
                    "editable_internal": True,
                    "duplicable_internal": True,
                    "publishable_marketplace": False,
                    "requires_origin_traceability": True,
                }
            )

        metadata_policy = (metadata_json or {}).get("usage_policy") if isinstance(metadata_json, dict) else None
        if isinstance(metadata_policy, dict):
            policy.update(metadata_policy)
        return policy

    def enrich_metadata_with_usage_policy(
        self,
        *,
        ownership_kind: str,
        origin_kind: str,
        metadata_json: Optional[dict] = None,
    ) -> dict:
        payload = dict(metadata_json or {})
        payload["usage_policy"] = self.get_usage_policy(ownership_kind, origin_kind, payload)
        return payload

    def register_native_asset(
        self,
        db: Session,
        *,
        empresa_id: int,
        entity_type: str,
        entity_id: int,
        origin_label: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> MarketplaceAssetOrigin:
        existing = self.get_origin(db, empresa_id=empresa_id, entity_type=entity_type, entity_id=entity_id)
        if existing:
            return existing

        enriched_metadata = self.enrich_metadata_with_usage_policy(
            ownership_kind="owned",
            origin_kind="native",
            metadata_json=metadata_json,
        )

        origin = MarketplaceAssetOrigin(
            empresa_id=empresa_id,
            entity_type=entity_type,
            entity_id=entity_id,
            ownership_kind="owned",
            origin_kind="native",
            origin_label=origin_label,
            metadata_json=enriched_metadata,
        )
        db.add(origin)
        db.commit()
        db.refresh(origin)
        return origin

    def register_acquired_asset(
        self,
        db: Session,
        *,
        empresa_id: int,
        entity_type: str,
        entity_id: int,
        source_entity_type: str,
        source_entity_id: int,
        source_company_id: Optional[int] = None,
        source_user_id: Optional[int] = None,
        marketplace_product_id: Optional[int] = None,
        marketplace_order_id: Optional[int] = None,
        marketplace_order_item_id: Optional[int] = None,
        origin_label: Optional[str] = None,
        metadata_json: Optional[dict] = None,
    ) -> MarketplaceAssetOrigin:
        existing = self.get_origin(db, empresa_id=empresa_id, entity_type=entity_type, entity_id=entity_id)
        if existing:
            return existing

        enriched_metadata = self.enrich_metadata_with_usage_policy(
            ownership_kind="acquired",
            origin_kind="marketplace",
            metadata_json=metadata_json,
        )

        origin = MarketplaceAssetOrigin(
            empresa_id=empresa_id,
            entity_type=entity_type,
            entity_id=entity_id,
            ownership_kind="acquired",
            origin_kind="marketplace",
            origin_label=origin_label,
            source_entity_type=source_entity_type,
            source_entity_id=source_entity_id,
            source_company_id=source_company_id,
            source_user_id=source_user_id,
            marketplace_product_id=marketplace_product_id,
            marketplace_order_id=marketplace_order_id,
            marketplace_order_item_id=marketplace_order_item_id,
            metadata_json=enriched_metadata,
        )
        db.add(origin)
        db.commit()
        db.refresh(origin)
        return origin

    def get_origin(self, db: Session, *, empresa_id: int, entity_type: str, entity_id: int) -> Optional[MarketplaceAssetOrigin]:
        return (
            db.query(MarketplaceAssetOrigin)
            .filter(
                MarketplaceAssetOrigin.empresa_id == empresa_id,
                MarketplaceAssetOrigin.entity_type == entity_type,
                MarketplaceAssetOrigin.entity_id == entity_id,
            )
            .first()
        )

    def validate_company_ownership(
        self,
        db: Session,
        *,
        empresa_id: int,
        entity_type: str,
        entity_id: int,
    ) -> Optional[MarketplaceAssetOrigin]:
        origin = self.get_origin(db, empresa_id=empresa_id, entity_type=entity_type, entity_id=entity_id)
        if not origin:
            return None

        if origin.ownership_kind != "acquired" or origin.origin_kind != "marketplace":
            return origin

        metadata = origin.metadata_json if isinstance(origin.metadata_json, dict) else {}
        purchase_scope = metadata.get("purchase_scope") if isinstance(metadata.get("purchase_scope"), dict) else {}
        owner_company_id = purchase_scope.get("owner_company_id") or origin.empresa_id
        if owner_company_id != empresa_id:
            raise HTTPException(
                status_code=403,
                detail="Este activo adquirido pertenece a otra empresa y no puede abrirse en el contexto actual.",
            )
        if metadata.get("revoked"):
            raise HTTPException(
                status_code=403,
                detail="Este activo fue revocado por devolución o resolución administrativa y ya no está disponible.",
            )
        return origin

    def list_company_origins(self, db: Session, *, empresa_id: int):
        return (
            db.query(MarketplaceAssetOrigin)
            .filter(MarketplaceAssetOrigin.empresa_id == empresa_id)
            .order_by(MarketplaceAssetOrigin.created_at.desc(), MarketplaceAssetOrigin.id.desc())
            .all()
        )

    def can_publish_entity(
        self,
        db: Session,
        *,
        empresa_id: int,
        entity_type: str,
        entity_id: int,
    ) -> tuple[bool, Optional[str], Optional[MarketplaceAssetOrigin]]:
        normalized_entity_type = str(entity_type or "").strip().lower()
        origin = self.get_origin(db, empresa_id=empresa_id, entity_type=entity_type, entity_id=entity_id)
        if not origin:
            if normalized_entity_type == "proyecto":
                from app.models.proyecto import Proyecto

                project = (
                    db.query(Proyecto)
                    .filter(Proyecto.empresa_id == empresa_id, Proyecto.id == entity_id)
                    .first()
                )
                project_config = project.plantillas_config if project and isinstance(project.plantillas_config, dict) else {}
                marketplace_flags = project_config.get("marketplace_flags") if isinstance(project_config.get("marketplace_flags"), dict) else {}
                traceability = project_config.get("marketplace_traceability") if isinstance(project_config.get("marketplace_traceability"), dict) else {}
                if (
                    marketplace_flags.get("purchase_bound")
                    or marketplace_flags.get("acquired")
                    or traceability.get("ownership_kind") == "acquired"
                ):
                    return False, self.PURCHASE_BOUND_BLOCK_REASON, None
            return True, None, None

        usage_policy = self.get_usage_policy(origin.ownership_kind, origin.origin_kind, origin.metadata_json)
        if usage_policy.get("export_allowed") is False or usage_policy.get("publishable_marketplace") is False:
            if origin.ownership_kind == "acquired" and origin.origin_kind == "marketplace":
                return False, self.PURCHASE_BOUND_BLOCK_REASON, origin
            return False, "Este activo no puede publicarse en marketplace.", origin

        if usage_policy.get("publishable_marketplace", True):
            return True, None, origin

        if origin.ownership_kind == "acquired" and origin.origin_kind == "marketplace":
            return False, self.PURCHASE_BOUND_BLOCK_REASON, origin
        return False, "Este activo no puede publicarse en marketplace.", origin

    def revoke_marketplace_asset(
        self,
        db: Session,
        *,
        origin: MarketplaceAssetOrigin,
        refund_id: int,
        reason: Optional[str] = None,
    ) -> MarketplaceAssetOrigin:
        metadata = dict(origin.metadata_json or {})
        metadata["revoked"] = True
        metadata["revoked_reason"] = str(reason or "").strip() or None
        metadata["revoked_at"] = datetime.utcnow().isoformat()
        metadata["refund_id"] = refund_id
        metadata["usage_policy"] = {
            "editable_internal": False,
            "duplicable_internal": False,
            "publishable_marketplace": False,
            "requires_origin_traceability": True,
            "revoked": True,
        }
        origin.metadata_json = metadata
        db.add(origin)
        db.flush()
        return origin


marketplace_asset_origin_service = MarketplaceAssetOriginService()
