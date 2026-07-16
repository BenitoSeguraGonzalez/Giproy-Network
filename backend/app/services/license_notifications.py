from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.license_notification_event import LicenseNotificationEvent
from app.models.licencia import Licencia
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderItem
from app.models.usuario import Usuario
from app.utils.email_utils import send_transactional_email


ADMIN_ROLES = {"administrador", "superadministrador"}
EMAIL_CHANNEL = "email"
IN_APP_CHANNEL = "in_app"
LICENSE_EXPIRY_WARNING_DAYS = 7
LICENSE_READONLY_REMINDER_DAYS = 5


def _date_to_text(value) -> str | None:
    return value.isoformat() if value else None


def _date_to_display(value) -> str | None:
    return value.strftime("%d/%m/%Y") if value else None


def _money_to_text(amount, currency: str | None) -> str:
    return f"{amount or 0} {currency or 'USD'}"


class LicenseNotificationService:
    def build_purchase_payload(self, order: MarketplaceOrder, buyer: Usuario | None = None) -> dict:
        items = []
        for item in list(order.items or []):
            items.append(
                {
                    "order_item_id": item.id,
                    "product_id": item.product_id,
                    "product_title": item.product_title_snapshot,
                    "product_type": item.product_type_snapshot,
                    "source_type": item.source_type_snapshot,
                    "source_id": item.source_id_snapshot,
                    "delivered_entity_type": item.delivered_entity_type,
                    "delivered_entity_id": item.delivered_entity_id,
                    "price": str(item.price or 0),
                }
            )
        item_titles = [item["product_title"] for item in items if item.get("product_title")]
        readable_items = ", ".join(item_titles[:3])
        if len(item_titles) > 3:
            readable_items = f"{readable_items} y {len(item_titles) - 3} mas"
        total_text = _money_to_text(order.total, order.currency)
        subject = f"Compra formalizada #{order.id} - GiProy"
        body = (
            f"Tu compra #{order.id} fue formalizada correctamente por {total_text}."
            + (f" Productos: {readable_items}." if readable_items else "")
        )
        return {
            "marketplace_order_id": order.id,
            "buyer_user_id": order.buyer_user_id,
            "buyer_email": buyer.email if buyer else None,
            "buyer_company_id": buyer.empresa_id if buyer else None,
            "status": order.status,
            "total": str(order.total or 0),
            "currency": order.currency,
            "items": items,
            "title": "Compra formalizada",
            "subject": subject,
            "body": body,
            "message": body,
            "severity": "info",
            "action_label": "Ver compra",
        }

    def build_assignment_payload(self, assignment: EmpresaLicencia, licencia: Licencia, empresa: Empresa | None = None) -> dict:
        starts_display = _date_to_display(assignment.starts_at) or assignment.starts_at.isoformat()
        ends_display = _date_to_display(assignment.ends_at) if assignment.ends_at else "sin vencimiento"
        subject = f"Licencia {licencia.nombre} activada - GiProy"
        body = f"La licencia {licencia.nombre} fue activada para el periodo {starts_display} - {ends_display}."
        return {
            "empresa_id": assignment.empresa_id,
            "empresa_nombre": empresa.nombre if empresa else None,
            "empresa_licencia_id": assignment.id,
            "licencia_id": licencia.id,
            "licencia_nombre": licencia.nombre,
            "licencia_codigo": licencia.codigo,
            "starts_at": _date_to_text(assignment.starts_at),
            "ends_at": _date_to_text(assignment.ends_at),
            "status": assignment.status,
            "source": assignment.source,
            "payment_confirmed_at": assignment.payment_confirmed_at.isoformat() if assignment.payment_confirmed_at else None,
            "title": "Licencia activada",
            "subject": subject,
            "body": body,
            "message": body,
            "severity": "success",
            "action_label": "Ver licencia",
        }

    def record_event(
        self,
        db: Session,
        *,
        empresa_id: int,
        notification_type: str,
        channel: str,
        dedupe_key: str,
        empresa_licencia_id: int | None = None,
        licencia_id: int | None = None,
        recipient_usuario_id: int | None = None,
        recipient_email: str | None = None,
        payload: dict | None = None,
        scheduled_for: datetime | None = None,
    ) -> LicenseNotificationEvent:
        existing = (
            db.query(LicenseNotificationEvent)
            .filter(LicenseNotificationEvent.dedupe_key == dedupe_key)
            .first()
        )
        if existing:
            return existing

        event = LicenseNotificationEvent(
            empresa_id=empresa_id,
            empresa_licencia_id=empresa_licencia_id,
            licencia_id=licencia_id,
            recipient_usuario_id=recipient_usuario_id,
            notification_type=notification_type,
            channel=channel,
            recipient_email=recipient_email,
            status="pending",
            dedupe_key=dedupe_key,
            payload=payload or None,
            scheduled_for=scheduled_for or datetime.now(timezone.utc),
        )
        db.add(event)
        db.flush()
        return event

    def serialize_event(self, event: LicenseNotificationEvent) -> dict:
        payload = dict(event.payload or {})
        return {
            "id": event.id,
            "empresa_id": event.empresa_id,
            "empresa_licencia_id": event.empresa_licencia_id,
            "licencia_id": event.licencia_id,
            "recipient_usuario_id": event.recipient_usuario_id,
            "notification_type": event.notification_type,
            "channel": event.channel,
            "recipient_email": event.recipient_email,
            "status": event.status,
            "title": payload.get("title") or payload.get("subject") or event.notification_type,
            "subject": payload.get("subject"),
            "body": payload.get("body") or payload.get("message"),
            "severity": payload.get("severity") or "info",
            "action_label": payload.get("action_label"),
            "payload": payload,
            "scheduled_for": event.scheduled_for,
            "sent_at": event.sent_at,
            "acknowledged_at": event.acknowledged_at,
            "created_at": event.created_at,
        }

    def list_pending_in_app_for_user(self, db: Session, user: Usuario) -> list[LicenseNotificationEvent]:
        return (
            db.query(LicenseNotificationEvent)
            .filter(
                LicenseNotificationEvent.channel == IN_APP_CHANNEL,
                LicenseNotificationEvent.recipient_usuario_id == user.id,
                LicenseNotificationEvent.status == "pending",
                LicenseNotificationEvent.acknowledged_at.is_(None),
            )
            .order_by(LicenseNotificationEvent.created_at.asc(), LicenseNotificationEvent.id.asc())
            .all()
        )

    def acknowledge_in_app_event(self, db: Session, *, event_id: int, user: Usuario) -> LicenseNotificationEvent | None:
        event = (
            db.query(LicenseNotificationEvent)
            .filter(
                LicenseNotificationEvent.id == event_id,
                LicenseNotificationEvent.channel == IN_APP_CHANNEL,
                LicenseNotificationEvent.recipient_usuario_id == user.id,
            )
            .first()
        )
        if not event:
            return None
        event.status = "acknowledged"
        event.acknowledged_at = datetime.now(timezone.utc)
        db.add(event)
        db.flush()
        return event

    def dispatch_pending_email_events(
        self,
        db: Session,
        *,
        limit: int = 50,
        notification_type: str | None = None,
        retry_failed: bool = False,
    ) -> list[LicenseNotificationEvent]:
        eligible_statuses = ["pending", "failed"] if retry_failed else ["pending"]
        query = (
            db.query(LicenseNotificationEvent)
            .filter(
                LicenseNotificationEvent.channel == EMAIL_CHANNEL,
                LicenseNotificationEvent.status.in_(eligible_statuses),
                LicenseNotificationEvent.recipient_email.isnot(None),
                or_(
                    LicenseNotificationEvent.scheduled_for.is_(None),
                    LicenseNotificationEvent.scheduled_for <= datetime.now(timezone.utc),
                ),
            )
        )
        if notification_type:
            query = query.filter(LicenseNotificationEvent.notification_type == notification_type)
        events = (
            query
            .order_by(LicenseNotificationEvent.scheduled_for.asc().nullsfirst(), LicenseNotificationEvent.id.asc())
            .limit(max(1, min(int(limit or 50), 200)))
            .all()
        )
        for event in events:
            payload = dict(event.payload or {})
            subject = payload.get("subject") or payload.get("title") or "Aviso GiProy"
            body = payload.get("body") or payload.get("message") or subject
            try:
                dispatch_result = send_transactional_email(
                    to_email=event.recipient_email,
                    subject=subject,
                    body=body,
                )
                event.status = "sent"
                event.sent_at = datetime.now(timezone.utc)
                event.payload = {
                    **payload,
                    "email_dispatch": dispatch_result,
                }
                event.last_error = None
            except Exception as exc:
                event.status = "failed"
                event.last_error = str(exc)
                event.payload = {
                    **payload,
                    "email_dispatch": {
                        "success": False,
                        "error": str(exc),
                    },
                }
            db.add(event)
        db.flush()
        return events

    def queue_paid_license_welcome(
        self,
        db: Session,
        assignment: EmpresaLicencia,
        *,
        licencia: Licencia | None = None,
        actor_usuario_id: int | None = None,
    ) -> list[LicenseNotificationEvent]:
        licencia = licencia or assignment.licencia
        if not licencia or bool(getattr(licencia, "is_default_express", False)):
            return []

        empresa = db.query(Empresa).filter(Empresa.id == assignment.empresa_id).first()
        payload = self.build_assignment_payload(assignment, licencia, empresa)
        if actor_usuario_id:
            payload["actor_usuario_id"] = actor_usuario_id

        admins = (
            db.query(Usuario)
            .filter(
                Usuario.empresa_id == assignment.empresa_id,
                Usuario.activo.is_(True),
            )
            .all()
        )
        admins = [user for user in admins if str(user.rol or "").strip().lower() in ADMIN_ROLES]

        events: list[LicenseNotificationEvent] = []
        for admin in admins:
            admin_payload = {**payload, "recipient_usuario_id": admin.id, "recipient_email": admin.email}
            events.append(
                self.record_event(
                    db,
                    empresa_id=assignment.empresa_id,
                    empresa_licencia_id=assignment.id,
                    licencia_id=licencia.id,
                    recipient_usuario_id=admin.id,
                    recipient_email=admin.email,
                    notification_type="license_welcome",
                    channel=EMAIL_CHANNEL,
                    dedupe_key=f"license:{assignment.id}:welcome:email:user:{admin.id}",
                    payload=admin_payload,
                )
            )
            events.append(
                self.record_event(
                    db,
                    empresa_id=assignment.empresa_id,
                    empresa_licencia_id=assignment.id,
                    licencia_id=licencia.id,
                    recipient_usuario_id=admin.id,
                    recipient_email=admin.email,
                    notification_type="license_welcome",
                    channel=IN_APP_CHANNEL,
                    dedupe_key=f"license:{assignment.id}:welcome:in_app:user:{admin.id}",
                    payload={**admin_payload, "display_once": True},
                )
            )

        fallback_email = None
        if not admins and empresa:
            fallback_email = empresa.contacto_email or empresa.email
        if fallback_email:
            events.append(
                self.record_event(
                    db,
                    empresa_id=assignment.empresa_id,
                    empresa_licencia_id=assignment.id,
                    licencia_id=licencia.id,
                    recipient_email=fallback_email,
                    notification_type="license_welcome",
                    channel=EMAIL_CHANNEL,
                    dedupe_key=f"license:{assignment.id}:welcome:email:company",
                    payload={**payload, "recipient_email": fallback_email, "fallback_recipient": True},
                )
            )

        return events

    def _company_admins(self, db: Session, empresa_id: int) -> list[Usuario]:
        users = (
            db.query(Usuario)
            .filter(
                Usuario.empresa_id == empresa_id,
                Usuario.activo.is_(True),
            )
            .all()
        )
        return [user for user in users if str(user.rol or "").strip().lower() in ADMIN_ROLES]

    def _company_active_users(self, db: Session, empresa_id: int) -> list[Usuario]:
        return (
            db.query(Usuario)
            .filter(
                Usuario.empresa_id == empresa_id,
                Usuario.activo.is_(True),
            )
            .order_by(Usuario.id.asc())
            .all()
        )

    def queue_license_expiry_window_notifications(
        self,
        db: Session,
        assignment: EmpresaLicencia,
        *,
        today: date | None = None,
    ) -> list[LicenseNotificationEvent]:
        licencia = assignment.licencia
        if not licencia or bool(getattr(licencia, "is_default_express", False)) or not assignment.ends_at:
            return []
        reference = today or date.today()
        days_remaining = (assignment.ends_at - reference).days
        if days_remaining < 0 or days_remaining > LICENSE_EXPIRY_WARNING_DAYS:
            return []

        ends_display = _date_to_display(assignment.ends_at) or assignment.ends_at.isoformat()
        empresa = db.query(Empresa).filter(Empresa.id == assignment.empresa_id).first()
        payload = {
            "empresa_id": assignment.empresa_id,
            "empresa_nombre": empresa.nombre if empresa else None,
            "empresa_licencia_id": assignment.id,
            "licencia_id": licencia.id,
            "licencia_nombre": licencia.nombre,
            "licencia_codigo": licencia.codigo,
            "ends_at": assignment.ends_at.isoformat(),
            "days_remaining": days_remaining,
            "title": "Licencia por caducar",
            "subject": f"La licencia {licencia.nombre} vence el {ends_display} - GiProy",
            "body": f"La licencia {licencia.nombre} vence el {ends_display}. Revise la renovacion para evitar interrupciones.",
            "message": f"La licencia {licencia.nombre} vence el {ends_display}. Revise la renovacion para evitar interrupciones.",
            "severity": "warning",
            "action_label": "Renovar licencia",
        }

        events: list[LicenseNotificationEvent] = []
        for user in self._company_active_users(db, assignment.empresa_id):
            events.append(
                self.record_event(
                    db,
                    empresa_id=assignment.empresa_id,
                    empresa_licencia_id=assignment.id,
                    licencia_id=licencia.id,
                    recipient_usuario_id=user.id,
                    recipient_email=user.email,
                    notification_type="license_expiring_soon",
                    channel=IN_APP_CHANNEL,
                    dedupe_key=f"license:{assignment.id}:expiring_soon:in_app:user:{user.id}",
                    payload={**payload, "recipient_usuario_id": user.id, "recipient_email": user.email, "display_once": False},
                )
            )

        if days_remaining == LICENSE_EXPIRY_WARNING_DAYS:
            for admin in self._company_admins(db, assignment.empresa_id):
                events.append(
                    self.record_event(
                        db,
                        empresa_id=assignment.empresa_id,
                        empresa_licencia_id=assignment.id,
                        licencia_id=licencia.id,
                        recipient_usuario_id=admin.id,
                        recipient_email=admin.email,
                        notification_type="license_expiring_soon",
                        channel=EMAIL_CHANNEL,
                        dedupe_key=f"license:{assignment.id}:expiring_soon:email:user:{admin.id}",
                        payload={**payload, "recipient_usuario_id": admin.id, "recipient_email": admin.email},
                    )
                )
        return events

    def queue_license_readonly_notifications(
        self,
        db: Session,
        assignment: EmpresaLicencia,
        *,
        today: date | None = None,
    ) -> list[LicenseNotificationEvent]:
        licencia = assignment.licencia
        if not licencia or bool(getattr(licencia, "is_default_express", False)) or not assignment.ends_at:
            return []
        reference = today or date.today()
        grace_ends_at = assignment.grace_ends_at
        if assignment.ends_at >= reference or not grace_ends_at or grace_ends_at < reference:
            return []

        days_since_expiry = (reference - assignment.ends_at).days
        days_until_delete = max(0, (grace_ends_at - reference).days)
        grace_display = _date_to_display(grace_ends_at) or grace_ends_at.isoformat()
        ends_display = _date_to_display(assignment.ends_at) or assignment.ends_at.isoformat()
        empresa = db.query(Empresa).filter(Empresa.id == assignment.empresa_id).first()
        payload = {
            "empresa_id": assignment.empresa_id,
            "empresa_nombre": empresa.nombre if empresa else None,
            "empresa_licencia_id": assignment.id,
            "licencia_id": licencia.id,
            "licencia_nombre": licencia.nombre,
            "licencia_codigo": licencia.codigo,
            "ends_at": assignment.ends_at.isoformat(),
            "grace_ends_at": grace_ends_at.isoformat(),
            "days_since_expiry": days_since_expiry,
            "days_until_delete": days_until_delete,
            "title": "Servicio en solo lectura",
            "subject": f"Servicio en solo lectura hasta {grace_display} - GiProy",
            "body": (
                f"La licencia {licencia.nombre} finalizo el {ends_display}. "
                f"El servicio opera en solo lectura hasta el {grace_display}. "
                "Los datos podran ser retirados al finalizar el periodo de disponibilidad."
            ),
            "message": (
                f"La licencia {licencia.nombre} finalizo el {ends_display}. "
                f"El servicio opera en solo lectura hasta el {grace_display}. "
                "Los datos podran ser retirados al finalizar el periodo de disponibilidad."
            ),
            "severity": "critical" if days_until_delete == 0 else "warning",
            "action_label": "Contactar renovacion",
        }

        events: list[LicenseNotificationEvent] = []
        for user in self._company_active_users(db, assignment.empresa_id):
            events.append(
                self.record_event(
                    db,
                    empresa_id=assignment.empresa_id,
                    empresa_licencia_id=assignment.id,
                    licencia_id=licencia.id,
                    recipient_usuario_id=user.id,
                    recipient_email=user.email,
                    notification_type="license_readonly",
                    channel=IN_APP_CHANNEL,
                    dedupe_key=f"license:{assignment.id}:readonly:in_app:user:{user.id}",
                    payload={**payload, "recipient_usuario_id": user.id, "recipient_email": user.email, "display_once": False},
                )
            )

        should_email = days_since_expiry == 1 or days_since_expiry % LICENSE_READONLY_REMINDER_DAYS == 0 or days_until_delete == 0
        if should_email:
            email_type = "license_data_deletion_today" if days_until_delete == 0 else "license_readonly"
            for admin in self._company_admins(db, assignment.empresa_id):
                events.append(
                    self.record_event(
                        db,
                        empresa_id=assignment.empresa_id,
                        empresa_licencia_id=assignment.id,
                        licencia_id=licencia.id,
                        recipient_usuario_id=admin.id,
                        recipient_email=admin.email,
                        notification_type=email_type,
                        channel=EMAIL_CHANNEL,
                        dedupe_key=f"license:{assignment.id}:{email_type}:email:user:{admin.id}:date:{reference.isoformat()}",
                        payload={**payload, "recipient_usuario_id": admin.id, "recipient_email": admin.email},
                    )
                )
        return events

    def queue_due_license_lifecycle_notifications(
        self,
        db: Session,
        *,
        today: date | None = None,
        empresa_id: int | None = None,
    ) -> list[LicenseNotificationEvent]:
        query = (
            db.query(EmpresaLicencia)
            .join(Licencia, Licencia.id == EmpresaLicencia.licencia_id)
            .options(joinedload(EmpresaLicencia.licencia))
            .filter(
                EmpresaLicencia.activa.is_(True),
                EmpresaLicencia.ends_at.isnot(None),
                Licencia.is_default_express.is_(False),
            )
        )
        if empresa_id is not None:
            query = query.filter(EmpresaLicencia.empresa_id == empresa_id)

        events: list[LicenseNotificationEvent] = []
        for assignment in query.all():
            events.extend(self.queue_license_expiry_window_notifications(db, assignment, today=today))
            events.extend(self.queue_license_readonly_notifications(db, assignment, today=today))
        return events

    def queue_purchase_formalized(
        self,
        db: Session,
        order: MarketplaceOrder,
        *,
        buyer: Usuario | None = None,
        actor_usuario_id: int | None = None,
        payment_method: str | None = None,
    ) -> list[LicenseNotificationEvent]:
        buyer = buyer or order.buyer
        if not buyer:
            return []

        payload = self.build_purchase_payload(order, buyer)
        if actor_usuario_id:
            payload["actor_usuario_id"] = actor_usuario_id
        if payment_method:
            payload["payment_method"] = payment_method

        return [
            self.record_event(
                db,
                empresa_id=buyer.empresa_id,
                recipient_usuario_id=buyer.id,
                recipient_email=buyer.email,
                notification_type="purchase_formalized",
                channel=EMAIL_CHANNEL,
                dedupe_key=f"marketplace-order:{order.id}:purchase_formalized:email:user:{buyer.id}",
                payload=payload,
            ),
            self.record_event(
                db,
                empresa_id=buyer.empresa_id,
                recipient_usuario_id=buyer.id,
                recipient_email=buyer.email,
                notification_type="purchase_formalized",
                channel=IN_APP_CHANNEL,
                dedupe_key=f"marketplace-order:{order.id}:purchase_formalized:in_app:user:{buyer.id}",
                payload={**payload, "display_once": True},
            ),
        ]

    def _extract_order_item_product_meta(self, item: MarketplaceOrderItem) -> dict:
        product = item.product
        preview = product.vista_previa if product and isinstance(product.vista_previa, dict) else {}
        return dict(preview.get("product_meta") or {})

    def resolve_order_item_end_date(self, item: MarketplaceOrderItem) -> date | None:
        product_meta = self._extract_order_item_product_meta(item)
        duration_months = product_meta.get("duration_months")
        if not duration_months or not item.order or not item.order.created_at:
            return None
        try:
            months = int(duration_months)
        except (TypeError, ValueError):
            return None
        if months <= 0:
            return None
        return item.order.created_at.date() + timedelta(days=30 * months)

    def queue_purchase_lifecycle_ended(
        self,
        db: Session,
        item: MarketplaceOrderItem,
        *,
        buyer: Usuario | None = None,
        today: date | None = None,
    ) -> list[LicenseNotificationEvent]:
        order = item.order
        buyer = buyer or (order.buyer if order else None)
        ends_at = self.resolve_order_item_end_date(item)
        reference = today or date.today()
        if not order or not buyer or not ends_at or ends_at > reference:
            return []

        starts_display = _date_to_display(order.created_at.date()) if order.created_at else None
        ends_display = _date_to_display(ends_at) or ends_at.isoformat()
        subject = f"Finalizo {item.product_title_snapshot} - GiProy"
        body = (
            f"El producto comprado '{item.product_title_snapshot}' llego a su fecha de fin el {ends_display}."
            " Revisa si necesitas renovar o contratar nuevamente el servicio."
        )
        payload = {
            "marketplace_order_id": order.id,
            "marketplace_order_item_id": item.id,
            "buyer_user_id": buyer.id,
            "buyer_email": buyer.email,
            "buyer_company_id": buyer.empresa_id,
            "product_id": item.product_id,
            "product_title": item.product_title_snapshot,
            "product_type": item.product_type_snapshot,
            "source_type": item.source_type_snapshot,
            "source_id": item.source_id_snapshot,
            "starts_at": order.created_at.date().isoformat() if order.created_at else None,
            "ends_at": ends_at.isoformat(),
            "starts_at_display": starts_display,
            "ends_at_display": ends_display,
            "title": "Producto finalizado",
            "subject": subject,
            "body": body,
            "message": body,
            "severity": "warning",
            "action_label": "Revisar compra",
        }

        return [
            self.record_event(
                db,
                empresa_id=buyer.empresa_id,
                recipient_usuario_id=buyer.id,
                recipient_email=buyer.email,
                notification_type="purchase_lifecycle_ended",
                channel=EMAIL_CHANNEL,
                dedupe_key=f"marketplace-order-item:{item.id}:purchase_lifecycle_ended:email:user:{buyer.id}",
                payload=payload,
            ),
            self.record_event(
                db,
                empresa_id=buyer.empresa_id,
                recipient_usuario_id=buyer.id,
                recipient_email=buyer.email,
                notification_type="purchase_lifecycle_ended",
                channel=IN_APP_CHANNEL,
                dedupe_key=f"marketplace-order-item:{item.id}:purchase_lifecycle_ended:in_app:user:{buyer.id}",
                payload={**payload, "display_once": True},
            ),
        ]

    def queue_due_purchase_lifecycle_end_notifications(
        self,
        db: Session,
        *,
        today: date | None = None,
        empresa_id: int | None = None,
    ) -> list[LicenseNotificationEvent]:
        query = (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .join(Usuario, Usuario.id == MarketplaceOrder.buyer_user_id)
            .options(
                joinedload(MarketplaceOrderItem.order).joinedload(MarketplaceOrder.buyer),
                joinedload(MarketplaceOrderItem.product),
            )
            .filter(MarketplaceOrder.status == "completed")
        )
        if empresa_id is not None:
            query = query.filter(Usuario.empresa_id == empresa_id)

        events: list[LicenseNotificationEvent] = []
        for item in query.all():
            events.extend(self.queue_purchase_lifecycle_ended(db, item, today=today))
        return events

    def run_purchase_lifecycle_housekeeping(
        self,
        db: Session,
        *,
        today: date | None = None,
        empresa_id: int | None = None,
        dispatch_email: bool = False,
        dispatch_limit: int = 50,
        retry_failed: bool = False,
    ) -> dict:
        queued_events = self.queue_due_purchase_lifecycle_end_notifications(
            db,
            today=today,
            empresa_id=empresa_id,
        )
        dispatched_events: list[LicenseNotificationEvent] = []
        if dispatch_email:
            dispatched_events = self.dispatch_pending_email_events(
                db,
                limit=dispatch_limit,
                notification_type="purchase_lifecycle_ended",
                retry_failed=retry_failed,
            )
        return {
            "queued_events": queued_events,
            "dispatched_events": dispatched_events,
        }

    def run_notification_housekeeping(
        self,
        db: Session,
        *,
        today: date | None = None,
        empresa_id: int | None = None,
        dispatch_email: bool = False,
        dispatch_limit: int = 50,
        notification_type: str | None = None,
        retry_failed: bool = False,
    ) -> dict:
        from app.services.license import license_service

        license_service.run_license_housekeeping_for_all_companies(
            db,
            today=today,
            commit=False,
        )

        purchase_events = self.queue_due_purchase_lifecycle_end_notifications(
            db,
            today=today,
            empresa_id=empresa_id,
        )
        license_events = self.queue_due_license_lifecycle_notifications(
            db,
            today=today,
            empresa_id=empresa_id,
        )
        dispatched_events: list[LicenseNotificationEvent] = []
        if dispatch_email:
            dispatched_events = self.dispatch_pending_email_events(
                db,
                limit=dispatch_limit,
                notification_type=notification_type,
                retry_failed=retry_failed,
            )
        return {
            "queued_purchase_events": purchase_events,
            "queued_license_events": license_events,
            "dispatched_events": dispatched_events,
        }


license_notification_service = LicenseNotificationService()
