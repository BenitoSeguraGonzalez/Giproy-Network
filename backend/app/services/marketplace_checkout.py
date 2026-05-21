import io
import base64
from uuid import uuid4

import httpx
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.licencia import Licencia
from app.models.cronograma import CronogramaValorado
from app.models.cronograma_trabajo import CronogramaTrabajo
from app.models.edo import EdoNode
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.marketplace import (
    MarketplaceAssetOrigin,
    MarketplaceCheckoutDraft,
    MarketplaceOrder,
    MarketplaceOrderItem,
    MarketplacePaymentMethod,
    MarketplacePaymentAttempt,
    MarketplacePaymentEvent,
    MarketplaceProduct,
    MarketplaceRefund,
)
from app.services.marketplace_asset_origin import marketplace_asset_origin_service
from app.services.marketplace_profile import evaluate_marketplace_profile
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto, PresupuestoNota
from app.models.proyecto import Proyecto
from app.models.proyecto_detalle import ProyectoDetalle
from app.models.recurso import Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.usuario import Usuario
from app.schemas.base_trabajo import BaseTrabajoCreate
from app.schemas.marketplace import (
    MarketplaceBankTransferCheckoutCreate,
    MarketplaceCheckoutDraftCreate,
    MarketplaceCheckoutRequest,
    MarketplaceRefundRequest,
)
from app.services.marketplace_permissions import has_marketplace_permission
from app.services.marketplace import marketplace_service
from app.services.recurso import recurso_service
from app.services.apu import calculate_apu_price
from app.services.presupuesto import calculate_presupuesto_totals
from app.services.public_procurement_portal_import import public_procurement_portal_import_service
from app.services.license import license_service
from app.core.unit_normalization import canonicalize_unit_symbol


ECUADOR_GEO_REFERENCE = {
    ("azuay", "cuenca"): {"lat": -2.9006, "lng": -79.0045, "resolution": "canton"},
    ("azuay", "paute"): {"lat": -2.7801, "lng": -78.7597, "resolution": "canton"},
    ("guayas", "guayaquil"): {"lat": -2.1709, "lng": -79.9224, "resolution": "canton"},
    ("guayas", "daule"): {"lat": -1.8622, "lng": -79.9778, "resolution": "canton"},
    ("manabi", "manta"): {"lat": -0.9677, "lng": -80.7089, "resolution": "canton"},
    ("pichincha", "quito"): {"lat": -0.1807, "lng": -78.4678, "resolution": "canton"},
    ("azuay", None): {"lat": -2.9006, "lng": -79.0045, "resolution": "provincia"},
    ("guayas", None): {"lat": -2.1709, "lng": -79.9224, "resolution": "provincia"},
    ("manabi", None): {"lat": -0.9677, "lng": -80.7089, "resolution": "provincia"},
    ("pichincha", None): {"lat": -0.1807, "lng": -78.4678, "resolution": "provincia"},
}


class MarketplaceCheckoutService:
    PLATFORM_COMMISSION_RATE = Decimal("0.20")
    SELLER_RATE = Decimal("0.80")
    CHECKOUT_DRAFT_TTL_MINUTES = 30
    BANK_TRANSFER_REVIEW_TTL_HOURS = 72
    ONLINE_PAYMENT_STALE_STATUSES = {"draft", "pending_customer_action", "created"}
    AUTO_REFUND_WINDOW_MINUTES = 30
    AUTO_REFUND_PRODUCT_TYPES = {"apu", "proyecto", "base_maestra"}
    PAYPHONE_CONFIRM_URL = "https://pay.payphonetodoesposible.com/api/button/V2/Confirm"
    PAYPAL_SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com"
    PAYPAL_PRODUCTION_BASE_URL = "https://api-m.paypal.com"
    ONLINE_PROVIDER_METHODS = {"payphone", "paypal"}

    def _extract_license_offer(self, product: MarketplaceProduct) -> dict:
        preview = self._extract_product_preview(product)
        product_meta = dict(preview.get("product_meta") or {})
        offer = dict(product_meta.get("license_offer") or {})

        plan_kind = str(
            offer.get("plan_kind")
            or product_meta.get("plan_kind")
            or offer.get("license_plan_kind")
            or product_meta.get("license_plan_kind")
            or ""
        ).strip().lower()
        license_code = str(
            offer.get("license_code")
            or product_meta.get("license_code")
            or offer.get("catalog_code")
            or product_meta.get("catalog_code")
            or ""
        ).strip().upper()
        license_name = str(
            offer.get("license_name")
            or product_meta.get("license_name")
            or ""
        ).strip()
        billing_cycle = str(
            offer.get("billing_cycle")
            or product_meta.get("billing_cycle")
            or ""
        ).strip().lower()

        try:
            months = int(
                offer.get("duration_months")
                or product_meta.get("duration_months")
                or 0
            )
        except (TypeError, ValueError):
            months = 0

        if months <= 0:
            months = 12 if billing_cycle == "annual" else 1

        return {
            "plan_kind": plan_kind,
            "license_code": license_code,
            "license_name": license_name,
            "billing_cycle": billing_cycle or ("annual" if months >= 12 else "monthly"),
            "duration_months": max(1, months),
        }

    def _resolve_marketplace_license_catalog(self, db: Session, product: MarketplaceProduct):
        offer = self._extract_license_offer(product)
        if not offer["plan_kind"] and not offer["license_code"] and not offer["license_name"]:
            raise HTTPException(
                status_code=400,
                detail="El producto de licencia no tiene configurado un plan comercial válido.",
            )

        license_service.ensure_default_catalog(db)
        query = db.query(Licencia).filter(Licencia.activo == True)

        licencia = None
        if offer["license_code"]:
            licencia = query.filter(func.upper(Licencia.codigo) == offer["license_code"]).first()
        if not licencia and offer["plan_kind"]:
            licencia = query.filter(func.lower(Licencia.plan_kind) == offer["plan_kind"]).first()
        if not licencia and offer["license_name"]:
            licencia = query.filter(func.lower(Licencia.nombre) == offer["license_name"].lower()).first()

        if not licencia or bool(getattr(licencia, "is_default_express", False)):
            raise HTTPException(
                status_code=400,
                detail="El producto de licencia apunta a un plan no comercial o no disponible.",
            )

        return licencia, offer

    def _fulfill_license_product(self, db: Session, product: MarketplaceProduct, buyer: Usuario):
        licencia, offer = self._resolve_marketplace_license_catalog(db, product)
        assignment = license_service.assign_license_to_company(
            db,
            empresa_id=buyer.empresa_id,
            licencia_id=licencia.id,
            months=offer["duration_months"],
            actor_usuario_id=buyer.id,
            payment_confirmed_at=datetime.now(timezone.utc),
            notes=f"Marketplace: {product.titulo}",
            force_immediate=False,
            source="marketplace_purchase",
        )
        return "empresa_licencia", assignment.id

    def _ensure_buyer_access(self, current_user: Usuario) -> None:
        role = (current_user.rol or "").strip().lower()
        if role not in {"administrador", "superadministrador"} or not current_user.empresa_id:
            raise HTTPException(
                status_code=403,
                detail="Solo los administradores de empresa pueden comprar en marketplace.",
            )
        if not has_marketplace_permission(current_user, "marketplace.buy"):
            raise HTTPException(status_code=403, detail="No tiene permisos para comprar en marketplace.")
        profile_status = evaluate_marketplace_profile(current_user)
        if not profile_status["complete"]:
            missing = ", ".join(profile_status["missing_labels"])
            raise HTTPException(status_code=403, detail=f"Complete el perfil del usuario antes de comprar en marketplace. Faltan: {missing}.")

    def _extract_sales_config(self, product: MarketplaceProduct) -> dict:
        preview = product.vista_previa if isinstance(product.vista_previa, dict) else {}
        raw = preview.get("sales_config") if isinstance(preview.get("sales_config"), dict) else {}
        sale_mode = "pack" if (raw.get("sale_mode") or "").strip().lower() == "pack" else "unit"
        min_quantity = max(1, int(raw.get("min_quantity") or 1))
        quantity_step = max(1, int(raw.get("quantity_step") or 1))
        default_quantity = max(min_quantity, int(raw.get("default_quantity") or min_quantity))
        max_quantity = raw.get("max_quantity")
        if max_quantity is not None:
            try:
                max_quantity = max(min_quantity, int(max_quantity))
            except (TypeError, ValueError):
                max_quantity = None

        if sale_mode == "unit":
            return {
                "sale_mode": "unit",
                "min_quantity": 1,
                "default_quantity": 1,
                "quantity_step": 1,
                "max_quantity": 1,
                "allows_multiple": False,
            }

        return {
            "sale_mode": "pack",
            "min_quantity": min_quantity,
            "default_quantity": default_quantity,
            "quantity_step": quantity_step,
            "max_quantity": max_quantity,
            "allows_multiple": True,
        }

    def _normalize_checkout_items(self, payload: MarketplaceCheckoutRequest) -> list[dict]:
        merged_quantities: dict[int, int] = {}

        if payload.items:
            raw_items = payload.items
        else:
            raw_items = []
            for product_id in payload.product_ids:
                raw_items.append({"product_id": product_id, "quantity": 1})

        for raw_item in raw_items:
            product_id = int(raw_item.product_id if hasattr(raw_item, "product_id") else raw_item.get("product_id"))
            quantity = int(raw_item.quantity if hasattr(raw_item, "quantity") else raw_item.get("quantity", 1))
            if quantity < 1:
                raise HTTPException(status_code=400, detail="La cantidad de compra debe ser mayor o igual a 1.")
            merged_quantities[product_id] = merged_quantities.get(product_id, 0) + quantity

        return [{"product_id": product_id, "quantity": quantity} for product_id, quantity in merged_quantities.items()]

    def _normalize_checkout_draft_items(self, payload: MarketplaceCheckoutDraftCreate) -> list[dict]:
        checkout_request = MarketplaceCheckoutRequest(
            product_ids=list(payload.product_ids or []),
            items=list(payload.items or []),
            notes=payload.notes,
        )
        return self._normalize_checkout_items(checkout_request)

    def _get_products_for_checkout(self, db: Session, product_ids: list[int]) -> list[MarketplaceProduct]:
        products = (
            db.query(MarketplaceProduct)
            .options(joinedload(MarketplaceProduct.seller))
            .filter(
                MarketplaceProduct.id.in_(product_ids),
                MarketplaceProduct.estado == "approved",
                MarketplaceProduct.activo == True,
            )
            .all()
        )
        products = [product for product in products if marketplace_service._is_product_in_publication_window(product)]
        if len(products) != len(product_ids):
            raise HTTPException(status_code=400, detail="Uno o más productos no están disponibles para compra.")
        return products

    def _build_checkout_snapshot(self, normalized_lines: list[dict]) -> dict:
        items = []
        total = Decimal("0.00")
        currency = "USD"

        for line in normalized_lines:
            product = line["product"]
            quantity = int(line["quantity"])
            line_total = (Decimal(str(product.precio or 0)) * Decimal(quantity)).quantize(Decimal("0.01"))
            currency = product.moneda or currency
            total += line_total
            items.append({
                "product_id": product.id,
                "title": product.titulo,
                "product_type": product.product_type,
                "quantity": quantity,
                "unit_price": str(Decimal(str(product.precio or 0)).quantize(Decimal("0.01"))),
                "line_total": str(line_total),
                "currency": currency,
            })

        return {
            "items": items,
            "currency": currency,
            "total": str(total.quantize(Decimal("0.01"))),
        }

    def _resolve_products_from_snapshot(self, db: Session, snapshot: dict) -> list[dict]:
        raw_items = list(snapshot.get("items") or [])
        if not raw_items:
            raise HTTPException(status_code=400, detail="El checkout draft no contiene productos válidos.")

        normalized_request_items = []
        for raw_item in raw_items:
            try:
                normalized_request_items.append({
                    "product_id": int(raw_item.get("product_id")),
                    "quantity": int(raw_item.get("quantity") or 1),
                })
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=400, detail="El checkout draft contiene líneas inválidas.") from exc

        product_ids = [item["product_id"] for item in normalized_request_items]
        products = self._get_products_for_checkout(db, product_ids)
        products_by_id = {product.id: product for product in products}

        normalized_lines: list[dict] = []
        for line in normalized_request_items:
            product = products_by_id.get(line["product_id"])
            if not product:
                raise HTTPException(status_code=400, detail="Uno o más productos del checkout draft ya no están disponibles.")

            sales_config = self._extract_sales_config(product)
            quantity = int(line["quantity"])
            if not sales_config["allows_multiple"] and quantity > 1:
                raise HTTPException(status_code=400, detail=f"El producto '{product.titulo}' solo permite compra unitaria.")
            normalized_lines.append({
                "product": product,
                "quantity": quantity,
            })

        return normalized_lines

    def _get_accessible_order(self, db: Session, order_id: int, current_user: Usuario) -> MarketplaceOrder:
        self._ensure_buyer_access(current_user)
        order = (
            db.query(MarketplaceOrder)
            .options(
                joinedload(MarketplaceOrder.items),
                joinedload(MarketplaceOrder.payment_attempts).joinedload(MarketplacePaymentAttempt.events),
            )
            .filter(
                MarketplaceOrder.id == order_id,
                MarketplaceOrder.buyer_user_id == current_user.id,
            )
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Pedido no encontrado.")
        return order

    def _summarize_payment_event(self, event: MarketplacePaymentEvent) -> str:
        labels = {
            "checkout_draft_expired": "Sesión de checkout expirada",
            "payphone_prepared": "PayPhone preparado",
            "payphone_confirmation_failed": "Confirmación PayPhone fallida",
            "payphone_canceled": "Pago PayPhone cancelado",
            "payphone_confirmed": "Pago PayPhone confirmado",
            "paypal_prepared": "PayPal preparado",
            "paypal_order_created": "Orden PayPal creada",
            "paypal_capture_failed": "Captura PayPal fallida",
            "paypal_captured": "Pago PayPal confirmado",
            "bank_transfer_submitted": "Transferencia reportada",
            "bank_transfer_confirmed": "Transferencia validada",
            "bank_transfer_rejected": "Transferencia rechazada",
            "refund_completed": "Reembolso completado",
            "legacy_checkout_confirmed": "Compra clásica confirmada",
        }
        return labels.get(
            str(event.event_type or "").strip().lower(),
            " ".join(str(event.event_type or "evento_pago").replace("_", " ").split()).capitalize(),
        )

    def _serialize_payment_timeline(self, order: MarketplaceOrder) -> list[dict]:
        timeline: list[dict] = []
        for attempt in list(order.payment_attempts or []):
            for event in list(attempt.events or []):
                occurred_at = event.processed_at or event.created_at
                timeline.append({
                    "event_type": event.event_type,
                    "provider": event.provider,
                    "event_origin": event.event_origin,
                    "occurred_at": occurred_at,
                    "summary": self._summarize_payment_event(event),
                })

        timeline.sort(key=lambda item: item.get("occurred_at") or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
        return timeline[:8]

    def _resolve_refund_provider_resolution(self, payment_method: str | None) -> dict:
        method_key = str(payment_method or "").strip().lower()
        if method_key == "bank_transfer":
            return {
                "status": "manual_bank_reversal_required",
                "note": "La devolución monetaria debe resolverse manualmente fuera del sistema mediante reversa o ajuste bancario.",
            }
        if method_key == "paypal":
            return {
                "status": "provider_reversal_pending",
                "note": "El acceso ya fue revocado en GiProy. La reversa monetaria en PayPal queda pendiente de conciliación operativa.",
            }
        if method_key == "payphone":
            return {
                "status": "provider_reversal_pending",
                "note": "El acceso ya fue revocado en GiProy. La reversa monetaria en PayPhone queda pendiente de conciliación operativa.",
            }
        return {
            "status": "internal_refund_recorded",
            "note": "El reembolso quedó registrado en GiProy. Verifica si hace falta una compensación externa adicional.",
        }

    def _serialize_order_summary(self, order: MarketplaceOrder) -> dict:
        payment_attempt = (order.payment_attempts or [None])[0]
        payment_payload = dict(payment_attempt.payload_json or {}) if payment_attempt and isinstance(payment_attempt.payload_json, dict) else {}
        delivered_items_count = sum(1 for item in (order.items or []) if item.delivered_entity_type and item.delivered_entity_id)
        pending_items_count = max(0, len(order.items or []) - delivered_items_count)
        if len(order.items or []) == 0:
            fulfillment_status = "none"
        elif pending_items_count == 0:
            fulfillment_status = "fulfilled"
        elif delivered_items_count == 0:
            fulfillment_status = "pending"
        else:
            fulfillment_status = "partial"
        refund_summary = self._summarize_refund_policy(order)
        payment_timeline = self._serialize_payment_timeline(order)
        return {
            "id": order.id,
            "buyer_user_id": order.buyer_user_id,
            "total": order.total,
            "commission_amount": order.commission_amount,
            "seller_amount": order.seller_amount,
            "currency": order.currency,
            "status": order.status,
            "notes": order.notes,
            "payment_method": payment_attempt.payment_method if payment_attempt else None,
            "payment_status": payment_attempt.status if payment_attempt else None,
            "transfer_reference": payment_payload.get("transfer_reference"),
            "transfer_date": payment_payload.get("transfer_date"),
            "provider_transaction_id": payment_attempt.provider_transaction_id if payment_attempt else None,
            "authorization_code": payment_payload.get("authorization_code"),
            "fulfillment_status": fulfillment_status,
            "delivered_items_count": delivered_items_count,
            "pending_items_count": pending_items_count,
            "refund_window_open": refund_summary["refund_window_open"],
            "refund_deadline_at": refund_summary["refund_deadline_at"],
            "refundable_items_count": refund_summary["refundable_items_count"],
            "non_refundable_items_count": refund_summary["non_refundable_items_count"],
            "refund_scope": refund_summary["refund_scope"],
            "refund_status": refund_summary["refund_status"],
            "refund_mode": payment_payload.get("refund_mode"),
            "refund_reason": payment_payload.get("refund_reason"),
            "refunded_at": payment_payload.get("refunded_at"),
            "refunded_by_user_id": payment_payload.get("refunded_by_user_id"),
            "refund_provider_resolution_status": payment_payload.get("refund_provider_resolution_status"),
            "refund_provider_resolution_note": payment_payload.get("refund_provider_resolution_note"),
            "refund_provider_resolution_at": payment_payload.get("refund_provider_resolution_at"),
            "payment_timeline": payment_timeline,
            "created_at": order.created_at,
            "items": list(order.items or []),
        }

    def create_checkout_draft(
        self,
        db: Session,
        payload: MarketplaceCheckoutDraftCreate,
        current_user: Usuario,
    ) -> MarketplaceCheckoutDraft:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        checkout_items = self._normalize_checkout_draft_items(payload)
        if not checkout_items:
            raise HTTPException(status_code=400, detail="Debe enviar al menos un producto para preparar la compra.")

        product_ids = [item["product_id"] for item in checkout_items]
        products = self._get_products_for_checkout(db, product_ids)
        products_by_id = {product.id: product for product in products}

        normalized_lines: list[dict] = []
        for line in checkout_items:
            product = products_by_id.get(line["product_id"])
            if not product:
                raise HTTPException(status_code=400, detail="Uno o más productos no están disponibles para compra.")
            sales_config = self._extract_sales_config(product)
            quantity = int(line["quantity"])
            if not sales_config["allows_multiple"] and quantity > 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"El producto '{product.titulo}' solo permite compra unitaria.",
                )
            normalized_lines.append({
                "product": product,
                "quantity": quantity,
            })

        snapshot = self._build_checkout_snapshot(normalized_lines)
        draft = MarketplaceCheckoutDraft(
            company_id=current_user.empresa_id,
            user_id=current_user.id,
            status="open",
            payment_method=(payload.payment_method or "").strip() or None,
            currency=snapshot["currency"],
            total=Decimal(snapshot["total"]),
            snapshot_json=snapshot,
            notes=payload.notes,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=self.CHECKOUT_DRAFT_TTL_MINUTES),
            last_activity_at=datetime.now(timezone.utc),
        )
        db.add(draft)
        db.flush()

        if draft.payment_method:
            payment_attempt = MarketplacePaymentAttempt(
                checkout_draft_id=draft.id,
                payment_method=draft.payment_method,
                payment_provider=draft.payment_method,
                status="draft",
                amount=draft.total,
                currency=draft.currency,
                environment_mode="pending_configuration",
                payload_json={"draft_snapshot": snapshot},
            )
            db.add(payment_attempt)

        db.commit()
        db.refresh(draft)
        return draft

    def list_own_checkout_drafts(self, db: Session, current_user: Usuario):
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        return (
            db.query(MarketplaceCheckoutDraft)
            .filter(MarketplaceCheckoutDraft.user_id == current_user.id)
            .order_by(MarketplaceCheckoutDraft.created_at.desc(), MarketplaceCheckoutDraft.id.desc())
            .all()
        )

    def _get_payment_method_record(self, db: Session, slug: str) -> MarketplacePaymentMethod:
        marketplace_service._seed_payment_methods_if_missing(db)
        method = (
            db.query(MarketplacePaymentMethod)
            .filter(MarketplacePaymentMethod.slug == slug)
            .first()
        )
        if not method:
            raise HTTPException(status_code=404, detail="Forma de pago no encontrada.")
        marketplace_service._sync_payment_method_readiness(method)
        return method

    def _expire_stale_checkout_drafts(self, db: Session, *, company_id: int | None = None, user_id: int | None = None) -> int:
        now = datetime.now(timezone.utc)
        query = (
            db.query(MarketplaceCheckoutDraft)
            .options(joinedload(MarketplaceCheckoutDraft.payment_attempts))
            .filter(
                MarketplaceCheckoutDraft.status == "open",
                MarketplaceCheckoutDraft.expires_at.isnot(None),
                MarketplaceCheckoutDraft.expires_at < now,
            )
        )
        if company_id is not None:
            query = query.filter(MarketplaceCheckoutDraft.company_id == company_id)
        if user_id is not None:
            query = query.filter(MarketplaceCheckoutDraft.user_id == user_id)

        drafts = query.all()
        if not drafts:
            return 0

        expired_count = 0
        for draft in drafts:
            draft.status = "expired"
            draft.last_activity_at = now
            db.add(draft)
            expired_count += 1

            for attempt in list(draft.payment_attempts or []):
                if (attempt.status or "").strip().lower() not in self.ONLINE_PAYMENT_STALE_STATUSES:
                    continue
                attempt.status = "expired"
                attempt.payload_json = {
                    **dict(attempt.payload_json or {}),
                    "expired_at": now.isoformat(),
                    "expired_reason": "checkout_draft_timeout",
                }
                db.add(attempt)
                db.flush()
                db.add(MarketplacePaymentEvent(
                    payment_attempt_id=attempt.id,
                    provider=attempt.payment_provider or attempt.payment_method,
                    event_type="checkout_draft_expired",
                    event_origin="system",
                    correlation_id=str(draft.id),
                    payload_json={
                        "checkout_draft_id": draft.id,
                        "payment_attempt_id": attempt.id,
                    },
                    processed_at=now,
                ))

        db.commit()
        return expired_count

    def _expire_stale_bank_transfer_orders(self, db: Session) -> int:
        now = datetime.now(timezone.utc)
        deadline = now - timedelta(hours=self.BANK_TRANSFER_REVIEW_TTL_HOURS)
        orders = (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.payment_attempts))
            .filter(
                MarketplaceOrder.status == "awaiting_manual_validation",
                MarketplaceOrder.created_at.isnot(None),
                MarketplaceOrder.created_at < deadline,
            )
            .all()
        )
        if not orders:
            return 0

        expired_count = 0
        for order in orders:
            payment_attempt = next(
                (attempt for attempt in (order.payment_attempts or []) if (attempt.payment_method or "").strip().lower() == "bank_transfer"),
                None,
            )
            if not payment_attempt:
                continue
            order.status = "expired"
            order.notes = str(order.notes or "").strip() or "Pedido expirado por falta de validación bancaria en el plazo operativo."
            payment_attempt.status = "expired"
            payment_attempt.payload_json = {
                **dict(payment_attempt.payload_json or {}),
                "expired_at": now.isoformat(),
                "expired_reason": "bank_transfer_review_timeout",
            }
            db.add(order)
            db.add(payment_attempt)
            db.flush()
            db.add(MarketplacePaymentEvent(
                payment_attempt_id=payment_attempt.id,
                provider="manual",
                event_type="bank_transfer_expired",
                event_origin="system",
                correlation_id=str(order.id),
                payload_json={
                    "order_id": order.id,
                    "expired_reason": "bank_transfer_review_timeout",
                },
                processed_at=now,
            ))
            expired_count += 1

        db.commit()
        return expired_count

    def _collect_payment_housekeeping_counts(self, db: Session) -> dict:
        now = datetime.now(timezone.utc)
        checkout_deadline = now
        bank_deadline = now - timedelta(hours=self.BANK_TRANSFER_REVIEW_TTL_HOURS)

        stale_checkout_drafts_count = (
            db.query(MarketplaceCheckoutDraft)
            .filter(
                MarketplaceCheckoutDraft.status == "open",
                MarketplaceCheckoutDraft.expires_at.isnot(None),
                MarketplaceCheckoutDraft.expires_at < checkout_deadline,
            )
            .count()
        )
        stale_bank_transfer_orders_count = (
            db.query(MarketplaceOrder)
            .filter(
                MarketplaceOrder.status == "awaiting_manual_validation",
                MarketplaceOrder.created_at.isnot(None),
                MarketplaceOrder.created_at < bank_deadline,
            )
            .count()
        )
        open_checkout_drafts_count = (
            db.query(MarketplaceCheckoutDraft)
            .filter(
                MarketplaceCheckoutDraft.status == "open",
                MarketplaceCheckoutDraft.expires_at.isnot(None),
                MarketplaceCheckoutDraft.expires_at >= checkout_deadline,
            )
            .count()
        )
        awaiting_manual_validation_count = (
            db.query(MarketplaceOrder)
            .filter(MarketplaceOrder.status == "awaiting_manual_validation")
            .count()
        )
        online_payment_waiting_count = (
            db.query(MarketplacePaymentAttempt)
            .filter(
                MarketplacePaymentAttempt.payment_method.in_(tuple(self.ONLINE_PROVIDER_METHODS)),
                MarketplacePaymentAttempt.status.in_(tuple(self.ONLINE_PAYMENT_STALE_STATUSES)),
            )
            .count()
        )

        orders_with_open_refund_window_count = 0
        completed_orders = (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items))
            .filter(MarketplaceOrder.status == "completed")
            .all()
        )
        for order in completed_orders:
            if self._summarize_refund_policy(order)["refund_window_open"]:
                orders_with_open_refund_window_count += 1

        return {
            "stale_checkout_drafts_count": stale_checkout_drafts_count,
            "stale_bank_transfer_orders_count": stale_bank_transfer_orders_count,
            "open_checkout_drafts_count": open_checkout_drafts_count,
            "awaiting_manual_validation_count": awaiting_manual_validation_count,
            "online_payment_waiting_count": online_payment_waiting_count,
            "orders_with_open_refund_window_count": orders_with_open_refund_window_count,
        }

    def get_payment_housekeeping_summary(self, db: Session, current_user: Usuario, *, run_actions: bool = False) -> dict:
        marketplace_service._validate_marketplace_admin_access(current_user)
        expired_checkout_drafts_count = 0
        expired_bank_transfer_orders_count = 0
        if run_actions:
            expired_checkout_drafts_count = self._expire_stale_checkout_drafts(db)
            expired_bank_transfer_orders_count = self._expire_stale_bank_transfer_orders(db)

        counts = self._collect_payment_housekeeping_counts(db)
        return {
            "generated_at": datetime.now(timezone.utc),
            "expired_checkout_drafts_count": expired_checkout_drafts_count,
            "expired_bank_transfer_orders_count": expired_bank_transfer_orders_count,
            **counts,
        }

    def _assert_checkout_draft_is_active(self, draft: MarketplaceCheckoutDraft) -> None:
        status = (draft.status or "").strip().lower()
        if status == "expired":
            raise HTTPException(
                status_code=400,
                detail="La sesión de compra expiró. Vuelve a abrir el carrito para preparar un nuevo checkout.",
            )
        if status != "open":
            raise HTTPException(status_code=400, detail="Este checkout draft ya fue procesado.")

        if draft.expires_at and draft.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="La sesión de compra expiró. Vuelve a abrir el carrito para preparar un nuevo checkout.",
            )

    def _build_payphone_reference(self, normalized_lines: list[dict]) -> str:
        first_product = normalized_lines[0]["product"] if normalized_lines else None
        first_title = str(first_product.titulo if first_product else "Marketplace GiProy").strip()
        compact_title = " ".join(first_title.split())
        if len(compact_title) > 72:
            compact_title = f"{compact_title[:69].rstrip()}..."
        return f"Marketplace GiProy · {compact_title}"

    def _build_payphone_geolocation(self, buyer: Usuario, normalized_lines: list[dict]) -> dict:
        for line in normalized_lines:
            product = line["product"]
            if (product.product_type or "").strip().lower() != "portal_compras_publicas":
                continue
            preview = self._extract_product_preview(product)
            portal_meta = dict(preview.get("portal_meta") or {})
            geo = self._resolve_portal_project_geolocation(portal_meta)
            if geo.get("lat") is not None and geo.get("lng") is not None:
                return geo
        return {"lat": None, "lng": None}

    def _complete_confirmed_order(
        self,
        db: Session,
        *,
        draft: MarketplaceCheckoutDraft,
        payment_attempt: MarketplacePaymentAttempt,
        buyer: Usuario,
        notes: str,
    ) -> MarketplaceOrder:
        normalized_lines = self._resolve_products_from_snapshot(db, dict(draft.snapshot_json or {}))
        total = Decimal("0.00")
        for line in normalized_lines:
            total += Decimal(str(line["product"].precio or 0)) * Decimal(int(line["quantity"]))
        total = total.quantize(Decimal("0.01"))

        commission = (total * self.PLATFORM_COMMISSION_RATE).quantize(Decimal("0.01"))
        seller_amount = (total * self.SELLER_RATE).quantize(Decimal("0.01"))
        order = MarketplaceOrder(
            buyer_user_id=buyer.id,
            total=total,
            commission_amount=commission,
            seller_amount=seller_amount,
            currency=draft.currency or "USD",
            status="completed",
            notes=notes,
        )
        db.add(order)
        db.flush()

        product_sales_counter: dict[int, int] = {}
        for line in normalized_lines:
            product = line["product"]
            quantity = int(line["quantity"])
            for _ in range(quantity):
                delivered_type, delivered_id = self._fulfill_product(db, product, buyer, None)
                item = MarketplaceOrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    seller_user_id=product.seller_user_id,
                    product_title_snapshot=product.titulo,
                    product_type_snapshot=product.product_type,
                    source_type_snapshot=product.source_type,
                    source_id_snapshot=product.source_id,
                    delivered_entity_type=delivered_type,
                    delivered_entity_id=delivered_id,
                    price=product.precio,
                )
                db.add(item)
                db.flush()

                if delivered_type and delivered_id and delivered_type != "empresa_licencia":
                    origin_metadata = {
                        "product_type": product.product_type,
                        "product_kind": product.product_kind,
                    }
                    if product.product_type == "portal_compras_publicas":
                        preview = self._extract_product_preview(product)
                        portal_meta = dict(preview.get("portal_meta") or {})
                        origin_metadata.update(
                            {
                                "template_version": portal_meta.get("template_version"),
                                "processing_status": portal_meta.get("processing_status"),
                                "delivery_mode": portal_meta.get("delivery_mode"),
                                "import_analysis": dict(portal_meta.get("import_analysis") or {}),
                                "project_delivery_policy": dict(portal_meta.get("project_delivery_policy") or {}),
                                "delivery_preview": dict(portal_meta.get("delivery_preview") or {}),
                            }
                        )
                    self._register_delivered_asset_origins(
                        db,
                        buyer=buyer,
                        product=product,
                        order_id=order.id,
                        order_item_id=item.id,
                        delivered_type=delivered_type,
                        delivered_id=delivered_id,
                        origin_metadata=origin_metadata,
                    )
                product_sales_counter[product.id] = product_sales_counter.get(product.id, 0) + 1

        if product_sales_counter:
            products = (
                db.query(MarketplaceProduct)
                .filter(MarketplaceProduct.id.in_(list(product_sales_counter.keys())))
                .all()
            )
            for product in products:
                product.ventas_count = int(product.ventas_count or 0) + product_sales_counter.get(product.id, 0)
                db.add(product)

        payment_attempt.order_id = order.id
        db.add(payment_attempt)

        draft.status = "submitted"
        draft.last_activity_at = datetime.now(timezone.utc)
        db.add(draft)
        db.flush()
        return order

    def _resolve_paypal_base_url(self, environment_mode: str | None) -> str:
        return (
            self.PAYPAL_SANDBOX_BASE_URL
            if (environment_mode or "").strip().lower() == "sandbox"
            else self.PAYPAL_PRODUCTION_BASE_URL
        )

    def _paypal_http_request(
        self,
        *,
        method: str,
        url: str,
        client_id: str,
        client_secret: str,
        headers: dict | None = None,
        json: dict | None = None,
        data: dict | None = None,
    ) -> httpx.Response:
        basic_token = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("utf-8")
        token_headers = {
            "Authorization": f"Basic {basic_token}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                token_response = client.post(
                    f"{url}/v1/oauth2/token",
                    headers=token_headers,
                    data={"grant_type": "client_credentials"},
                )
                token_response.raise_for_status()
                access_token = dict(token_response.json() or {}).get("access_token")
                if not access_token:
                    raise HTTPException(status_code=502, detail="PayPal no devolvió un access token válido.")

                request_headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                    **(headers or {}),
                }
                response = client.request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    json=json,
                    data=data,
                )
                return response
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"No se pudo comunicar con PayPal: {exc}") from exc

    def prepare_payphone_checkout(
        self,
        db: Session,
        checkout_draft_id: int,
        current_user: Usuario,
    ) -> dict:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        draft = (
            db.query(MarketplaceCheckoutDraft)
            .options(joinedload(MarketplaceCheckoutDraft.payment_attempts))
            .filter(
                MarketplaceCheckoutDraft.id == checkout_draft_id,
                MarketplaceCheckoutDraft.user_id == current_user.id,
                MarketplaceCheckoutDraft.company_id == current_user.empresa_id,
            )
            .first()
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Checkout draft no encontrado.")
        if (draft.payment_method or "").strip().lower() != "payphone":
            raise HTTPException(status_code=400, detail="Este checkout draft no corresponde a PayPhone.")
        self._assert_checkout_draft_is_active(draft)

        method = self._get_payment_method_record(db, "payphone")
        if not method.is_active:
            raise HTTPException(status_code=400, detail="PayPhone no está activo actualmente.")
        if (method.readiness_status or "").strip().lower() not in {"sandbox_ready", "production_ready"}:
            raise HTTPException(status_code=400, detail="PayPhone aún no está configurado completamente.")

        config = marketplace_service._coerce_payment_method_config(method.config_json)
        normalized_lines = self._resolve_products_from_snapshot(db, dict(draft.snapshot_json or {}))
        total = Decimal("0.00")
        for line in normalized_lines:
            total += Decimal(str(line["product"].precio or 0)) * Decimal(int(line["quantity"]))
        total = total.quantize(Decimal("0.01"))
        amount_cents = int((total * Decimal("100")).quantize(Decimal("1")))

        client_transaction_id = f"GIPROY-{draft.id}-{uuid4().hex[:20].upper()}"
        idempotency_key = uuid4().hex
        geolocation = self._build_payphone_geolocation(current_user, normalized_lines)

        payment_attempt = draft.payment_attempts[0] if draft.payment_attempts else MarketplacePaymentAttempt(
            checkout_draft_id=draft.id,
            payment_method="payphone",
            payment_provider="payphone",
            amount=total,
            currency=draft.currency or "USD",
        )
        payment_attempt.status = "pending_customer_action"
        payment_attempt.payment_provider = "payphone"
        payment_attempt.amount = total
        payment_attempt.currency = draft.currency or "USD"
        payment_attempt.client_transaction_id = client_transaction_id
        payment_attempt.idempotency_key = idempotency_key
        payment_attempt.config_version = method.config_version or "v1"
        payment_attempt.environment_mode = method.environment_mode or "sandbox"
        payment_attempt.payload_json = {
            "buyer_company_id": current_user.empresa_id,
            "buyer_user_id": current_user.id,
            "draft_snapshot": dict(draft.snapshot_json or {}),
            "reference": self._build_payphone_reference(normalized_lines),
            "return_url": str(config.get("return_url") or "").strip() or None,
            "store_id": str(config.get("store_id") or "").strip() or None,
            "amount_cents": amount_cents,
        }
        db.add(payment_attempt)
        db.flush()

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="payphone",
            event_type="payphone_prepared",
            event_origin="checkout",
            correlation_id=client_transaction_id,
            payload_json={
                "checkout_draft_id": draft.id,
                "amount_cents": amount_cents,
                "environment_mode": payment_attempt.environment_mode,
            },
            processed_at=datetime.now(timezone.utc),
        ))

        draft.last_activity_at = datetime.now(timezone.utc)
        db.add(draft)
        db.commit()

        identification_type = 1
        document_id = str(getattr(current_user.empresa, "ruc", "") or "").strip() or None
        if document_id and len(document_id) > 13:
            document_id = document_id[:13]

        return {
            "checkout_draft_id": draft.id,
            "payment_attempt_id": payment_attempt.id,
            "environment_mode": payment_attempt.environment_mode or "sandbox",
            "token": str(config.get("token") or "").strip(),
            "store_id": str(config.get("store_id") or "").strip(),
            "client_transaction_id": client_transaction_id,
            "amount": amount_cents,
            "amount_without_tax": amount_cents,
            "currency": draft.currency or "USD",
            "reference": payment_attempt.payload_json.get("reference"),
            "lang": "es",
            "default_method": "card",
            "time_zone": -5,
            "phone_number": str(current_user.movil or "").strip() or None,
            "email": str(current_user.email or "").strip() or None,
            "document_id": document_id,
            "identification_type": identification_type,
            "lat": str(geolocation.get("lat")) if geolocation.get("lat") is not None else None,
            "lng": str(geolocation.get("lng")) if geolocation.get("lng") is not None else None,
        }

    def confirm_payphone_checkout(
        self,
        db: Session,
        *,
        payphone_id: int,
        client_transaction_id: str,
        current_user: Usuario,
    ) -> dict:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        normalized_client_tx = str(client_transaction_id or "").strip()
        if not normalized_client_tx:
            raise HTTPException(status_code=400, detail="Debes indicar el clientTransactionId de PayPhone.")

        payment_attempt = (
            db.query(MarketplacePaymentAttempt)
            .options(joinedload(MarketplacePaymentAttempt.checkout_draft))
            .filter(
                MarketplacePaymentAttempt.client_transaction_id == normalized_client_tx,
                MarketplacePaymentAttempt.payment_method == "payphone",
            )
            .first()
        )
        if not payment_attempt:
            raise HTTPException(status_code=404, detail="No se encontró un intento PayPhone asociado a esa transacción.")

        draft = payment_attempt.checkout_draft
        if not draft or draft.user_id != current_user.id or draft.company_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="La transacción de PayPhone no pertenece al usuario actual.")
        self._assert_checkout_draft_is_active(draft)

        if (payment_attempt.status or "").strip().lower() == "confirmed" and payment_attempt.order_id:
            existing_order = (
                db.query(MarketplaceOrder)
                .options(joinedload(MarketplaceOrder.items), joinedload(MarketplaceOrder.payment_attempts))
                .filter(MarketplaceOrder.id == payment_attempt.order_id)
                .first()
            )
            return {
                "transaction_status": "Approved",
                "status_code": 3,
                "message": "La transacción PayPhone ya estaba confirmada.",
                "order": existing_order,
                "payment_attempt_id": payment_attempt.id,
                "provider_transaction_id": payment_attempt.provider_transaction_id,
                "authorization_code": dict(payment_attempt.payload_json or {}).get("authorization_code"),
            }

        method = self._get_payment_method_record(db, "payphone")
        config = marketplace_service._coerce_payment_method_config(method.config_json)
        bearer_token = str(config.get("token") or "").strip()
        if not bearer_token:
            raise HTTPException(status_code=400, detail="PayPhone no tiene token configurado para confirmación.")

        try:
            with httpx.Client(timeout=25.0) as client:
                response = client.post(
                    self.PAYPHONE_CONFIRM_URL,
                    headers={
                        "Authorization": f"Bearer {bearer_token}",
                        "Content-Type": "application/json",
                    },
                    json={"id": int(payphone_id), "clientTxId": normalized_client_tx},
                )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail=f"No se pudo confirmar la transacción con PayPhone: {exc}") from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"PayPhone rechazó la confirmación con estado HTTP {response.status_code}.",
            )

        result = dict(response.json() or {})
        status_code = int(result.get("statusCode") or 0)
        transaction_status = str(result.get("transactionStatus") or "").strip() or "Unknown"

        payment_attempt.provider_order_id = str(payphone_id)
        payment_attempt.provider_transaction_id = str(result.get("transactionId") or "").strip() or None
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "confirm_response": result,
            "authorization_code": result.get("authorizationCode"),
            "confirmed_at": datetime.now(timezone.utc).isoformat(),
        }
        db.add(payment_attempt)
        db.flush()

        if status_code != 3 or transaction_status.lower() != "approved":
            payment_attempt.status = "canceled" if status_code == 2 else "failed"
            db.add(payment_attempt)
            db.add(MarketplacePaymentEvent(
                payment_attempt_id=payment_attempt.id,
                provider="payphone",
                event_type="payphone_confirmation_failed" if status_code != 2 else "payphone_canceled",
                event_origin="return_url",
                correlation_id=str(payphone_id),
                payload_json=result,
                processed_at=datetime.now(timezone.utc),
            ))
            draft.last_activity_at = datetime.now(timezone.utc)
            db.add(draft)
            db.commit()
            return {
                "transaction_status": transaction_status or "Canceled",
                "status_code": status_code or None,
                "message": str(result.get("message") or "La transacción PayPhone no fue aprobada."),
                "order": None,
                "payment_attempt_id": payment_attempt.id,
                "provider_transaction_id": payment_attempt.provider_transaction_id,
                "authorization_code": result.get("authorizationCode"),
            }

        normalized_lines = self._resolve_products_from_snapshot(db, dict(draft.snapshot_json or {}))
        total = Decimal("0.00")
        for line in normalized_lines:
            total += Decimal(str(line["product"].precio or 0)) * Decimal(int(line["quantity"]))
        total = total.quantize(Decimal("0.01"))

        if Decimal(str(result.get("amount") or 0)).quantize(Decimal("0.01")) != total:
            raise HTTPException(status_code=400, detail="El monto confirmado por PayPhone no coincide con el checkout draft.")
        order = self._complete_confirmed_order(
            db,
            draft=draft,
            payment_attempt=payment_attempt,
            buyer=current_user,
            notes="Compra confirmada con PayPhone.",
        )
        payment_attempt.status = "confirmed"
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "confirmed_by_provider": True,
            "buyer_email": result.get("email"),
            "buyer_phone_number": result.get("phoneNumber"),
            "buyer_document": result.get("document"),
            "authorization_code": result.get("authorizationCode"),
        }
        db.add(payment_attempt)

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="payphone",
            event_type="payphone_confirmed",
            event_origin="return_url",
            correlation_id=str(payphone_id),
            payload_json=result,
            processed_at=datetime.now(timezone.utc),
        ))
        db.commit()

        confirmed_order = (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items), joinedload(MarketplaceOrder.payment_attempts))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )
        return {
            "transaction_status": transaction_status,
            "status_code": status_code,
            "message": str(result.get("message") or "Transacción aprobada."),
            "order": confirmed_order,
            "payment_attempt_id": payment_attempt.id,
            "provider_transaction_id": payment_attempt.provider_transaction_id,
            "authorization_code": result.get("authorizationCode"),
        }

    def prepare_paypal_checkout(
        self,
        db: Session,
        checkout_draft_id: int,
        current_user: Usuario,
    ) -> dict:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        draft = (
            db.query(MarketplaceCheckoutDraft)
            .options(joinedload(MarketplaceCheckoutDraft.payment_attempts))
            .filter(
                MarketplaceCheckoutDraft.id == checkout_draft_id,
                MarketplaceCheckoutDraft.user_id == current_user.id,
                MarketplaceCheckoutDraft.company_id == current_user.empresa_id,
            )
            .first()
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Checkout draft no encontrado.")
        if (draft.payment_method or "").strip().lower() != "paypal":
            raise HTTPException(status_code=400, detail="Este checkout draft no corresponde a PayPal.")
        self._assert_checkout_draft_is_active(draft)

        method = self._get_payment_method_record(db, "paypal")
        if not method.is_active:
            raise HTTPException(status_code=400, detail="PayPal no está activo actualmente.")
        if (method.readiness_status or "").strip().lower() not in {"sandbox_ready", "production_ready"}:
            raise HTTPException(status_code=400, detail="PayPal aún no está configurado completamente.")

        config = marketplace_service._coerce_payment_method_config(method.config_json)
        payment_attempt = draft.payment_attempts[0] if draft.payment_attempts else MarketplacePaymentAttempt(
            checkout_draft_id=draft.id,
            payment_method="paypal",
            payment_provider="paypal",
            amount=draft.total,
            currency=draft.currency or "USD",
        )
        payment_attempt.status = "pending_customer_action"
        payment_attempt.payment_provider = "paypal"
        payment_attempt.config_version = method.config_version or "v1"
        payment_attempt.environment_mode = method.environment_mode or "sandbox"
        payment_attempt.idempotency_key = payment_attempt.idempotency_key or uuid4().hex
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "buyer_company_id": current_user.empresa_id,
            "buyer_user_id": current_user.id,
            "draft_snapshot": dict(draft.snapshot_json or {}),
        }
        db.add(payment_attempt)
        db.flush()

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="paypal",
            event_type="paypal_prepared",
            event_origin="checkout",
            correlation_id=payment_attempt.idempotency_key,
            payload_json={"checkout_draft_id": draft.id},
            processed_at=datetime.now(timezone.utc),
        ))
        draft.last_activity_at = datetime.now(timezone.utc)
        db.add(draft)
        db.commit()

        return {
            "checkout_draft_id": draft.id,
            "payment_attempt_id": payment_attempt.id,
            "environment_mode": payment_attempt.environment_mode or "sandbox",
            "client_id": str(config.get("client_id") or "").strip(),
            "currency": draft.currency or "USD",
            "intent": "CAPTURE",
            "sdk_components": "buttons",
        }

    def create_paypal_order(
        self,
        db: Session,
        *,
        checkout_draft_id: int,
        current_user: Usuario,
    ) -> dict:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        draft = (
            db.query(MarketplaceCheckoutDraft)
            .options(joinedload(MarketplaceCheckoutDraft.payment_attempts))
            .filter(
                MarketplaceCheckoutDraft.id == checkout_draft_id,
                MarketplaceCheckoutDraft.user_id == current_user.id,
                MarketplaceCheckoutDraft.company_id == current_user.empresa_id,
            )
            .first()
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Checkout draft no encontrado.")
        if (draft.payment_method or "").strip().lower() != "paypal":
            raise HTTPException(status_code=400, detail="Este checkout draft no corresponde a PayPal.")
        self._assert_checkout_draft_is_active(draft)

        method = self._get_payment_method_record(db, "paypal")
        config = marketplace_service._coerce_payment_method_config(method.config_json)
        client_id = str(config.get("client_id") or "").strip()
        client_secret = str(config.get("client_secret") or "").strip()
        if not client_id or not client_secret:
            raise HTTPException(status_code=400, detail="PayPal no tiene credenciales completas.")

        payment_attempt = draft.payment_attempts[0] if draft.payment_attempts else None
        if not payment_attempt:
            raise HTTPException(status_code=400, detail="Este checkout draft no tiene intento PayPal preparado.")
        if payment_attempt.provider_order_id:
            return {
                "paypal_order_id": payment_attempt.provider_order_id,
                "payment_attempt_id": payment_attempt.id,
                "status": payment_attempt.status,
            }

        normalized_lines = self._resolve_products_from_snapshot(db, dict(draft.snapshot_json or {}))
        total = Decimal("0.00")
        for line in normalized_lines:
            total += Decimal(str(line["product"].precio or 0)) * Decimal(int(line["quantity"]))
        total = total.quantize(Decimal("0.01"))

        request_id = f"giproy-paypal-{draft.id}-{uuid4().hex[:18]}"
        base_url = self._resolve_paypal_base_url(method.environment_mode)
        response = self._paypal_http_request(
            method="POST",
            url=f"{base_url}/v2/checkout/orders",
            client_id=client_id,
            client_secret=client_secret,
            headers={"PayPal-Request-Id": request_id},
            json={
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": f"checkout-draft-{draft.id}",
                        "description": self._build_payphone_reference(normalized_lines),
                        "amount": {
                            "currency_code": draft.currency or "USD",
                            "value": f"{total:.2f}",
                        },
                    }
                ],
            },
        )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"PayPal rechazó la creación de la orden con estado HTTP {response.status_code}.",
            )
        payload = dict(response.json() or {})
        paypal_order_id = str(payload.get("id") or "").strip()
        if not paypal_order_id:
            raise HTTPException(status_code=502, detail="PayPal no devolvió un identificador de orden válido.")

        payment_attempt.provider_order_id = paypal_order_id
        payment_attempt.client_transaction_id = request_id
        payment_attempt.status = str(payload.get("status") or "CREATED")
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "paypal_create_order_response": payload,
        }
        db.add(payment_attempt)
        db.flush()
        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="paypal",
            event_type="paypal_order_created",
            event_origin="checkout",
            correlation_id=paypal_order_id,
            payload_json=payload,
            processed_at=datetime.now(timezone.utc),
        ))
        db.commit()
        return {
            "paypal_order_id": paypal_order_id,
            "payment_attempt_id": payment_attempt.id,
            "status": payment_attempt.status,
        }

    def capture_paypal_order(
        self,
        db: Session,
        *,
        paypal_order_id: str,
        current_user: Usuario,
    ) -> dict:
        self._ensure_buyer_access(current_user)
        self._expire_stale_checkout_drafts(db, company_id=current_user.empresa_id, user_id=current_user.id)
        normalized_order_id = str(paypal_order_id or "").strip()
        if not normalized_order_id:
            raise HTTPException(status_code=400, detail="Debes indicar la orden PayPal a capturar.")

        payment_attempt = (
            db.query(MarketplacePaymentAttempt)
            .options(joinedload(MarketplacePaymentAttempt.checkout_draft))
            .filter(
                MarketplacePaymentAttempt.provider_order_id == normalized_order_id,
                MarketplacePaymentAttempt.payment_method == "paypal",
            )
            .first()
        )
        if not payment_attempt:
            raise HTTPException(status_code=404, detail="No se encontró un intento PayPal asociado a esa orden.")

        draft = payment_attempt.checkout_draft
        if not draft or draft.user_id != current_user.id or draft.company_id != current_user.empresa_id:
            raise HTTPException(status_code=403, detail="La orden de PayPal no pertenece al usuario actual.")
        self._assert_checkout_draft_is_active(draft)

        if (payment_attempt.status or "").strip().lower() == "completed" and payment_attempt.order_id:
            existing_order = (
                db.query(MarketplaceOrder)
                .options(joinedload(MarketplaceOrder.items), joinedload(MarketplaceOrder.payment_attempts))
                .filter(MarketplaceOrder.id == payment_attempt.order_id)
                .first()
            )
            return {
                "capture_status": "COMPLETED",
                "order": existing_order,
                "payment_attempt_id": payment_attempt.id,
                "provider_transaction_id": payment_attempt.provider_transaction_id,
                "authorization_code": dict(payment_attempt.payload_json or {}).get("authorization_code"),
                "message": "La orden de PayPal ya estaba capturada.",
            }

        method = self._get_payment_method_record(db, "paypal")
        config = marketplace_service._coerce_payment_method_config(method.config_json)
        client_id = str(config.get("client_id") or "").strip()
        client_secret = str(config.get("client_secret") or "").strip()
        base_url = self._resolve_paypal_base_url(method.environment_mode)
        request_id = f"giproy-paypal-capture-{normalized_order_id}-{uuid4().hex[:12]}"
        response = self._paypal_http_request(
            method="POST",
            url=f"{base_url}/v2/checkout/orders/{normalized_order_id}/capture",
            client_id=client_id,
            client_secret=client_secret,
            headers={"PayPal-Request-Id": request_id},
            json={},
        )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"PayPal rechazó la captura de la orden con estado HTTP {response.status_code}.",
            )
        payload = dict(response.json() or {})
        capture_status = str(payload.get("status") or "").strip() or "UNKNOWN"

        purchase_units = list(payload.get("purchase_units") or [])
        first_unit = purchase_units[0] if purchase_units else {}
        payments = dict(first_unit.get("payments") or {})
        captures = list(payments.get("captures") or [])
        first_capture = captures[0] if captures else {}
        capture_id = str(first_capture.get("id") or "").strip() or None

        if capture_status != "COMPLETED":
            payment_attempt.status = capture_status or "FAILED"
            payment_attempt.payload_json = {
                **dict(payment_attempt.payload_json or {}),
                "paypal_capture_response": payload,
            }
            db.add(payment_attempt)
            db.add(MarketplacePaymentEvent(
                payment_attempt_id=payment_attempt.id,
                provider="paypal",
                event_type="paypal_capture_failed",
                event_origin="checkout",
                correlation_id=normalized_order_id,
                payload_json=payload,
                processed_at=datetime.now(timezone.utc),
            ))
            db.commit()
            return {
                "capture_status": capture_status,
                "order": None,
                "payment_attempt_id": payment_attempt.id,
                "provider_transaction_id": capture_id,
                "authorization_code": None,
                "message": "La captura de PayPal no se completó correctamente.",
            }

        order = self._complete_confirmed_order(
            db,
            draft=draft,
            payment_attempt=payment_attempt,
            buyer=current_user,
            notes="Compra confirmada con PayPal.",
        )
        payment_attempt.status = "completed"
        payment_attempt.provider_transaction_id = capture_id
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "paypal_capture_response": payload,
            "captured_at": datetime.now(timezone.utc).isoformat(),
            "authorization_code": capture_id,
        }
        db.add(payment_attempt)
        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="paypal",
            event_type="paypal_captured",
            event_origin="checkout",
            correlation_id=normalized_order_id,
            payload_json=payload,
            processed_at=datetime.now(timezone.utc),
        ))
        db.commit()

        confirmed_order = (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items), joinedload(MarketplaceOrder.payment_attempts))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )
        return {
            "capture_status": capture_status,
            "order": confirmed_order,
            "payment_attempt_id": payment_attempt.id,
            "provider_transaction_id": capture_id,
            "authorization_code": capture_id,
            "message": "La orden de PayPal se capturó correctamente.",
        }

    def submit_bank_transfer_checkout(
        self,
        db: Session,
        payload: MarketplaceBankTransferCheckoutCreate,
        current_user: Usuario,
    ) -> MarketplaceOrder:
        self._ensure_buyer_access(current_user)
        self._expire_stale_bank_transfer_orders(db)
        draft = (
            db.query(MarketplaceCheckoutDraft)
            .options(joinedload(MarketplaceCheckoutDraft.payment_attempts))
            .filter(
                MarketplaceCheckoutDraft.id == payload.checkout_draft_id,
                MarketplaceCheckoutDraft.user_id == current_user.id,
                MarketplaceCheckoutDraft.company_id == current_user.empresa_id,
            )
            .first()
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Checkout draft no encontrado.")
        if (draft.payment_method or "").strip().lower() != "bank_transfer":
            raise HTTPException(status_code=400, detail="Este checkout draft no corresponde a transferencia bancaria.")
        if (draft.status or "").strip().lower() != "open":
            raise HTTPException(status_code=400, detail="Este checkout draft ya fue procesado.")

        transfer_reference = str(payload.transfer_reference or "").strip()
        if not transfer_reference:
            raise HTTPException(status_code=400, detail="Debes indicar la referencia de la transferencia.")

        normalized_lines = self._resolve_products_from_snapshot(db, dict(draft.snapshot_json or {}))
        total = Decimal("0.00")
        for line in normalized_lines:
            total += Decimal(str(line["product"].precio or 0)) * Decimal(int(line["quantity"]))
        total = total.quantize(Decimal("0.01"))

        commission = (total * self.PLATFORM_COMMISSION_RATE).quantize(Decimal("0.01"))
        seller_amount = (total * self.SELLER_RATE).quantize(Decimal("0.01"))
        order = MarketplaceOrder(
            buyer_user_id=current_user.id,
            total=total,
            commission_amount=commission,
            seller_amount=seller_amount,
            currency=draft.currency or "USD",
            status="awaiting_manual_validation",
            notes=str(payload.notes or draft.notes or "").strip() or "Pedido pendiente de validación por transferencia bancaria.",
        )
        db.add(order)
        db.flush()

        for line in normalized_lines:
            product = line["product"]
            quantity = int(line["quantity"])
            for _ in range(quantity):
                db.add(MarketplaceOrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    seller_user_id=product.seller_user_id,
                    product_title_snapshot=product.titulo,
                    product_type_snapshot=product.product_type,
                    source_type_snapshot=product.source_type,
                    source_id_snapshot=product.source_id,
                    delivered_entity_type=None,
                    delivered_entity_id=None,
                    price=product.precio,
                ))

        payment_attempt = draft.payment_attempts[0] if draft.payment_attempts else MarketplacePaymentAttempt(
            checkout_draft_id=draft.id,
            payment_method="bank_transfer",
            payment_provider="manual",
            amount=total,
            currency=draft.currency or "USD",
        )
        payment_attempt.order_id = order.id
        payment_attempt.status = "awaiting_manual_validation"
        payment_attempt.environment_mode = "manual"
        payment_attempt.payload_json = {
            "transfer_reference": transfer_reference,
            "transfer_date": str(payload.transfer_date or "").strip() or None,
            "buyer_company_id": current_user.empresa_id,
            "buyer_user_id": current_user.id,
            "draft_snapshot": dict(draft.snapshot_json or {}),
        }
        db.add(payment_attempt)
        db.flush()

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="manual",
            event_type="bank_transfer_submitted",
            event_origin="checkout",
            correlation_id=transfer_reference,
            payload_json={
                "checkout_draft_id": draft.id,
                "order_id": order.id,
                "transfer_reference": transfer_reference,
                "transfer_date": str(payload.transfer_date or "").strip() or None,
            },
            processed_at=datetime.now(timezone.utc),
        ))

        draft.status = "submitted"
        draft.last_activity_at = datetime.now(timezone.utc)
        db.add(draft)

        db.commit()
        return (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )

    def _get_admin_order_with_payment(self, db: Session, order_id: int, current_user: Usuario) -> MarketplaceOrder:
        marketplace_service._validate_marketplace_admin_access(current_user)
        order = (
            db.query(MarketplaceOrder)
            .options(
                joinedload(MarketplaceOrder.items),
                joinedload(MarketplaceOrder.buyer),
                joinedload(MarketplaceOrder.payment_attempts).joinedload(MarketplacePaymentAttempt.events),
            )
            .filter(MarketplaceOrder.id == order_id)
            .first()
        )
        if not order:
            raise HTTPException(status_code=404, detail="Pedido marketplace no encontrado.")
        return order

    def list_admin_orders(self, db: Session, current_user: Usuario) -> list[dict]:
        marketplace_service._validate_marketplace_admin_access(current_user)
        self._expire_stale_bank_transfer_orders(db)
        orders = (
            db.query(MarketplaceOrder)
            .options(
                joinedload(MarketplaceOrder.items),
                joinedload(MarketplaceOrder.buyer),
                joinedload(MarketplaceOrder.payment_attempts).joinedload(MarketplacePaymentAttempt.events),
            )
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrder.id.desc())
            .all()
        )
        company_names = {
            company.id: company.nombre
            for company in db.query(Empresa.id, Empresa.nombre).all()
        }
        user_names = {
            user.id: user.nombre_completo
            for user in db.query(Usuario.id, Usuario.nombre_completo).all()
        }
        results = []
        for order in orders:
            payment_attempt = (order.payment_attempts or [None])[0]
            payment_payload = dict(payment_attempt.payload_json or {}) if payment_attempt and isinstance(payment_attempt.payload_json, dict) else {}
            delivered_items_count = sum(1 for item in (order.items or []) if item.delivered_entity_type and item.delivered_entity_id)
            pending_items_count = max(0, len(order.items or []) - delivered_items_count)
            if len(order.items or []) == 0:
                fulfillment_status = "none"
            elif pending_items_count == 0:
                fulfillment_status = "fulfilled"
            elif delivered_items_count == 0:
                fulfillment_status = "pending"
            else:
                fulfillment_status = "partial"
            refund_summary = self._summarize_refund_policy(order)
            payment_timeline = self._serialize_payment_timeline(order)
            latest_payment_event = payment_timeline[0] if payment_timeline else None
            buyer_company_name = company_names.get(getattr(order.buyer, "empresa_id", None))
            payment_reviewed_by_user_id = payment_payload.get("validated_by_user_id") or payment_payload.get("rejected_by_user_id")
            results.append({
                "id": order.id,
                "buyer_user_id": order.buyer_user_id,
                "buyer_name": order.buyer.nombre_completo if order.buyer else None,
                "buyer_company_name": buyer_company_name,
                "total": order.total,
                "currency": order.currency,
                "status": order.status,
                "notes": order.notes,
                "created_at": order.created_at,
                "items_count": len(order.items or []),
                "payment_method": payment_attempt.payment_method if payment_attempt else None,
                "payment_status": payment_attempt.status if payment_attempt else None,
                "transfer_reference": payment_payload.get("transfer_reference"),
                "transfer_date": payment_payload.get("transfer_date"),
                "provider_transaction_id": payment_attempt.provider_transaction_id if payment_attempt else None,
                "authorization_code": payment_payload.get("authorization_code"),
                "payment_reviewed_at": payment_payload.get("validated_at") or payment_payload.get("rejected_at"),
                "payment_reviewed_by_user_id": payment_reviewed_by_user_id,
                "payment_reviewed_by_name": user_names.get(payment_reviewed_by_user_id),
                "admin_notes": payment_payload.get("admin_notes"),
                "fulfillment_status": fulfillment_status,
                "delivered_items_count": delivered_items_count,
                "pending_items_count": pending_items_count,
                "payment_latest_event": latest_payment_event["summary"] if latest_payment_event else None,
                "payment_latest_event_at": latest_payment_event["occurred_at"] if latest_payment_event else None,
                "refund_window_open": refund_summary["refund_window_open"],
                "refund_deadline_at": refund_summary["refund_deadline_at"],
                "refundable_items_count": refund_summary["refundable_items_count"],
                "non_refundable_items_count": refund_summary["non_refundable_items_count"],
                "refund_scope": refund_summary["refund_scope"],
                "refund_status": refund_summary["refund_status"],
                "refund_mode": payment_payload.get("refund_mode"),
                "refund_reason": payment_payload.get("refund_reason"),
                "refunded_at": payment_payload.get("refunded_at"),
                "refunded_by_user_id": payment_payload.get("refunded_by_user_id"),
                "refunded_by_name": user_names.get(payment_payload.get("refunded_by_user_id")),
                "refund_provider_resolution_status": payment_payload.get("refund_provider_resolution_status"),
                "refund_provider_resolution_note": payment_payload.get("refund_provider_resolution_note"),
                "refund_provider_resolution_at": payment_payload.get("refund_provider_resolution_at"),
            })
        return results

    def _summarize_refund_policy(self, order: MarketplaceOrder) -> dict:
        items = list(order.items or [])
        refundable_items_count = sum(
            1
            for item in items
            if (item.product_type_snapshot or "").strip().lower() in self.AUTO_REFUND_PRODUCT_TYPES
        )
        non_refundable_items_count = max(0, len(items) - refundable_items_count)
        refund_deadline_at = None
        refund_window_open = False
        refund_scope = "none"
        refund_status = "none"

        if refundable_items_count > 0:
            refund_scope = "all" if non_refundable_items_count == 0 else "partial"
            if order.created_at and (order.status or "").strip().lower() == "completed":
                refund_deadline_at = order.created_at + timedelta(minutes=self.AUTO_REFUND_WINDOW_MINUTES)
                if refund_deadline_at.tzinfo is None:
                    refund_deadline_at = refund_deadline_at.replace(tzinfo=timezone.utc)
                refund_window_open = datetime.now(timezone.utc) <= refund_deadline_at
                refund_status = "eligible" if refund_window_open else "expired"

        if (order.status or "").strip().lower() == "refunded":
            refund_status = "refunded"

        return {
            "refund_window_open": refund_window_open,
            "refund_deadline_at": refund_deadline_at,
            "refundable_items_count": refundable_items_count,
            "non_refundable_items_count": non_refundable_items_count,
            "refund_scope": refund_scope,
            "refund_status": refund_status,
        }

    def confirm_bank_transfer_order(self, db: Session, order_id: int, admin_notes: str | None, current_user: Usuario) -> MarketplaceOrder:
        self._expire_stale_bank_transfer_orders(db)
        order = self._get_admin_order_with_payment(db, order_id, current_user)
        payment_attempt = next((attempt for attempt in (order.payment_attempts or []) if (attempt.payment_method or "").lower() == "bank_transfer"), None)
        if not payment_attempt:
            raise HTTPException(status_code=400, detail="Este pedido no tiene un intento de transferencia bancaria asociado.")
        if (order.status or "").lower() != "awaiting_manual_validation":
            raise HTTPException(status_code=400, detail="Este pedido ya no está pendiente de validación manual.")

        buyer = order.buyer
        if not buyer:
            raise HTTPException(status_code=400, detail="No se pudo resolver el comprador de este pedido.")

        product_sales_counter: dict[int, int] = {}
        for item in order.items:
            if item.delivered_entity_type and item.delivered_entity_id:
                continue
            if not item.product_id:
                continue
            product = (
                db.query(MarketplaceProduct)
                .options(joinedload(MarketplaceProduct.seller))
                .filter(MarketplaceProduct.id == item.product_id)
                .first()
            )
            if not product:
                continue
            delivered_type, delivered_id = self._fulfill_product(db, product, buyer, None)
            item.delivered_entity_type = delivered_type
            item.delivered_entity_id = delivered_id
            db.add(item)

            if delivered_type and delivered_id and delivered_type != "empresa_licencia":
                origin_metadata = {
                    "product_type": product.product_type,
                    "product_kind": product.product_kind,
                }
                if product.product_type == "portal_compras_publicas":
                    preview = self._extract_product_preview(product)
                    portal_meta = dict(preview.get("portal_meta") or {})
                    origin_metadata.update(
                        {
                            "template_version": portal_meta.get("template_version"),
                            "processing_status": portal_meta.get("processing_status"),
                            "delivery_mode": portal_meta.get("delivery_mode"),
                            "import_analysis": dict(portal_meta.get("import_analysis") or {}),
                            "project_delivery_policy": dict(portal_meta.get("project_delivery_policy") or {}),
                            "delivery_preview": dict(portal_meta.get("delivery_preview") or {}),
                        }
                    )
                self._register_delivered_asset_origins(
                    db,
                    buyer=buyer,
                    product=product,
                    order_id=order.id,
                    order_item_id=item.id,
                    delivered_type=delivered_type,
                    delivered_id=delivered_id,
                    origin_metadata=origin_metadata,
                )
            product_sales_counter[product.id] = product_sales_counter.get(product.id, 0) + 1

        if product_sales_counter:
            products = (
                db.query(MarketplaceProduct)
                .filter(MarketplaceProduct.id.in_(list(product_sales_counter.keys())))
                .all()
            )
            for product in products:
                product.ventas_count = int(product.ventas_count or 0) + product_sales_counter.get(product.id, 0)
                db.add(product)

        order.status = "completed"
        order.notes = str(admin_notes or order.notes or "").strip() or "Transferencia bancaria validada manualmente."
        payment_attempt.status = "confirmed"
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "validated_by_user_id": current_user.id,
            "validated_at": datetime.now(timezone.utc).isoformat(),
            "admin_notes": str(admin_notes or "").strip() or None,
        }
        db.add(order)
        db.add(payment_attempt)
        db.flush()

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="manual",
            event_type="bank_transfer_confirmed",
            event_origin="admin",
            correlation_id=str(order.id),
            payload_json={
                "order_id": order.id,
                "validated_by_user_id": current_user.id,
                "admin_notes": str(admin_notes or "").strip() or None,
            },
            processed_at=datetime.now(timezone.utc),
        ))
        db.commit()
        return (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )

    def reject_bank_transfer_order(self, db: Session, order_id: int, admin_notes: str | None, current_user: Usuario) -> MarketplaceOrder:
        self._expire_stale_bank_transfer_orders(db)
        order = self._get_admin_order_with_payment(db, order_id, current_user)
        payment_attempt = next((attempt for attempt in (order.payment_attempts or []) if (attempt.payment_method or "").lower() == "bank_transfer"), None)
        if not payment_attempt:
            raise HTTPException(status_code=400, detail="Este pedido no tiene un intento de transferencia bancaria asociado.")
        if (order.status or "").lower() != "awaiting_manual_validation":
            raise HTTPException(status_code=400, detail="Este pedido ya no está pendiente de validación manual.")

        order.status = "payment_rejected"
        order.notes = str(admin_notes or "").strip() or "Transferencia bancaria rechazada por superadministración."
        payment_attempt.status = "rejected"
        payment_attempt.payload_json = {
            **dict(payment_attempt.payload_json or {}),
            "rejected_by_user_id": current_user.id,
            "rejected_at": datetime.now(timezone.utc).isoformat(),
            "admin_notes": str(admin_notes or "").strip() or None,
        }
        db.add(order)
        db.add(payment_attempt)
        db.flush()

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="manual",
            event_type="bank_transfer_rejected",
            event_origin="admin",
            correlation_id=str(order.id),
            payload_json={
                "order_id": order.id,
                "rejected_by_user_id": current_user.id,
                "admin_notes": str(admin_notes or "").strip() or None,
            },
            processed_at=datetime.now(timezone.utc),
        ))
        db.commit()
        return (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )

    def _revoke_order_access(self, db: Session, order: MarketplaceOrder, refund_id: int, reason: str | None) -> int:
        origins = (
            db.query(MarketplaceAssetOrigin)
            .filter(
                MarketplaceAssetOrigin.marketplace_order_id == order.id,
                MarketplaceAssetOrigin.marketplace_order_item_id.isnot(None),
            )
            .all()
        )
        revoked_count = 0
        for origin in origins:
            metadata = dict(origin.metadata_json or {})
            if metadata.get("revoked"):
                continue
            marketplace_asset_origin_service.revoke_marketplace_asset(
                db,
                origin=origin,
                refund_id=refund_id,
                reason=reason,
            )
            revoked_count += 1
        return revoked_count

    def _complete_refund_for_order(
        self,
        db: Session,
        *,
        order: MarketplaceOrder,
        payment_attempt: MarketplacePaymentAttempt | None,
        actor_user_id: int,
        refund_mode: str,
        reason: str | None,
    ) -> MarketplaceOrder:
        refund = MarketplaceRefund(
            order_id=order.id,
            requested_by_user_id=actor_user_id,
            reviewed_by_user_id=actor_user_id,
            refund_mode=refund_mode,
            refund_scope="all",
            refund_method=(payment_attempt.payment_method if payment_attempt else None),
            status="completed",
            amount=order.total,
            currency=order.currency,
            reason=reason,
            metadata_json={},
            reviewed_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
        )
        db.add(refund)
        db.flush()

        revoked_count = self._revoke_order_access(db, order, refund.id, reason)
        refund.metadata_json = {
            "revoked_items_count": revoked_count,
            "order_status_before_refund": order.status,
        }
        order.status = "refunded"
        order.notes = str(reason or order.notes or "").strip() or "Pedido reembolsado y acceso revocado."
        db.add(order)
        db.add(refund)

        if payment_attempt:
            provider_resolution = self._resolve_refund_provider_resolution(payment_attempt.payment_method)
            payment_attempt.status = "refunded"
            payment_attempt.payload_json = {
                **dict(payment_attempt.payload_json or {}),
                "refund_id": refund.id,
                "refund_mode": refund_mode,
                "refund_reason": str(reason or "").strip() or None,
                "refunded_at": datetime.now(timezone.utc).isoformat(),
                "refunded_by_user_id": actor_user_id,
                "refund_provider_resolution_status": provider_resolution["status"],
                "refund_provider_resolution_note": provider_resolution["note"],
                "refund_provider_resolution_at": datetime.now(timezone.utc).isoformat(),
            }
            refund.metadata_json = {
                **dict(refund.metadata_json or {}),
                "provider_resolution_status": provider_resolution["status"],
                "provider_resolution_note": provider_resolution["note"],
                "provider_resolution_at": datetime.now(timezone.utc).isoformat(),
            }
            db.add(refund)
            db.add(payment_attempt)
            db.flush()
            db.add(MarketplacePaymentEvent(
                payment_attempt_id=payment_attempt.id,
                provider=payment_attempt.payment_provider or payment_attempt.payment_method,
                event_type="refund_completed",
                event_origin="system",
                correlation_id=str(refund.id),
                payload_json={
                    "order_id": order.id,
                    "refund_id": refund.id,
                    "revoked_items_count": revoked_count,
                },
                processed_at=datetime.now(timezone.utc),
            ))

        db.commit()
        return (
            db.query(MarketplaceOrder)
            .options(
                joinedload(MarketplaceOrder.items),
                joinedload(MarketplaceOrder.payment_attempts).joinedload(MarketplacePaymentAttempt.events),
            )
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )

    def request_order_refund(
        self,
        db: Session,
        order_id: int,
        payload: MarketplaceRefundRequest,
        current_user: Usuario,
    ) -> MarketplaceOrder:
        order = self._get_accessible_order(db, order_id, current_user)
        if (order.status or "").strip().lower() != "completed":
            raise HTTPException(status_code=400, detail="Solo los pedidos completados pueden entrar en devolución.")
        refund_summary = self._summarize_refund_policy(order)
        if refund_summary["refund_scope"] != "all" or not refund_summary["refund_window_open"]:
            raise HTTPException(
                status_code=400,
                detail="Este pedido no tiene devolución automática disponible en este momento.",
            )
        payment_attempt = (order.payment_attempts or [None])[0]
        return self._complete_refund_for_order(
            db,
            order=order,
            payment_attempt=payment_attempt,
            actor_user_id=current_user.id,
            refund_mode="automatic",
            reason=str(payload.reason or "").strip() or "Devolución automática solicitada por el comprador dentro de la ventana habilitada.",
        )

    def admin_force_refund_order(
        self,
        db: Session,
        order_id: int,
        payload: MarketplaceRefundRequest,
        current_user: Usuario,
    ) -> MarketplaceOrder:
        marketplace_service._validate_marketplace_admin_access(current_user)
        order = self._get_admin_order_with_payment(db, order_id, current_user)
        if (order.status or "").strip().lower() not in {"completed", "refunded"}:
            raise HTTPException(status_code=400, detail="Solo los pedidos completados pueden reembolsarse manualmente.")
        if (order.status or "").strip().lower() == "refunded":
            raise HTTPException(status_code=400, detail="Este pedido ya fue reembolsado.")
        payment_attempt = (order.payment_attempts or [None])[0]
        return self._complete_refund_for_order(
            db,
            order=order,
            payment_attempt=payment_attempt,
            actor_user_id=current_user.id,
            refund_mode="manual_override",
            reason=str(payload.reason or "").strip() or "Devolución manual solicitada por superadministración.",
        )

    def _get_or_create_acquisition_base(self, db: Session, buyer: Usuario) -> BaseTrabajo:
        existing = (
            db.query(BaseTrabajo)
            .filter(
                BaseTrabajo.empresa_id == buyer.empresa_id,
                BaseTrabajo.nombre == "Marketplace - Adquiridos",
            )
            .first()
        )
        if existing:
            return existing

        from app.repositories.base_trabajo import base_trabajo_repo

        base = base_trabajo_repo.create(
            db,
            BaseTrabajoCreate(
                nombre="Marketplace - Adquiridos",
                tipo="Base Maestra",
                descripcion="Base creada automáticamente para recursos adquiridos en marketplace.",
                moneda="USD",
            ),
            buyer.empresa_id,
        )
        return base

    def _extract_product_preview(self, product: MarketplaceProduct) -> dict:
        return product.vista_previa if isinstance(product.vista_previa, dict) else {}

    def _parse_iso_date(self, value: str | None):
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value))
        except (TypeError, ValueError):
            return None

    def _normalize_geo_key(self, value: str | None) -> str | None:
        import re
        import unicodedata

        text = str(value or "").strip().lower()
        if not text:
            return None
        normalized = unicodedata.normalize("NFKD", text)
        normalized = "".join(char for char in normalized if not unicodedata.combining(char))
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
        return normalized or None

    def _resolve_portal_reference_code(self, product_meta: dict, portal_meta: dict) -> str | None:
        import_source = dict(portal_meta.get("import_source") or {})
        for candidate in [import_source.get("reference"), portal_meta.get("codigo_licitacion"), product_meta.get("codigo")]:
            value = str(candidate or "").strip()
            if value:
                return value
        return None

    def _resolve_portal_project_geolocation(self, portal_meta: dict) -> dict:
        province_key = self._normalize_geo_key(portal_meta.get("provincia"))
        canton_key = self._normalize_geo_key(portal_meta.get("canton"))
        match = None
        if province_key and canton_key:
            match = ECUADOR_GEO_REFERENCE.get((province_key, canton_key))
        if match is None and province_key:
            match = ECUADOR_GEO_REFERENCE.get((province_key, None))
        if not match:
            return {"lat": None, "lng": None, "resolution": "unresolved"}
        return {"lat": match["lat"], "lng": match["lng"], "resolution": match["resolution"]}

    def _build_purchase_scope_metadata(
        self,
        *,
        buyer: Usuario,
        product: MarketplaceProduct,
        order_id: int,
        order_item_id: int,
        entity_type: str,
        entity_id: int,
        extra: dict | None = None,
    ) -> dict:
        return marketplace_asset_origin_service.build_company_ownership_metadata(
            owner_company_id=buyer.empresa_id,
            source="marketplace_purchase",
            product_type=product.product_type,
            marketplace_product_id=product.id,
            marketplace_order_id=order_id,
            marketplace_order_item_id=order_item_id,
            extra={
                "entity_type": entity_type,
                "entity_id": entity_id,
                **(extra or {}),
            },
        )

    def _stamp_project_marketplace_traceability(
        self,
        db: Session,
        *,
        project_id: int,
        buyer: Usuario,
        product: MarketplaceProduct,
        order_id: int,
        order_item_id: int,
    ) -> None:
        project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == buyer.empresa_id).first()
        if not project:
            return

        current_config = dict(project.plantillas_config or {})
        current_config["marketplace_traceability"] = {
            "origin_type": "public_procurement_purchase" if product.product_type == "portal_compras_publicas" else "marketplace_purchase",
            "ownership_kind": "acquired",
            "owner_company_id": buyer.empresa_id,
            "marketplace_product_id": product.id,
            "marketplace_order_id": order_id,
            "marketplace_order_item_id": order_item_id,
            "product_type": product.product_type,
            "linked_base_id": project.base_trabajo_id,
            "marked_at": datetime.now(timezone.utc).isoformat(),
        }
        current_config["marketplace_flags"] = {
            **dict(current_config.get("marketplace_flags") or {}),
            "acquired": True,
            "purchase_bound": True,
            "requires_company_ownership": True,
        }
        project.plantillas_config = current_config
        db.add(project)
        db.flush()

    def _register_delivered_asset_origins(
        self,
        db: Session,
        *,
        buyer: Usuario,
        product: MarketplaceProduct,
        order_id: int,
        order_item_id: int,
        delivered_type: str,
        delivered_id: int,
        origin_metadata: dict,
    ) -> None:
        purchase_scope = self._build_purchase_scope_metadata(
            buyer=buyer,
            product=product,
            order_id=order_id,
            order_item_id=order_item_id,
            entity_type=delivered_type,
            entity_id=delivered_id,
        )
        metadata_payload = dict(origin_metadata or {})
        metadata_payload.update(purchase_scope)

        marketplace_asset_origin_service.register_acquired_asset(
            db,
            empresa_id=buyer.empresa_id,
            entity_type=delivered_type,
            entity_id=delivered_id,
            source_entity_type=product.source_type,
            source_entity_id=product.source_id,
            source_company_id=product.seller.empresa_id if product.seller else None,
            source_user_id=product.seller_user_id,
            marketplace_product_id=product.id,
            marketplace_order_id=order_id,
            marketplace_order_item_id=order_item_id,
            origin_label=f"Marketplace: {product.titulo}",
            metadata_json=metadata_payload,
        )

        if delivered_type != "proyecto":
            return

        project = db.query(Proyecto).filter(Proyecto.id == delivered_id, Proyecto.empresa_id == buyer.empresa_id).first()
        if not project:
            return

        self._stamp_project_marketplace_traceability(
            db,
            project_id=project.id,
            buyer=buyer,
            product=product,
            order_id=order_id,
            order_item_id=order_item_id,
        )

        if not project.base_trabajo_id:
            return

        linked_base_metadata = dict(origin_metadata or {})
        linked_base_metadata.update(
            self._build_purchase_scope_metadata(
                buyer=buyer,
                product=product,
                order_id=order_id,
                order_item_id=order_item_id,
                entity_type="base_trabajo",
                entity_id=project.base_trabajo_id,
                extra={
                    "linked_project_id": project.id,
                    "linked_project_code": project.codigo,
                },
            )
        )
        marketplace_asset_origin_service.register_acquired_asset(
            db,
            empresa_id=buyer.empresa_id,
            entity_type="base_trabajo",
            entity_id=project.base_trabajo_id,
            source_entity_type=product.source_type,
            source_entity_id=product.source_id,
            source_company_id=product.seller.empresa_id if product.seller else None,
            source_user_id=product.seller_user_id,
            marketplace_product_id=product.id,
            marketplace_order_id=order_id,
            marketplace_order_item_id=order_item_id,
            origin_label=f"Marketplace: base vinculada a {product.titulo}",
            metadata_json=linked_base_metadata,
        )

    def _resolve_or_create_target_subcat(self, db: Session, source_subcat: SubcategoriaItem, target_base_id: int, empresa_id: int) -> SubcategoriaItem:
        target_subcat = (
            db.query(SubcategoriaItem)
            .filter(
                SubcategoriaItem.base_trabajo_id == target_base_id,
                SubcategoriaItem.empresa_id == empresa_id,
                SubcategoriaItem.subcategoria_codigo == source_subcat.subcategoria_codigo,
                SubcategoriaItem.descripcion == source_subcat.descripcion,
            )
            .first()
        )
        if target_subcat:
            return target_subcat

        target_subcat = SubcategoriaItem(
            codigo=source_subcat.codigo,
            descripcion=source_subcat.descripcion,
            observaciones=source_subcat.observaciones,
            subcategoria_codigo=source_subcat.subcategoria_codigo,
            orden=source_subcat.orden,
            base_trabajo_id=target_base_id,
            empresa_id=empresa_id,
            revisado=source_subcat.revisado,
            omniclass_codigo=source_subcat.omniclass_codigo,
            omniclass_titulo=source_subcat.omniclass_titulo,
        )
        db.add(target_subcat)
        db.flush()
        return target_subcat

    def _clone_apu_to_company(self, db: Session, source_apu: APU, buyer: Usuario, target_base_id: int) -> APU:
        source_apu = (
            db.query(APU)
            .options(
                joinedload(APU.lineas).joinedload(APULinea.recurso),
                joinedload(APU.lineas).joinedload(APULinea.apu_hijo),
                joinedload(APU.subcategoria_item),
            )
            .filter(APU.id == source_apu.id)
            .first()
        )
        if not source_apu:
            raise HTTPException(status_code=404, detail="APU origen no encontrado.")

        memo_apus: dict[int, APU] = {}

        def clone_recursive(apu: APU) -> APU:
            if apu.id in memo_apus:
                return memo_apus[apu.id]

            source_subcat = apu.subcategoria_item
            target_subcat = None
            if source_subcat:
                target_subcat = self._resolve_or_create_target_subcat(db, source_subcat, target_base_id, buyer.empresa_id)

            existing = (
                db.query(APU)
                .filter(
                    APU.empresa_id == buyer.empresa_id,
                    APU.base_trabajo_id == target_base_id,
                    APU.descripcion_normalizada == apu.descripcion_normalizada,
                    APU.unidad == canonicalize_unit_symbol(apu.unidad),
                )
                .first()
            )
            if existing:
                memo_apus[apu.id] = existing
                return existing

            from app.services.apu import apu_service

            new_apu = APU(
                codigo=apu_service._generate_next_code_for_base(
                    db,
                    target_base_id,
                    buyer.empresa_id,
                    target_subcat.id if target_subcat else None,
                ),
                descripcion=apu.descripcion,
                descripcion_normalizada=apu.descripcion_normalizada,
                unidad=canonicalize_unit_symbol(apu.unidad),
                rendimiento_estandar=apu.rendimiento_estandar,
                costo_directo=apu.costo_directo,
                costo_indirecto=apu.costo_indirecto,
                precio_unitario_total=apu.precio_unitario_total,
                moneda=apu.moneda,
                estado_revision="Revisado",
                revision=0,
                categoria_id=apu.categoria_id,
                subcategoria_item_id=target_subcat.id if target_subcat else None,
                empresa_id=buyer.empresa_id,
                base_trabajo_id=target_base_id,
                omniclass_codigo=apu.omniclass_codigo,
                omniclass_titulo=apu.omniclass_titulo,
            )
            db.add(new_apu)
            db.flush()
            memo_apus[apu.id] = new_apu

            for linea in sorted(apu.lineas or [], key=lambda item: ((item.orden or 0), item.id or 0)):
                new_line = APULinea(
                    apu_id=new_apu.id,
                    cantidad=linea.cantidad,
                    rendimiento=linea.rendimiento,
                    orden=linea.orden,
                    precio_congelado=linea.precio_congelado,
                    subtotal=linea.subtotal,
                    tanteo_activo=False,
                )
                if linea.recurso_id and linea.recurso:
                    copied_resource = recurso_service.copy_to_base(
                        db,
                        linea.recurso_id,
                        target_base_id,
                        buyer.empresa_id,
                        revision=0,
                    )
                    new_line.recurso_id = copied_resource.id if copied_resource else None
                elif linea.apu_hijo_id and linea.apu_hijo:
                    copied_child = clone_recursive(linea.apu_hijo)
                    new_line.apu_hijo_id = copied_child.id
                db.add(new_line)

            db.flush()
            calculate_apu_price(db, new_apu)
            db.flush()
            return new_apu

        return clone_recursive(source_apu)

    def _generate_project_code(self, db: Session, empresa_id: int) -> str:
        empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        if not empresa:
            raise HTTPException(status_code=404, detail="Empresa compradora no encontrada.")

        prefix = empresa.proy_prefijo or empresa.nombre.replace(" ", "")[:20]
        period = empresa.proy_periodo or str(datetime.now().year)
        current_secuencial = empresa.proy_secuencial
        while True:
            seq_str = str(current_secuencial).zfill(empresa.proy_secuencial_size or 9)
            candidate = f"{prefix}-{period}-{seq_str}"
            exists = db.query(Proyecto).filter(Proyecto.codigo == candidate, Proyecto.empresa_id == empresa_id).first()
            if not exists:
                empresa.proy_secuencial = current_secuencial + 1
                db.add(empresa)
                db.flush()
                return candidate
            current_secuencial += 1

    def _build_cloned_apu_map(self, db: Session, source_base_id: int | None, target_base_id: int | None, target_empresa_id: int) -> dict[int, int]:
        if not source_base_id or not target_base_id:
            return {}

        source_apus = (
            db.query(APU)
            .filter(APU.base_trabajo_id == source_base_id)
            .all()
        )
        cloned_apus = (
            db.query(APU)
            .filter(APU.base_trabajo_id == target_base_id, APU.empresa_id == target_empresa_id)
            .all()
        )
        cloned_by_signature = {
            (apu.descripcion_normalizada, canonicalize_unit_symbol(apu.unidad)): apu.id
            for apu in cloned_apus
        }

        apu_map: dict[int, int] = {}
        for source_apu in source_apus:
            target_apu_id = cloned_by_signature.get((source_apu.descripcion_normalizada, canonicalize_unit_symbol(source_apu.unidad)))
            if target_apu_id:
                apu_map[source_apu.id] = target_apu_id
        return apu_map

    def _clone_project_detail_to_company(self, db: Session, source_project: Proyecto, cloned_project: Proyecto, buyer: Usuario) -> None:
        source_root_code = source_project.codigo_root or source_project.codigo
        if not source_root_code:
            return

        source_detail = (
            db.query(ProyectoDetalle)
            .filter(
                ProyectoDetalle.codigo_root == source_root_code,
                ProyectoDetalle.empresa_id == source_project.empresa_id,
            )
            .first()
        )
        if not source_detail:
            return

        cloned_detail = ProyectoDetalle(
            codigo_root=cloned_project.codigo_root or cloned_project.codigo,
            empresa_id=buyer.empresa_id,
            cod_referencial=source_detail.cod_referencial,
            tipo_proyecto_id=source_detail.tipo_proyecto_id,
            categoria_id=source_detail.categoria_id,
            tipo_construccion=source_detail.tipo_construccion,
            ambito_contratacion=source_detail.ambito_contratacion,
            tipo_contrato=source_detail.tipo_contrato,
            normativa_aplicable=source_detail.normativa_aplicable,
            nivel_complejidad=source_detail.nivel_complejidad,
            cliente_contratante_preliminar=source_detail.cliente_contratante_preliminar,
            presupuesto_referencial=source_detail.presupuesto_referencial,
            moneda=source_detail.moneda,
            fuente_financiamiento=source_detail.fuente_financiamiento,
            numero_contrato=source_detail.numero_contrato,
            fecha_firma_contrato=source_detail.fecha_firma_contrato,
            descripcion_breve=source_detail.descripcion_breve,
            alcance_detallado=source_detail.alcance_detallado,
            tipo_medicion=source_detail.tipo_medicion,
            area_terreno=source_detail.area_terreno,
            area_construccion=source_detail.area_construccion,
            num_niveles=source_detail.num_niveles,
            longitud_total=source_detail.longitud_total,
            unidad_longitud=source_detail.unidad_longitud,
            ancho_promedio=source_detail.ancho_promedio,
            volumen_total=source_detail.volumen_total,
            cantidad_unidades=source_detail.cantidad_unidades,
            descripcion_unidad=source_detail.descripcion_unidad,
            fecha_inicio=source_detail.fecha_inicio,
            plazo_ejecucion=source_detail.plazo_ejecucion,
            fecha_finalizacion=source_detail.fecha_finalizacion,
            pais=source_detail.pais,
            provincia=source_detail.provincia,
            canton=source_detail.canton,
            ciudad=source_detail.ciudad,
            direccion=source_detail.direccion,
            imagen_referencial_url=source_detail.imagen_referencial_url,
            latitud=source_detail.latitud,
            longitud=source_detail.longitud,
            map_zoom=source_detail.map_zoom,
        )
        db.add(cloned_detail)
        db.flush()

    def _clone_tree_nodes_to_company(self, db: Session, node_model, source_project_id: int, target_project_id: int, target_empresa_id: int) -> dict[int, int]:
        source_nodes = (
            db.query(node_model)
            .filter(node_model.proyecto_id == source_project_id)
            .order_by(node_model.parent_id.nullsfirst(), node_model.orden.asc(), node_model.id.asc())
            .all()
        )

        id_map: dict[int, int] = {}
        for source_node in source_nodes:
            cloned_node = node_model(
                proyecto_id=target_project_id,
                parent_id=id_map.get(source_node.parent_id) if source_node.parent_id else None,
                tipo_nodo=source_node.tipo_nodo,
                orden=source_node.orden,
                codigo=source_node.codigo,
                empresa_id=target_empresa_id,
            )
            for field in ("nombre", "definicion", "stakeholder_id", "rol_id", "actividades_claves"):
                if hasattr(source_node, field):
                    setattr(cloned_node, field, getattr(source_node, field))
            db.add(cloned_node)
            db.flush()
            id_map[source_node.id] = cloned_node.id

        return id_map

    def _clone_project_budgets_to_company(
        self,
        db: Session,
        source_project: Proyecto,
        cloned_project: Proyecto,
        buyer: Usuario,
        cloned_edt_map: dict[int, int],
        cloned_apu_map: dict[int, int],
    ) -> dict[int, dict[int, int]]:
        source_budgets = (
            db.query(Presupuesto)
            .filter(
                Presupuesto.proyecto_id == source_project.id,
                Presupuesto.empresa_id == source_project.empresa_id,
            )
            .all()
        )

        budget_detail_maps: dict[int, dict[int, int]] = {}
        for budget in source_budgets:
            cloned_budget = Presupuesto(
                codigo=budget.codigo,
                revision=0,
                descripcion=budget.descripcion,
                subtotal=budget.subtotal,
                indirectos_total=budget.indirectos_total,
                impuestos=budget.impuestos,
                total=budget.total,
                estado="En Elaboración",
                moneda=budget.moneda,
                proyecto_id=cloned_project.id,
                empresa_id=buyer.empresa_id,
                iva_aplicado=budget.iva_aplicado,
                dec_moneda=budget.dec_moneda,
                dec_calculos=budget.dec_calculos,
            )
            db.add(cloned_budget)
            db.flush()

            detail_id_map: dict[int, int] = {}
            source_details = (
                db.query(PresupuestoDetalle)
                .filter(PresupuestoDetalle.presupuesto_id == budget.id)
                .order_by(PresupuestoDetalle.parent_id.nullsfirst(), PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc())
                .all()
            )
            for source_detail in source_details:
                cloned_detail = PresupuestoDetalle(
                    presupuesto_id=cloned_budget.id,
                    apu_id=cloned_apu_map.get(source_detail.apu_id) if source_detail.apu_id else None,
                    parent_id=detail_id_map.get(source_detail.parent_id) if source_detail.parent_id else None,
                    tipo=source_detail.tipo,
                    edt_id=cloned_edt_map.get(source_detail.edt_id, source_detail.edt_id),
                    codigo_item=source_detail.codigo_item,
                    descripcion=source_detail.descripcion,
                    unidad=canonicalize_unit_symbol(source_detail.unidad),
                    cantidad=source_detail.cantidad,
                    precio_unitario=source_detail.precio_unitario,
                    precio_total=source_detail.precio_total,
                    orden=source_detail.orden,
                    omniclass_codigo=source_detail.omniclass_codigo,
                    omniclass_titulo=source_detail.omniclass_titulo,
                    notas=source_detail.notas,
                    tanteo_activo=source_detail.tanteo_activo,
                )
                db.add(cloned_detail)
                db.flush()
                detail_id_map[source_detail.id] = cloned_detail.id

            budget_detail_maps[budget.id] = detail_id_map

            source_indirectos = (
                db.query(PresupuestoIndirecto)
                .filter(PresupuestoIndirecto.presupuesto_id == budget.id)
                .all()
            )
            for source_indirecto in source_indirectos:
                db.add(PresupuestoIndirecto(
                    presupuesto_id=cloned_budget.id,
                    empresa_id=buyer.empresa_id,
                    concepto_codigo=source_indirecto.concepto_codigo,
                    concepto_id=source_indirecto.concepto_id,
                    categoria_codigo=source_indirecto.categoria_codigo,
                    nombre=source_indirecto.nombre,
                    porcentaje=source_indirecto.porcentaje,
                    observaciones=source_indirecto.observaciones,
                    fijo=source_indirecto.fijo,
                    usuario=source_indirecto.usuario,
                    custom=source_indirecto.custom,
                ))

            source_notes = (
                db.query(PresupuestoNota)
                .filter(PresupuestoNota.presupuesto_id == budget.id)
                .order_by(PresupuestoNota.id.asc())
                .all()
            )
            for source_note in source_notes:
                db.add(PresupuestoNota(
                    presupuesto_id=cloned_budget.id,
                    linea_presupuesto_id=detail_id_map.get(source_note.linea_presupuesto_id) if source_note.linea_presupuesto_id else None,
                    autor_usuario_id=None,
                    autor_nombre_snapshot=source_note.autor_nombre_snapshot,
                    tipo=source_note.tipo,
                    texto=source_note.texto,
                ))

            calculate_presupuesto_totals(db, cloned_budget)
            db.flush()

        return budget_detail_maps

    def _clone_project_schedules_to_company(
        self,
        db: Session,
        source_project: Proyecto,
        cloned_project: Proyecto,
        buyer: Usuario,
        budget_detail_maps: dict[int, dict[int, int]],
    ) -> None:
        if not budget_detail_maps:
            return

        source_budget_ids = list(budget_detail_maps.keys())
        cloned_budgets = (
            db.query(Presupuesto)
            .filter(
                Presupuesto.proyecto_id == cloned_project.id,
                Presupuesto.empresa_id == buyer.empresa_id,
            )
            .all()
        )
        cloned_budgets_by_code = {budget.codigo: budget for budget in cloned_budgets}
        source_budgets = (
            db.query(Presupuesto)
            .filter(
                Presupuesto.id.in_(source_budget_ids),
                Presupuesto.proyecto_id == source_project.id,
                Presupuesto.empresa_id == source_project.empresa_id,
            )
            .all()
        )

        for source_budget in source_budgets:
            cloned_budget = cloned_budgets_by_code.get(source_budget.codigo)
            if not cloned_budget:
                continue

            detail_map = budget_detail_maps.get(source_budget.id, {})
            source_valued = (
                db.query(CronogramaValorado)
                .filter(
                    CronogramaValorado.presupuesto_id == source_budget.id,
                    CronogramaValorado.proyecto_id == source_project.id,
                    CronogramaValorado.empresa_id == source_project.empresa_id,
                )
                .first()
            )
            if source_valued:
                remapped_overrides = {
                    str(detail_map[int(line_id)]): override
                    for line_id, override in (source_valued.line_distribution_overrides or {}).items()
                    if str(line_id).isdigit() and int(line_id) in detail_map
                }
                db.add(CronogramaValorado(
                    empresa_id=buyer.empresa_id,
                    proyecto_id=cloned_project.id,
                    presupuesto_id=cloned_budget.id,
                    period_type=source_valued.period_type,
                    distribution_mode=source_valued.distribution_mode,
                    global_distribution=source_valued.global_distribution or [],
                    line_distribution_overrides=remapped_overrides,
                ))

            source_work = (
                db.query(CronogramaTrabajo)
                .filter(
                    CronogramaTrabajo.presupuesto_id == source_budget.id,
                    CronogramaTrabajo.proyecto_id == source_project.id,
                    CronogramaTrabajo.empresa_id == source_project.empresa_id,
                )
                .first()
            )
            if source_work:
                remapped_schedule = {
                    str(detail_map[int(line_id)]): schedule
                    for line_id, schedule in (source_work.schedule_data or {}).items()
                    if str(line_id).isdigit() and int(line_id) in detail_map
                }
                if "__config__" in (source_work.schedule_data or {}):
                    remapped_schedule["__config__"] = source_work.schedule_data.get("__config__") or {}
                db.add(CronogramaTrabajo(
                    empresa_id=buyer.empresa_id,
                    proyecto_id=cloned_project.id,
                    presupuesto_id=cloned_budget.id,
                    schedule_data=remapped_schedule,
                ))

        db.flush()

    def _clone_project_to_company(self, db: Session, source_project: Proyecto, buyer: Usuario) -> Proyecto:
        source_project = db.query(Proyecto).filter(Proyecto.id == source_project.id).first()
        if not source_project:
            raise HTTPException(status_code=404, detail="Proyecto origen no encontrado.")

        from app.repositories.base_trabajo import base_trabajo_repo

        cloned_base = None
        if source_project.base_trabajo_id:
            cloned_base = base_trabajo_repo.create(
                db,
                BaseTrabajoCreate(
                    nombre=f"Base adquirida - {source_project.nombre}",
                    tipo="Base de Proyecto",
                    descripcion=f"Base clonada desde marketplace para {source_project.nombre}",
                    source_base_id=source_project.base_trabajo_id,
                    empresa_id=buyer.empresa_id,
                ),
                buyer.empresa_id,
            )

        project_code = self._generate_project_code(db, buyer.empresa_id)
        cloned_project = Proyecto(
            nombre=source_project.nombre,
            codigo=project_code,
            codigo_root=project_code,
            revision=0,
            descripcion=source_project.descripcion,
            estado="Planificación",
            fecha_inicio=source_project.fecha_inicio,
            fecha_fin_estimada=source_project.fecha_fin_estimada,
            presupuesto_estimado=source_project.presupuesto_estimado,
            moneda=source_project.moneda,
            empresa_id=buyer.empresa_id,
            cliente_id=source_project.cliente_id,
            base_trabajo_id=cloned_base.id if cloned_base else None,
            plantillas_config=source_project.plantillas_config,
        )
        db.add(cloned_project)
        db.flush()

        self._clone_project_detail_to_company(db, source_project, cloned_project, buyer)
        cloned_edt_map = self._clone_tree_nodes_to_company(
            db,
            EdtNode,
            source_project.id,
            cloned_project.id,
            buyer.empresa_id,
        )
        self._clone_tree_nodes_to_company(
            db,
            EdoNode,
            source_project.id,
            cloned_project.id,
            buyer.empresa_id,
        )
        cloned_apu_map = self._build_cloned_apu_map(
            db,
            source_project.base_trabajo_id,
            cloned_base.id if cloned_base else None,
            buyer.empresa_id,
        )
        budget_detail_maps = self._clone_project_budgets_to_company(
            db,
            source_project,
            cloned_project,
            buyer,
            cloned_edt_map,
            cloned_apu_map,
        )
        self._clone_project_schedules_to_company(
            db,
            source_project,
            cloned_project,
            buyer,
            budget_detail_maps,
        )

        db.flush()
        return cloned_project

    def _build_portal_project_description(self, product: MarketplaceProduct, product_meta: dict, portal_meta: dict) -> str:
        lines = []
        if product.descripcion:
            lines.append(product.descripcion)
        if product_meta.get("descripcion_completa"):
            lines.append(str(product_meta["descripcion_completa"]).strip())

        location_parts = [portal_meta.get("pais"), portal_meta.get("provincia"), portal_meta.get("canton")]
        location_label = " / ".join([part for part in location_parts if part])
        if location_label:
            lines.append(f"Ubicación de licitación: {location_label}")
        if portal_meta.get("direccion"):
            lines.append(f"Dirección: {portal_meta.get('direccion')}")
        if portal_meta.get("precio_licitacion"):
            lines.append(f"Precio de licitación: {portal_meta.get('precio_licitacion')} {product.moneda or 'USD'}")
        if portal_meta.get("fecha_inicio_licitacion") or portal_meta.get("fecha_fin_licitacion"):
            lines.append(
                "Ventana de licitación: "
                f"{portal_meta.get('fecha_inicio_licitacion') or '-'} -> {portal_meta.get('fecha_fin_licitacion') or '-'}"
            )
        return "\n\n".join([line for line in lines if line]).strip() or f"Proyecto adquirido desde marketplace: {product.titulo}"

    def _seed_portal_project_detail(
        self,
        db: Session,
        *,
        project: Proyecto,
        buyer: Usuario,
        product: MarketplaceProduct,
        product_meta: dict,
        portal_meta: dict,
    ) -> None:
        analysis = dict(portal_meta.get("import_analysis") or {})
        chapters = list(analysis.get("chapters") or [])
        chapters_preview = ", ".join(chapters[:4])
        if len(chapters) > 4:
            chapters_preview += ", ..."
        reference_code = self._resolve_portal_reference_code(product_meta, portal_meta)
        geolocation = self._resolve_portal_project_geolocation(portal_meta)
        location_label = " / ".join([part for part in [portal_meta.get("pais"), portal_meta.get("provincia"), portal_meta.get("canton")] if part])

        object_lines = [
            f"Artículo adquirido: {product.titulo}",
            product_meta.get("descripcion_completa") or product.descripcion or product.resumen or "",
            f"Código / referencia técnica: {reference_code or 'Sin referencia'}",
            f"Fuente técnica: {analysis.get('source_filename') or (portal_meta.get('import_source') or {}).get('reference') or 'Sin referencia'}",
            f"Rubros detectados: {analysis.get('items_count') or 0}",
            f"Capítulos detectados: {analysis.get('chapters_count') or 0}",
            f"Importe técnico base: {analysis.get('total_amount') or portal_meta.get('precio_licitacion') or product.precio or 0} {product.moneda or 'USD'}",
        ]
        if chapters_preview:
            object_lines.append(f"Capítulos principales: {chapters_preview}")
        if location_label:
            object_lines.append(f"Localización del proyecto: {location_label}")
        if geolocation.get("lat") is not None and geolocation.get("lng") is not None:
            object_lines.append(
                f"Geolocalización propuesta: {geolocation.get('lat')}, {geolocation.get('lng')} ({geolocation.get('resolution')})"
            )

        detail = ProyectoDetalle(
            codigo_root=project.codigo_root or project.codigo,
            empresa_id=buyer.empresa_id,
            cod_referencial=reference_code,
            tipo_construccion="Adquirido",
            ambito_contratacion="Público",
            tipo_contrato="Portal de compras públicas",
            cliente_contratante_preliminar=portal_meta.get("contratante") or portal_meta.get("entidad_contratante"),
            presupuesto_referencial=portal_meta.get("precio_licitacion") or analysis.get("total_amount") or product.precio,
            moneda=product.moneda or "USD",
            fuente_financiamiento="Presupuesto Estatal",
            numero_contrato=portal_meta.get("codigo_proceso") or portal_meta.get("numero_contrato"),
            fecha_inicio=project.fecha_inicio,
            fecha_finalizacion=project.fecha_fin_estimada,
            pais=portal_meta.get("pais") or "Ecuador",
            provincia=portal_meta.get("provincia"),
            canton=portal_meta.get("canton"),
            direccion=portal_meta.get("direccion"),
            latitud=geolocation.get("lat"),
            longitud=geolocation.get("lng"),
            descripcion_breve=portal_meta.get("descripcion_breve") or reference_code,
            alcance_detallado="\n".join([line for line in object_lines if line]).strip(),
            tipo_medicion="area",
        )
        db.add(detail)
        db.flush()

    def _seed_portal_project_budget(
        self,
        db: Session,
        *,
        project: Proyecto,
        buyer: Usuario,
        product: MarketplaceProduct,
        product_meta: dict,
        portal_meta: dict,
    ) -> Presupuesto | None:
        analysis = dict(portal_meta.get("import_analysis") or {})
        rubros = list(analysis.get("rubros") or [])
        if not rubros:
            return None

        root_node = EdtNode(
            proyecto_id=project.id,
            parent_id=None,
            tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
            orden=1,
            codigo="1",
            nombre=analysis.get("budget_title") or product.titulo,
            definicion="Estructura operativa base generada automáticamente desde la compra de Portal de compras públicas.",
            empresa_id=buyer.empresa_id,
        )
        db.add(root_node)
        db.flush()

        chapter_map: dict[str, EdtNode] = {}
        chapter_order = 1
        for row in rubros:
            chapter_name = (row.get("capitulo") or "").strip() or "General"
            if chapter_name in chapter_map:
                continue
            node = EdtNode(
                proyecto_id=project.id,
                parent_id=root_node.id,
                tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE,
                orden=chapter_order,
                codigo=f"1.{chapter_order}",
                nombre=chapter_name,
                definicion=f"Capítulo importado automáticamente desde el artículo adquirido: {product.titulo}.",
                empresa_id=buyer.empresa_id,
            )
            db.add(node)
            db.flush()
            chapter_map[chapter_name] = node
            chapter_order += 1

        budget = Presupuesto(
            codigo=f"{project.codigo}-P01" if project.codigo else None,
            revision=int(project.revision or 0),
            descripcion=product_meta.get("descripcion_corta") or product.titulo,
            estado="En Elaboración",
            moneda=product.moneda or "USD",
            iva_aplicado=Decimal("15.00"),
            proyecto_id=project.id,
            empresa_id=buyer.empresa_id,
        )
        db.add(budget)
        db.flush()

        for index, row in enumerate(rubros, start=1):
            chapter_name = (row.get("capitulo") or "").strip() or "General"
            edt_node = chapter_map.get(chapter_name) or root_node
            quantity = Decimal(str(row.get("cantidad") or 1))
            unit_price = Decimal(str(row.get("precio_u") or row.get("precio_total") or 0))
            total_price = Decimal(str(row.get("precio_total") or 0))
            if quantity <= 0:
                quantity = Decimal("1")
            if unit_price <= 0 and total_price > 0:
                unit_price = total_price

            detail_notes = []
            if row.get("codigo"):
                detail_notes.append(f"Código fuente: {row.get('codigo')}")
            if analysis.get("source_files"):
                source_preview = ", ".join(
                    [item.get("filename") for item in list(analysis.get("source_files") or [])[:2] if item.get("filename")]
                )
                if source_preview:
                    detail_notes.append(f"Fuentes: {source_preview}")
            elif analysis.get("source_filename"):
                detail_notes.append(f"Fuente: {analysis.get('source_filename')}")

            detail = PresupuestoDetalle(
                presupuesto_id=budget.id,
                apu_id=None,
                parent_id=None,
                tipo="portal_importado",
                edt_id=edt_node.id,
                codigo_item=row.get("nro") or f"R-{index:03d}",
                descripcion=row.get("descripcion") or f"Rubro importado {index}",
                unidad=canonicalize_unit_symbol(row.get("unidad") or "u"),
                cantidad=quantity,
                precio_unitario=unit_price,
                precio_total=total_price,
                orden=index,
                notas="\n".join(detail_notes) if detail_notes else None,
                tanteo_activo=False,
            )
            db.add(detail)

        db.flush()
        calculate_presupuesto_totals(db, budget)
        db.flush()
        return budget

    def _fulfill_public_procurement_portal(self, db: Session, product: MarketplaceProduct, buyer: Usuario):
        preview = self._extract_product_preview(product)
        product_meta = dict(preview.get("product_meta") or {})
        portal_meta = dict(preview.get("portal_meta") or {})
        policy = dict(portal_meta.get("project_delivery_policy") or {})
        delivery_preview = dict(portal_meta.get("delivery_preview") or {})

        source_project_id = policy.get("source_project_id")
        if policy.get("clone_source_project_on_purchase") and source_project_id:
            source_project = db.query(Proyecto).filter(Proyecto.id == source_project_id).first()
            if not source_project:
                raise HTTPException(status_code=404, detail="Proyecto origen de compra publica no encontrado.")
            cloned_project = self._clone_project_to_company(db, source_project, buyer)
            cloned_config = dict(cloned_project.plantillas_config or {})
            cloned_config["marketplace_delivery"] = {
                **dict(cloned_config.get("marketplace_delivery") or {}),
                "product_id": product.id,
                "product_type": product.product_type,
                "origin_label": f"Marketplace: {product.titulo}",
                "delivery_mode": portal_meta.get("delivery_mode"),
                "template_version": portal_meta.get("template_version"),
            }
            cloned_config["marketplace_flags"] = {
                **dict(cloned_config.get("marketplace_flags") or {}),
                "acquired": True,
                "send_locked": bool(policy.get("project_send_locked", True)),
                "without_base": bool(policy.get("project_without_base", True)),
            }
            cloned_project.plantillas_config = cloned_config
            db.add(cloned_project)
            db.flush()
            return "proyecto", cloned_project.id

        project_code = self._generate_project_code(db, buyer.empresa_id)
        project_name = (
            delivery_preview.get("project_delivery", {}).get("project_name")
            or f"Adquirido · {product.titulo}"
        )

        project = Proyecto(
            nombre=project_name,
            codigo=project_code,
            codigo_root=project_code,
            revision=0,
            descripcion=self._build_portal_project_description(product, product_meta, portal_meta),
            estado="Planificación",
            fecha_inicio=self._parse_iso_date(portal_meta.get("fecha_inicio_licitacion")),
            fecha_fin_estimada=self._parse_iso_date(portal_meta.get("fecha_fin_licitacion")),
            presupuesto_estimado=Decimal(str(portal_meta.get("precio_licitacion") or product.precio or 0)),
            moneda=product.moneda,
            empresa_id=buyer.empresa_id,
            cliente_id=None,
            base_trabajo_id=None if policy.get("project_without_base", True) else None,
            plantillas_config={
                "marketplace_delivery": {
                    "product_id": product.id,
                    "product_type": product.product_type,
                    "template_version": portal_meta.get("template_version"),
                    "processing_status": portal_meta.get("processing_status"),
                    "delivery_mode": portal_meta.get("delivery_mode"),
                    "import_analysis": dict(portal_meta.get("import_analysis") or {}),
                    "origin_label": f"Marketplace: {product.titulo}",
                },
                "portal_compras_publicas": {
                    "import_source": dict(portal_meta.get("import_source") or {}),
                    "project_delivery_policy": policy,
                    "delivery_preview": delivery_preview,
                },
                "marketplace_flags": {
                    "acquired": True,
                    "send_locked": bool(policy.get("project_send_locked", True)),
                    "without_base": bool(policy.get("project_without_base", True)),
                },
            },
        )
        db.add(project)
        db.flush()
        self._seed_portal_project_detail(
            db,
            project=project,
            buyer=buyer,
            product=product,
            product_meta=product_meta,
            portal_meta=portal_meta,
        )
        budget = self._seed_portal_project_budget(
            db,
            project=project,
            buyer=buyer,
            product=product,
            product_meta=product_meta,
            portal_meta=portal_meta,
        )
        if isinstance(project.plantillas_config, dict):
            delivery = project.plantillas_config.get("marketplace_delivery") or {}
            delivery["budget_seeded"] = budget is not None
            delivery["budget_id"] = budget.id if budget else None
            delivery["budget_lines"] = len(list((portal_meta.get("import_analysis") or {}).get("rubros") or []))
            project.plantillas_config["marketplace_delivery"] = delivery
            db.add(project)
            db.flush()
        return "proyecto", project.id

    def _fulfill_product(self, db: Session, product: MarketplaceProduct, buyer: Usuario, apu_target_base_id: int | None):
        if product.product_kind == "manual" and product.product_type == "licencia":
            return self._fulfill_license_product(db, product, buyer)

        if product.product_kind == "manual" and product.product_type == "portal_compras_publicas":
            return self._fulfill_public_procurement_portal(db, product, buyer)

        if product.product_kind != "referenced" or not product.source_type or not product.source_id:
            return None, None

        if product.source_type == "base_trabajo":
            from app.repositories.base_trabajo import base_trabajo_repo

            source_base = db.query(BaseTrabajo).filter(BaseTrabajo.id == product.source_id).first()
            if not source_base:
                raise HTTPException(status_code=404, detail="Base origen no encontrada.")
            cloned_base = base_trabajo_repo.create(
                db,
                BaseTrabajoCreate(
                    nombre=f"{source_base.nombre} - Adquirida",
                    tipo=source_base.tipo,
                    descripcion=source_base.descripcion,
                    porcentaje_indirectos=source_base.porcentaje_indirectos,
                    pais_id=source_base.pais_id,
                    moneda=source_base.moneda,
                    observaciones=source_base.observaciones,
                    source_base_id=source_base.id,
                    empresa_id=buyer.empresa_id,
                ),
                buyer.empresa_id,
            )
            return "base_trabajo", cloned_base.id

        if product.source_type == "apu":
            source_apu = db.query(APU).filter(APU.id == product.source_id).first()
            if not source_apu:
                raise HTTPException(status_code=404, detail="APU origen no encontrado.")
            target_base_id = apu_target_base_id or self._get_or_create_acquisition_base(db, buyer).id
            cloned_apu = self._clone_apu_to_company(db, source_apu, buyer, target_base_id)
            return "apu", cloned_apu.id

        if product.source_type == "proyecto":
            source_project = db.query(Proyecto).filter(Proyecto.id == product.source_id).first()
            if not source_project:
                raise HTTPException(status_code=404, detail="Proyecto origen no encontrado.")
            cloned_project = self._clone_project_to_company(db, source_project, buyer)
            return "proyecto", cloned_project.id

        return None, None

    def checkout(self, db: Session, payload: MarketplaceCheckoutRequest, current_user: Usuario) -> MarketplaceOrder:
        self._ensure_buyer_access(current_user)
        checkout_items = self._normalize_checkout_items(payload)
        if not checkout_items:
            raise HTTPException(status_code=400, detail="Debe enviar al menos un producto para checkout.")

        product_ids = [item["product_id"] for item in checkout_items]
        products = self._get_products_for_checkout(db, product_ids)
        products_by_id = {product.id: product for product in products}

        total = Decimal("0.00")
        normalized_lines: list[dict] = []
        for line in checkout_items:
            product = products_by_id.get(line["product_id"])
            if not product:
                raise HTTPException(status_code=400, detail="Uno o más productos no están disponibles para compra.")

            sales_config = self._extract_sales_config(product)
            quantity = int(line["quantity"])
            if not sales_config["allows_multiple"] and quantity > 1:
                raise HTTPException(
                    status_code=400,
                    detail=f"El producto '{product.titulo}' solo permite compra unitaria.",
                )
            if quantity < sales_config["min_quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"El producto '{product.titulo}' requiere una cantidad mínima de {sales_config['min_quantity']}.",
                )
            if sales_config["max_quantity"] and quantity > sales_config["max_quantity"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"El producto '{product.titulo}' permite una cantidad máxima de {sales_config['max_quantity']}.",
                )
            if sales_config["allows_multiple"]:
                delta = quantity - sales_config["min_quantity"]
                if delta % sales_config["quantity_step"] != 0:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"El producto '{product.titulo}' debe comprarse en incrementos de "
                            f"{sales_config['quantity_step']}."
                        ),
                    )

            line_total = Decimal(str(product.precio or 0)) * Decimal(quantity)
            total += line_total
            normalized_lines.append({
                "product": product,
                "quantity": quantity,
            })

        commission = (total * self.PLATFORM_COMMISSION_RATE).quantize(Decimal("0.01"))
        seller_amount = (total * self.SELLER_RATE).quantize(Decimal("0.01"))

        order = MarketplaceOrder(
            buyer_user_id=current_user.id,
            total=total,
            commission_amount=commission,
            seller_amount=seller_amount,
            currency=products[0].moneda if products else "USD",
            status="completed",
            notes=payload.notes,
        )
        db.add(order)
        db.flush()

        payment_attempt = MarketplacePaymentAttempt(
            order_id=order.id,
            payment_method="legacy_checkout",
            payment_provider="internal",
            status="confirmed",
            amount=total,
            currency=order.currency,
            environment_mode="legacy",
            payload_json={
                "buyer_company_id": current_user.empresa_id,
                "buyer_user_id": current_user.id,
                "notes": payload.notes,
            },
        )
        db.add(payment_attempt)
        db.flush()

        for line in normalized_lines:
            product = line["product"]
            quantity = line["quantity"]
            for _ in range(quantity):
                delivered_type, delivered_id = self._fulfill_product(db, product, current_user, payload.apu_target_base_id)
                item = MarketplaceOrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    seller_user_id=product.seller_user_id,
                    product_title_snapshot=product.titulo,
                    product_type_snapshot=product.product_type,
                    source_type_snapshot=product.source_type,
                    source_id_snapshot=product.source_id,
                    delivered_entity_type=delivered_type,
                    delivered_entity_id=delivered_id,
                    price=product.precio,
                )
                db.add(item)
                db.flush()

                if delivered_type and delivered_id and delivered_type != "empresa_licencia":
                    origin_metadata = {
                        "product_type": product.product_type,
                        "product_kind": product.product_kind,
                    }
                    if product.product_type == "portal_compras_publicas":
                        preview = self._extract_product_preview(product)
                        portal_meta = dict(preview.get("portal_meta") or {})
                        project_delivery_metadata = {}
                        if delivered_type == "proyecto" and delivered_id:
                            delivered_project = db.query(Proyecto).filter(Proyecto.id == delivered_id).first()
                            if delivered_project and isinstance(delivered_project.plantillas_config, dict):
                                project_delivery_metadata = dict(delivered_project.plantillas_config.get("marketplace_delivery") or {})
                        origin_metadata.update(
                            {
                                "template_version": portal_meta.get("template_version"),
                                "processing_status": portal_meta.get("processing_status"),
                                "delivery_mode": portal_meta.get("delivery_mode"),
                                "import_analysis": dict(portal_meta.get("import_analysis") or {}),
                                "project_delivery_policy": dict(portal_meta.get("project_delivery_policy") or {}),
                                "delivery_preview": dict(portal_meta.get("delivery_preview") or {}),
                                "marketplace_delivery": project_delivery_metadata,
                            }
                        )
                    self._register_delivered_asset_origins(
                        db,
                        buyer=current_user,
                        product=product,
                        order_id=order.id,
                        order_item_id=item.id,
                        delivered_type=delivered_type,
                        delivered_id=delivered_id,
                        origin_metadata=origin_metadata,
                    )

            product.ventas_count = int(product.ventas_count or 0) + quantity
            db.add(product)

        db.add(MarketplacePaymentEvent(
            payment_attempt_id=payment_attempt.id,
            provider="internal",
            event_type="legacy_checkout_confirmed",
            event_origin="checkout",
            correlation_id=str(order.id),
            payload_json={
                "order_id": order.id,
                "buyer_user_id": current_user.id,
                "buyer_company_id": current_user.empresa_id,
            },
            processed_at=datetime.now(timezone.utc),
        ))

        db.commit()
        db.refresh(order)
        return (
            db.query(MarketplaceOrder)
            .options(joinedload(MarketplaceOrder.items), joinedload(MarketplaceOrder.payment_attempts))
            .filter(MarketplaceOrder.id == order.id)
            .first()
        )

    def list_own_orders(self, db: Session, current_user: Usuario):
        self._ensure_buyer_access(current_user)
        self._expire_stale_bank_transfer_orders(db)
        orders = (
            db.query(MarketplaceOrder)
            .options(
                joinedload(MarketplaceOrder.items),
                joinedload(MarketplaceOrder.payment_attempts).joinedload(MarketplacePaymentAttempt.events),
            )
            .filter(MarketplaceOrder.buyer_user_id == current_user.id)
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrder.id.desc())
            .all()
        )
        return [self._serialize_order_summary(order) for order in orders]

    def get_own_order(self, db: Session, order_id: int, current_user: Usuario):
        self._expire_stale_bank_transfer_orders(db)
        return self._serialize_order_summary(self._get_accessible_order(db, order_id, current_user))

    def list_order_downloads(self, db: Session, order_id: int, current_user: Usuario) -> list[dict]:
        order = self._get_accessible_order(db, order_id, current_user)
        if (order.status or "").strip().lower() == "refunded":
            return []
        downloads: list[dict] = []
        portal_origin_by_order_item = {
            origin.marketplace_order_item_id: origin
            for origin in (
                db.query(MarketplaceAssetOrigin)
                .filter(
                    MarketplaceAssetOrigin.marketplace_order_id == order.id,
                    MarketplaceAssetOrigin.marketplace_order_item_id.isnot(None),
                )
                .all()
            )
        }
        budget_ids_by_project = {
            project_id: budget_id
            for project_id, budget_id in (
                db.query(Presupuesto.proyecto_id, Presupuesto.id)
                .filter(Presupuesto.proyecto_id.in_([
                    item.delivered_entity_id
                    for item in order.items
                    if item.delivered_entity_type == "proyecto" and item.delivered_entity_id
                ]))
                .order_by(Presupuesto.id.asc())
                .all()
            )
        }

        for item in order.items:
            if item.delivered_entity_type == "apu" and item.delivered_entity_id:
                downloads.append({
                    "order_item_id": item.id,
                    "label": f"APU XLSX · {item.product_title_snapshot}",
                    "description": "Reporte técnico del APU adquirido.",
                    "report_type": "apu",
                    "entity_id": item.delivered_entity_id,
                    "format": "xlsx",
                    "template_id": "001",
                })
                downloads.append({
                    "order_item_id": item.id,
                    "label": f"APU PDF · {item.product_title_snapshot}",
                    "description": "Versión PDF del APU adquirido.",
                    "report_type": "apu",
                    "entity_id": item.delivered_entity_id,
                    "format": "pdf",
                    "template_id": "001",
                })

            if item.delivered_entity_type == "proyecto" and item.delivered_entity_id and item.product_type_snapshot != "portal_compras_publicas":
                downloads.append({
                    "order_item_id": item.id,
                    "label": f"EDT XLSX · {item.product_title_snapshot}",
                    "description": "Estructura EDT del proyecto adquirido.",
                    "report_type": "edt",
                    "entity_id": item.delivered_entity_id,
                    "format": "xlsx",
                    "variant": "listado",
                })
                project_budget_id = budget_ids_by_project.get(item.delivered_entity_id)
                if project_budget_id:
                    downloads.append({
                        "order_item_id": item.id,
                        "label": f"Presupuesto XLSX · {item.product_title_snapshot}",
                        "description": "Presupuesto operativo del proyecto adquirido.",
                        "report_type": "presupuesto",
                        "entity_id": project_budget_id,
                        "format": "xlsx",
                        "template_id": "001",
                    })
                    downloads.append({
                        "order_item_id": item.id,
                        "label": f"Presupuesto PDF · {item.product_title_snapshot}",
                        "description": "Versión PDF del presupuesto operativo.",
                        "report_type": "presupuesto",
                        "entity_id": project_budget_id,
                        "format": "pdf",
                        "template_id": "001",
                    })

            if item.product_type_snapshot == "portal_compras_publicas":
                origin = portal_origin_by_order_item.get(item.id)
                metadata = dict(origin.metadata_json or {}) if origin and isinstance(origin.metadata_json, dict) else {}
                if dict(metadata.get("import_analysis") or {}) and metadata.get("delivery_mode") != "project_only":
                    downloads.append({
                        "order_item_id": item.id,
                        "label": f"Portal Excel · {item.product_title_snapshot}",
                        "description": "Exportación técnica integrada del portal de compras públicas adquirido.",
                        "report_type": "portal_excel",
                        "entity_id": item.delivered_entity_id or item.id,
                        "format": "xlsx",
                        "variant": "portal_import",
                    })

        return downloads

    def generate_portal_order_excel(self, db: Session, order_id: int, order_item_id: int, current_user: Usuario):
        order = self._get_accessible_order(db, order_id, current_user)
        item = next((candidate for candidate in order.items if candidate.id == order_item_id), None)
        if not item or item.product_type_snapshot != "portal_compras_publicas":
            raise HTTPException(status_code=404, detail="No se encontró la exportación técnica solicitada.")

        origin = (
            db.query(MarketplaceAssetOrigin)
            .filter(
                MarketplaceAssetOrigin.marketplace_order_id == order.id,
                MarketplaceAssetOrigin.marketplace_order_item_id == order_item_id,
            )
            .first()
        )
        metadata = dict(origin.metadata_json or {}) if origin and isinstance(origin.metadata_json, dict) else {}
        analysis = dict(metadata.get("import_analysis") or {})
        if not analysis:
            raise HTTPException(status_code=404, detail="El pedido no tiene una exportación técnica de portal disponible.")

        delivery_preview = dict(metadata.get("delivery_preview") or {})
        export_context = {
            "location_label": delivery_preview.get("location_label") or "-",
            "exported_at": datetime.utcnow().strftime("%Y-%m-%d"),
            "indirect_cost_percentage": 0.2,
            "reference_code": delivery_preview.get("reference_code") or "",
        }
        excel_bytes, filename = public_procurement_portal_import_service.build_excel_bytes(
            analysis,
            item.product_title_snapshot,
            export_context,
        )
        return io.BytesIO(excel_bytes), filename

    def generate_order_invoice_pdf(self, db: Session, order_id: int, current_user: Usuario):
        order = self._get_accessible_order(db, order_id, current_user)
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        left = 18 * mm
        y = height - 20 * mm

        def draw_line(text: str, size: int = 10, gap: float = 6.5 * mm, bold: bool = False):
            nonlocal y
            pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
            pdf.drawString(left, y, text)
            y -= gap

        pdf.setTitle(f"Factura Marketplace {order.id}")
        draw_line("GIPROY MARKETPLACE", size=9, gap=5 * mm, bold=True)
        draw_line(f"Factura de pedido #{order.id}", size=18, gap=8 * mm, bold=True)
        draw_line(f"Fecha: {order.created_at.strftime('%Y-%m-%d %H:%M') if order.created_at else '-'}", bold=False)
        draw_line(f"Comprador: {current_user.nombre_completo or current_user.email or current_user.alias or 'Usuario'}")
        draw_line(f"Moneda: {order.currency}")
        y -= 2 * mm
        draw_line("Detalle", size=12, gap=7 * mm, bold=True)

        for index, item in enumerate(order.items, start=1):
            if y < 35 * mm:
                pdf.showPage()
                y = height - 20 * mm
            draw_line(f"{index}. {item.product_title_snapshot}", size=11, gap=5.5 * mm, bold=True)
            draw_line(
                f"Tipo: {item.product_type_snapshot} | Entrega: {item.delivered_entity_type or 'manual'} | Precio: {Decimal(str(item.price or 0)):.2f} {order.currency}",
                size=9,
                gap=5 * mm,
            )

        y -= 2 * mm
        draw_line(f"Subtotal pedido: {Decimal(str(order.total or 0)):.2f} {order.currency}", bold=True)
        draw_line(f"Comisión plataforma: {Decimal(str(order.commission_amount or 0)):.2f} {order.currency}")
        draw_line(f"Liquidez vendedor: {Decimal(str(order.seller_amount or 0)):.2f} {order.currency}")
        draw_line(f"Estado: {order.status}")
        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        return buffer, f"factura_marketplace_{order.id}.pdf"

    def _resolve_entity_title(self, db: Session, entity_type: str, entity_id: int) -> str:
        if entity_type == "base_trabajo":
            entity = db.query(BaseTrabajo).filter(BaseTrabajo.id == entity_id).first()
            if entity:
                return entity.nombre
        elif entity_type == "apu":
            entity = db.query(APU).filter(APU.id == entity_id).first()
            if entity:
                return entity.descripcion
        elif entity_type == "proyecto":
            entity = db.query(Proyecto).filter(Proyecto.id == entity_id).first()
            if entity:
                return entity.nombre
        return f"{entity_type}:{entity_id}"

    def list_buyer_library(self, db: Session, current_user: Usuario) -> list[dict]:
        self._ensure_buyer_access(current_user)
        origins = (
            db.query(MarketplaceAssetOrigin)
            .filter(
                MarketplaceAssetOrigin.empresa_id == current_user.empresa_id,
                MarketplaceAssetOrigin.ownership_kind == "acquired",
            )
            .order_by(MarketplaceAssetOrigin.created_at.desc(), MarketplaceAssetOrigin.id.desc())
            .all()
        )

        items: list[dict] = []
        for origin in origins:
            metadata_json = origin.metadata_json if isinstance(origin.metadata_json, dict) else {}
            if metadata_json.get("revoked"):
                continue
            items.append(
                {
                    "origin_id": origin.id,
                    "entity_type": origin.entity_type,
                    "entity_id": origin.entity_id,
                    "entity_title": self._resolve_entity_title(db, origin.entity_type, origin.entity_id),
                    "ownership_kind": origin.ownership_kind,
                    "origin_kind": origin.origin_kind,
                    "origin_label": origin.origin_label,
                    "source_entity_type": origin.source_entity_type,
                    "source_entity_id": origin.source_entity_id,
                    "source_entity_title": self._resolve_entity_title(db, origin.source_entity_type, origin.source_entity_id)
                    if origin.source_entity_type and origin.source_entity_id
                    else None,
                    "marketplace_product_id": origin.marketplace_product_id,
                    "marketplace_order_id": origin.marketplace_order_id,
                    "marketplace_order_item_id": origin.marketplace_order_item_id,
                    "metadata_json": metadata_json,
                    "usage_policy": marketplace_asset_origin_service.get_usage_policy(
                        origin.ownership_kind,
                        origin.origin_kind,
                        metadata_json,
                    ),
                    "created_at": origin.created_at,
                }
            )
        return items


marketplace_checkout_service = MarketplaceCheckoutService()
