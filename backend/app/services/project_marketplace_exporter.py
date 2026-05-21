from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceProduct
from app.models.empresa import Empresa
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario
from app.services.marketplace import marketplace_service
from app.services.public_procurement_project_import_access import (
    PUBLIC_PROCUREMENT_IMPORT_COMPANY_NAME,
    can_access_public_procurement_project_importer,
    normalize_public_procurement_company_name,
)


class ProjectMarketplaceExporter:
    """Exporta proyectos clasicos propios como productos pendientes de Marketplace."""

    ALLOWED_ROLES = {"administrador", "superadministrador"}
    PRODUCT_TYPE_PROJECT = "proyecto"
    PRODUCT_TYPE_PUBLIC_PROCUREMENT = "portal_compras_publicas"
    DEFAULT_PROJECT_SALE_PRICE = Decimal("19.99")

    def _validate_access(self, current_user: Usuario) -> None:
        role = str(current_user.rol or "").strip().lower()
        if role not in self.ALLOWED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores y superadministradores pueden exportar proyectos a marketplace.",
            )

    def _resolve_project_total(self, db: Session, project: Proyecto) -> tuple[Decimal, str]:
        budget = (
            db.query(Presupuesto)
            .filter(
                Presupuesto.proyecto_id == project.id,
                Presupuesto.empresa_id == project.empresa_id,
            )
            .order_by(Presupuesto.revision.desc(), Presupuesto.id.desc())
            .first()
        )
        if budget:
            budget_total = Decimal(str(budget.total or 0))
            if budget_total > 0:
                return budget_total, "presupuesto_total"

            detail_total = (
                db.query(func.coalesce(func.sum(PresupuestoDetalle.precio_total), 0))
                .filter(PresupuestoDetalle.presupuesto_id == budget.id)
                .scalar()
            )
            detail_total_decimal = Decimal(str(detail_total or 0))
            if detail_total_decimal > 0:
                return detail_total_decimal, "presupuesto_detalle"

        estimated = Decimal(str(project.presupuesto_estimado or 0))
        return estimated, "presupuesto_estimado"

    def _resolve_commercial_price(self, technical_total: Decimal) -> Decimal:
        # Reutiliza la tabla de precios automatica ya validada para compras publicas.
        return marketplace_service._resolve_portal_commercial_price({"precio_licitacion": f"{technical_total:.2f}"})

    def _resolve_project_sale_price(self, raw_price: Any = None) -> Decimal:
        try:
            price = Decimal(str(raw_price if raw_price not in {None, ""} else self.DEFAULT_PROJECT_SALE_PRICE))
        except Exception:
            price = self.DEFAULT_PROJECT_SALE_PRICE
        if price <= 0:
            return self.DEFAULT_PROJECT_SALE_PRICE
        return price.quantize(Decimal("0.01"))

    def _can_choose_export_type(self, db: Session, current_user: Usuario, empresa_id: int) -> bool:
        if not can_access_public_procurement_project_importer(current_user):
            return False
        company = db.query(Empresa).filter(Empresa.id == empresa_id).first()
        company_name = getattr(company, "nombre", None) or getattr(getattr(current_user, "empresa", None), "nombre", None)
        return normalize_public_procurement_company_name(company_name) == normalize_public_procurement_company_name(
            PUBLIC_PROCUREMENT_IMPORT_COMPANY_NAME
        )

    def _resolve_product_type(
        self,
        db: Session,
        *,
        current_user: Usuario,
        empresa_id: int,
        requested_product_type: str | None,
    ) -> tuple[str, bool]:
        can_choose = self._can_choose_export_type(db, current_user, empresa_id)
        normalized = str(requested_product_type or self.PRODUCT_TYPE_PROJECT).strip().lower()
        if normalized not in {self.PRODUCT_TYPE_PROJECT, self.PRODUCT_TYPE_PUBLIC_PROCUREMENT}:
            normalized = self.PRODUCT_TYPE_PROJECT
        if normalized == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT and not can_choose:
            normalized = self.PRODUCT_TYPE_PROJECT
        return normalized, can_choose

    def _build_product_meta(
        self,
        *,
        project: Proyecto,
        technical_total: Decimal,
        commercial_price: Decimal,
        total_source: str,
        product_type: str,
    ) -> dict[str, Any]:
        description = (project.descripcion or "").strip()
        short_description = description or f"Proyecto clasico GIPROY {project.codigo or project.id}"
        today = datetime.now(timezone.utc).date()
        project_config = dict(project.plantillas_config or {})
        import_trace = dict(project_config.get("public_procurement_import") or {})
        return {
            "titulo_comercial": project.nombre,
            "descripcion_corta": short_description[:240],
            "descripcion_larga": description or short_description,
            "descripcion_completa": description or short_description,
            "precio_con_iva": f"{commercial_price:.2f}",
            "precio_referencia_tecnica": f"{technical_total:.2f}",
            "precio_referencia_fuente": total_source,
            "precio_origen": (
                "tramos_compras_publicas_giproy"
                if product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT
                else "precio_manual_proyecto"
            ),
            "export_source": "classic_project",
            "export_status": "pending_moderation",
            "codigo_proyecto": project.codigo,
            "revision_proyecto": project.revision or 0,
            "fecha_inicio_publicacion": today.isoformat(),
            "fecha_fin_publicacion": (today + timedelta(days=30)).isoformat(),
            "import_traceability": import_trace or None,
        }

    def _date_to_iso(self, value: Any, fallback: date) -> str:
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, date):
            return value.isoformat()
        value_text = str(value or "").strip()
        return value_text[:10] if value_text else fallback.isoformat()

    def _build_portal_meta(
        self,
        *,
        project: Proyecto,
        technical_total: Decimal,
    ) -> dict[str, Any]:
        today = datetime.now(timezone.utc).date()
        project_config = dict(project.plantillas_config or {})
        import_trace = dict(project_config.get("public_procurement_import") or {})
        analysis = dict(import_trace.get("analysis") or import_trace.get("import_analysis") or {})
        source_reference = (
            import_trace.get("source_filename")
            or import_trace.get("source_reference")
            or project.codigo
            or f"PROY-{project.id}"
        )
        return {
            "pais": import_trace.get("pais") or "Ecuador",
            "provincia": import_trace.get("provincia") or "",
            "canton": import_trace.get("canton") or None,
            "direccion": import_trace.get("direccion") or None,
            "codigo_licitacion": import_trace.get("codigo_proceso") or project.codigo or source_reference,
            "precio_licitacion": f"{technical_total:.2f}",
            "fecha_inicio_licitacion": self._date_to_iso(project.fecha_inicio, today),
            "fecha_fin_licitacion": self._date_to_iso(project.fecha_fin_estimada, today + timedelta(days=30)),
            "delivery_mode": "project_only",
            "import_source": {
                "kind": "proyecto_clasico",
                "reference": str(source_reference),
                "notes": "Exportado desde proyecto clasico GIPROY.",
                "excel_export_enabled": False,
                "project_seed_enabled": True,
            },
            "project_delivery_policy": {
                "create_project_on_purchase": True,
                "project_without_base": True,
                "project_send_locked": True,
                "mark_as_acquired": True,
                "clone_source_project_on_purchase": True,
                "source_project_id": project.id,
            },
            "import_analysis": analysis or {
                "source_filename": source_reference,
                "total_amount": f"{technical_total:.2f}",
                "items_count": 0,
                "generated_from_project_id": project.id,
            },
        }

    def _build_export_payload(
        self,
        db: Session,
        *,
        project: Proyecto,
        current_user: Usuario,
        product_type: str = PRODUCT_TYPE_PROJECT,
        overrides: dict[str, Any] | None = None,
        require_portal_fields: bool = False,
        ) -> dict[str, Any]:
        technical_total, total_source = self._resolve_project_total(db, project)
        overrides = {key: value for key, value in dict(overrides or {}).items() if value is not None}
        override_product_meta = dict(overrides.get("product_meta") or {})
        commercial_price = (
            self._resolve_commercial_price(technical_total)
            if product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT
            else self._resolve_project_sale_price(override_product_meta.get("precio_con_iva"))
        )
        preview = marketplace_service._build_preview("proyecto", project) or {}
        product_meta = self._build_product_meta(
            project=project,
            technical_total=technical_total,
            commercial_price=commercial_price,
            total_source=total_source,
            product_type=product_type,
        )
        product_meta.update(override_product_meta)
        product_meta["precio_con_iva"] = f"{commercial_price:.2f}"
        title = str(overrides.get("titulo") or project.nombre or f"Proyecto {project.id}").strip()
        portal_meta = None
        normalized_portal = None
        if product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT:
            portal_meta = self._build_portal_meta(project=project, technical_total=technical_total)
            portal_meta.update(dict(overrides.get("portal_meta") or {}))
            normalized_portal = marketplace_service._normalize_portal_meta(
                portal_meta,
                current_preview=preview,
                require_fields=require_portal_fields,
            )
            commercial_price = marketplace_service._resolve_portal_commercial_price(normalized_portal)
            normalized_meta = marketplace_service._normalize_product_meta(
                db,
                current_user,
                product_type,
                commercial_price,
                product_meta,
                current_preview=preview,
                require_publication_window=True,
            )
            normalized_portal = marketplace_service._finalize_portal_meta(
                title=title,
                currency="USD",
                product_meta=normalized_meta,
                portal_meta=normalized_portal,
                current_preview=preview,
                revision_bump=False,
            )
            readiness = marketplace_service._get_activation_readiness(
                product_type=product_type,
                title=title,
                product_meta=normalized_meta,
                portal_meta=normalized_portal,
            )
            preview = marketplace_service._merge_preview_metadata(
                preview,
                product_meta=normalized_meta,
                portal_meta=normalized_portal,
                activation_readiness=readiness,
            )
        else:
            normalized_meta = marketplace_service._normalize_product_meta(
                db,
                current_user,
                product_type,
                commercial_price,
                product_meta,
                current_preview=preview,
                require_publication_window=False,
            )
            readiness = marketplace_service._get_activation_readiness(
                product_type=product_type,
                title=title,
                product_meta=normalized_meta,
            )
            preview = marketplace_service._merge_preview_metadata(
                preview,
                product_meta=normalized_meta,
                activation_readiness=readiness,
            )
        for extra_key in (
            "precio_referencia_tecnica",
            "precio_referencia_fuente",
            "precio_origen",
            "export_source",
            "export_status",
            "codigo_proyecto",
            "revision_proyecto",
            "import_traceability",
        ):
            if extra_key in product_meta:
                normalized_meta[extra_key] = product_meta[extra_key]
        preview["project_export"] = {
            "source": "classic_project",
            "product_type": product_type,
            "technical_total": f"{technical_total:.2f}",
            "technical_total_source": total_source,
            "commercial_price_rule": (
                "tramos_compras_publicas_giproy"
                if product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT
                else "manual_project_sale_price"
            ),
            "moderation_status": "pending",
            "synced_at": datetime.now(timezone.utc).isoformat(),
        }
        return {
            "technical_total": technical_total,
            "technical_total_source": total_source,
            "commercial_price": commercial_price,
            "preview": preview,
            "product_meta": normalized_meta,
            "portal_meta": normalized_portal or portal_meta,
            "readiness": readiness,
        }

    def _validate_project_export_readiness(self, project: Proyecto) -> None:
        project_config = dict(project.plantillas_config or {})
        import_trace = dict(project_config.get("public_procurement_import") or {})
        if not import_trace:
            return
        validation_status = str(import_trace.get("technical_validation_status") or "").strip().lower()
        if validation_status in {"blocked", "invalid", "format_not_supported"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El proyecto importado no esta listo para exportarse a Marketplace: conserva incidencias tecnicas bloqueantes.",
            )
        export_readiness = dict(import_trace.get("export_readiness") or {})
        if export_readiness and export_readiness.get("can_export_marketplace") is False:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=export_readiness.get("message") or "El proyecto importado no esta habilitado para exportarse a Marketplace.",
            )

    def _resolve_existing_product(
        self,
        db: Session,
        *,
        empresa_id: int,
        project: Proyecto,
        product_type: str,
    ) -> MarketplaceProduct | None:
        query = (
            db.query(MarketplaceProduct)
            .join(Usuario, MarketplaceProduct.seller_user_id == Usuario.id)
            .filter(
                Usuario.empresa_id == empresa_id,
                MarketplaceProduct.product_type == product_type,
            )
        )
        if product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT:
            for product in query.all():
                preview = dict(product.vista_previa or {})
                project_export = dict(preview.get("project_export") or {})
                if str(project_export.get("source_project_id") or "") == str(project.id):
                    return product
            return None
        return (
            query.filter(
                MarketplaceProduct.source_type == "proyecto",
                MarketplaceProduct.source_id == project.id,
            )
            .first()
        )

    def _resolve_project(self, db: Session, *, project_id: int, empresa_id: int) -> Proyecto:
        project = (
            db.query(Proyecto)
            .filter(Proyecto.id == project_id, Proyecto.empresa_id == empresa_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado o acceso denegado.")
        return project

    def list_project_export_statuses(
        self,
        db: Session,
        *,
        empresa_id: int,
        current_user: Usuario,
    ) -> dict[str, Any]:
        self._validate_access(current_user)
        project_ids = {
            project_id
            for (project_id,) in db.query(Proyecto.id).filter(Proyecto.empresa_id == empresa_id).all()
        }
        if not project_ids:
            return {"empresa_id": empresa_id, "projects": {}}

        products = (
            db.query(MarketplaceProduct)
            .join(Usuario, MarketplaceProduct.seller_user_id == Usuario.id)
            .filter(
                Usuario.empresa_id == empresa_id,
                MarketplaceProduct.product_type.in_([
                    self.PRODUCT_TYPE_PROJECT,
                    self.PRODUCT_TYPE_PUBLIC_PROCUREMENT,
                ]),
            )
            .order_by(MarketplaceProduct.fecha_actualizacion.desc().nullslast(), MarketplaceProduct.fecha_creacion.desc())
            .all()
        )

        status_by_project: dict[str, dict[str, Any]] = {}
        for product in products:
            preview = dict(product.vista_previa or {})
            project_export = dict(preview.get("project_export") or {})
            source_project_id = product.source_id if product.source_type == "proyecto" else project_export.get("source_project_id")
            try:
                project_id = int(source_project_id)
            except (TypeError, ValueError):
                continue
            if project_id not in project_ids:
                continue

            product_status = str(product.estado or "pending").strip().lower()
            can_edit = product_status == "pending" and int(product.ventas_count or 0) == 0
            entry = {
                "project_id": project_id,
                "product_id": product.id,
                "product_type": product.product_type,
                "status": product_status,
                "active": bool(product.activo),
                "can_edit": can_edit,
                "can_republish": can_edit,
                "sales_count": int(product.ventas_count or 0),
                "title": product.titulo,
                "price": str(product.precio),
                "updated_at": product.fecha_actualizacion or product.fecha_creacion,
                "message": (
                    "Pendiente de revision: puedes corregir y reenviar."
                    if can_edit
                    else "Gestiona esta publicacion desde Mis ventas."
                ),
            }
            key = str(project_id)
            if key not in status_by_project or status_by_project[key].get("status") != "pending":
                status_by_project[key] = entry

        return {"empresa_id": empresa_id, "projects": status_by_project}

    def preview_project_export(
        self,
        db: Session,
        *,
        project_id: int,
        empresa_id: int,
        current_user: Usuario,
        requested_product_type: str | None = None,
    ) -> dict[str, Any]:
        self._validate_access(current_user)
        project = self._resolve_project(db, project_id=project_id, empresa_id=empresa_id)
        product_type, can_choose = self._resolve_product_type(
            db,
            current_user=current_user,
            empresa_id=empresa_id,
            requested_product_type=requested_product_type,
        )
        marketplace_service._ensure_entity_publishable(db, current_user, "proyecto", project.id)
        self._validate_project_export_readiness(project)
        export_payload = self._build_export_payload(
            db,
            project=project,
            current_user=current_user,
            product_type=product_type,
        )
        existing = self._resolve_existing_product(
            db,
            empresa_id=empresa_id,
            project=project,
            product_type=product_type,
        )
        return {
            "project_id": project.id,
            "product_type": product_type,
            "can_choose_product_type": can_choose,
            "product_type_options": [
                {"value": self.PRODUCT_TYPE_PROJECT, "label": "Vender proyecto"},
                *(
                    [{"value": self.PRODUCT_TYPE_PUBLIC_PROCUREMENT, "label": "Compra publica"}]
                    if can_choose
                    else []
                ),
            ],
            "titulo": project.nombre.strip() or f"Proyecto {project.id}",
            "resumen": (project.descripcion or "").strip()[:500] or None,
            "descripcion": (project.descripcion or "").strip() or None,
            "incluye": (
                "Proyecto clasico GIPROY con base de datos, presupuesto y estructura tecnica asociada."
                if product_type == self.PRODUCT_TYPE_PROJECT
                else "Compra publica preparada desde proyecto clasico GIPROY y entregada como proyecto al comprador."
            ),
            "no_incluye": "No incluye derechos de reventa ni exportacion fuera de la empresa compradora.",
            "etiquetas": (
                ["proyecto", "giproy", "compras-publicas"]
                if product_type == self.PRODUCT_TYPE_PROJECT
                else ["compra-publica", "portal", "giproy"]
            ),
            "product_meta": export_payload["product_meta"],
            "portal_meta": export_payload["portal_meta"],
            "preview": export_payload["preview"],
            "readiness": export_payload["readiness"],
            "price": str(export_payload["commercial_price"]),
            "technical_total": str(export_payload["technical_total"]),
            "technical_total_source": export_payload["technical_total_source"],
            "already_exists": bool(existing),
            "existing_product_id": existing.id if existing else None,
        }

    def export_project(
        self,
        db: Session,
        *,
        project_id: int,
        empresa_id: int,
        current_user: Usuario,
        requested_product_type: str | None = None,
        overrides: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        self._validate_access(current_user)
        project = self._resolve_project(db, project_id=project_id, empresa_id=empresa_id)
        product_type, _ = self._resolve_product_type(
            db,
            current_user=current_user,
            empresa_id=empresa_id,
            requested_product_type=requested_product_type,
        )

        marketplace_service._ensure_entity_publishable(db, current_user, "proyecto", project.id)
        self._validate_project_export_readiness(project)

        export_payload = self._build_export_payload(
            db,
            project=project,
            current_user=current_user,
            product_type=product_type,
            overrides=overrides,
            require_portal_fields=product_type == self.PRODUCT_TYPE_PUBLIC_PROCUREMENT,
        )
        technical_total = export_payload["technical_total"]
        commercial_price = export_payload["commercial_price"]
        preview = export_payload["preview"]
        title = str((overrides or {}).get("titulo") or project.nombre or f"Proyecto {project.id}").strip()
        resumen = str((overrides or {}).get("resumen") or (project.descripcion or "").strip()[:500] or "").strip() or None
        descripcion = str((overrides or {}).get("descripcion") or (project.descripcion or "").strip() or "").strip() or None
        incluye = str(
            (overrides or {}).get("incluye")
            or (
                "Proyecto clasico GIPROY con base de datos, presupuesto y estructura tecnica asociada."
                if product_type == self.PRODUCT_TYPE_PROJECT
                else "Compra publica preparada desde proyecto clasico GIPROY y entregada como proyecto al comprador."
            )
        ).strip()
        no_incluye = str(
            (overrides or {}).get("no_incluye")
            or "No incluye derechos de reventa ni exportacion fuera de la empresa compradora."
        ).strip()
        etiquetas = [
            str(item).strip()
            for item in ((overrides or {}).get("etiquetas") or (
                ["proyecto", "giproy", "compras-publicas"]
                if product_type == self.PRODUCT_TYPE_PROJECT
                else ["compra-publica", "portal", "giproy"]
            ))
            if str(item).strip()
        ]
        preview["project_export"] = {
            **dict(preview.get("project_export") or {}),
            "source_project_id": project.id,
            "seller_empresa_id": empresa_id,
        }

        existing = self._resolve_existing_product(db, empresa_id=empresa_id, project=project, product_type=product_type)
        if existing:
            if int(existing.ventas_count or 0) > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este proyecto ya tiene ventas asociadas. Gestiona suspension o cancelacion desde Mis ventas.",
                )
            existing_status = str(existing.estado or "").strip().lower()
            if existing_status != "pending":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Este proyecto ya fue publicado. No se puede volver a publicarlo; gestionalo desde Mis ventas.",
                )
            replaced_product_id = existing.id
            db.delete(existing)
            db.flush()
            category = marketplace_service._resolve_fixed_category_for_product_type(db, product_type)
            replacement = MarketplaceProduct(
                titulo=title,
                slug=marketplace_service._ensure_unique_slug(db, marketplace_service._slugify(title or f"proyecto-{project.id}")),
                resumen=resumen,
                descripcion=descripcion,
                incluye=incluye,
                no_incluye=no_incluye,
                vista_previa=preview,
                etiquetas=etiquetas,
                product_type=product_type,
                product_kind="referenced" if product_type == self.PRODUCT_TYPE_PROJECT else "manual",
                source_type="proyecto" if product_type == self.PRODUCT_TYPE_PROJECT else None,
                source_id=project.id if product_type == self.PRODUCT_TYPE_PROJECT else None,
                precio=commercial_price,
                moneda="USD",
                estado="pending",
                activo=False,
                requiere_aprobacion=True,
                category_id=category.id if category else None,
                seller_user_id=current_user.id,
                approved_by_user_id=None,
            )
            db.add(replacement)
            db.commit()
            db.refresh(replacement)
            return {
                "product_id": replacement.id,
                "status": replacement.estado,
                "already_exists": True,
                "replaced_existing_product_id": replaced_product_id,
                "product_type": replacement.product_type,
                "price": str(replacement.precio),
                "technical_total": str(technical_total),
                "technical_total_source": export_payload["technical_total_source"],
                "message": "La publicacion pendiente anterior fue sustituida y queda nuevamente pendiente de moderacion.",
            }

        category = marketplace_service._resolve_fixed_category_for_product_type(db, product_type)
        product = MarketplaceProduct(
            titulo=title,
            slug=marketplace_service._ensure_unique_slug(db, marketplace_service._slugify(title or f"proyecto-{project.id}")),
            resumen=resumen,
            descripcion=descripcion,
            incluye=incluye,
            no_incluye=no_incluye,
            vista_previa=preview,
            etiquetas=etiquetas,
            product_type=product_type,
            product_kind="referenced" if product_type == self.PRODUCT_TYPE_PROJECT else "manual",
            source_type="proyecto" if product_type == self.PRODUCT_TYPE_PROJECT else None,
            source_id=project.id if product_type == self.PRODUCT_TYPE_PROJECT else None,
            precio=commercial_price,
            moneda="USD",
            estado="pending",
            activo=False,
            requiere_aprobacion=True,
            category_id=category.id if category else None,
            seller_user_id=current_user.id,
            approved_by_user_id=None,
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        return {
            "product_id": product.id,
            "status": product.estado,
            "already_exists": False,
            "product_type": product.product_type,
            "price": str(product.precio),
            "technical_total": str(technical_total),
            "technical_total_source": export_payload["technical_total_source"],
            "message": "Producto creado en marketplace como pendiente de moderacion.",
        }


project_marketplace_exporter = ProjectMarketplaceExporter()
