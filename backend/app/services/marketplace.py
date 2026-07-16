import re
import unicodedata
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.marketplace import (
    MarketplaceOrder,
    MarketplaceOrderItem,
    MarketplacePaymentMethod,
    MarketplaceProductCategory,
    MarketplaceReview,
)
from app.models.apu import APU
from app.models.base_trabajo import BaseTrabajo
from app.models.empresa import Empresa
from app.models.marketplace import MarketplaceProduct
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.schemas.marketplace import MarketplaceProductCreate, MarketplaceProductUpdate
from app.services.audit_event import record_audit_event
from app.services.marketplace_asset_origin import marketplace_asset_origin_service
from app.services.marketplace_bootstrap import FIXED_MARKETPLACE_CATEGORIES
from app.services.marketplace_profile import evaluate_marketplace_profile, seed_admin_marketplace_profile_from_company
from app.services.marketplace_permissions import has_marketplace_permission, is_marketplace_beta_company_admin
from app.services.geo import ECUADOR_GEO_REFERENCE


class MarketplaceService:
    SYSTEM_ONLY_PRODUCT_TYPES = {"licencia", "addon", "adicional", "portal_compras_publicas"}
    STANDARD_SELLER_PRODUCT_TYPES = {"base_maestra", "apu", "proyecto"}
    FIXED_CATEGORY_SLUG_BY_PRODUCT_TYPE = {
        "licencia": "tienda-licencias",
        "apu": "tienda-apus",
        "base_maestra": "tienda-bases-maestras",
        "proyecto": "tienda-proyectos",
        "portal_compras_publicas": "tienda-portal-compras-publicas",
        "addon": "tienda-packs-saas",
        "adicional": "tienda-modulos-servicios",
    }
    REFERENCE_TYPE_TO_PRODUCT_TYPE = {
        "base_trabajo": "base_maestra",
        "apu": "apu",
        "proyecto": "proyecto",
    }
    PAYMENT_METHOD_DEFAULTS = (
        {
            "slug": "payphone",
            "nombre": "PayPhone",
            "descripcion": "Cobro inmediato mediante la cajita de pagos PayPhone.",
            "provider": "payphone",
            "priority": 10,
            "environment_mode": "sandbox",
            "config_json": {
                "public_text": "Paga con PayPhone y confirma la compra al aprobarse la transacción.",
                "support_email": "",
                "token": "",
                "store_id": "",
                "return_url": "",
            },
        },
        {
            "slug": "paypal",
            "nombre": "PayPal",
            "descripcion": "Cobro online con orden y captura mediante PayPal.",
            "provider": "paypal",
            "priority": 20,
            "environment_mode": "sandbox",
            "config_json": {
                "public_text": "Paga con PayPal y activa la compra después de confirmar la captura.",
                "support_email": "",
                "client_id": "",
                "client_secret": "",
                "webhook_id": "",
            },
        },
        {
            "slug": "bank_transfer",
            "nombre": "Transferencia bancaria",
            "descripcion": "Pedido registrado con validación manual por transferencia bancaria.",
            "provider": "manual",
            "priority": 30,
            "environment_mode": "manual",
            "config_json": {
                "public_text": "Realiza la transferencia y espera la validación manual del equipo comercial.",
                "support_email": "",
                "bank_name": "",
                "account_holder": "",
                "account_number": "",
                "iban_cci": "",
                "instructions": "",
            },
        },
    )

    def _normalize_portal_date_value(self, raw_value, *, field_label: str) -> str:
        raw_text = str(raw_value or "").strip()
        if not raw_text:
            return ""

        first_token = re.split(r"[T ]", raw_text, maxsplit=1)[0].strip()
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", first_token):
            raise HTTPException(status_code=400, detail=f"{field_label} debe usar una fecha válida en formato YYYY-MM-DD.")
        try:
            normalized = datetime.fromisoformat(first_token).date().isoformat()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=f"{field_label} debe usar una fecha válida en formato YYYY-MM-DD.") from exc
        return normalized

    def _parse_portal_licitacion_amount(self, raw_value) -> Decimal:
        raw_text = str(raw_value or "").strip()
        if not raw_text:
            return Decimal("0.00")

        compact = raw_text.replace(" ", "").replace("'", "")
        has_comma = "," in compact
        has_dot = "." in compact

        if has_comma and has_dot:
            decimal_separator = "." if compact.rfind(".") > compact.rfind(",") else ","
            thousands_separator = "," if decimal_separator == "." else "."
            normalized = compact.replace(thousands_separator, "").replace(decimal_separator, ".")
        elif has_comma:
            parts = compact.split(",")
            last_part = parts[-1] if parts else ""
            if len(parts) == 2 and len(last_part) <= 2:
                normalized = f"{parts[0]}.{last_part}"
            else:
                normalized = compact.replace(",", "")
        elif has_dot:
            parts = compact.split(".")
            last_part = parts[-1] if parts else ""
            if len(parts) == 2 and len(last_part) <= 2:
                normalized = compact
            else:
                normalized = compact.replace(".", "")
        else:
            normalized = compact

        try:
            return Decimal(normalized)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Portal de compras públicas requiere un precio de licitación numérico válido.") from exc

    def _resolve_portal_commercial_price(self, portal_meta: Optional[dict]) -> Decimal:
        licitacion_amount = self._parse_portal_licitacion_amount((portal_meta or {}).get("precio_licitacion"))
        if licitacion_amount <= Decimal("100000"):
            return Decimal("11.50")
        if licitacion_amount <= Decimal("300000"):
            return Decimal("35.50")
        if licitacion_amount <= Decimal("1000000"):
            return Decimal("115.00")
        return Decimal("345.00")

    def _get_general_activation_readiness(
        self,
        *,
        title: str,
        product_meta: Optional[dict],
    ) -> dict:
        normalized_title = str(title or "").strip()
        product_data = dict(product_meta or {})

        missing_fields: list[str] = []
        if not normalized_title:
            missing_fields.append("titulo")
        if not str(product_data.get("descripcion_corta") or "").strip():
            missing_fields.append("descripcion_corta")
        if not str(product_data.get("descripcion_larga") or "").strip():
            missing_fields.append("descripcion_larga")
        if not str(product_data.get("descripcion_completa") or "").strip():
            missing_fields.append("descripcion_completa")
        if not str(product_data.get("fecha_inicio_publicacion") or "").strip():
            missing_fields.append("fecha_inicio_publicacion")
        if not str(product_data.get("fecha_fin_publicacion") or "").strip():
            missing_fields.append("fecha_fin_publicacion")

        return {
            "ready": not missing_fields,
            "missing_fields": missing_fields,
        }

    def _get_activation_readiness(
        self,
        *,
        product_type: str,
        title: str,
        product_meta: Optional[dict],
        portal_meta: Optional[dict] = None,
    ) -> dict:
        general = self._get_general_activation_readiness(
            title=title,
            product_meta=product_meta,
        )
        if (product_type or "").strip().lower() != "portal_compras_publicas":
            return general

        portal = self._get_portal_activation_readiness(
            title=title,
            product_meta=product_meta,
            portal_meta=portal_meta,
        )
        merged_missing = []
        for field_name in [*general["missing_fields"], *portal["missing_fields"]]:
            if field_name not in merged_missing:
                merged_missing.append(field_name)
        return {
            "ready": not merged_missing,
            "missing_fields": merged_missing,
        }

    def _get_portal_activation_readiness(
        self,
        *,
        title: str,
        product_meta: Optional[dict],
        portal_meta: Optional[dict],
    ) -> dict:
        normalized_title = str(title or "").strip()
        product_data = dict(product_meta or {})
        portal_data = dict(portal_meta or {})
        import_source = dict(portal_data.get("import_source") or {})
        unified_reference = str(import_source.get("reference") or portal_data.get("codigo_licitacion") or "").strip()

        missing_fields: list[str] = []
        if not normalized_title:
            missing_fields.append("titulo")
        if not str(product_data.get("descripcion_corta") or "").strip():
            missing_fields.append("descripcion_corta")
        if not str(product_data.get("descripcion_larga") or "").strip():
            missing_fields.append("descripcion_larga")
        if not str(product_data.get("descripcion_completa") or "").strip():
            missing_fields.append("descripcion_completa")
        if not str(product_data.get("fecha_inicio_publicacion") or "").strip():
            missing_fields.append("fecha_inicio_publicacion")
        if not str(product_data.get("fecha_fin_publicacion") or "").strip():
            missing_fields.append("fecha_fin_publicacion")
        if not str(portal_data.get("pais") or "").strip():
            missing_fields.append("pais")
        if not str(portal_data.get("provincia") or "").strip():
            missing_fields.append("provincia")
        if not str(portal_data.get("precio_licitacion") or "").strip():
            missing_fields.append("precio_licitacion")
        if not str(portal_data.get("fecha_inicio_licitacion") or "").strip():
            missing_fields.append("fecha_inicio_licitacion")
        if not str(portal_data.get("fecha_fin_licitacion") or "").strip():
            missing_fields.append("fecha_fin_licitacion")
        if not str(import_source.get("kind") or "").strip():
            missing_fields.append("import_source_kind")
        if not unified_reference:
            missing_fields.append("import_source_reference")
        if str(import_source.get("kind") or "").strip() == "archivo_base" and not isinstance(portal_data.get("import_analysis"), dict):
            missing_fields.append("import_analysis")

        return {
            "ready": not missing_fields,
            "missing_fields": missing_fields,
        }

    def _normalize_sales_config(self, sales_config: Optional[dict]) -> dict:
        raw = sales_config if isinstance(sales_config, dict) else {}
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
            }

        return {
            "sale_mode": "pack",
            "min_quantity": min_quantity,
            "default_quantity": default_quantity,
            "quantity_step": quantity_step,
            "max_quantity": max_quantity,
        }

    def _merge_preview_sales_config(self, current_preview: Optional[dict], sales_config: Optional[dict]) -> dict:
        preview = dict(current_preview or {})
        preview["sales_config"] = self._normalize_sales_config(sales_config)
        return preview

    def _generate_product_code(self, db: Session, product_type: str) -> str:
        prefixes = {
            "licencia": "LIC",
            "addon": "ADD",
            "adicional": "ADI",
            "base_maestra": "BMT",
            "apu": "APU",
            "proyecto": "PRY",
            "portal_compras_publicas": "PCP",
        }
        prefix = prefixes.get((product_type or "").strip().lower(), "PRD")
        sequence = (db.query(func.count(MarketplaceProduct.id)).filter(MarketplaceProduct.product_type == product_type).scalar() or 0) + 1
        return f"{prefix}-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{sequence:04d}"

    def _resolve_creator_label(self, db: Session, current_user: Usuario) -> str:
        if (current_user.rol or "").lower() == "superadministrador":
            return "Sistema"
        if current_user.empresa_id:
            company_name = db.query(Empresa.nombre).filter(Empresa.id == current_user.empresa_id).scalar()
            if company_name:
                return company_name
        return current_user.nombre_completo or "Sin creador"

    def _extract_publication_window(self, product: MarketplaceProduct) -> tuple[Optional[str], Optional[str]]:
        preview = dict(product.vista_previa or {})
        product_meta = dict(preview.get("product_meta") or {})
        start = (
            product_meta.get("fecha_inicio_publicacion")
            or product_meta.get("fecha_publicacion")
            or None
        )
        end = (
            product_meta.get("fecha_fin_publicacion")
            or product_meta.get("fecha_retirada")
            or None
        )
        return (
            str(start).strip() if start else None,
            str(end).strip() if end else None,
        )

    def _is_product_in_publication_window(self, product: MarketplaceProduct, now: Optional[datetime] = None) -> bool:
        start_raw, end_raw = self._extract_publication_window(product)
        if not start_raw or not end_raw:
            return False
        current_date = (now or datetime.now(timezone.utc)).date()
        try:
            start_date = datetime.fromisoformat(start_raw).date()
            end_date = datetime.fromisoformat(end_raw).date()
        except ValueError:
            return False
        return start_date <= current_date <= end_date

    def _normalize_product_meta(
        self,
        db: Session,
        current_user: Usuario,
        product_type: str,
        price: Decimal,
        product_meta: Optional[dict],
        current_preview: Optional[dict] = None,
        *,
        require_publication_window: bool = True,
    ) -> dict:
        current_meta = dict((current_preview or {}).get("product_meta") or {})
        raw = product_meta if isinstance(product_meta, dict) else {}
        normalized_product_type = (product_type or "").strip().lower()

        codigo = str(raw.get("codigo") or current_meta.get("codigo") or self._generate_product_code(db, product_type)).strip()
        fecha_inicio_publicacion = str(
            raw.get("fecha_inicio_publicacion")
            or raw.get("fecha_publicacion")
            or current_meta.get("fecha_inicio_publicacion")
            or current_meta.get("fecha_publicacion")
            or datetime.now(timezone.utc).date().isoformat()
        ).strip()
        fecha_fin_publicacion_raw = (
            raw.get("fecha_fin_publicacion")
            if "fecha_fin_publicacion" in raw
            else raw.get("fecha_retirada", current_meta.get("fecha_fin_publicacion", current_meta.get("fecha_retirada")))
        )
        descuento_promocion_raw = raw.get("descuento_promocion", current_meta.get("descuento_promocion"))
        descripcion_completa_raw = raw.get("descripcion_completa", current_meta.get("descripcion_completa"))
        imagen_relevante_raw = raw.get("imagen_relevante_url", current_meta.get("imagen_relevante_url"))

        fecha_fin_publicacion = str(fecha_fin_publicacion_raw or "").strip() or None
        if require_publication_window:
            if not fecha_inicio_publicacion or not fecha_fin_publicacion:
                raise HTTPException(status_code=400, detail="Todos los artículos requieren fecha de inicio y fin de publicación.")
            try:
                start_date = datetime.fromisoformat(fecha_inicio_publicacion).date()
                end_date = datetime.fromisoformat(fecha_fin_publicacion).date()
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Las fechas de publicación no tienen un formato válido.") from exc
            if end_date < start_date:
                raise HTTPException(status_code=400, detail="La fecha fin de publicación no puede ser anterior a la fecha de inicio.")
        elif fecha_inicio_publicacion or fecha_fin_publicacion:
            if not fecha_inicio_publicacion or not fecha_fin_publicacion:
                raise HTTPException(status_code=400, detail="Si defines publicación en borrador, debes indicar inicio y fin.")
            try:
                start_date = datetime.fromisoformat(fecha_inicio_publicacion).date()
                end_date = datetime.fromisoformat(fecha_fin_publicacion).date()
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Las fechas de publicación no tienen un formato válido.") from exc
            if end_date < start_date:
                raise HTTPException(status_code=400, detail="La fecha fin de publicación no puede ser anterior a la fecha de inicio.")

        normalized_meta = {
            **current_meta,
            **raw,
            "codigo": codigo,
            "descripcion_corta": str(raw.get("descripcion_corta") or current_meta.get("descripcion_corta") or "").strip() or None,
            "descripcion_larga": str(raw.get("descripcion_larga") or current_meta.get("descripcion_larga") or "").strip() or None,
            "descripcion_completa": str(descripcion_completa_raw or "").strip() or None,
            "imagen_relevante_url": str(imagen_relevante_raw or "").strip() or None,
            "precio_con_iva": f"{Decimal(price):.2f}",
            "fecha_inicio_publicacion": fecha_inicio_publicacion,
            "fecha_fin_publicacion": fecha_fin_publicacion,
            "descuento_promocion": str(descuento_promocion_raw or "").strip() or None,
            "creador": "Sistema" if normalized_product_type == "portal_compras_publicas" else self._resolve_creator_label(db, current_user),
        }
        return normalized_meta

    def _build_portal_template_version(self, product_code: str, revision: int) -> str:
        base_code = (product_code or "PCP").strip() or "PCP"
        safe_revision = max(1, int(revision or 1))
        return f"{base_code}-V{safe_revision}"

    def _normalize_geo_key(self, value: Optional[str]) -> Optional[str]:
        text = str(value or "").strip().lower()
        if not text:
            return None
        normalized = unicodedata.normalize("NFKD", text)
        normalized = "".join(char for char in normalized if not unicodedata.combining(char))
        normalized = re.sub(r"[^a-z0-9]+", " ", normalized).strip()
        return normalized or None

    def _resolve_portal_reference_code(self, product_meta: Optional[dict], portal_meta: Optional[dict]) -> Optional[str]:
        portal_data = dict(portal_meta or {})
        import_source = dict(portal_data.get("import_source") or {})
        candidates = [
            import_source.get("reference"),
            portal_data.get("codigo_licitacion"),
            dict(product_meta or {}).get("codigo"),
        ]
        for candidate in candidates:
            value = str(candidate or "").strip()
            if value:
                return value
        return None

    def _resolve_portal_project_geolocation(self, portal_meta: Optional[dict]) -> dict:
        portal_data = dict(portal_meta or {})
        province_key = self._normalize_geo_key(portal_data.get("provincia"))
        canton_key = self._normalize_geo_key(portal_data.get("canton"))

        match = None
        if province_key and canton_key:
            match = ECUADOR_GEO_REFERENCE.get((province_key, canton_key))
        if match is None and province_key:
            match = ECUADOR_GEO_REFERENCE.get((province_key, None))

        if not match:
            return {
                "lat": None,
                "lng": None,
                "resolution": "unresolved",
                "label": None,
            }

        label_parts = [portal_data.get("pais"), portal_data.get("provincia"), portal_data.get("canton")]
        return {
            "lat": match["lat"],
            "lng": match["lng"],
            "resolution": match["resolution"],
            "label": " / ".join([part for part in label_parts if part]),
        }

    def _portal_meaningful_payload(self, portal_meta: Optional[dict]) -> dict:
        meta = dict(portal_meta or {})
        return {
            "pais": meta.get("pais"),
            "provincia": meta.get("provincia"),
            "canton": meta.get("canton"),
            "direccion": meta.get("direccion"),
            "codigo_licitacion": meta.get("codigo_licitacion"),
            "precio_licitacion": meta.get("precio_licitacion"),
            "fecha_inicio_licitacion": meta.get("fecha_inicio_licitacion"),
            "fecha_fin_licitacion": meta.get("fecha_fin_licitacion"),
            "delivery_mode": meta.get("delivery_mode"),
            "import_source": meta.get("import_source"),
            "project_delivery_policy": meta.get("project_delivery_policy"),
            "import_analysis": meta.get("import_analysis"),
        }

    def _resolve_portal_processing_status(self, portal_meta: Optional[dict]) -> str:
        meta = dict(portal_meta or {})
        import_source = dict(meta.get("import_source") or {})
        policy = dict(meta.get("project_delivery_policy") or {})
        delivery_mode = (meta.get("delivery_mode") or "excel_and_project").strip().lower()

        if not import_source.get("kind") or not import_source.get("reference"):
            return "draft"
        if delivery_mode not in {"excel_only", "project_only", "excel_and_project"}:
            return "error"
        if delivery_mode in {"project_only", "excel_and_project"} and not policy.get("create_project_on_purchase", True):
            return "error"
        return "ready"

    def _validate_portal_product_ready(self, product_meta: dict, portal_meta: dict) -> None:
        policy = dict(portal_meta.get("project_delivery_policy") or {})
        if not policy.get("create_project_on_purchase", True):
            raise HTTPException(status_code=400, detail="Portal de compras públicas debe crear un proyecto al comprarse.")

    def _build_portal_delivery_preview(
        self,
        *,
        title: str,
        currency: str,
        product_meta: dict,
        portal_meta: dict,
    ) -> dict:
        policy = dict(portal_meta.get("project_delivery_policy") or {})
        import_source = dict(portal_meta.get("import_source") or {})
        licitacion_price = portal_meta.get("precio_licitacion") or product_meta.get("precio_con_iva") or "0.00"
        reference_code = self._resolve_portal_reference_code(product_meta, portal_meta)
        geolocation = self._resolve_portal_project_geolocation(portal_meta)
        location_label = " / ".join(
            [part for part in [portal_meta.get("pais"), portal_meta.get("provincia"), portal_meta.get("canton")] if part]
        )

        return {
            "article_title": title,
            "template_version": portal_meta.get("template_version"),
            "processing_status": portal_meta.get("processing_status"),
            "delivery_mode": portal_meta.get("delivery_mode"),
            "location_label": location_label,
            "publication_window": {
                "start": product_meta.get("fecha_inicio_publicacion"),
                "end": product_meta.get("fecha_fin_publicacion"),
            },
            "licitacion_window": {
                "start": portal_meta.get("fecha_inicio_licitacion"),
                "end": portal_meta.get("fecha_fin_licitacion"),
            },
            "import_source": {
                "kind": import_source.get("kind"),
                "reference": import_source.get("reference"),
                "excel_export_enabled": bool(import_source.get("excel_export_enabled", True)),
                "project_seed_enabled": bool(import_source.get("project_seed_enabled", True)),
            },
            "import_analysis": dict(portal_meta.get("import_analysis") or {}),
            "project_delivery": {
                "project_name": f"Adquirido · {title}",
                "cod_referencial": reference_code,
                "location_label": location_label,
                "address": portal_meta.get("direccion"),
                "geolocation": geolocation,
                "without_base": bool(policy.get("project_without_base", True)),
                "send_locked": bool(policy.get("project_send_locked", True)),
                "mark_as_acquired": bool(policy.get("mark_as_acquired", True)),
            },
            "commercial": {
                "creator": product_meta.get("creador"),
                "price_with_tax": licitacion_price,
                "currency": currency or "USD",
            },
        }

    def _finalize_portal_meta(
        self,
        *,
        title: str,
        currency: str,
        product_meta: dict,
        portal_meta: dict,
        current_preview: Optional[dict] = None,
        revision_bump: bool = False,
    ) -> dict:
        current_meta = dict((current_preview or {}).get("portal_meta") or {})
        current_revision = int(current_meta.get("template_revision") or 1)
        revision = current_revision + 1 if current_meta and revision_bump else current_revision
        if not current_meta:
            revision = 1

        final_meta = dict(portal_meta or {})
        final_meta["template_revision"] = revision
        final_meta["template_version"] = self._build_portal_template_version(product_meta.get("codigo") or "PCP", revision)
        final_meta["processing_status"] = self._resolve_portal_processing_status(final_meta)
        final_meta["activation_readiness"] = self._get_portal_activation_readiness(
            title=title,
            product_meta=product_meta,
            portal_meta=final_meta,
        )
        final_meta["delivery_preview"] = self._build_portal_delivery_preview(
            title=title,
            currency=currency,
            product_meta=product_meta,
            portal_meta=final_meta,
        )
        final_meta["traceability"] = {
            "last_validated_at": datetime.now(timezone.utc).isoformat(),
            "source": "marketplace_admin",
            "template_revision": revision,
        }
        return final_meta

    def _normalize_portal_meta(
        self,
        portal_meta: Optional[dict],
        current_preview: Optional[dict] = None,
        *,
        require_fields: bool = False,
    ) -> Optional[dict]:
        current_meta = dict((current_preview or {}).get("portal_meta") or {})
        raw = portal_meta if isinstance(portal_meta, dict) else {}
        import_source_raw = raw.get("import_source") if isinstance(raw.get("import_source"), dict) else (
            current_meta.get("import_source") if isinstance(current_meta.get("import_source"), dict) else {}
        )
        policy_raw = raw.get("project_delivery_policy") if isinstance(raw.get("project_delivery_policy"), dict) else (
            current_meta.get("project_delivery_policy") if isinstance(current_meta.get("project_delivery_policy"), dict) else {}
        )
        delivery_mode = str(raw.get("delivery_mode") if "delivery_mode" in raw else current_meta.get("delivery_mode") or "excel_and_project").strip().lower()
        if delivery_mode not in {"excel_only", "project_only", "excel_and_project"}:
            delivery_mode = "excel_and_project"
        current_import_source = current_meta.get("import_source") if isinstance(current_meta.get("import_source"), dict) else {}
        normalized_import_reference = str(
            import_source_raw.get("reference")
            if "reference" in import_source_raw
            else current_import_source.get("reference") or ""
        ).strip() or None
        normalized_codigo_licitacion = str(
            raw.get("codigo_licitacion")
            if "codigo_licitacion" in raw
            else current_meta.get("codigo_licitacion") or normalized_import_reference or ""
        ).strip() or normalized_import_reference or ""
        unified_reference = normalized_import_reference or normalized_codigo_licitacion or None

        merged = {
            "pais": str(raw.get("pais") if "pais" in raw else current_meta.get("pais") or "").strip(),
            "provincia": str(raw.get("provincia") if "provincia" in raw else current_meta.get("provincia") or "").strip(),
            "canton": str(raw.get("canton") if "canton" in raw else current_meta.get("canton") or "").strip() or None,
            "direccion": str(raw.get("direccion") if "direccion" in raw else current_meta.get("direccion") or "").strip() or None,
            "codigo_licitacion": normalized_codigo_licitacion,
            "precio_licitacion": str(raw.get("precio_licitacion") if "precio_licitacion" in raw else current_meta.get("precio_licitacion") or "").strip(),
            "fecha_inicio_licitacion": self._normalize_portal_date_value(
                raw.get("fecha_inicio_licitacion") if "fecha_inicio_licitacion" in raw else current_meta.get("fecha_inicio_licitacion"),
                field_label="Fecha de publicación licitación",
            ),
            "fecha_fin_licitacion": self._normalize_portal_date_value(
                raw.get("fecha_fin_licitacion") if "fecha_fin_licitacion" in raw else current_meta.get("fecha_fin_licitacion"),
                field_label="Fecha entrega propuesta",
            ),
            "delivery_mode": delivery_mode,
            "import_source": {
                "kind": str(import_source_raw.get("kind") or "manual").strip().lower() or "manual",
                "reference": unified_reference,
                "notes": str(import_source_raw.get("notes") or "").strip() or None,
                "excel_export_enabled": bool(import_source_raw.get("excel_export_enabled", True)),
                "project_seed_enabled": bool(import_source_raw.get("project_seed_enabled", True)),
            },
            "project_delivery_policy": {
                "create_project_on_purchase": bool(policy_raw.get("create_project_on_purchase", True)),
                "project_without_base": bool(policy_raw.get("project_without_base", True)),
                "project_send_locked": bool(policy_raw.get("project_send_locked", True)),
                "mark_as_acquired": bool(policy_raw.get("mark_as_acquired", True)),
                "clone_source_project_on_purchase": bool(policy_raw.get("clone_source_project_on_purchase", False)),
                "source_project_id": policy_raw.get("source_project_id"),
            },
            "import_analysis": dict(raw.get("import_analysis") or current_meta.get("import_analysis") or {}) or None,
        }

        if require_fields:
            if not merged["pais"] or not merged["provincia"]:
                raise HTTPException(status_code=400, detail="Portal de compras públicas requiere país y provincia.")
            if not merged["precio_licitacion"]:
                raise HTTPException(status_code=400, detail="Portal de compras públicas requiere precio de licitación.")
            if not merged["fecha_inicio_licitacion"] or not merged["fecha_fin_licitacion"]:
                raise HTTPException(status_code=400, detail="Portal de compras públicas requiere fecha de inicio y fin de licitación.")
            if not merged["import_source"]["reference"]:
                raise HTTPException(status_code=400, detail="Portal de compras públicas requiere código o referencia técnica.")
            try:
                start = datetime.fromisoformat(merged["fecha_inicio_licitacion"])
                end = datetime.fromisoformat(merged["fecha_fin_licitacion"])
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="Las fechas de licitación no tienen un formato válido.") from exc
            if end < start:
                raise HTTPException(status_code=400, detail="La fecha fin de licitación no puede ser anterior a la fecha de inicio.")

        return merged

    def _merge_preview_metadata(
        self,
        current_preview: Optional[dict],
        *,
        product_meta: Optional[dict] = None,
        portal_meta: Optional[dict] = None,
        activation_readiness: Optional[dict] = None,
    ) -> dict:
        preview = dict(current_preview or {})
        if product_meta is not None:
            preview["product_meta"] = product_meta
        if portal_meta is not None:
            preview["portal_meta"] = portal_meta
        if activation_readiness is not None:
            preview["activation_readiness"] = activation_readiness
        return preview

    def _slugify(self, value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value or "")
        ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
        return slug or "producto"

    def _ensure_unique_slug(self, db: Session, base_slug: str, exclude_product_id: Optional[int] = None) -> str:
        slug = base_slug
        counter = 2
        while True:
            query = db.query(MarketplaceProduct).filter(MarketplaceProduct.slug == slug)
            if exclude_product_id is not None:
                query = query.filter(MarketplaceProduct.id != exclude_product_id)
            if not query.first():
                return slug
            slug = f"{base_slug}-{counter}"
            counter += 1

    def _build_cloned_title(self, db: Session, current_user: Usuario, original_title: str) -> str:
        base_title = (original_title or "Producto").strip()
        candidate = f"{base_title} (Copia)"
        counter = 2

        while db.query(MarketplaceProduct).filter(
            MarketplaceProduct.seller_user_id == current_user.id,
            func.lower(MarketplaceProduct.titulo) == candidate.lower(),
        ).first():
            candidate = f"{base_title} (Copia {counter})"
            counter += 1

        return candidate

    def _validate_seller_access(self, db: Session, current_user: Usuario) -> None:
        role = (current_user.rol or "").lower()
        if role not in {"administrador", "superadministrador"}:
            raise HTTPException(status_code=403, detail="Solo administradores pueden publicar en marketplace.")
        if not has_marketplace_permission(current_user, "seller.publish"):
            raise HTTPException(status_code=403, detail="No tiene permisos para publicar en marketplace.")
        if role == "superadministrador":
            return
        seed_admin_marketplace_profile_from_company(db, current_user)
        profile_status = evaluate_marketplace_profile(current_user)
        if not profile_status["complete"]:
            missing = ", ".join(profile_status["missing_labels"])
            raise HTTPException(status_code=403, detail=f"Complete el perfil del usuario antes de vender en marketplace. Faltan: {missing}.")

    def _ensure_company_can_sell(self, db: Session, current_user: Usuario) -> None:
        role = (current_user.rol or "").lower()
        if role == "superadministrador":
            return
        if not current_user.empresa_id:
            raise HTTPException(status_code=403, detail="El usuario no tiene una empresa asociada para vender en marketplace.")

        company = db.query(Empresa).filter(Empresa.id == current_user.empresa_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Empresa no encontrada.")
        if not company.marketplace_can_sell:
            raise HTTPException(status_code=403, detail="La empresa no tiene habilitada la venta en marketplace.")

    def _validate_marketplace_admin_access(self, current_user: Usuario) -> None:
        role = (current_user.rol or "").lower()
        if role != "superadministrador" and not is_marketplace_beta_company_admin(current_user):
            raise HTTPException(status_code=403, detail="Solo superadministración puede administrar globalmente el marketplace.")
        if not has_marketplace_permission(current_user, "marketplace.manage_all_products"):
            raise HTTPException(status_code=403, detail="No tiene permisos de administración global del marketplace.")

    def _validate_buyer_review_access(self, db: Session, current_user: Usuario) -> None:
        if not has_marketplace_permission(current_user, "reviews.create"):
            raise HTTPException(status_code=403, detail="No tiene permisos para reseñar productos del marketplace.")
        if (current_user.rol or "").lower() == "superadministrador":
            return
        seed_admin_marketplace_profile_from_company(db, current_user)
        profile_status = evaluate_marketplace_profile(current_user)
        if not profile_status["complete"]:
            missing = ", ".join(profile_status["missing_labels"])
            raise HTTPException(status_code=403, detail=f"Complete el perfil del usuario antes de reseñar en marketplace. Faltan: {missing}.")

    def _validate_product_type_access(self, current_user: Usuario, product_type: str, *, admin_context: bool = False) -> None:
        role = (current_user.rol or "").lower()
        normalized_type = (product_type or "").strip().lower()
        if role == "superadministrador" or (admin_context and is_marketplace_beta_company_admin(current_user)):
            if normalized_type not in (self.SYSTEM_ONLY_PRODUCT_TYPES | self.STANDARD_SELLER_PRODUCT_TYPES):
                raise HTTPException(status_code=400, detail="Tipo de producto marketplace no soportado.")
            return
        if normalized_type not in self.STANDARD_SELLER_PRODUCT_TYPES:
            raise HTTPException(
                status_code=403,
                detail="Esta empresa solo puede vender APUs, Bases Maestras y Proyectos en marketplace.",
            )

    def _validate_category_scope(
        self,
        db: Session,
        category_id: Optional[int],
        current_user: Usuario,
        *,
        admin_context: bool = False,
    ) -> Optional[MarketplaceProductCategory]:
        if not category_id:
            return None
        category = db.query(MarketplaceProductCategory).filter(MarketplaceProductCategory.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Categoría marketplace no encontrada.")

        fixed_slugs = {item["slug"] for item in FIXED_MARKETPLACE_CATEGORIES}
        if (category.slug or "").strip().lower() not in fixed_slugs:
            raise HTTPException(
                status_code=403,
                detail="Solo se pueden usar las categorías fijas habilitadas actualmente en Tienda.",
            )

        role = (current_user.rol or "").lower()
        scope = (category.visibility_scope or "all").lower()
        if scope == "system" and role != "superadministrador" and not (admin_context and is_marketplace_beta_company_admin(current_user)):
            raise HTTPException(status_code=403, detail="Esta categoría está reservada para productos del Sistema.")
        if scope == "users" and role == "superadministrador":
            raise HTTPException(status_code=403, detail="Esta categoría está reservada para vendedores de empresas usuarias.")
        return category

    def _resolve_fixed_category_for_product_type(self, db: Session, product_type: Optional[str]) -> Optional[MarketplaceProductCategory]:
        target_slug = self.FIXED_CATEGORY_SLUG_BY_PRODUCT_TYPE.get(str(product_type or "").strip().lower())
        if not target_slug:
            return None
        return (
            db.query(MarketplaceProductCategory)
            .filter(MarketplaceProductCategory.slug == target_slug)
            .first()
        )

    def _resolve_effective_category_id(
        self,
        db: Session,
        product_type: Optional[str],
        category_id: Optional[int],
        current_user: Usuario,
        *,
        admin_context: bool = False,
    ) -> Optional[int]:
        explicit_category = self._validate_category_scope(db, category_id, current_user, admin_context=admin_context)
        if explicit_category is not None:
            return explicit_category.id

        fixed_category = self._resolve_fixed_category_for_product_type(db, product_type)
        return fixed_category.id if fixed_category else None

    def _backfill_missing_fixed_category_ids(self, db: Session) -> None:
        has_missing = db.query(
            db.query(MarketplaceProduct)
            .filter(MarketplaceProduct.category_id.is_(None))
            .exists()
        ).scalar()
        if not has_missing:
            return
        missing_products = (
            db.query(MarketplaceProduct)
            .filter(MarketplaceProduct.category_id.is_(None))
            .all()
        )
        changed = False
        for product in missing_products:
            fixed_category = self._resolve_fixed_category_for_product_type(db, product.product_type)
            if not fixed_category:
                continue
            product.category_id = fixed_category.id
            db.add(product)
            changed = True
        if changed:
            db.commit()

    def _resolve_target_company_id(
        self,
        db: Session,
        current_user: Usuario,
        empresa_id: Optional[int] = None,
    ) -> int:
        role = (current_user.rol or "").lower()
        if role == "superadministrador":
            if not empresa_id:
                raise HTTPException(
                    status_code=400,
                    detail="Seleccione una empresa activa para abrir el panel comercial de empresa.",
                )
            company = db.query(Empresa.id).filter(Empresa.id == empresa_id).first()
            if not company:
                raise HTTPException(status_code=404, detail="Empresa no encontrada.")
            return empresa_id

        if not current_user.empresa_id:
            raise HTTPException(status_code=403, detail="El usuario no tiene una empresa asociada.")
        return current_user.empresa_id

    def _seed_payment_methods_if_missing(self, db: Session) -> None:
        existing_slugs = {slug for (slug,) in db.query(MarketplacePaymentMethod.slug).all()}
        changed = False
        for item in self.PAYMENT_METHOD_DEFAULTS:
            if item["slug"] in existing_slugs:
                continue
            db.add(MarketplacePaymentMethod(**item))
            changed = True
        if changed:
            db.commit()

    def _coerce_payment_method_config(self, config_json: Optional[dict]) -> dict:
        return dict(config_json or {})

    def _build_payment_method_missing_fields(self, method: MarketplacePaymentMethod) -> list[str]:
        config = self._coerce_payment_method_config(method.config_json)
        slug = (method.slug or "").strip().lower()
        if slug == "payphone":
            required_fields = ["token", "store_id", "return_url"]
        elif slug == "paypal":
            required_fields = ["client_id", "client_secret"]
        elif slug == "bank_transfer":
            required_fields = ["bank_name", "account_holder", "account_number", "instructions"]
        else:
            required_fields = []
        return [field for field in required_fields if not str(config.get(field) or "").strip()]

    def _resolve_payment_method_readiness(self, method: MarketplacePaymentMethod) -> str:
        missing_fields = self._build_payment_method_missing_fields(method)
        if missing_fields:
            return "incomplete"
        return "sandbox_ready" if (method.environment_mode or "").strip().lower() == "sandbox" else "production_ready"

    def _sync_payment_method_readiness(self, method: MarketplacePaymentMethod) -> MarketplacePaymentMethod:
        method.readiness_status = self._resolve_payment_method_readiness(method)
        return method

    def _serialize_public_payment_method(self, method: MarketplacePaymentMethod) -> dict:
        config = self._coerce_payment_method_config(method.config_json)
        public_config = {
            "public_text": str(config.get("public_text") or "").strip(),
            "support_email": str(config.get("support_email") or "").strip(),
        }
        return {
            "id": method.id,
            "slug": method.slug,
            "nombre": method.nombre,
            "descripcion": method.descripcion,
            "provider": method.provider,
            "is_active": method.is_active,
            "priority": method.priority,
            "environment_mode": method.environment_mode,
            "readiness_status": method.readiness_status,
            "config_version": method.config_version,
            "config_json": public_config,
            "created_at": method.created_at,
            "updated_at": method.updated_at,
        }

    def _resolve_source_entity(self, db: Session, current_user: Usuario, source_type: str, source_id: int):
        target_empresa_id = current_user.empresa_id
        if source_type == "base_trabajo":
            entity = (
                db.query(BaseTrabajo)
                .filter(BaseTrabajo.id == source_id, BaseTrabajo.empresa_id == target_empresa_id)
                .first()
            )
        elif source_type == "apu":
            entity = (
                db.query(APU)
                .filter(APU.id == source_id, APU.empresa_id == target_empresa_id)
                .first()
            )
        elif source_type == "proyecto":
            entity = (
                db.query(Proyecto)
                .filter(Proyecto.id == source_id, Proyecto.empresa_id == target_empresa_id)
                .first()
            )
        else:
            raise HTTPException(status_code=400, detail="Tipo de entidad referenciada no soportado.")

        if not entity:
            raise HTTPException(status_code=404, detail="Entidad origen no encontrada en la empresa actual.")
        return entity

    def _build_preview(self, source_type: Optional[str], entity) -> Optional[dict]:
        if not source_type or entity is None:
            return None
        if source_type == "base_trabajo":
            return {
                "kind": "base_trabajo",
                "nombre": entity.nombre,
                "tipo": entity.tipo,
                "moneda": entity.moneda,
                "indirectos": float(entity.porcentaje_indirectos or 0),
            }
        if source_type == "apu":
            return {
                "kind": "apu",
                "codigo": entity.codigo,
                "descripcion": entity.descripcion,
                "unidad": entity.unidad,
                "lineas": len(entity.lineas or []),
                "precio_referencia": float(entity.precio_unitario_total or 0),
            }
        if source_type == "proyecto":
            return {
                "kind": "proyecto",
                "nombre": entity.nombre,
                "codigo": entity.codigo,
                "revision": entity.revision,
                "estado": entity.estado,
                "base_trabajo_id": entity.base_trabajo_id,
            }
        return None

    def _validate_source_mapping(self, payload: MarketplaceProductCreate) -> None:
        if payload.product_kind == "manual":
            if payload.source_type or payload.source_id:
                raise HTTPException(status_code=400, detail="Un producto manual no puede incluir source_type ni source_id.")
            return

        if payload.product_kind != "referenced":
            raise HTTPException(status_code=400, detail="Tipo de producto no soportado.")
        if not payload.source_type or not payload.source_id:
            raise HTTPException(status_code=400, detail="Un producto referenciado requiere source_type y source_id.")

        expected_product_type = self.REFERENCE_TYPE_TO_PRODUCT_TYPE.get(payload.source_type)
        if expected_product_type != payload.product_type:
            raise HTTPException(
                status_code=400,
                detail=f"El tipo de producto '{payload.product_type}' no coincide con source_type '{payload.source_type}'.",
            )

    def _ensure_entity_publishable(self, db: Session, current_user: Usuario, source_type: str, source_id: int) -> None:
        can_publish, blocked_reason, _ = marketplace_asset_origin_service.can_publish_entity(
            db,
            empresa_id=current_user.empresa_id,
            entity_type=source_type,
            entity_id=source_id,
        )
        if not can_publish:
            record_audit_event(
                db,
                module="marketplace",
                event_type="marketplace_publish_blocked_purchase_bound",
                severity="warning",
                message=blocked_reason or "Entidad bloqueada para publicacion marketplace.",
                actor=current_user,
                empresa_id=current_user.empresa_id,
                entity_type=source_type,
                entity_id=source_id,
                payload={
                    "source_type": source_type,
                    "source_id": source_id,
                    "policy": "purchase_bound_no_reexport",
                },
            )
            raise HTTPException(status_code=403, detail=blocked_reason or "La entidad seleccionada no puede publicarse en marketplace.")

    def list_source_options(
        self,
        db: Session,
        current_user: Usuario,
        source_type: str,
        q: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)

        normalized_source_type = (source_type or "").strip().lower()
        if normalized_source_type not in self.REFERENCE_TYPE_TO_PRODUCT_TYPE:
            raise HTTPException(status_code=400, detail="Tipo de origen no soportado.")

        duplicate_rows = (
            db.query(MarketplaceProduct.id, MarketplaceProduct.source_id)
            .filter(
                MarketplaceProduct.seller_user_id == current_user.id,
                MarketplaceProduct.source_type == normalized_source_type,
                MarketplaceProduct.source_id.isnot(None),
            )
            .all()
        )
        published_map = {row.source_id: row.id for row in duplicate_rows}
        search = (q or "").strip()

        if normalized_source_type == "base_trabajo":
            query = db.query(BaseTrabajo).filter(BaseTrabajo.empresa_id == current_user.empresa_id)
            if search:
                pattern = f"%{search}%"
                query = query.filter(
                    BaseTrabajo.nombre.ilike(pattern) | BaseTrabajo.codigo_unico.ilike(pattern)
                )
            entities = query.order_by(BaseTrabajo.nombre.asc()).limit(limit).all()
            return [
                {
                    "source_type": normalized_source_type,
                    "source_id": entity.id,
                    "product_type": "base_maestra",
                    "title": entity.nombre,
                    "subtitle": f"{entity.codigo_unico} | {entity.tipo}",
                    "detail": entity.descripcion,
                    "currency": entity.moneda,
                    "amount": Decimal(str(entity.porcentaje_indirectos or 0)),
                    "is_publishable": publishability[0],
                    "blocked_reason": publishability[1],
                    "already_published": entity.id in published_map,
                    "existing_product_id": published_map.get(entity.id),
                }
                for entity in entities
                for publishability in [marketplace_asset_origin_service.can_publish_entity(
                    db,
                    empresa_id=current_user.empresa_id,
                    entity_type=normalized_source_type,
                    entity_id=entity.id,
                )[:2]]
            ]

        if normalized_source_type == "apu":
            query = (
                db.query(APU)
                .options(joinedload(APU.base_trabajo))
                .filter(APU.empresa_id == current_user.empresa_id)
            )
            if search:
                pattern = f"%{search}%"
                query = query.filter(APU.descripcion.ilike(pattern) | APU.codigo.ilike(pattern))
            entities = query.order_by(APU.descripcion.asc()).limit(limit).all()
            return [
                {
                    "source_type": normalized_source_type,
                    "source_id": entity.id,
                    "product_type": "apu",
                    "title": entity.descripcion,
                    "subtitle": f"{entity.codigo} | {entity.unidad}",
                    "detail": entity.base_trabajo.nombre if entity.base_trabajo else None,
                    "currency": entity.moneda,
                    "amount": Decimal(str(entity.precio_unitario_total or 0)),
                    "is_publishable": publishability[0],
                    "blocked_reason": publishability[1],
                    "already_published": entity.id in published_map,
                    "existing_product_id": published_map.get(entity.id),
                }
                for entity in entities
                for publishability in [marketplace_asset_origin_service.can_publish_entity(
                    db,
                    empresa_id=current_user.empresa_id,
                    entity_type=normalized_source_type,
                    entity_id=entity.id,
                )[:2]]
            ]

        query = db.query(Proyecto).filter(Proyecto.empresa_id == current_user.empresa_id)
        if search:
            pattern = f"%{search}%"
            query = query.filter(Proyecto.nombre.ilike(pattern) | Proyecto.codigo.ilike(pattern))
        entities = query.order_by(Proyecto.fecha_creacion.desc(), Proyecto.id.desc()).limit(limit).all()
        return [
            {
                "source_type": normalized_source_type,
                "source_id": entity.id,
                "product_type": "proyecto",
                "title": entity.nombre,
                "subtitle": f"{entity.codigo or 'SIN CODIGO'} | Rev. {entity.revision}",
                "detail": entity.estado,
                "currency": entity.moneda,
                "amount": Decimal(str(entity.presupuesto_estimado or 0)),
                "is_publishable": publishability[0],
                "blocked_reason": publishability[1],
                "already_published": entity.id in published_map,
                "existing_product_id": published_map.get(entity.id),
            }
            for entity in entities
            for publishability in [marketplace_asset_origin_service.can_publish_entity(
                db,
                empresa_id=current_user.empresa_id,
                entity_type=normalized_source_type,
                entity_id=entity.id,
            )[:2]]
        ]

    def create_product(
        self,
        db: Session,
        payload: MarketplaceProductCreate,
        current_user: Usuario,
        *,
        admin_context: bool = False,
    ) -> MarketplaceProduct:
        if admin_context:
            self._validate_marketplace_admin_access(current_user)
        else:
            self._validate_seller_access(db, current_user)
            self._ensure_company_can_sell(db, current_user)
        self._validate_source_mapping(payload)
        self._validate_product_type_access(current_user, payload.product_type, admin_context=admin_context)
        resolved_category_id = self._resolve_effective_category_id(
            db,
            payload.product_type,
            payload.category_id,
            current_user,
            admin_context=admin_context,
        )
        normalized_currency = "USD"

        source_entity = None
        if payload.product_kind == "referenced":
            self._ensure_entity_publishable(db, current_user, payload.source_type, payload.source_id)
            source_entity = self._resolve_source_entity(db, current_user, payload.source_type, payload.source_id)
            duplicate = (
                db.query(MarketplaceProduct)
                .filter(
                    MarketplaceProduct.seller_user_id == current_user.id,
                    MarketplaceProduct.source_type == payload.source_type,
                    MarketplaceProduct.source_id == payload.source_id,
                )
                .first()
            )
            if duplicate:
                raise HTTPException(status_code=400, detail="La entidad seleccionada ya está publicada en marketplace.")

        base_slug = self._slugify(payload.titulo)
        unique_slug = self._ensure_unique_slug(db, base_slug)
        requires_approval = bool(payload.requiere_aprobacion)
        status = "approved" if admin_context or (current_user.rol or "").lower() == "superadministrador" or not requires_approval else "pending"
        preview = self._merge_preview_sales_config(
            self._build_preview(payload.source_type, source_entity),
            payload.sales_config,
        )
        normalized_price = Decimal(payload.precio)
        normalized_product_meta = self._normalize_product_meta(
            db,
            current_user,
            payload.product_type,
            normalized_price,
            payload.product_meta,
            current_preview=preview,
            require_publication_window=bool(payload.activo),
        )
        normalized_portal_meta = None
        if payload.product_type == "portal_compras_publicas":
            base_portal_meta = self._normalize_portal_meta(
                payload.portal_meta,
                current_preview=preview,
                require_fields=False,
            )
            normalized_price = self._resolve_portal_commercial_price(base_portal_meta)
            normalized_product_meta = self._normalize_product_meta(
                db,
                current_user,
                payload.product_type,
                normalized_price,
                payload.product_meta,
                current_preview=preview,
                require_publication_window=bool(payload.activo),
            )
            readiness = self._get_activation_readiness(
                product_type=payload.product_type,
                title=payload.titulo.strip(),
                product_meta=normalized_product_meta,
                portal_meta=base_portal_meta,
            )
            self._validate_portal_product_ready(normalized_product_meta, base_portal_meta)
            normalized_portal_meta = self._finalize_portal_meta(
                title=payload.titulo.strip(),
                currency=normalized_currency,
                product_meta=normalized_product_meta,
                portal_meta=base_portal_meta,
                current_preview=preview,
                revision_bump=False,
            )
        else:
            readiness = self._get_activation_readiness(
                product_type=payload.product_type,
                title=payload.titulo.strip(),
                product_meta=normalized_product_meta,
            )

        preview = self._merge_preview_metadata(
            preview,
            product_meta=normalized_product_meta,
            portal_meta=normalized_portal_meta,
            activation_readiness=readiness,
        )

        product = MarketplaceProduct(
            titulo=payload.titulo.strip(),
            slug=unique_slug,
            resumen=(payload.resumen or "").strip() or None,
            descripcion=(payload.descripcion or "").strip() or None,
            incluye=(payload.incluye or "").strip() or None,
            no_incluye=(payload.no_incluye or "").strip() or None,
            vista_previa=preview,
            etiquetas=[item.strip() for item in payload.etiquetas if item and item.strip()],
            product_type=payload.product_type,
            product_kind=payload.product_kind,
            source_type=payload.source_type,
            source_id=payload.source_id,
            precio=normalized_price,
            moneda=normalized_currency,
            estado=status,
            activo=bool(payload.activo and readiness["ready"]),
            requiere_aprobacion=requires_approval,
            category_id=resolved_category_id,
            seller_user_id=current_user.id,
            approved_by_user_id=current_user.id if status == "approved" else None,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def create_admin_product(self, db: Session, payload: MarketplaceProductCreate, current_user: Usuario) -> MarketplaceProduct:
        return self.create_product(db, payload, current_user, admin_context=True)

    def list_seller_products(self, db: Session, current_user: Usuario):
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        return (
            db.query(MarketplaceProduct)
            .options(joinedload(MarketplaceProduct.seller), joinedload(MarketplaceProduct.category))
            .filter(MarketplaceProduct.seller_user_id == current_user.id)
            .order_by(MarketplaceProduct.fecha_creacion.desc())
            .all()
        )

    def list_company_products(self, db: Session, current_user: Usuario, empresa_id: Optional[int] = None):
        self._validate_seller_access(db, current_user)
        target_company_id = self._resolve_target_company_id(db, current_user, empresa_id)
        return (
            db.query(MarketplaceProduct)
            .options(joinedload(MarketplaceProduct.seller), joinedload(MarketplaceProduct.category))
            .join(Usuario, Usuario.id == MarketplaceProduct.seller_user_id)
            .filter(
                Usuario.empresa_id == target_company_id,
                func.lower(Usuario.rol) != "superadministrador",
            )
            .order_by(MarketplaceProduct.fecha_creacion.desc(), MarketplaceProduct.id.desc())
            .all()
        )

    def update_seller_product(
        self,
        db: Session,
        product_id: int,
        payload: MarketplaceProductUpdate,
        current_user: Usuario,
    ) -> MarketplaceProduct:
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        product = (
            db.query(MarketplaceProduct)
            .filter(
                MarketplaceProduct.id == product_id,
                MarketplaceProduct.seller_user_id == current_user.id,
            )
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Producto marketplace no encontrado.")
        if product.product_kind == "referenced" and product.source_type and product.source_id:
            self._ensure_entity_publishable(db, current_user, product.source_type, product.source_id)

        updates = payload.model_dump(exclude_unset=True)
        readiness = self._get_activation_readiness(
            product_type=product.product_type,
            title=product.titulo,
            product_meta=dict((product.vista_previa or {}).get("product_meta") or {}),
            portal_meta=dict((product.vista_previa or {}).get("portal_meta") or {}),
        )
        material_update_keys = {
            "titulo",
            "resumen",
            "descripcion",
            "incluye",
            "no_incluye",
            "etiquetas",
            "precio",
            "moneda",
            "category_id",
            "sales_config",
            "product_meta",
            "portal_meta",
        }
        has_material_changes = any(key in updates for key in material_update_keys)
        is_superadmin = (current_user.rol or "").lower() == "superadministrador"
        had_review_feedback = product.estado == "rejected" or bool((product.admin_notes or "").strip())

        if "titulo" in updates and updates["titulo"]:
            product.titulo = updates["titulo"].strip()
            product.slug = self._ensure_unique_slug(db, self._slugify(product.titulo), exclude_product_id=product.id)
        if "resumen" in updates:
            product.resumen = (updates["resumen"] or "").strip() or None
        if "descripcion" in updates:
            product.descripcion = (updates["descripcion"] or "").strip() or None
        if "incluye" in updates:
            product.incluye = (updates["incluye"] or "").strip() or None
        if "no_incluye" in updates:
            product.no_incluye = (updates["no_incluye"] or "").strip() or None
        if "etiquetas" in updates and updates["etiquetas"] is not None:
            product.etiquetas = [item.strip() for item in updates["etiquetas"] if item and item.strip()]
        if "precio" in updates and updates["precio"] is not None:
            product.precio = Decimal(updates["precio"])
        product.moneda = "USD"
        if "category_id" in updates:
            self._validate_category_scope(db, updates["category_id"], current_user)
            product.category_id = updates["category_id"]
        if "sales_config" in updates:
            product.vista_previa = self._merge_preview_sales_config(product.vista_previa, updates["sales_config"])
        normalized_product_meta = None
        if "product_meta" in updates or "precio" in updates or (product.product_type == "portal_compras_publicas" and "titulo" in updates):
            price_for_meta = updates.get("precio", product.precio)
            normalized_product_meta = self._normalize_product_meta(
                db,
                current_user,
                product.product_type,
                Decimal(price_for_meta),
                updates.get("product_meta"),
                current_preview=product.vista_previa,
                require_publication_window=bool(updates.get("activo", product.activo)),
            )
            product.vista_previa = self._merge_preview_metadata(
                product.vista_previa,
                product_meta=normalized_product_meta,
            )
            readiness = self._get_activation_readiness(
                product_type=product.product_type,
                title=product.titulo,
                product_meta=normalized_product_meta,
                portal_meta=dict((product.vista_previa or {}).get("portal_meta") or {}),
            )
        if product.product_type == "portal_compras_publicas" and ("portal_meta" in updates or normalized_product_meta is not None or "titulo" in updates):
            base_portal_meta = self._normalize_portal_meta(
                updates.get("portal_meta"),
                current_preview=product.vista_previa,
                require_fields=False,
            )
            resolved_portal_price = self._resolve_portal_commercial_price(base_portal_meta)
            product.precio = resolved_portal_price
            normalized_product_meta = self._normalize_product_meta(
                db,
                current_user,
                product.product_type,
                resolved_portal_price,
                updates.get("product_meta"),
                current_preview=product.vista_previa,
                require_publication_window=bool(updates.get("activo", product.activo)),
            )
            readiness = self._get_activation_readiness(
                product_type=product.product_type,
                title=product.titulo,
                product_meta=normalized_product_meta,
                portal_meta=base_portal_meta,
            )
            self._validate_portal_product_ready(normalized_product_meta, base_portal_meta)
            product.vista_previa = self._merge_preview_metadata(
                product.vista_previa,
                portal_meta=self._finalize_portal_meta(
                    title=product.titulo,
                    currency="USD",
                    product_meta=normalized_product_meta,
                    portal_meta=base_portal_meta,
                    current_preview=product.vista_previa,
                    revision_bump=True,
                ),
            )
            if not readiness["ready"]:
                product.activo = False
        product.vista_previa = self._merge_preview_metadata(
            product.vista_previa,
            activation_readiness=readiness,
        )
        if "activo" in updates:
            product.activo = bool(updates["activo"] and readiness["ready"])
        if "requiere_aprobacion" in updates:
            product.requiere_aprobacion = bool(updates["requiere_aprobacion"])
            if product.estado == "approved" and product.requiere_aprobacion and not is_superadmin:
                product.estado = "pending"
                product.approved_by_user_id = None

        if (
            has_material_changes
            and product.requiere_aprobacion
            and not is_superadmin
            and had_review_feedback
        ):
            product.estado = "pending"
            product.approved_by_user_id = None
            product.activo = bool(readiness["ready"])

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def clone_seller_product(self, db: Session, product_id: int, current_user: Usuario) -> MarketplaceProduct:
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        source_product = (
            db.query(MarketplaceProduct)
            .filter(
                MarketplaceProduct.id == product_id,
                MarketplaceProduct.seller_user_id == current_user.id,
            )
            .first()
        )
        if not source_product:
            raise HTTPException(status_code=404, detail="Producto marketplace no encontrado.")
        if source_product.product_kind == "referenced" and source_product.source_type and source_product.source_id:
            self._ensure_entity_publishable(db, current_user, source_product.source_type, source_product.source_id)

        self._validate_product_type_access(current_user, source_product.product_type)
        self._validate_category_scope(db, source_product.category_id, current_user)

        cloned_title = self._build_cloned_title(db, current_user, source_product.titulo)
        cloned_slug = self._ensure_unique_slug(db, self._slugify(cloned_title))
        requires_approval = bool(source_product.requiere_aprobacion)
        status = "approved" if (current_user.rol or "").lower() == "superadministrador" or not requires_approval else "pending"

        cloned_product = MarketplaceProduct(
            titulo=cloned_title,
            slug=cloned_slug,
            resumen=source_product.resumen,
            descripcion=source_product.descripcion,
            incluye=source_product.incluye,
            no_incluye=source_product.no_incluye,
            vista_previa=dict(source_product.vista_previa or {}),
            etiquetas=list(source_product.etiquetas or []),
            product_type=source_product.product_type,
            product_kind="manual",
            source_type=None,
            source_id=None,
            precio=source_product.precio,
            moneda="USD",
            estado=status,
            activo=source_product.activo,
            requiere_aprobacion=requires_approval,
            category_id=source_product.category_id,
            seller_user_id=current_user.id,
            approved_by_user_id=current_user.id if status == "approved" else None,
        )
        db.add(cloned_product)
        db.commit()
        db.refresh(cloned_product)
        return cloned_product

    def delete_seller_product(self, db: Session, product_id: int, current_user: Usuario) -> None:
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        product = (
            db.query(MarketplaceProduct)
            .filter(
                MarketplaceProduct.id == product_id,
                MarketplaceProduct.seller_user_id == current_user.id,
            )
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail="Producto marketplace no encontrado.")

        sales_count = (
            db.query(func.count(MarketplaceOrderItem.id))
            .filter(MarketplaceOrderItem.product_id == product.id)
            .scalar()
        )
        if int(sales_count or 0) > 0:
            product.activo = False
            product.estado = "cancelled"
            preview = dict(product.vista_previa or {})
            sales_policy = dict(preview.get("sales_policy") or {})
            sales_policy.update({
                "seller_withdrawn": True,
                "withdrawn_at": datetime.now(timezone.utc).isoformat(),
                "withdrawn_by_user_id": current_user.id,
                "withdrawal_mode": "cancelled_with_order_history",
            })
            product.vista_previa = {**preview, "sales_policy": sales_policy}
            db.add(product)
        else:
            db.delete(product)
        db.commit()

    def list_admin_categories(self, db: Session, current_user: Usuario):
        self._validate_marketplace_admin_access(current_user)
        fixed_slugs = [item["slug"] for item in FIXED_MARKETPLACE_CATEGORIES]
        return (
            db.query(MarketplaceProductCategory)
            .filter(MarketplaceProductCategory.slug.in_(fixed_slugs))
            .order_by(MarketplaceProductCategory.sort_order.asc(), MarketplaceProductCategory.nombre.asc())
            .all()
        )

    def list_admin_products(self, db: Session, current_user: Usuario):
        self._validate_marketplace_admin_access(current_user)
        self._backfill_missing_fixed_category_ids(db)
        return (
            db.query(MarketplaceProduct)
            .options(joinedload(MarketplaceProduct.seller), joinedload(MarketplaceProduct.category))
            .order_by(MarketplaceProduct.fecha_creacion.desc(), MarketplaceProduct.id.desc())
            .all()
        )

    def list_admin_payment_methods(self, db: Session, current_user: Usuario):
        self._validate_marketplace_admin_access(current_user)
        self._seed_payment_methods_if_missing(db)
        methods = (
            db.query(MarketplacePaymentMethod)
            .order_by(MarketplacePaymentMethod.priority.asc(), MarketplacePaymentMethod.id.asc())
            .all()
        )
        changed = False
        for method in methods:
            previous = method.readiness_status
            self._sync_payment_method_readiness(method)
            if previous != method.readiness_status:
                db.add(method)
                changed = True
        if changed:
            db.commit()
            for method in methods:
                db.refresh(method)
        return methods

    def list_public_payment_methods(self, db: Session, current_user: Usuario):
        if not has_marketplace_permission(current_user, "marketplace.view"):
            raise HTTPException(status_code=403, detail="No tiene permisos para ver métodos de pago del marketplace.")
        self._seed_payment_methods_if_missing(db)
        methods = (
            db.query(MarketplacePaymentMethod)
            .order_by(MarketplacePaymentMethod.priority.asc(), MarketplacePaymentMethod.id.asc())
            .all()
        )
        changed = False
        for method in methods:
            previous = method.readiness_status
            self._sync_payment_method_readiness(method)
            if previous != method.readiness_status:
                db.add(method)
                changed = True
        if changed:
            db.commit()
            for method in methods:
                db.refresh(method)
        return [
            self._serialize_public_payment_method(method)
            for method in methods
            if method.is_active and method.readiness_status in {"sandbox_ready", "production_ready"}
        ]

    def get_active_commercial_payment_method(self, db: Session, slug: str) -> MarketplacePaymentMethod:
        normalized_slug = str(slug or "").strip().lower()
        if not normalized_slug:
            raise HTTPException(status_code=400, detail="Debe seleccionar una forma de pago.")

        self._seed_payment_methods_if_missing(db)
        method = (
            db.query(MarketplacePaymentMethod)
            .filter(MarketplacePaymentMethod.slug == normalized_slug)
            .first()
        )
        if not method:
            raise HTTPException(status_code=404, detail="Forma de pago no encontrada.")

        self._sync_payment_method_readiness(method)
        if not method.is_active:
            raise HTTPException(status_code=400, detail="La forma de pago seleccionada no esta activa.")
        if (method.readiness_status or "").strip().lower() not in {"sandbox_ready", "production_ready"}:
            raise HTTPException(status_code=400, detail="La forma de pago seleccionada no esta lista para operar.")
        return method

    def update_admin_payment_method(self, db: Session, slug: str, payload, current_user: Usuario) -> MarketplacePaymentMethod:
        self._validate_marketplace_admin_access(current_user)
        self._seed_payment_methods_if_missing(db)
        method = (
            db.query(MarketplacePaymentMethod)
            .filter(MarketplacePaymentMethod.slug == slug)
            .first()
        )
        if not method:
            raise HTTPException(status_code=404, detail="Forma de pago no encontrada.")

        updates = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else dict(payload or {})
        config = self._coerce_payment_method_config(method.config_json)
        for field_name in (
            "public_text",
            "support_email",
            "token",
            "store_id",
            "return_url",
            "client_id",
            "client_secret",
            "webhook_id",
            "bank_name",
            "account_holder",
            "account_number",
            "iban_cci",
            "instructions",
        ):
            if field_name in updates:
                config[field_name] = str(updates[field_name] or "").strip()

        if "description" in updates:
            method.descripcion = str(updates["description"] or "").strip() or None
        if "environment_mode" in updates and updates["environment_mode"]:
            normalized_mode = str(updates["environment_mode"]).strip().lower()
            if normalized_mode not in {"sandbox", "production", "manual"}:
                raise HTTPException(status_code=400, detail="Modo de entorno de pago no soportado.")
            method.environment_mode = normalized_mode

        method.config_json = config
        self._sync_payment_method_readiness(method)

        if "is_active" in updates:
            target_active = bool(updates["is_active"])
            if target_active and method.readiness_status == "incomplete":
                raise HTTPException(
                    status_code=400,
                    detail="Completa la configuración requerida antes de activar esta forma de pago.",
                )
            method.is_active = target_active

        method.config_version = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        db.add(method)
        db.commit()
        db.refresh(method)
        return method

    def update_admin_product(
        self,
        db: Session,
        product_id: int,
        payload: MarketplaceProductUpdate,
        current_user: Usuario,
    ) -> MarketplaceProduct:
        self._validate_marketplace_admin_access(current_user)
        product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Producto marketplace no encontrado.")
        if product.product_kind == "referenced" and product.source_type and product.source_id:
            self._ensure_entity_publishable(db, current_user, product.source_type, product.source_id)

        updates = payload.model_dump(exclude_unset=True)
        is_superadmin = (current_user.rol or "").lower() == "superadministrador"
        readiness = self._get_activation_readiness(
            product_type=product.product_type,
            title=product.titulo,
            product_meta=dict((product.vista_previa or {}).get("product_meta") or {}),
            portal_meta=dict((product.vista_previa or {}).get("portal_meta") or {}),
        )

        if "titulo" in updates and updates["titulo"]:
            product.titulo = updates["titulo"].strip()
            product.slug = self._ensure_unique_slug(db, self._slugify(product.titulo), exclude_product_id=product.id)
        if "resumen" in updates:
            product.resumen = (updates["resumen"] or "").strip() or None
        if "descripcion" in updates:
            product.descripcion = (updates["descripcion"] or "").strip() or None
        if "incluye" in updates:
            product.incluye = (updates["incluye"] or "").strip() or None
        if "no_incluye" in updates:
            product.no_incluye = (updates["no_incluye"] or "").strip() or None
        if "etiquetas" in updates and updates["etiquetas"] is not None:
            product.etiquetas = [item.strip() for item in updates["etiquetas"] if item and item.strip()]
        if "precio" in updates and updates["precio"] is not None:
            product.precio = Decimal(updates["precio"])
        product.moneda = "USD"
        if "category_id" in updates:
            product.category_id = self._resolve_effective_category_id(db, product.product_type, updates["category_id"], current_user)
        elif not product.category_id:
            product.category_id = self._resolve_effective_category_id(db, product.product_type, None, current_user)
        if "activo" in updates:
            product.activo = bool(updates["activo"] and readiness["ready"])
        if "requiere_aprobacion" in updates:
            product.requiere_aprobacion = bool(updates["requiere_aprobacion"])
        if "sales_config" in updates:
            product.vista_previa = self._merge_preview_sales_config(product.vista_previa, updates["sales_config"])
        normalized_product_meta = None
        if "product_meta" in updates or "precio" in updates or (product.product_type == "portal_compras_publicas" and "titulo" in updates):
            price_for_meta = updates.get("precio", product.precio)
            normalized_product_meta = self._normalize_product_meta(
                db,
                current_user,
                product.product_type,
                Decimal(price_for_meta),
                updates.get("product_meta"),
                current_preview=product.vista_previa,
                require_publication_window=bool(updates.get("activo", product.activo)),
            )
            product.vista_previa = self._merge_preview_metadata(
                product.vista_previa,
                product_meta=normalized_product_meta,
            )
            readiness = self._get_activation_readiness(
                product_type=product.product_type,
                title=product.titulo,
                product_meta=normalized_product_meta,
                portal_meta=dict((product.vista_previa or {}).get("portal_meta") or {}),
            )
        if product.product_type == "portal_compras_publicas" and ("portal_meta" in updates or normalized_product_meta is not None or "titulo" in updates):
            base_portal_meta = self._normalize_portal_meta(
                updates.get("portal_meta"),
                current_preview=product.vista_previa,
                require_fields=False,
            )
            resolved_portal_price = self._resolve_portal_commercial_price(base_portal_meta)
            product.precio = resolved_portal_price
            normalized_product_meta = self._normalize_product_meta(
                db,
                current_user,
                product.product_type,
                resolved_portal_price,
                updates.get("product_meta"),
                current_preview=product.vista_previa,
                require_publication_window=bool(updates.get("activo", product.activo)),
            )
            readiness = self._get_activation_readiness(
                product_type=product.product_type,
                title=product.titulo,
                product_meta=normalized_product_meta,
                portal_meta=base_portal_meta,
            )
            self._validate_portal_product_ready(normalized_product_meta, base_portal_meta)
            product.vista_previa = self._merge_preview_metadata(
                product.vista_previa,
                portal_meta=self._finalize_portal_meta(
                    title=product.titulo,
                    currency="USD",
                    product_meta=normalized_product_meta,
                    portal_meta=base_portal_meta,
                    current_preview=product.vista_previa,
                    revision_bump=True,
                ),
            )
            if not readiness["ready"]:
                product.activo = False
        product.vista_previa = self._merge_preview_metadata(
            product.vista_previa,
            activation_readiness=readiness,
        )
        if is_superadmin:
            product.estado = "approved"
            product.approved_by_user_id = current_user.id

        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    def delete_admin_product(self, db: Session, product_id: int, current_user: Usuario) -> None:
        self._validate_marketplace_admin_access(current_user)
        product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Producto marketplace no encontrado.")

        sales_count = (
            db.query(func.count(MarketplaceOrderItem.id))
            .filter(MarketplaceOrderItem.product_id == product.id)
            .scalar()
        )
        if int(sales_count or 0) > 0:
            product.activo = False
            product.estado = "cancelled"
            preview = dict(product.vista_previa or {})
            sales_policy = dict(preview.get("sales_policy") or {})
            sales_policy.update({
                "admin_withdrawn": True,
                "withdrawn_at": datetime.now(timezone.utc).isoformat(),
                "withdrawn_by_user_id": current_user.id,
                "withdrawal_mode": "cancelled_with_order_history",
            })
            product.vista_previa = {**preview, "sales_policy": sales_policy}
            db.add(product)
        else:
            db.delete(product)
        db.commit()

    def create_category(self, db: Session, payload, current_user: Usuario) -> MarketplaceProductCategory:
        self._validate_marketplace_admin_access(current_user)
        raise HTTPException(
            status_code=403,
            detail="El catálogo de categorías está cerrado temporalmente y solo permite las categorías fijas definidas por Sistema.",
        )

    def update_category(self, db: Session, category_id: int, payload, current_user: Usuario) -> MarketplaceProductCategory:
        self._validate_marketplace_admin_access(current_user)
        raise HTTPException(
            status_code=403,
            detail="El catálogo de categorías está cerrado temporalmente y no admite edición manual.",
        )

    def delete_category(self, db: Session, category_id: int, current_user: Usuario) -> None:
        self._validate_marketplace_admin_access(current_user)
        raise HTTPException(
            status_code=403,
            detail="El catálogo de categorías está cerrado temporalmente y no admite borrado manual.",
        )

    def get_seller_stats(self, db: Session, current_user: Usuario) -> dict:
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        products = db.query(MarketplaceProduct).filter(MarketplaceProduct.seller_user_id == current_user.id).all()
        sales_items_all = (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .filter(
                MarketplaceOrderItem.seller_user_id == current_user.id,
                MarketplaceOrder.status.in_(["completed", "refunded"]),
            )
            .all()
        )
        sales_items = [item for item in sales_items_all if (item.order.status or "").strip().lower() == "completed"]
        refunded_items = [item for item in sales_items_all if (item.order.status or "").strip().lower() == "refunded"]
        gross = sum((Decimal(str(item.price or 0)) for item in sales_items), Decimal("0.00"))
        refunded = sum((Decimal(str(item.price or 0)) for item in refunded_items), Decimal("0.00"))
        commission = (gross * Decimal("0.20")).quantize(Decimal("0.01"))
        net = (gross * Decimal("0.80")).quantize(Decimal("0.01"))
        by_type: dict[str, int] = {}
        by_status: dict[str, int] = {}
        for product in products:
            by_type[product.product_type] = by_type.get(product.product_type, 0) + 1
            by_status[product.estado] = by_status.get(product.estado, 0) + 1

        return {
            "products_count": len(products),
            "sales_count": len(sales_items),
            "refunded_sales_count": len(refunded_items),
            "gross_income": gross,
            "refunded_amount": refunded,
            "commission_amount": commission,
            "net_income": net,
            "sales_by_type": by_type,
            "products_by_status": by_status,
            "active_products_count": len([product for product in products if product.activo]),
            "paused_products_count": len([product for product in products if not product.activo]),
            "refund_policy": {
                "automatic_window_minutes": 30,
                "automatic_product_types": ["apu", "base_maestra", "proyecto"],
            },
        }

    def get_company_stats(self, db: Session, current_user: Usuario, empresa_id: Optional[int] = None) -> dict:
        self._validate_seller_access(db, current_user)
        target_company_id = self._resolve_target_company_id(db, current_user, empresa_id)
        products = (
            db.query(MarketplaceProduct)
            .join(Usuario, Usuario.id == MarketplaceProduct.seller_user_id)
            .filter(
                Usuario.empresa_id == target_company_id,
                func.lower(Usuario.rol) != "superadministrador",
            )
            .all()
        )
        sales_items_all = (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .join(Usuario, Usuario.id == MarketplaceOrderItem.seller_user_id)
            .filter(
                Usuario.empresa_id == target_company_id,
                func.lower(Usuario.rol) != "superadministrador",
                MarketplaceOrder.status.in_(["completed", "refunded"]),
            )
            .all()
        )
        sales_items = [item for item in sales_items_all if (item.order.status or "").strip().lower() == "completed"]
        refunded_items = [item for item in sales_items_all if (item.order.status or "").strip().lower() == "refunded"]
        gross = sum((Decimal(str(item.price or 0)) for item in sales_items), Decimal("0.00"))
        refunded = sum((Decimal(str(item.price or 0)) for item in refunded_items), Decimal("0.00"))
        commission = (gross * Decimal("0.20")).quantize(Decimal("0.01"))
        net = (gross * Decimal("0.80")).quantize(Decimal("0.01"))
        by_type: dict[str, int] = {}
        by_status: dict[str, int] = {}
        for product in products:
            by_type[product.product_type] = by_type.get(product.product_type, 0) + 1
            by_status[product.estado] = by_status.get(product.estado, 0) + 1

        active_sellers = (
            db.query(func.count(Usuario.id))
            .filter(
                Usuario.empresa_id == target_company_id,
                func.lower(Usuario.rol) != "superadministrador",
                Usuario.activo == True,
            )
            .scalar()
        )

        return {
            "products_count": len(products),
            "sales_count": len(sales_items),
            "refunded_sales_count": len(refunded_items),
            "gross_income": gross,
            "refunded_amount": refunded,
            "commission_amount": commission,
            "net_income": net,
            "sales_by_type": by_type,
            "products_by_status": by_status,
            "active_products_count": len([product for product in products if product.activo]),
            "paused_products_count": len([product for product in products if not product.activo]),
            "active_sellers": int(active_sellers or 0),
            "empresa_id": target_company_id,
            "refund_policy": {
                "automatic_window_minutes": 30,
                "automatic_product_types": ["apu", "base_maestra", "proyecto"],
            },
        }

    def list_seller_sales(self, db: Session, current_user: Usuario):
        self._validate_seller_access(db, current_user)
        self._ensure_company_can_sell(db, current_user)
        items = (
            db.query(MarketplaceOrderItem)
            .options(joinedload(MarketplaceOrderItem.order))
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .filter(
                MarketplaceOrderItem.seller_user_id == current_user.id,
                MarketplaceOrder.status.in_(["completed", "refunded"]),
            )
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrderItem.id.desc())
            .all()
        )
        return [self._serialize_sale_item(item) for item in items]

    def list_company_sales(self, db: Session, current_user: Usuario, empresa_id: Optional[int] = None):
        self._validate_seller_access(db, current_user)
        target_company_id = self._resolve_target_company_id(db, current_user, empresa_id)
        items = (
            db.query(MarketplaceOrderItem)
            .options(joinedload(MarketplaceOrderItem.order), joinedload(MarketplaceOrderItem.seller))
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .join(Usuario, Usuario.id == MarketplaceOrderItem.seller_user_id)
            .filter(
                Usuario.empresa_id == target_company_id,
                func.lower(Usuario.rol) != "superadministrador",
                MarketplaceOrder.status.in_(["completed", "refunded"]),
            )
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrderItem.id.desc())
            .all()
        )
        return [self._serialize_sale_item(item) for item in items]

    def _serialize_sale_item(self, item: MarketplaceOrderItem) -> dict:
        order = item.order
        order_status = (order.status if order else "completed") or "completed"
        is_refunded = str(order_status).strip().lower() == "refunded"
        return {
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "seller_user_id": item.seller_user_id,
            "seller_name": item.seller.nombre_completo if getattr(item, "seller", None) else None,
            "product_title_snapshot": item.product_title_snapshot,
            "product_type_snapshot": item.product_type_snapshot,
            "source_type_snapshot": item.source_type_snapshot,
            "source_id_snapshot": item.source_id_snapshot,
            "delivered_entity_type": item.delivered_entity_type,
            "delivered_entity_id": item.delivered_entity_id,
            "price": item.price,
            "currency": order.currency if order else "USD",
            "created_at": order.created_at if order else None,
            "order_status": order_status,
            "is_refunded": is_refunded,
            "net_amount": Decimal("0.00") if is_refunded else (Decimal(str(item.price or 0)) * Decimal("0.80")).quantize(Decimal("0.01")),
            "commission_amount": Decimal("0.00") if is_refunded else (Decimal(str(item.price or 0)) * Decimal("0.20")).quantize(Decimal("0.01")),
            "refund_policy": {
                "automatic_window_minutes": 30,
                "automatic_product_types": ["apu", "base_maestra", "proyecto"],
            },
            "order": {
                "id": order.id if order else item.order_id,
                "status": order_status,
                "created_at": order.created_at if order else None,
            },
        }

    def list_product_reviews(self, db: Session, product_id: int) -> list[dict]:
        reviews = (
            db.query(MarketplaceReview)
            .options(joinedload(MarketplaceReview.buyer))
            .filter(MarketplaceReview.product_id == product_id)
            .order_by(MarketplaceReview.created_at.desc(), MarketplaceReview.id.desc())
            .all()
        )
        return [
            {
                "id": review.id,
                "product_id": review.product_id,
                "order_id": review.order_id,
                "buyer_user_id": review.buyer_user_id,
                "buyer_name": review.buyer.nombre_completo if review.buyer else None,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
            }
            for review in reviews
        ]

    def create_review(self, db: Session, product_id: int, rating: int, comment: Optional[str], current_user: Usuario) -> MarketplaceReview:
        self._validate_buyer_review_access(db, current_user)

        product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
        if not product or product.estado != "approved" or not product.activo:
            raise HTTPException(status_code=404, detail="Producto no encontrado para reseña.")

        purchased_item = (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .filter(
                MarketplaceOrderItem.product_id == product_id,
                MarketplaceOrder.buyer_user_id == current_user.id,
                MarketplaceOrder.status == "completed",
            )
            .order_by(MarketplaceOrder.id.desc(), MarketplaceOrderItem.id.desc())
            .first()
        )
        if not purchased_item:
            raise HTTPException(status_code=403, detail="Solo puede reseñar productos que ya compró.")

        existing_review = (
            db.query(MarketplaceReview)
            .filter(
                MarketplaceReview.product_id == product_id,
                MarketplaceReview.buyer_user_id == current_user.id,
            )
            .first()
        )
        if existing_review:
            raise HTTPException(status_code=400, detail="Ya existe una reseña suya para este producto.")

        review = MarketplaceReview(
            product_id=product_id,
            order_id=purchased_item.order_id,
            buyer_user_id=current_user.id,
            rating=rating,
            comment=(comment or "").strip() or None,
        )
        db.add(review)
        db.flush()

        avg_rating = (
            db.query(func.avg(MarketplaceReview.rating))
            .filter(MarketplaceReview.product_id == product_id)
            .scalar()
        )
        product.rating_promedio = Decimal(str(avg_rating or 0)).quantize(Decimal("0.01"))
        db.add(product)
        db.commit()
        db.refresh(review)
        return review


marketplace_service = MarketplaceService()
