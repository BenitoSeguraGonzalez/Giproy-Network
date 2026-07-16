from __future__ import annotations

import secrets
import string
import hashlib
import json
from dataclasses import dataclass
from decimal import Decimal
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.empresa import Empresa
from app.models.empresa_licencia import EmpresaLicencia
from app.models.licencia import Licencia
from app.models.apu import APU, APULinea
from app.models.base_trabajo import BaseTrabajo
from app.models.edt import EdtNode, TipoNodoEdt
from app.models.marketplace import MarketplaceAssetOrigin, MarketplaceProduct
from app.models.marketplace import MarketplaceOrder, MarketplaceOrderItem
from app.models.presupuesto import Presupuesto, PresupuestoDetalle, PresupuestoIndirecto
from app.models.proyecto import Proyecto
from app.models.recurso import CategoriaRecurso, Recurso
from app.models.subcategoria_item import SubcategoriaItem
from app.models.transferencia import (
    TransferAdminPublicCode,
    TransferAllowedCompanyRecipient,
    TransferAuditEvent,
    TransferCodeAttemptGuard,
    TransferCompanyPublicCode,
    TransferExtraRecipientPack,
    TransferImportReference,
    TransferImportResult,
    TransferMarketplaceRequirement,
    TransferShipment,
    TransferShipmentItem,
)
from app.models.unidad import Unidad
from app.models.usuario import Usuario
from app.schemas.transferencia import (
    TRANSFER_ALLOWED_LICENSES,
    TRANSFER_AUTHORIZED_ROLES,
    TRANSFER_SHIPMENT_STATES,
    TRANSFER_STATE_PRESENTATION,
)
from app.services.classic_asset_portability import classic_asset_portability_service


PUBLIC_CODE_ALPHABET = string.ascii_uppercase + string.digits
PUBLIC_CODE_RAW_LENGTH = 6
FIXED_RECIPIENT_LIMIT = 3
CODE_FAILURE_PAUSE_MINUTES = 5
CODE_FAILURE_BAN_DAYS = 7
CODE_FAILURE_WINDOW_HOURS = 24
CODE_FAILURES_BEFORE_PAUSE = 3
CODE_FAILURES_BEFORE_BAN = 12
TRANSFER_EXCLUDED_SECTIONS = [
    "cronogramas",
    "gantt",
    "planificacion_temporal",
    "documentos",
    "uploads",
]

TRANSFER_TIMELINE_EVENT_LABELS = {
    "creado": "Envio creado",
    "enviado": "Envio enviado",
    "recepcionado": "Envio recepcionado",
    "importado": "Envio importado",
    "rechazado": "Envio rechazado",
    "cancelado": "Envio cancelado",
    "expirado": "Envio expirado",
    "transfer_recipient_added": "Empresa habilitada para comunicacion",
    "transfer_shipment_created": "Envio creado",
    "transfer_shipment_rejected": "Envio rechazado por el receptor",
    "transfer_shipment_rejected_notification": "Notificacion de rechazo al emisor",
    "transfer_shipment_imported": "Envio importado por el receptor",
    "transfer_shipment_import_failed": "Fallo de importacion del envio",
    "transfer_shipment_cancelled": "Envio cancelado por el emisor",
    "transfer_shipment_receipt_sanitized": "Recepcion saneada por el sistema",
    "transfer_marketplace_requirements_revalidated": "Compras Marketplace revalidadas",
    "transfer_code_validation_failed": "Validacion de codigo fallida",
    "transfer_code_validation_paused": "Validacion de codigo pausada",
    "transfer_code_validation_banned": "Validacion de codigo bloqueada",
    "transfer_code_validation_resolved": "Codigo de empresa validado",
}


@dataclass
class TransferPolicyError(ValueError):
    code: str
    message: str

    def __str__(self) -> str:
        return self.message


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _json_safe(value):
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return value


class TransferenciasService:
    def role_key(self, role: str | None) -> str:
        return (role or "").strip().lower()

    def is_transfer_operator(self, user: Usuario) -> bool:
        return self.role_key(user.rol) in set(TRANSFER_AUTHORIZED_ROLES)

    def ensure_operator(self, user: Usuario) -> None:
        if not self.is_transfer_operator(user):
            raise TransferPolicyError(
                "transfer_role_forbidden",
                "Solo Administradores y Superadministradores pueden operar Envios y Transferencias.",
            )

    def ensure_license_enabled(self, db: Session, empresa_id: int) -> str:
        assignment = self._get_current_license_assignment(db, empresa_id)
        license_code = (assignment.licencia.codigo if assignment and assignment.licencia else "").strip().upper()
        plan_kind = (assignment.licencia.plan_kind if assignment and assignment.licencia else "").strip().upper()
        if license_code in TRANSFER_ALLOWED_LICENSES or plan_kind in {"ESTANDAR", "PROFESIONAL"}:
            return license_code or plan_kind
        raise TransferPolicyError(
            "transfer_license_blocked",
            "La licencia activa de la empresa no permite Envios y Transferencias.",
        )

    def resolve_effective_empresa_id(self, db: Session, user: Usuario, empresa_id: int | None = None) -> int:
        self.ensure_operator(user)
        requested_id = int(empresa_id or user.empresa_id)
        user_company_id = int(user.empresa_id)
        if requested_id != user_company_id and self.role_key(user.rol) != "superadministrador":
            raise TransferPolicyError(
                "transfer_company_scope_forbidden",
                "No puede operar Envios y Transferencias para otra empresa.",
            )
        exists = db.query(Empresa.id).filter(Empresa.id == requested_id).first()
        if not exists:
            raise TransferPolicyError("transfer_company_not_found", "La empresa operativa no existe.")
        return requested_id

    def ensure_company_public_code(self, db: Session, empresa_id: int) -> TransferCompanyPublicCode:
        empresa = db.query(Empresa).filter(Empresa.id == int(empresa_id)).first()
        if not empresa:
            raise TransferPolicyError("transfer_company_not_found", "La empresa no existe para generar codigo publico.")

        existing = (
            db.query(TransferCompanyPublicCode)
            .filter(TransferCompanyPublicCode.empresa_id == empresa.id, TransferCompanyPublicCode.status == "active")
            .order_by(TransferCompanyPublicCode.id.desc())
            .first()
        )
        if existing:
            return existing

        code = TransferCompanyPublicCode(
            empresa_id=empresa.id,
            public_code=self.generate_unique_public_code(db),
            status="active",
            metadata_json={"source": "auto_company"},
        )
        db.add(code)
        db.flush()
        return code

    def sanitize_company_public_codes(self, db: Session) -> dict:
        companies = db.query(Empresa).order_by(Empresa.id.asc()).all()
        created = 0
        existing = 0
        for empresa in companies:
            before = (
                db.query(TransferCompanyPublicCode)
                .filter(TransferCompanyPublicCode.empresa_id == empresa.id, TransferCompanyPublicCode.status == "active")
                .first()
            )
            self.ensure_company_public_code(db, empresa.id)
            created += 0 if before else 1
            existing += 1 if before else 0
        db.flush()
        return {
            "scanned_companies": len(companies),
            "created_codes": created,
            "existing_codes": existing,
        }

    def ensure_admin_public_code(self, db: Session, user: Usuario) -> TransferCompanyPublicCode | None:
        if not self.is_transfer_operator(user):
            return None
        return self.ensure_company_public_code(db, user.empresa_id)

    def ensure_legacy_admin_public_code(self, db: Session, user: Usuario) -> TransferAdminPublicCode | None:
        if not self.is_transfer_operator(user):
            return None
        existing = (
            db.query(TransferAdminPublicCode)
            .filter(TransferAdminPublicCode.usuario_id == user.id)
            .order_by(TransferAdminPublicCode.id.desc())
            .first()
        )
        if existing:
            return existing

        code = TransferAdminPublicCode(
            usuario_id=user.id,
            empresa_id=user.empresa_id,
            public_code=self.generate_unique_public_code(db),
            status="active",
            metadata_json={"source": "auto_admin_user"},
        )
        db.add(code)
        db.flush()
        return code

    def sanitize_admin_public_codes(self, db: Session) -> dict:
        result = self.sanitize_company_public_codes(db)
        return {
            "scanned_admin_users": result["scanned_companies"],
            "created_codes": result["created_codes"],
            "existing_codes": result["existing_codes"],
        }

    def _public_code_exists(self, db: Session, formatted: str) -> bool:
        company_exists = (
            db.query(TransferCompanyPublicCode.id)
            .filter(TransferCompanyPublicCode.public_code == formatted)
            .first()
        )
        if company_exists:
            return True
        legacy_exists = (
            db.query(TransferAdminPublicCode.id)
            .filter(TransferAdminPublicCode.public_code == formatted)
            .first()
        )
        return bool(legacy_exists)

    def generate_unique_public_code(self, db: Session) -> str:
        for _ in range(40):
            raw = "".join(secrets.choice(PUBLIC_CODE_ALPHABET) for _ in range(PUBLIC_CODE_RAW_LENGTH))
            formatted = self.format_public_code(raw)
            if not self._public_code_exists(db, formatted):
                return formatted
        raise TransferPolicyError("transfer_code_generation_failed", "No se pudo generar un codigo publico unico.")

    @staticmethod
    def normalize_public_code(value: str) -> str:
        raw = "".join(ch for ch in str(value or "").upper() if ch.isalnum())
        if len(raw) != PUBLIC_CODE_RAW_LENGTH:
            raise TransferPolicyError("transfer_code_invalid_format", "El codigo debe tener formato XXX - XXX.")
        return TransferenciasService.format_public_code(raw)

    @staticmethod
    def format_public_code(raw: str) -> str:
        compact = "".join(ch for ch in str(raw or "").upper() if ch.isalnum())
        return f"{compact[:3]} - {compact[3:]}"

    def get_my_public_code(self, db: Session, user: Usuario, empresa_id: int | None = None) -> TransferCompanyPublicCode:
        effective_empresa_id = self.resolve_effective_empresa_id(db, user, empresa_id=empresa_id)
        code = self.ensure_company_public_code(db, effective_empresa_id)
        if code is None:
            raise TransferPolicyError("transfer_code_not_available", "No existe codigo publico para esta empresa.")
        return code

    def resolve_recipient_company(self, db: Session, *, sender_empresa_id: int, public_code: str, actor_user_id: int | None = None) -> Empresa:
        self.ensure_license_enabled(db, sender_empresa_id)
        self._assert_code_attempt_allowed(db, sender_empresa_id)
        try:
            normalized_code = self.normalize_public_code(public_code)
        except TransferPolicyError:
            self._record_code_failure(db, sender_empresa_id, attempted_code=str(public_code or ""), actor_user_id=actor_user_id)
            raise

        company_code = (
            db.query(TransferCompanyPublicCode)
            .options(joinedload(TransferCompanyPublicCode.empresa))
            .filter(
                TransferCompanyPublicCode.public_code == normalized_code,
                TransferCompanyPublicCode.status == "active",
            )
            .first()
        )
        recipient_empresa = company_code.empresa if company_code else None
        if not recipient_empresa:
            legacy_code = (
                db.query(TransferAdminPublicCode)
                .options(joinedload(TransferAdminPublicCode.empresa), joinedload(TransferAdminPublicCode.usuario))
                .filter(
                    TransferAdminPublicCode.public_code == normalized_code,
                    TransferAdminPublicCode.status == "active",
                )
                .first()
            )
            if legacy_code and legacy_code.empresa and legacy_code.usuario and legacy_code.usuario.activo:
                recipient_empresa = legacy_code.empresa

        if not recipient_empresa:
            self._record_code_failure(db, sender_empresa_id, attempted_code=normalized_code, actor_user_id=actor_user_id)
            raise TransferPolicyError("transfer_code_not_found", "No se pudo validar el codigo indicado.")

        if int(recipient_empresa.id) == int(sender_empresa_id):
            self._record_code_failure(db, sender_empresa_id, attempted_code=normalized_code, actor_user_id=actor_user_id)
            raise TransferPolicyError("transfer_recipient_same_company", "No se puede asociar la propia empresa como destinataria.")

        self._record_code_success(db, sender_empresa_id, attempted_code=normalized_code, actor_user_id=actor_user_id)
        return recipient_empresa

    def create_recipient_from_code(
        self,
        db: Session,
        *,
        sender_empresa_id: int,
        public_code: str,
        actor_user_id: int,
        confirm: bool,
        confirmed_display_name: str | None = None,
    ) -> TransferAllowedCompanyRecipient:
        if not confirm:
            raise TransferPolicyError("transfer_recipient_confirmation_required", "Debe confirmar explicitamente la empresa destinataria.")

        recipient_company = self.resolve_recipient_company(
            db,
            sender_empresa_id=sender_empresa_id,
            public_code=public_code,
            actor_user_id=actor_user_id,
        )
        display_name = self.company_display_name(recipient_company)
        if confirmed_display_name and confirmed_display_name.strip() != display_name:
            raise TransferPolicyError("transfer_recipient_confirmation_mismatch", "La confirmacion no coincide con la empresa resuelta.")

        existing = (
            db.query(TransferAllowedCompanyRecipient)
            .filter(
                TransferAllowedCompanyRecipient.empresa_id == sender_empresa_id,
                TransferAllowedCompanyRecipient.recipient_empresa_id == recipient_company.id,
                TransferAllowedCompanyRecipient.status == "active",
            )
            .first()
        )
        if existing:
            return existing

        fixed_used = self.count_fixed_recipients(db, sender_empresa_id)
        source_pack = None
        recipient_kind = "fixed"
        expires_at = None
        if fixed_used >= FIXED_RECIPIENT_LIMIT:
            source_pack = self._next_available_extra_pack(db, sender_empresa_id)
            if source_pack is None:
                raise TransferPolicyError(
                    "transfer_recipient_slots_exhausted",
                    "La empresa ya uso sus 3 destinatarios fijos y no tiene paquetes Conecta disponibles.",
                )
            recipient_kind = "additional"
            expires_at = source_pack.expires_at
            source_pack.slots_used = int(source_pack.slots_used or 0) + 1
            db.add(source_pack)

        recipient = TransferAllowedCompanyRecipient(
            empresa_id=sender_empresa_id,
            recipient_empresa_id=recipient_company.id,
            recipient_kind=recipient_kind,
            status="active",
            source_pack_id=source_pack.id if source_pack else None,
            created_by_user_id=actor_user_id,
            confirmed_by_user_id=actor_user_id,
            expires_at=expires_at,
            metadata_json={
                "confirmation_display_name": confirmed_display_name or display_name,
                "recipient_company_name": recipient_company.nombre,
                "recipient_company_alias": recipient_company.alias,
            },
        )
        db.add(recipient)
        db.flush()
        self._log_audit(
            db,
            empresa_id=sender_empresa_id,
            user_id=actor_user_id,
            event_type="transfer_recipient_added",
            payload={
                "recipient_id": recipient.id,
                "recipient_kind": recipient_kind,
                "recipient_empresa_id": recipient_company.id,
            },
        )
        db.flush()
        return recipient

    def list_recipients(self, db: Session, empresa_id: int) -> list[TransferAllowedCompanyRecipient]:
        now = _utcnow()
        return (
            db.query(TransferAllowedCompanyRecipient)
            .options(joinedload(TransferAllowedCompanyRecipient.recipient_empresa))
            .filter(
                TransferAllowedCompanyRecipient.empresa_id == empresa_id,
                TransferAllowedCompanyRecipient.status == "active",
            )
            .filter(
                (TransferAllowedCompanyRecipient.expires_at == None)
                | (TransferAllowedCompanyRecipient.expires_at >= now)
            )
            .order_by(TransferAllowedCompanyRecipient.created_at.desc(), TransferAllowedCompanyRecipient.id.desc())
            .all()
        )

    def summarize_recipient_capacity(self, db: Session, empresa_id: int) -> dict[str, int]:
        recipients = self.list_recipients(db, empresa_id)
        fixed_used = len([item for item in recipients if item.recipient_kind == "fixed"])
        additional_used = len([item for item in recipients if item.recipient_kind == "additional"])
        now = _utcnow()
        packs = (
            db.query(TransferExtraRecipientPack)
            .filter(
                TransferExtraRecipientPack.empresa_id == empresa_id,
                TransferExtraRecipientPack.status == "active",
                TransferExtraRecipientPack.expires_at > now,
            )
            .all()
        )
        additional_limit = sum(max(0, int(pack.slots_total or 0)) for pack in packs)
        pack_slots_used = sum(max(0, int(pack.slots_used or 0)) for pack in packs)
        additional_available = max(0, additional_limit - pack_slots_used)
        return {
            "fixed_limit": FIXED_RECIPIENT_LIMIT,
            "fixed_used": fixed_used,
            "fixed_available": max(0, FIXED_RECIPIENT_LIMIT - fixed_used),
            "additional_limit": additional_limit,
            "additional_used": additional_used,
            "additional_available": additional_available,
            "additional_active": additional_used,
        }

    def list_tray(
        self,
        db: Session,
        *,
        empresa_id: int,
        direction: str = "todos",
        status_filter: str | None = None,
        q: str | None = None,
        date_from: date | datetime | None = None,
        date_to: date | datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict:
        normalized_direction = self._normalize_tray_direction(direction)
        normalized_status = (status_filter or "").strip() or None
        if normalized_status and normalized_status not in set(TRANSFER_SHIPMENT_STATES):
            raise TransferPolicyError("transfer_tray_status_invalid", "Estado de bandeja no soportado.")

        start_at, end_at = self._tray_date_bounds(date_from, date_to)
        activity_at = func.coalesce(TransferShipment.received_at, TransferShipment.sent_at, TransferShipment.created_at)
        query = (
            db.query(TransferShipment)
            .options(
                joinedload(TransferShipment.sender_empresa),
                joinedload(TransferShipment.receiver_empresa),
                joinedload(TransferShipment.items),
                joinedload(TransferShipment.events),
            )
            .filter(activity_at >= start_at, activity_at <= end_at)
        )
        if normalized_direction == "entrada":
            query = query.filter(TransferShipment.receiver_empresa_id == empresa_id)
        elif normalized_direction == "salida":
            query = query.filter(TransferShipment.sender_empresa_id == empresa_id)
        else:
            query = query.filter(
                or_(
                    TransferShipment.sender_empresa_id == empresa_id,
                    TransferShipment.receiver_empresa_id == empresa_id,
                )
            )

        shipments = query.order_by(activity_at.desc(), TransferShipment.id.desc()).all()
        search_text = self._normalize_search(q)
        if search_text:
            shipments = [shipment for shipment in shipments if self._shipment_matches_search(shipment, search_text)]

        metrics = self._build_tray_metrics(shipments, empresa_id=empresa_id)
        if normalized_status:
            shipments = [shipment for shipment in shipments if shipment.status == normalized_status]

        total = len(shipments)
        limit = max(1, min(int(limit or 50), 200))
        offset = max(0, int(offset or 0))
        page = shipments[offset : offset + limit]
        return {
            "direction": normalized_direction,
            "status": normalized_status,
            "q": q,
            "date_from": start_at.isoformat(),
            "date_to": end_at.isoformat(),
            "total": total,
            "limit": limit,
            "offset": offset,
            "states": self.state_options(),
            "metrics": metrics,
            "items": [self.serialize_tray_item(shipment, viewer_empresa_id=empresa_id) for shipment in page],
        }

    def get_tray_summary(self, db: Session, *, empresa_id: int) -> dict:
        now = _utcnow()
        start_at = now - timedelta(days=30)
        activity_at = func.coalesce(TransferShipment.received_at, TransferShipment.sent_at, TransferShipment.created_at)
        shipments = (
            db.query(TransferShipment)
            .options(joinedload(TransferShipment.sender_empresa), joinedload(TransferShipment.receiver_empresa), joinedload(TransferShipment.items))
            .filter(TransferShipment.receiver_empresa_id == empresa_id, activity_at >= start_at, activity_at <= now)
            .order_by(activity_at.desc(), TransferShipment.id.desc())
            .all()
        )
        metrics = self._build_tray_metrics(shipments, empresa_id=empresa_id)
        active_statuses = {"enviado", "recepcionado", "bloqueado_marketplace", "listo_para_importar", "fallo_importacion"}
        active_items = [shipment for shipment in shipments if shipment.status in active_statuses]
        return {
            "direction": "entrada",
            "status": None,
            "q": None,
            "date_from": start_at.isoformat(),
            "date_to": now.isoformat(),
            "total": len(active_items),
            "limit": len(active_items) or 1,
            "offset": 0,
            "states": self.state_options(),
            "metrics": metrics,
            "items": [self.serialize_tray_item(shipment, viewer_empresa_id=empresa_id) for shipment in active_items[:20]],
        }

    def get_shipment_timeline(self, db: Session, *, shipment_id: int, empresa_id: int) -> dict:
        shipment = (
            db.query(TransferShipment)
            .options(joinedload(TransferShipment.events))
            .filter(
                TransferShipment.id == shipment_id,
                or_(TransferShipment.sender_empresa_id == empresa_id, TransferShipment.receiver_empresa_id == empresa_id),
            )
            .first()
        )
        if not shipment:
            raise TransferPolicyError("transfer_shipment_scope_forbidden", "El envio no pertenece a la empresa activa.")
        return {"shipment_id": shipment.id, "items": self.shipment_timeline(shipment)}

    def reject_shipment(self, db: Session, *, shipment_id: int, empresa_id: int, actor_user_id: int, reason: str) -> TransferShipment:
        clean_reason = (reason or "").strip()
        if len(clean_reason) < 3:
            raise TransferPolicyError("transfer_reject_reason_required", "El motivo de rechazo es obligatorio.")
        shipment = self._get_receiver_shipment(db, shipment_id=shipment_id, empresa_id=empresa_id)
        if shipment.status == "importado" or shipment.imported_at is not None:
            raise TransferPolicyError("transfer_reject_imported_forbidden", "No se puede rechazar un envio ya importado.")
        if shipment.status in {"cancelado", "expirado"}:
            raise TransferPolicyError("transfer_reject_closed_forbidden", "No se puede rechazar un envio cerrado.")
        now = _utcnow()
        shipment.status = "rechazado"
        shipment.rejected_at = now
        shipment.updated_at = now
        metadata = dict(shipment.metadata_json or {})
        metadata["reject_reason"] = clean_reason
        metadata["rejected_by_user_id"] = actor_user_id
        shipment.metadata_json = metadata
        db.add(shipment)
        self._log_audit(
            db,
            shipment_id=shipment.id,
            empresa_id=empresa_id,
            user_id=actor_user_id,
            event_type="transfer_shipment_rejected",
            payload={"shipment_id": shipment.id, "reason": clean_reason},
        )
        self._log_audit(
            db,
            shipment_id=shipment.id,
            empresa_id=shipment.sender_empresa_id,
            user_id=None,
            event_type="transfer_shipment_rejected_notification",
            payload={"shipment_id": shipment.id, "receiver_empresa_id": empresa_id, "reason": clean_reason},
        )
        db.flush()
        return shipment

    def import_shipment(self, db: Session, *, shipment_id: int, empresa_id: int, actor_user_id: int) -> dict:
        shipment = self._get_receiver_shipment(db, shipment_id=shipment_id, empresa_id=empresa_id)
        existing_result = (
            db.query(TransferImportResult)
            .filter(TransferImportResult.shipment_id == shipment.id)
            .order_by(TransferImportResult.id.desc())
            .first()
        )
        if existing_result and existing_result.status == "completed":
            return self._serialize_import_result(shipment, existing_result, idempotent=True)

        self._assert_shipment_can_import(db, shipment, empresa_id=empresa_id, actor_user_id=actor_user_id)
        if shipment.status in {"rechazado", "cancelado", "expirado"}:
            raise TransferPolicyError("transfer_import_closed_forbidden", "No se puede importar un envio cerrado.")

        item = self._primary_shipment_item(shipment)
        if item is None or not item.payload_json:
            raise TransferPolicyError("transfer_import_payload_missing", "El envio no contiene payload importable.")

        result = existing_result or TransferImportResult(
            shipment_id=shipment.id,
            receiver_empresa_id=empresa_id,
            status="pending",
            attempts_count=0,
            payload_hash=item.payload_hash,
        )
        result.attempts_count = int(result.attempts_count or 0) + 1
        db.add(result)
        db.flush()

        try:
            imported_type, imported_id = self._import_payload_copy(
                db,
                shipment=shipment,
                item=item,
                empresa_id=empresa_id,
                actor_user_id=actor_user_id,
            )
            now = _utcnow()
            result.status = "completed"
            result.imported_entity_type = imported_type
            result.imported_entity_id = imported_id
            result.payload_hash = item.payload_hash
            result.last_error = None
            result.completed_at = now
            result.metadata_json = {
                "source_shipment_id": shipment.id,
                "source_empresa_id": shipment.sender_empresa_id,
                "target_empresa_id": empresa_id,
                "source_entity_type": shipment.asset_type,
                "source_entity_id": shipment.asset_id,
                "imported_entity_type": imported_type,
                "imported_entity_id": imported_id,
                "visibility": "admins_and_superadmins",
            }
            shipment.status = "importado"
            shipment.marketplace_blocked = False
            shipment.imported_at = now
            shipment.updated_at = now
            db.add(result)
            db.add(shipment)
            db.add(item)
            db.add(
                TransferImportReference(
                    shipment_id=shipment.id,
                    import_result_id=result.id,
                    source_empresa_id=shipment.sender_empresa_id,
                    target_empresa_id=empresa_id,
                    source_entity_type=shipment.asset_type,
                    source_entity_id=shipment.asset_id,
                    target_entity_type=imported_type,
                    target_entity_id=imported_id,
                    metadata_json={"payload_hash": item.payload_hash, "contract_version": item.contract_version},
                )
            )
            self._log_audit(
                db,
                shipment_id=shipment.id,
                empresa_id=empresa_id,
                user_id=actor_user_id,
                event_type="transfer_shipment_imported",
                payload={"shipment_id": shipment.id, "imported_entity_type": imported_type, "imported_entity_id": imported_id},
            )
            self._sanitize_imported_payload(
                item,
                shipment=shipment,
                result=result,
                target_empresa_id=empresa_id,
                imported_type=imported_type,
                imported_id=imported_id,
                sanitized_at=now,
            )
            db.flush()
            return self._serialize_import_result(shipment, result, idempotent=False)
        except Exception as exc:
            result.status = "failed"
            result.last_error = str(exc)
            result.updated_at = _utcnow()
            shipment.status = "fallo_importacion"
            shipment.updated_at = _utcnow()
            db.add(result)
            db.add(shipment)
            self._log_audit(
                db,
                shipment_id=shipment.id,
                empresa_id=empresa_id,
                user_id=actor_user_id,
                event_type="transfer_shipment_import_failed",
                payload={"shipment_id": shipment.id, "error": str(exc), "attempts_count": result.attempts_count},
            )
            db.flush()
            return self._serialize_import_result(shipment, result, idempotent=False)

    def build_preflight(
        self,
        db: Session,
        *,
        sender_empresa_id: int,
        recipient_id: int,
        asset_type: str,
        asset_id: int,
        actor_user_id: int,
        description: str | None = None,
        dry_run: bool = True,
        marketplace_confirmed: bool = False,
    ) -> dict:
        self.ensure_license_enabled(db, sender_empresa_id)
        recipient = self._get_active_recipient(db, sender_empresa_id=sender_empresa_id, recipient_id=recipient_id)
        normalized_asset_type = self._normalize_asset_type(asset_type)
        snapshot = self._build_snapshot(db, sender_empresa_id=sender_empresa_id, asset_type=normalized_asset_type, asset_id=asset_id)
        default_description = str(description or snapshot["asset_name"] or "").strip()
        if not default_description:
            raise TransferPolicyError("transfer_description_required", "La descripcion del envio es obligatoria.")

        payload_hash = self._hash_payload(snapshot["payload"])
        marketplace_requirements = self._detect_marketplace_requirements(
            db,
            empresa_id=sender_empresa_id,
            asset_type=normalized_asset_type,
            asset_id=asset_id,
            payload=snapshot["payload"],
        )
        marketplace_blocked = bool(marketplace_requirements)
        blockers = list(snapshot["blockers"])
        if marketplace_blocked and not dry_run and not marketplace_confirmed:
            blockers.append("marketplace_confirmation_required")
        exportable = not blockers

        return {
            "dry_run": bool(dry_run),
            "exportable": exportable,
            "asset_type": normalized_asset_type,
            "asset_id": asset_id,
            "asset_name": snapshot["asset_name"],
            "description": default_description,
            "recipient_id": recipient.id,
            "recipient_company_display_name": self.company_display_name(recipient.recipient_empresa),
            "contract_version": snapshot["contract_version"],
            "snapshot_hash": payload_hash,
            "content_summary": snapshot["content_summary"],
            "warnings": snapshot["warnings"],
            "blockers": blockers,
            "marketplace_blocked": marketplace_blocked,
            "requires_marketplace_confirmation": marketplace_blocked,
            "marketplace_requirements": marketplace_requirements,
            "excluded_sections": list(TRANSFER_EXCLUDED_SECTIONS),
            "payload": snapshot["payload"],
            "recipient": recipient,
        }

    def create_shipment(
        self,
        db: Session,
        *,
        sender_empresa_id: int,
        recipient_id: int,
        asset_type: str,
        asset_id: int,
        actor_user_id: int,
        description: str | None = None,
        marketplace_confirmed: bool = False,
    ) -> TransferShipment:
        preflight = self.build_preflight(
            db,
            sender_empresa_id=sender_empresa_id,
            recipient_id=recipient_id,
            asset_type=asset_type,
            asset_id=asset_id,
            actor_user_id=actor_user_id,
            description=description,
            dry_run=False,
            marketplace_confirmed=marketplace_confirmed,
        )
        if not preflight["exportable"]:
            raise TransferPolicyError("transfer_preflight_blocked", "El envio no puede crearse hasta resolver los bloqueos del preflight.")

        now = _utcnow()
        recipient = preflight["recipient"]
        shipment = TransferShipment(
            sender_empresa_id=sender_empresa_id,
            receiver_empresa_id=recipient.recipient_empresa_id,
            created_by_user_id=actor_user_id,
            sent_by_user_id=actor_user_id,
            status="bloqueado_marketplace" if preflight["marketplace_blocked"] else "enviado",
            asset_type=preflight["asset_type"],
            asset_id=preflight["asset_id"],
            description=preflight["description"],
            contract_version=preflight["contract_version"],
            snapshot_hash=preflight["snapshot_hash"],
            preflight_payload={
                "content_summary": preflight["content_summary"],
                "warnings": preflight["warnings"],
                "excluded_sections": preflight["excluded_sections"],
                "marketplace_requirements_count": len(preflight["marketplace_requirements"]),
            },
            marketplace_blocked=preflight["marketplace_blocked"],
            expires_at=now + timedelta(days=60),
            created_at=now,
            sent_at=now,
            metadata_json={"source": "transfer_preflight_v1"},
        )
        db.add(shipment)
        db.flush()

        db.add(
            TransferShipmentItem(
                shipment_id=shipment.id,
                asset_type=preflight["asset_type"],
                asset_id=preflight["asset_id"],
                asset_name_snapshot=preflight["asset_name"],
                contract_version=preflight["contract_version"],
                payload_hash=preflight["snapshot_hash"],
                payload_json=preflight["payload"],
                metadata_json={"excluded_sections": preflight["excluded_sections"]},
            )
        )

        for requirement in preflight["marketplace_requirements"]:
            db.add(
                TransferMarketplaceRequirement(
                    shipment_id=shipment.id,
                    product_id=requirement.get("product_id"),
                    product_title_snapshot=requirement["product_title"],
                    status="pending_purchase",
                    required=True,
                    price_snapshot=requirement.get("price"),
                    currency=requirement.get("currency") or "USD",
                    metadata_json={"source": "preflight_marketplace_dependency"},
                )
            )

        self._log_audit(
            db,
            shipment_id=shipment.id,
            empresa_id=sender_empresa_id,
            user_id=actor_user_id,
            event_type="transfer_shipment_created",
            payload={
                "shipment_id": shipment.id,
                "receiver_empresa_id": recipient.recipient_empresa_id,
                "asset_type": preflight["asset_type"],
                "asset_id": preflight["asset_id"],
                "snapshot_hash": preflight["snapshot_hash"],
                "marketplace_blocked": preflight["marketplace_blocked"],
            },
        )
        db.flush()
        return shipment

    def cancel_shipment(
        self,
        db: Session,
        *,
        shipment_id: int,
        sender_empresa_id: int,
        actor_user_id: int,
        reason: str | None = None,
    ) -> TransferShipment:
        shipment = (
            db.query(TransferShipment)
            .filter(TransferShipment.id == shipment_id, TransferShipment.sender_empresa_id == sender_empresa_id)
            .first()
        )
        if not shipment:
            raise TransferPolicyError("transfer_shipment_not_found", "Envio no encontrado.")
        if shipment.imported_at is not None or shipment.status == "importado":
            raise TransferPolicyError("transfer_cancel_after_import_forbidden", "No se puede cancelar un envio que ya fue importado.")
        if shipment.status in {"cancelado", "rechazado", "expirado"}:
            return shipment
        shipment.status = "cancelado"
        shipment.cancelled_at = _utcnow()
        shipment.updated_at = shipment.cancelled_at
        shipment.metadata_json = {
            **dict(shipment.metadata_json or {}),
            "cancel_reason": (reason or "").strip() or None,
            "cancelled_by_user_id": actor_user_id,
        }
        db.add(shipment)
        self._log_audit(
            db,
            shipment_id=shipment.id,
            empresa_id=sender_empresa_id,
            user_id=actor_user_id,
            event_type="transfer_shipment_cancelled",
            payload={"shipment_id": shipment.id, "reason": reason},
        )
        db.flush()
        return shipment

    def evaluate_marketplace_requirements(
        self,
        db: Session,
        *,
        shipment_id: int,
        empresa_id: int,
        actor_user_id: int | None = None,
        revalidate: bool = False,
    ) -> dict:
        shipment = db.query(TransferShipment).filter(TransferShipment.id == shipment_id).first()
        if not shipment:
            raise TransferPolicyError("transfer_shipment_not_found", "Envio no encontrado.")
        if int(shipment.receiver_empresa_id) != int(empresa_id) and int(shipment.sender_empresa_id) != int(empresa_id):
            raise TransferPolicyError("transfer_shipment_scope_forbidden", "No puede consultar requisitos de este envio.")

        requirements = (
            db.query(TransferMarketplaceRequirement)
            .filter(TransferMarketplaceRequirement.shipment_id == shipment.id)
            .order_by(TransferMarketplaceRequirement.id.asc())
            .all()
        )
        rows = []
        checkout_items = []
        total_pending = Decimal("0")
        currency = "USD"

        for requirement in requirements:
            product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == requirement.product_id).first() if requirement.product_id else None
            order_item = self._find_receiver_purchase_for_requirement(
                db,
                receiver_empresa_id=shipment.receiver_empresa_id,
                product_id=requirement.product_id,
            )
            purchased = bool(order_item)
            current_price = Decimal(str(product.precio if product else requirement.price_snapshot or 0))
            row_currency = product.moneda if product else requirement.currency or "USD"
            currency = row_currency or currency

            if purchased and revalidate:
                requirement.status = "purchased"
                requirement.receiver_order_item_id = order_item.id
                requirement.updated_at = _utcnow()
                db.add(requirement)
            elif not purchased and revalidate:
                requirement.status = "pending_purchase"
                requirement.receiver_order_item_id = None
                requirement.updated_at = _utcnow()
                db.add(requirement)

            if not purchased:
                total_pending += current_price
                if requirement.product_id:
                    checkout_items.append({
                        "product_id": requirement.product_id,
                        "quantity": 1,
                        "source": "transfer_marketplace_requirement",
                        "shipment_id": shipment.id,
                        "requirement_id": requirement.id,
                    })

            rows.append({
                "requirement_id": requirement.id,
                "product_id": requirement.product_id,
                "product_title": product.titulo if product else requirement.product_title_snapshot,
                "required": True,
                "status": "purchased" if purchased else "pending_purchase",
                "purchased": purchased,
                "current_price": _json_safe(current_price),
                "currency": row_currency,
                "purchase_url": f"/marketplace/products/{requirement.product_id}" if requirement.product_id else None,
                "receiver_order_item_id": order_item.id if order_item else None,
            })

        all_required_purchased = all(row["purchased"] for row in rows)
        if revalidate and rows:
            if all_required_purchased and shipment.status == "bloqueado_marketplace":
                shipment.status = "listo_para_importar"
                shipment.marketplace_blocked = False
                shipment.updated_at = _utcnow()
                db.add(shipment)
            elif not all_required_purchased:
                shipment.status = "bloqueado_marketplace"
                shipment.marketplace_blocked = True
                shipment.updated_at = _utcnow()
                db.add(shipment)
            self._log_audit(
                db,
                shipment_id=shipment.id,
                empresa_id=empresa_id,
                user_id=actor_user_id,
                event_type="transfer_marketplace_requirements_revalidated",
                payload={
                    "shipment_id": shipment.id,
                    "all_required_purchased": all_required_purchased,
                    "pending_count": len([row for row in rows if not row["purchased"]]),
                },
            )
            db.flush()

        return {
            "shipment_id": shipment.id,
            "receiver_empresa_id": shipment.receiver_empresa_id,
            "all_required_purchased": all_required_purchased,
            "can_import_or_use": all_required_purchased,
            "total_pending_price": _json_safe(total_pending),
            "currency": currency,
            "requirements": rows,
            "checkout_items": checkout_items,
            "help_context": {
                "kind": "marketplace_required_purchase",
                "message": "Para importar o usar este envio debe adquirir todos los productos Marketplace obligatorios.",
                "action": "Comprar productos pendientes y usar Revalidar compras.",
            },
        }

    @staticmethod
    def _find_receiver_purchase_for_requirement(
        db: Session,
        *,
        receiver_empresa_id: int,
        product_id: int | None,
    ) -> MarketplaceOrderItem | None:
        if not product_id:
            return None
        return (
            db.query(MarketplaceOrderItem)
            .join(MarketplaceOrder, MarketplaceOrder.id == MarketplaceOrderItem.order_id)
            .join(Usuario, Usuario.id == MarketplaceOrder.buyer_user_id)
            .filter(
                Usuario.empresa_id == receiver_empresa_id,
                MarketplaceOrder.status == "completed",
                MarketplaceOrderItem.product_id == product_id,
            )
            .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrderItem.id.desc())
            .first()
        )

    def count_fixed_recipients(self, db: Session, empresa_id: int) -> int:
        return int(
            db.query(TransferAllowedCompanyRecipient)
            .filter(
                TransferAllowedCompanyRecipient.empresa_id == empresa_id,
                TransferAllowedCompanyRecipient.recipient_kind == "fixed",
                TransferAllowedCompanyRecipient.status == "active",
            )
            .count()
            or 0
        )

    @staticmethod
    def company_display_name(empresa: Empresa) -> str:
        return (empresa.alias or empresa.nombre or "").strip()

    @staticmethod
    def serialize_company_preview(empresa: Empresa) -> dict:
        return {
            "company_display_name": TransferenciasService.company_display_name(empresa),
            "company_name": empresa.nombre,
            "company_alias": empresa.alias,
            "status": "resolved",
        }

    @staticmethod
    def state_options() -> list[dict]:
        return [
            {
                "code": code,
                "label": TRANSFER_STATE_PRESENTATION.get(code, {}).get("label", code),
                "color": TRANSFER_STATE_PRESENTATION.get(code, {}).get("color", "neutral"),
                "recoverable": bool(TRANSFER_STATE_PRESENTATION.get(code, {}).get("recoverable", False)),
            }
            for code in TRANSFER_SHIPMENT_STATES
        ]

    def serialize_tray_item(self, shipment: TransferShipment, *, viewer_empresa_id: int) -> dict:
        sender = shipment.sender_empresa
        receiver = shipment.receiver_empresa
        direction = "entrada" if int(shipment.receiver_empresa_id) == int(viewer_empresa_id) else "salida"
        counterparty = sender if direction == "entrada" else receiver
        meta = TRANSFER_STATE_PRESENTATION.get(shipment.status, {})
        status_label, status_color = self._viewer_status_presentation(shipment.status, direction, meta)
        asset_name = None
        if shipment.items:
            first_item = sorted(shipment.items, key=lambda item: item.id or 0)[0]
            asset_name = first_item.asset_name_snapshot
        return {
            "id": shipment.id,
            "direction": direction,
            "status": shipment.status,
            "status_label": status_label,
            "status_color": status_color,
            "status_recoverable": bool(meta.get("recoverable", False)),
            "asset_type": shipment.asset_type,
            "asset_id": shipment.asset_id,
            "asset_name": asset_name,
            "description": shipment.description,
            "company_display_name": self.company_display_name(counterparty),
            "company_name": counterparty.nombre,
            "company_alias": counterparty.alias,
            "sender_company_display_name": self.company_display_name(sender),
            "sender_company_name": sender.nombre,
            "sender_company_alias": sender.alias,
            "receiver_company_display_name": self.company_display_name(receiver),
            "receiver_company_name": receiver.nombre,
            "receiver_company_alias": receiver.alias,
            "marketplace_blocked": bool(shipment.marketplace_blocked),
            "created_at": shipment.created_at.isoformat() if shipment.created_at else None,
            "sent_at": shipment.sent_at.isoformat() if shipment.sent_at else None,
            "received_at": shipment.received_at.isoformat() if shipment.received_at else None,
            "opened_at": shipment.opened_at.isoformat() if shipment.opened_at else None,
            "imported_at": shipment.imported_at.isoformat() if shipment.imported_at else None,
            "rejected_at": shipment.rejected_at.isoformat() if shipment.rejected_at else None,
            "cancelled_at": shipment.cancelled_at.isoformat() if shipment.cancelled_at else None,
            "expires_at": shipment.expires_at.isoformat() if shipment.expires_at else None,
            "timeline": self.shipment_timeline(shipment),
        }

    @staticmethod
    def _viewer_status_presentation(status_code: str, direction: str, meta: dict) -> tuple[str, str]:
        if status_code == "enviado" and direction == "entrada":
            return "Recibido", "cyan"
        return meta.get("label", status_code), meta.get("color", "neutral")

    def shipment_timeline(self, shipment: TransferShipment) -> list[dict]:
        timeline: list[dict] = []
        self._append_timeline_date(timeline, shipment.created_at, "creado", "Envio creado")
        self._append_timeline_date(timeline, shipment.sent_at, "enviado", "Envio enviado")
        self._append_timeline_date(timeline, shipment.received_at, "recepcionado", "Envio recepcionado")
        self._append_timeline_date(timeline, shipment.imported_at, "importado", "Envio importado")
        self._append_timeline_date(timeline, shipment.rejected_at, "rechazado", "Envio rechazado")
        self._append_timeline_date(timeline, shipment.cancelled_at, "cancelado", "Envio cancelado")
        if shipment.status == "expirado":
            self._append_timeline_date(timeline, shipment.expires_at, "expirado", "Envio expirado")

        for event in shipment.events or []:
            label = self._timeline_event_label(event.event_type)
            timeline.append(
                {
                    "at": event.created_at.isoformat() if event.created_at else None,
                    "type": event.event_type,
                    "type_label": label,
                    "label": label,
                    "actor_scope": event.actor_scope,
                    "message": event.message,
                    "payload": event.payload_json or {},
                }
            )
        return sorted(timeline, key=lambda item: item.get("at") or "")

    @staticmethod
    def _append_timeline_date(timeline: list[dict], value: datetime | None, event_type: str, label: str) -> None:
        if value is None:
            return
        timeline.append({"at": value.isoformat(), "type": event_type, "type_label": label, "label": label, "payload": {}})

    @staticmethod
    def _timeline_event_label(event_type: str | None) -> str:
        clean_type = str(event_type or "").strip()
        if clean_type in TRANSFER_TIMELINE_EVENT_LABELS:
            return TRANSFER_TIMELINE_EVENT_LABELS[clean_type]
        return "Evento de transferencia"

    @staticmethod
    def _normalize_tray_direction(direction: str | None) -> str:
        normalized = str(direction or "todos").strip().lower()
        if normalized in {"all", "todo", "todos"}:
            return "todos"
        if normalized in {"entrada", "inbox", "recibidos"}:
            return "entrada"
        if normalized in {"salida", "outbox", "enviados"}:
            return "salida"
        raise TransferPolicyError("transfer_tray_direction_invalid", "Direccion de bandeja no soportada.")

    @staticmethod
    def _tray_date_bounds(date_from: date | datetime | None, date_to: date | datetime | None) -> tuple[datetime, datetime]:
        now = _utcnow()
        start_value = date_from or (now - timedelta(days=30))
        end_value = date_to or now
        start_at = TransferenciasService._as_day_start(start_value)
        end_at = TransferenciasService._as_day_end(end_value)
        if start_at > end_at:
            raise TransferPolicyError("transfer_tray_date_range_invalid", "La fecha inicial no puede ser mayor que la fecha final.")
        return start_at, end_at

    @staticmethod
    def _as_day_start(value: date | datetime) -> datetime:
        if isinstance(value, datetime):
            return _as_aware(value) or _utcnow()
        return datetime(value.year, value.month, value.day, tzinfo=timezone.utc)

    @staticmethod
    def _as_day_end(value: date | datetime) -> datetime:
        if isinstance(value, datetime):
            return _as_aware(value) or _utcnow()
        return datetime(value.year, value.month, value.day, 23, 59, 59, 999999, tzinfo=timezone.utc)

    @staticmethod
    def _normalize_search(value: str | None) -> str:
        return " ".join(str(value or "").strip().lower().split())

    def _shipment_matches_search(self, shipment: TransferShipment, search_text: str) -> bool:
        haystack = [
            shipment.description,
            shipment.asset_type,
            shipment.sender_empresa.nombre if shipment.sender_empresa else None,
            shipment.sender_empresa.alias if shipment.sender_empresa else None,
            shipment.receiver_empresa.nombre if shipment.receiver_empresa else None,
            shipment.receiver_empresa.alias if shipment.receiver_empresa else None,
        ]
        haystack.extend(item.asset_name_snapshot for item in shipment.items or [])
        return search_text in " ".join(str(value or "").lower() for value in haystack)

    @staticmethod
    def _build_tray_metrics(shipments: list[TransferShipment], *, empresa_id: int) -> dict:
        active_new_statuses = {"enviado", "recepcionado", "bloqueado_marketplace", "listo_para_importar", "fallo_importacion"}
        return {
            "enviados": len([item for item in shipments if int(item.sender_empresa_id) == int(empresa_id)]),
            "recibidos": len([item for item in shipments if int(item.receiver_empresa_id) == int(empresa_id)]),
            "nuevos": len(
                [
                    item
                    for item in shipments
                    if int(item.receiver_empresa_id) == int(empresa_id)
                    and item.status in active_new_statuses
                    and item.opened_at is None
                ]
            ),
            "bloqueados": len([item for item in shipments if item.status == "bloqueado_marketplace"]),
            "listos": len([item for item in shipments if item.status == "listo_para_importar"]),
            "importados": len([item for item in shipments if item.status == "importado"]),
            "rechazados": len([item for item in shipments if item.status == "rechazado"]),
            "cancelados": len([item for item in shipments if item.status == "cancelado"]),
            "expirados": len([item for item in shipments if item.status == "expirado"]),
            "fallos_importacion": len([item for item in shipments if item.status == "fallo_importacion"]),
        }

    def _get_receiver_shipment(self, db: Session, *, shipment_id: int, empresa_id: int) -> TransferShipment:
        shipment = (
            db.query(TransferShipment)
            .options(
                joinedload(TransferShipment.sender_empresa),
                joinedload(TransferShipment.receiver_empresa),
                joinedload(TransferShipment.items),
                joinedload(TransferShipment.requirements),
                joinedload(TransferShipment.events),
            )
            .filter(TransferShipment.id == shipment_id, TransferShipment.receiver_empresa_id == empresa_id)
            .first()
        )
        if not shipment:
            raise TransferPolicyError("transfer_shipment_scope_forbidden", "El envio no pertenece a la empresa receptora activa.")
        return shipment

    def _assert_shipment_can_import(self, db: Session, shipment: TransferShipment, *, empresa_id: int, actor_user_id: int) -> None:
        expires_at = _as_aware(shipment.expires_at)
        if expires_at and expires_at < _utcnow() and shipment.status != "importado":
            shipment.status = "expirado"
            shipment.updated_at = _utcnow()
            db.add(shipment)
            db.flush()
            raise TransferPolicyError("transfer_shipment_expired", "El envio expiro y no puede importarse.")
        if shipment.status in {"cancelado", "rechazado", "expirado"}:
            raise TransferPolicyError("transfer_shipment_closed", "El envio esta cerrado.")
        if shipment.status == "bloqueado_marketplace" or shipment.marketplace_blocked:
            requirements = self.evaluate_marketplace_requirements(
                db,
                shipment_id=shipment.id,
                empresa_id=empresa_id,
                actor_user_id=actor_user_id,
                revalidate=True,
            )
            if not requirements["all_required_purchased"]:
                raise TransferPolicyError("transfer_marketplace_required", "El receptor debe adquirir todos los productos Marketplace requeridos antes de importar.")

    @staticmethod
    def _primary_shipment_item(shipment: TransferShipment) -> TransferShipmentItem | None:
        if not shipment.items:
            return None
        return sorted(shipment.items, key=lambda item: item.id or 0)[0]

    @staticmethod
    def _sanitize_imported_payload(
        item: TransferShipmentItem,
        *,
        shipment: TransferShipment,
        result: TransferImportResult,
        target_empresa_id: int,
        imported_type: str,
        imported_id: int,
        sanitized_at: datetime,
    ) -> None:
        item.payload_json = {
            "sanitized": True,
            "sanitized_at": sanitized_at.isoformat(),
            "reason": "import_completed",
            "source_shipment_id": shipment.id,
            "source_empresa_id": shipment.sender_empresa_id,
            "target_empresa_id": target_empresa_id,
            "source_entity_type": shipment.asset_type,
            "source_entity_id": shipment.asset_id,
            "imported_entity_type": imported_type,
            "imported_entity_id": imported_id,
            "import_result_id": result.id,
            "payload_hash": item.payload_hash,
            "contract_version": item.contract_version,
        }

    def _serialize_import_result(self, shipment: TransferShipment, result: TransferImportResult, *, idempotent: bool) -> dict:
        return {
            "shipment_id": shipment.id,
            "status": shipment.status,
            "import_status": result.status,
            "imported_entity_type": result.imported_entity_type,
            "imported_entity_id": result.imported_entity_id,
            "idempotent": idempotent,
            "attempts_count": int(result.attempts_count or 0),
            "last_error": result.last_error,
        }

    def _import_payload_copy(
        self,
        db: Session,
        *,
        shipment: TransferShipment,
        item: TransferShipmentItem,
        empresa_id: int,
        actor_user_id: int,
    ) -> tuple[str, int]:
        payload = item.payload_json or {}
        asset_type = self._normalize_asset_type(payload.get("asset_type") or item.asset_type)
        if asset_type == "proyecto":
            project = self._import_project_payload(db, shipment=shipment, payload=payload, empresa_id=empresa_id, actor_user_id=actor_user_id)
            return "proyecto", int(project.id)
        base = self._import_base_payload(db, shipment=shipment, payload=payload, empresa_id=empresa_id)
        return "base_trabajo", int(base.id)

    def _import_project_payload(self, db: Session, *, shipment: TransferShipment, payload: dict, empresa_id: int, actor_user_id: int) -> Proyecto:
        has_snapshot_base_graph = "base_trabajo" in payload or "apus" in payload
        if not has_snapshot_base_graph and shipment.asset_id and shipment.sender_empresa_id:
            try:
                result = classic_asset_portability_service.clone_project_to_company(
                    db,
                    source_project_id=int(shipment.asset_id),
                    source_empresa_id=int(shipment.sender_empresa_id),
                    target_empresa_id=empresa_id,
                    context="transferencias",
                    name_suffix=f"- recibido {shipment.id}",
                    code_suffix=f"TRF{shipment.id}",
                    include_schedules=False,
                    restrict_base_to_budget_apus=True,
                    metadata={
                        "shipment_id": shipment.id,
                        "source_empresa_id": shipment.sender_empresa_id,
                        "source_project_id": shipment.asset_id,
                        "actor_user_id": actor_user_id,
                    },
                )
                return result.project
            except ValueError as exc:
                if str(exc) != "classic_project_source_not_found":
                    raise TransferPolicyError(
                        "transfer_project_import_integrity_failed",
                        "No se pudo importar el proyecto conservando la relacion Base/APU/Presupuesto.",
                    ) from exc

        imported_base = None
        apu_id_map: dict[int, int] = {}
        if not payload.get("base_trabajo") or not payload.get("apus"):
            raise TransferPolicyError(
                "transfer_project_without_base_or_apus",
                "Un proyecto transferido debe incluir Base de Proyecto y APUs.",
            )
        if payload.get("base_trabajo"):
            imported_base, _, _, _, apu_id_map = self._import_base_payload_with_maps(
                db,
                shipment=shipment,
                payload=payload,
                empresa_id=empresa_id,
            )

        source = payload.get("project") or {}
        now = _utcnow()
        source_name = str(source.get("nombre") or shipment.description or "Proyecto recibido").strip()
        target = Proyecto(
            nombre=self._unique_project_name(db, empresa_id, f"{source_name} - recibido {shipment.id}"),
            codigo=self._copy_code(source.get("codigo"), shipment.id),
            codigo_root=self._copy_code(source.get("codigo_root"), shipment.id),
            revision=0,
            descripcion=source.get("descripcion"),
            estado="Planificación",
            fecha_inicio=self._parse_datetime(source.get("fecha_inicio")),
            fecha_fin_estimada=self._parse_datetime(source.get("fecha_fin_estimada")),
            presupuesto_estimado=source.get("presupuesto_estimado") or 0,
            moneda=source.get("moneda") or "USD",
            empresa_id=empresa_id,
            cliente_id=None,
            base_trabajo_id=imported_base.id if imported_base else None,
            plantillas_config={
                "transfer_import": {
                    "shipment_id": shipment.id,
                    "source_empresa_id": shipment.sender_empresa_id,
                    "source_project_id": shipment.asset_id,
                    "source_asset_type": shipment.asset_type,
                    "imported_by_user_id": actor_user_id,
                    "imported_at": now.isoformat(),
                    "visibility": "admins_and_superadmins",
                }
            },
        )
        db.add(target)
        db.flush()

        edt_id_map = self._import_project_edt_nodes(db, payload.get("edt_nodes") or [], target_project_id=target.id, empresa_id=empresa_id)
        fallback_edt_id = self._ensure_project_root_edt(db, target_project_id=target.id, empresa_id=empresa_id, edt_id_map=edt_id_map)
        self._import_project_presupuestos(
            db,
            payload.get("presupuestos") or [],
            target_project_id=target.id,
            empresa_id=empresa_id,
            edt_id_map=edt_id_map,
            fallback_edt_id=fallback_edt_id,
            apu_id_map=apu_id_map,
        )
        if imported_base:
            classic_asset_portability_service.assert_project_budget_apu_integrity(
                db,
                project_id=target.id,
                empresa_id=empresa_id,
                base_trabajo_id=imported_base.id,
            )
        db.flush()
        return target

    def _import_project_edt_nodes(self, db: Session, nodes: list[dict], *, target_project_id: int, empresa_id: int) -> dict[int, int]:
        id_map: dict[int, int] = {}
        sorted_nodes = sorted(nodes, key=lambda item: (item.get("parent_id") is not None, int(item.get("id") or 0)))
        for node in sorted_nodes:
            source_id = int(node.get("id") or 0)
            parent_id = id_map.get(int(node.get("parent_id") or 0)) if node.get("parent_id") else None
            tipo_nodo = node.get("tipo_nodo") or TipoNodoEdt.CUENTA_PAQUETE.value
            if tipo_nodo not in {item.value for item in TipoNodoEdt}:
                tipo_nodo = TipoNodoEdt.CUENTA_PAQUETE.value
            created = EdtNode(
                proyecto_id=target_project_id,
                parent_id=parent_id,
                tipo_nodo=tipo_nodo,
                orden=int(node.get("orden") or 0),
                codigo=str(node.get("codigo") or source_id or "1"),
                nombre=node.get("nombre"),
                definicion=node.get("definicion"),
                stakeholder_id=None,
                rol_id=None,
                actividades_claves=node.get("actividades_claves"),
                empresa_id=empresa_id,
            )
            db.add(created)
            db.flush()
            if source_id:
                id_map[source_id] = created.id
        return id_map

    def _ensure_project_root_edt(self, db: Session, *, target_project_id: int, empresa_id: int, edt_id_map: dict[int, int]) -> int:
        if edt_id_map:
            return next(iter(edt_id_map.values()))
        root = EdtNode(
            proyecto_id=target_project_id,
            tipo_nodo=TipoNodoEdt.CUENTA_PAQUETE.value,
            orden=0,
            codigo="1",
            nombre="Proyecto recibido",
            empresa_id=empresa_id,
        )
        db.add(root)
        db.flush()
        return root.id

    def _import_project_presupuestos(
        self,
        db: Session,
        presupuestos: list[dict],
        *,
        target_project_id: int,
        empresa_id: int,
        edt_id_map: dict[int, int],
        fallback_edt_id: int,
        apu_id_map: dict[int, int] | None = None,
    ) -> None:
        apu_id_map = apu_id_map or {}
        for source_presupuesto in presupuestos:
            presupuesto = Presupuesto(
                codigo=self._copy_code(source_presupuesto.get("codigo"), target_project_id),
                revision=int(source_presupuesto.get("revision") or 1),
                descripcion=source_presupuesto.get("descripcion") or "Presupuesto recibido",
                subtotal=source_presupuesto.get("subtotal") or 0,
                indirectos_total=source_presupuesto.get("indirectos_total") or 0,
                impuestos=source_presupuesto.get("impuestos") or 0,
                total=source_presupuesto.get("total") or 0,
                estado=source_presupuesto.get("estado") or "En Elaboración",
                moneda=source_presupuesto.get("moneda") or "USD",
                iva_aplicado=source_presupuesto.get("iva_aplicado") or 15,
                dec_moneda=int(source_presupuesto.get("dec_moneda") or 2),
                dec_calculos=int(source_presupuesto.get("dec_calculos") or 4),
                proyecto_id=target_project_id,
                empresa_id=empresa_id,
            )
            db.add(presupuesto)
            db.flush()

            detail_map: dict[int, int] = {}
            for detail in sorted(source_presupuesto.get("detalles") or [], key=lambda row: (row.get("parent_id") is not None, int(row.get("orden") or 0), int(row.get("id") or 0))):
                source_detail_id = int(detail.get("id") or 0)
                source_apu_id = int(detail.get("apu_id") or 0)
                is_package = str(detail.get("tipo") or "").upper() == "CUENTA_PAQUETE"
                if not is_package and not source_apu_id:
                    raise TransferPolicyError(
                        "transfer_project_budget_line_without_apu",
                        "Un proyecto transferido no puede importar lineas operativas sin APU.",
                    )
                mapped_apu_id = apu_id_map.get(source_apu_id) if source_apu_id else None
                if source_apu_id and not mapped_apu_id and not is_package:
                    raise TransferPolicyError(
                        "transfer_project_apu_mapping_missing",
                        "No se pudo mapear un APU del presupuesto importado.",
                    )
                created = PresupuestoDetalle(
                    presupuesto_id=presupuesto.id,
                    apu_id=mapped_apu_id,
                    parent_id=detail_map.get(int(detail.get("parent_id") or 0)) if detail.get("parent_id") else None,
                    tipo=detail.get("tipo"),
                    edt_id=edt_id_map.get(int(detail.get("edt_id") or 0), fallback_edt_id),
                    codigo_item=detail.get("codigo_item"),
                    descripcion=detail.get("descripcion") or "Linea recibida",
                    unidad=detail.get("unidad"),
                    cantidad=detail.get("cantidad") or 0,
                    precio_unitario=detail.get("precio_unitario") or 0,
                    precio_total=detail.get("precio_total") or 0,
                    orden=int(detail.get("orden") or 0),
                    omniclass_codigo=detail.get("omniclass_codigo"),
                    omniclass_titulo=detail.get("omniclass_titulo"),
                    notas=detail.get("notas"),
                    tanteo_activo=False,
                )
                db.add(created)
                db.flush()
                if source_detail_id:
                    detail_map[source_detail_id] = created.id

            for indirecto in source_presupuesto.get("indirectos") or []:
                db.add(
                    PresupuestoIndirecto(
                        presupuesto_id=presupuesto.id,
                        empresa_id=empresa_id,
                        concepto_codigo=indirecto.get("concepto_codigo") or "TRANSFER",
                        concepto_id=None,
                        categoria_codigo=indirecto.get("categoria_codigo") or "GEN",
                        nombre=indirecto.get("nombre") or "Indirecto recibido",
                        porcentaje=indirecto.get("porcentaje") or 0,
                        observaciones=indirecto.get("observaciones"),
                        fijo=bool(indirecto.get("fijo", False)),
                        usuario=bool(indirecto.get("usuario", False)),
                        custom=bool(indirecto.get("custom", False)),
                    )
                )

    def _import_base_payload(self, db: Session, *, shipment: TransferShipment, payload: dict, empresa_id: int) -> BaseTrabajo:
        base, _, _, _, _ = self._import_base_payload_with_maps(db, shipment=shipment, payload=payload, empresa_id=empresa_id)
        return base

    def _import_base_payload_with_maps(
        self,
        db: Session,
        *,
        shipment: TransferShipment,
        payload: dict,
        empresa_id: int,
    ) -> tuple[BaseTrabajo, dict[int, int], dict[int, int], dict[int, int], dict[int, int]]:
        source = payload.get("base_trabajo") or {}
        now = _utcnow()
        source_name = str(source.get("nombre") or shipment.description or "Base recibida").strip()
        base = BaseTrabajo(
            codigo_unico=self._unique_base_code(db, empresa_id, source.get("codigo_unico") or f"TRF-{shipment.id}"),
            nombre=self._unique_base_name(db, empresa_id, f"{source_name} - recibida {shipment.id}"),
            tipo=source.get("tipo") or "Base Maestra",
            descripcion=source.get("descripcion"),
            porcentaje_indirectos=source.get("porcentaje_indirectos") or 0,
            activa=False,
            tipo_rendimiento=source.get("tipo_rendimiento") or "Rendimiento Unitario",
            unidad_tiempo=source.get("unidad_tiempo") or "Horas",
            pais_id=source.get("pais_id"),
            moneda=source.get("moneda") or "USD",
            observaciones=source.get("observaciones"),
            empresa_id=empresa_id,
            source_base_id=None,
            clone_created_at=now,
            sync_mode="snapshot_locked",
        )
        db.add(base)
        db.flush()

        category_map: dict[int, int] = {}
        for category in payload.get("categorias") or []:
            created = CategoriaRecurso(
                nombre=category.get("nombre") or "Categoria recibida",
                descripcion=category.get("descripcion"),
                base_trabajo_id=base.id,
                empresa_id=empresa_id,
            )
            db.add(created)
            db.flush()
            if category.get("id"):
                category_map[int(category["id"])] = created.id

        subcategory_map: dict[int, int] = {}
        for subcategory in payload.get("subcategorias") or []:
            created = SubcategoriaItem(
                codigo=subcategory.get("codigo") or f"TRF-{subcategory.get('id') or len(subcategory_map) + 1}",
                descripcion=subcategory.get("descripcion") or "Subcategoria recibida",
                observaciones=subcategory.get("observaciones"),
                subcategoria_codigo=int(subcategory.get("subcategoria_codigo") or 1),
                orden=int(subcategory.get("orden") or 0),
                base_trabajo_id=base.id,
                empresa_id=empresa_id,
                revisado=bool(subcategory.get("revisado", True)),
                omniclass_codigo=subcategory.get("omniclass_codigo"),
                omniclass_titulo=subcategory.get("omniclass_titulo"),
            )
            db.add(created)
            db.flush()
            if subcategory.get("id"):
                subcategory_map[int(subcategory["id"])] = created.id

        unit_map: dict[int, int] = {}
        for unit in payload.get("unidades") or []:
            source_unit_id = int(unit.get("id") or 0)
            if not source_unit_id:
                continue
            existing = (
                db.query(Unidad)
                .filter(
                    Unidad.descripcion == (unit.get("descripcion") or "u"),
                    Unidad.subcategoria_codigo == int(unit.get("subcategoria_codigo") or 5),
                    Unidad.empresa_id == empresa_id,
                    Unidad.base_trabajo_id == base.id,
                )
                .first()
            )
            if existing:
                unit_map[source_unit_id] = existing.id
                continue
            created = Unidad(
                descripcion=unit.get("descripcion") or "u",
                descripcion_completa=unit.get("descripcion_completa"),
                subcategoria_codigo=int(unit.get("subcategoria_codigo") or 5),
                es_global=False,
                empresa_id=empresa_id,
                base_trabajo_id=base.id,
            )
            db.add(created)
            db.flush()
            unit_map[source_unit_id] = created.id

        resource_map: dict[int, int] = {}
        for resource in payload.get("recursos") or []:
            subcategory_id = subcategory_map.get(int(resource.get("subcategoria_item_id") or 0))
            source_unidad_id = int(resource.get("unidad_id") or 0)
            unidad_id = unit_map.get(source_unidad_id, resource.get("unidad_id"))
            if not subcategory_id or not unidad_id:
                continue
            created = Recurso(
                codigo=resource.get("codigo") or f"TRF-{resource.get('id') or len(resource_map) + 1}",
                descripcion=resource.get("descripcion") or "Recurso recibido",
                descripcion_normalizada=resource.get("descripcion_normalizada") or str(resource.get("descripcion") or "recurso recibido").lower(),
                precio=resource.get("precio") or 0,
                equipment_ownership_kind=resource.get("equipment_ownership_kind"),
                governing_resource_kind=resource.get("governing_resource_kind"),
                unidad_id=unidad_id,
                cod_cpc_id=resource.get("cod_cpc_id"),
                especificaciones=resource.get("especificaciones"),
                subcategoria_item_id=subcategory_id,
                base_trabajo_id=base.id,
                empresa_id=empresa_id,
                source_recurso_id=None,
                content_origin="transfer",
                sync_status="snapshot_locked",
                revisado=bool(resource.get("revisado", True)),
                revision=int(resource.get("revision") or 0),
                omniclass_codigo=resource.get("omniclass_codigo"),
                omniclass_titulo=resource.get("omniclass_titulo"),
            )
            db.add(created)
            db.flush()
            if resource.get("id"):
                resource_map[int(resource["id"])] = created.id

        apu_map: dict[int, int] = {}
        for apu in payload.get("apus") or []:
            subcategory_id = subcategory_map.get(int(apu.get("subcategoria_item_id") or 0))
            created = APU(
                codigo=apu.get("codigo") or f"TRF-{apu.get('id') or len(apu_map) + 1}",
                descripcion=apu.get("descripcion") or "APU recibido",
                descripcion_normalizada=apu.get("descripcion_normalizada") or str(apu.get("descripcion") or "apu recibido").lower(),
                unidad=apu.get("unidad") or "u",
                rendimiento_estandar=apu.get("rendimiento_estandar") or 1,
                costo_directo=apu.get("costo_directo") or 0,
                costo_indirecto=apu.get("costo_indirecto") or 0,
                precio_unitario_total=apu.get("precio_unitario_total") or 0,
                moneda=apu.get("moneda") or "USD",
                estado_revision=apu.get("estado_revision") or "Borrador",
                revision=int(apu.get("revision") or 0),
                categoria_id=category_map.get(int(apu.get("categoria_id") or 0)),
                subcategoria_item_id=subcategory_id,
                empresa_id=empresa_id,
                base_trabajo_id=base.id,
                source_apu_id=None,
                content_origin="transfer",
                sync_status="snapshot_locked",
                omniclass_codigo=apu.get("omniclass_codigo"),
                omniclass_titulo=apu.get("omniclass_titulo"),
            )
            db.add(created)
            db.flush()
            if apu.get("id"):
                apu_map[int(apu["id"])] = created.id

        for apu in payload.get("apus") or []:
            parent_apu_id = apu_map.get(int(apu.get("id") or 0))
            if not parent_apu_id:
                continue
            for line in apu.get("lineas") or []:
                db.add(
                    APULinea(
                        apu_id=parent_apu_id,
                        recurso_id=resource_map.get(int(line.get("recurso_id") or 0)),
                        apu_hijo_id=apu_map.get(int(line.get("apu_hijo_id") or 0)),
                        cantidad=line.get("cantidad") or 0,
                        rendimiento=line.get("rendimiento"),
                        orden=int(line.get("orden") or 0),
                        precio_congelado=line.get("precio_congelado"),
                        subtotal=line.get("subtotal"),
                    )
                )

        base.snapshot_subcategories_count = len(subcategory_map)
        base.snapshot_resources_count = len(resource_map)
        base.snapshot_apus_count = len(apu_map)
        db.add(base)
        db.flush()
        return base, category_map, subcategory_map, resource_map, apu_map

    @staticmethod
    def _parse_datetime(value) -> datetime | None:
        if not value:
            return None
        if isinstance(value, datetime):
            return value
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None

    @staticmethod
    def _copy_code(value, suffix: int) -> str | None:
        if not value:
            return None
        clean = str(value).strip()
        if not clean:
            return None
        return f"{clean}-TRF{suffix}"[:50]

    def _unique_project_name(self, db: Session, empresa_id: int, base_name: str) -> str:
        return self._unique_text_value(db, Proyecto.nombre, Proyecto.empresa_id, empresa_id, base_name, max_length=255)

    def _unique_base_name(self, db: Session, empresa_id: int, base_name: str) -> str:
        return self._unique_text_value(db, BaseTrabajo.nombre, BaseTrabajo.empresa_id, empresa_id, base_name, max_length=255)

    def _unique_base_code(self, db: Session, empresa_id: int, base_code: str) -> str:
        clean = f"{str(base_code or 'TRF').strip()}-TRF{empresa_id}"[:90]
        return self._unique_text_value(db, BaseTrabajo.codigo_unico, BaseTrabajo.empresa_id, empresa_id, clean, max_length=100)

    @staticmethod
    def _unique_text_value(db: Session, column, scope_column, scope_value: int, base_value: str, *, max_length: int) -> str:
        clean = str(base_value or "Recibido").strip()[:max_length]
        candidate = clean
        index = 2
        while db.query(column).filter(scope_column == scope_value, column == candidate).first():
            suffix = f" ({index})"
            candidate = f"{clean[: max_length - len(suffix)]}{suffix}"
            index += 1
        return candidate

    def _normalize_asset_type(self, asset_type: str) -> str:
        normalized = str(asset_type or "").strip().lower()
        if normalized not in {"proyecto", "base_trabajo"}:
            raise TransferPolicyError("transfer_asset_type_invalid", "Tipo de activo no soportado para transferencia.")
        return normalized

    def _get_active_recipient(self, db: Session, *, sender_empresa_id: int, recipient_id: int) -> TransferAllowedCompanyRecipient:
        now = _utcnow()
        recipient = (
            db.query(TransferAllowedCompanyRecipient)
            .options(joinedload(TransferAllowedCompanyRecipient.recipient_empresa))
            .filter(
                TransferAllowedCompanyRecipient.id == recipient_id,
                TransferAllowedCompanyRecipient.empresa_id == sender_empresa_id,
                TransferAllowedCompanyRecipient.status == "active",
            )
            .filter(
                (TransferAllowedCompanyRecipient.expires_at == None)
                | (TransferAllowedCompanyRecipient.expires_at >= now)
            )
            .first()
        )
        if not recipient:
            raise TransferPolicyError("transfer_recipient_not_found", "Empresa destinataria no habilitada para envios.")
        return recipient

    def _build_snapshot(self, db: Session, *, sender_empresa_id: int, asset_type: str, asset_id: int) -> dict:
        if asset_type == "proyecto":
            return self._build_project_snapshot(db, empresa_id=sender_empresa_id, project_id=asset_id)
        return self._build_base_snapshot(db, empresa_id=sender_empresa_id, base_id=asset_id)

    def _build_project_snapshot(self, db: Session, *, empresa_id: int, project_id: int) -> dict:
        project = db.query(Proyecto).filter(Proyecto.id == project_id, Proyecto.empresa_id == empresa_id).first()
        if not project:
            raise TransferPolicyError("transfer_asset_not_found", "Proyecto no encontrado para la empresa activa.")

        edt_nodes = (
            db.query(EdtNode)
            .filter(EdtNode.proyecto_id == project.id, EdtNode.empresa_id == empresa_id)
            .order_by(EdtNode.parent_id.asc().nullsfirst(), EdtNode.orden.asc(), EdtNode.id.asc())
            .all()
        )
        presupuestos = (
            db.query(Presupuesto)
            .filter(Presupuesto.proyecto_id == project.id, Presupuesto.empresa_id == empresa_id)
            .order_by(Presupuesto.id.asc())
            .all()
        )
        blockers = []
        if not edt_nodes:
            blockers.append("project_without_edt")
        if not presupuestos:
            blockers.append("project_without_budget")
        if not project.base_trabajo_id:
            blockers.append("project_without_base_trabajo")

        presupuesto_payload = []
        has_operational_detail = False
        has_budget_apu_link = False
        budget_apu_ids: set[int] = set()
        for presupuesto in presupuestos:
            detalles = (
                db.query(PresupuestoDetalle)
                .filter(PresupuestoDetalle.presupuesto_id == presupuesto.id)
                .order_by(PresupuestoDetalle.parent_id.asc().nullsfirst(), PresupuestoDetalle.orden.asc(), PresupuestoDetalle.id.asc())
                .all()
            )
            indirectos = (
                db.query(PresupuestoIndirecto)
                .filter(PresupuestoIndirecto.presupuesto_id == presupuesto.id, PresupuestoIndirecto.empresa_id == empresa_id)
                .order_by(PresupuestoIndirecto.id.asc())
                .all()
            )
            for detail in detalles:
                if str(detail.tipo or "").upper() == "CUENTA_PAQUETE":
                    continue
                has_operational_detail = True
                if detail.apu_id:
                    has_budget_apu_link = True
                    budget_apu_ids.add(int(detail.apu_id))
                else:
                    blockers.append("project_budget_line_without_apu")
            presupuesto_payload.append({
                "id": presupuesto.id,
                "codigo": presupuesto.codigo,
                "revision": presupuesto.revision,
                "descripcion": presupuesto.descripcion,
                "subtotal": _json_safe(presupuesto.subtotal),
                "indirectos_total": _json_safe(presupuesto.indirectos_total),
                "impuestos": _json_safe(presupuesto.impuestos),
                "total": _json_safe(presupuesto.total),
                "estado": presupuesto.estado,
                "moneda": presupuesto.moneda,
                "iva_aplicado": _json_safe(presupuesto.iva_aplicado),
                "dec_moneda": presupuesto.dec_moneda,
                "dec_calculos": presupuesto.dec_calculos,
                "detalles": [
                    {
                        "id": item.id,
                        "parent_id": item.parent_id,
                        "edt_id": item.edt_id,
                        "apu_id": item.apu_id,
                        "tipo": item.tipo,
                        "codigo_item": item.codigo_item,
                        "descripcion": item.descripcion,
                        "unidad": item.unidad,
                        "cantidad": _json_safe(item.cantidad),
                        "precio_unitario": _json_safe(item.precio_unitario),
                        "precio_total": _json_safe(item.precio_total),
                        "orden": item.orden,
                        "omniclass_codigo": item.omniclass_codigo,
                        "omniclass_titulo": item.omniclass_titulo,
                    }
                    for item in detalles
                ],
                "indirectos": [
                    {
                        "id": item.id,
                        "concepto_codigo": item.concepto_codigo,
                        "concepto_id": item.concepto_id,
                        "categoria_codigo": item.categoria_codigo,
                        "nombre": item.nombre,
                        "porcentaje": _json_safe(item.porcentaje),
                        "observaciones": item.observaciones,
                        "fijo": item.fijo,
                        "usuario": item.usuario,
                        "custom": item.custom,
                    }
                    for item in indirectos
                ],
            })

        payload = {
            "contract_version": "transfer-v1",
            "asset_type": "proyecto",
            "project": {
                "id": project.id,
                "nombre": project.nombre,
                "codigo": project.codigo,
                "codigo_root": project.codigo_root,
                "revision": project.revision,
                "descripcion": project.descripcion,
                "estado": project.estado,
                "fecha_inicio": _json_safe(project.fecha_inicio),
                "fecha_fin_estimada": _json_safe(project.fecha_fin_estimada),
                "presupuesto_estimado": _json_safe(project.presupuesto_estimado),
                "moneda": project.moneda,
                "base_trabajo_id": project.base_trabajo_id,
                "plantillas_config": project.plantillas_config,
            },
            "edt_nodes": [
                {
                    "id": item.id,
                    "parent_id": item.parent_id,
                    "tipo_nodo": str(item.tipo_nodo.value if hasattr(item.tipo_nodo, "value") else item.tipo_nodo),
                    "orden": item.orden,
                    "codigo": item.codigo,
                    "nombre": item.nombre,
                    "definicion": item.definicion,
                    "stakeholder_id": item.stakeholder_id,
                    "rol_id": item.rol_id,
                    "actividades_claves": item.actividades_claves,
                }
                for item in edt_nodes
            ],
            "presupuestos": presupuesto_payload,
        }
        base_snapshot = None
        if project.base_trabajo_id:
            base_snapshot = self._build_base_snapshot(
                db,
                empresa_id=empresa_id,
                base_id=project.base_trabajo_id,
                apu_scope_ids=budget_apu_ids,
            )
            for key in ("base_trabajo", "categorias", "subcategorias", "unidades", "recursos", "apus"):
                if key in base_snapshot["payload"]:
                    payload[key] = base_snapshot["payload"][key]
            if int((base_snapshot.get("content_summary") or {}).get("apus") or 0) <= 0:
                blockers.append("project_without_apus")
        if not has_operational_detail:
            blockers.append("project_budget_without_operational_detail")
        if not has_budget_apu_link:
            blockers.append("project_budget_without_apu")
        if budget_apu_ids and project.base_trabajo_id:
            apus_in_scope = {
                int(item.id)
                for item in db.query(APU)
                .filter(
                    APU.id.in_(budget_apu_ids),
                    APU.empresa_id == empresa_id,
                    APU.base_trabajo_id == project.base_trabajo_id,
                )
                .all()
            }
            if apus_in_scope != budget_apu_ids:
                blockers.append("project_budget_apu_out_of_scope")
        blockers = list(dict.fromkeys(blockers))
        return {
            "contract_version": "transfer-v1",
            "asset_name": project.nombre,
            "payload": payload,
            "blockers": blockers,
            "warnings": [],
            "content_summary": {
                "project": 1,
                "edt_nodes": len(edt_nodes),
                "presupuestos": len(presupuestos),
                "presupuesto_detalles": sum(len(item["detalles"]) for item in presupuesto_payload),
                "presupuesto_indirectos": sum(len(item["indirectos"]) for item in presupuesto_payload),
                "base_trabajo": 1 if base_snapshot else 0,
                "categorias": (base_snapshot or {}).get("content_summary", {}).get("categorias", 0),
                "subcategorias": (base_snapshot or {}).get("content_summary", {}).get("subcategorias", 0),
                "unidades": (base_snapshot or {}).get("content_summary", {}).get("unidades", 0),
                "recursos": (base_snapshot or {}).get("content_summary", {}).get("recursos", 0),
                "apus": (base_snapshot or {}).get("content_summary", {}).get("apus", 0),
                "apu_lineas": (base_snapshot or {}).get("content_summary", {}).get("apu_lineas", 0),
                "excluded_sections": list(TRANSFER_EXCLUDED_SECTIONS),
            },
        }

    def _build_base_snapshot(self, db: Session, *, empresa_id: int, base_id: int, apu_scope_ids: set[int] | None = None) -> dict:
        base = db.query(BaseTrabajo).filter(BaseTrabajo.id == base_id, BaseTrabajo.empresa_id == empresa_id).first()
        if not base:
            raise TransferPolicyError("transfer_asset_not_found", "Base de Trabajo no encontrada para la empresa activa.")

        if apu_scope_ids is None:
            categorias = (
                db.query(CategoriaRecurso)
                .filter((CategoriaRecurso.empresa_id == empresa_id) | (CategoriaRecurso.base_trabajo_id == base.id))
                .order_by(CategoriaRecurso.id.asc())
                .all()
            )
            subcategorias = (
                db.query(SubcategoriaItem)
                .filter(SubcategoriaItem.base_trabajo_id == base.id, SubcategoriaItem.empresa_id == empresa_id)
                .order_by(SubcategoriaItem.subcategoria_codigo.asc(), SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc())
                .all()
            )
            recursos = (
                db.query(Recurso)
                .filter(Recurso.base_trabajo_id == base.id, Recurso.empresa_id == empresa_id)
                .order_by(Recurso.codigo.asc(), Recurso.id.asc())
                .all()
            )
            apus = (
                db.query(APU)
                .filter(APU.base_trabajo_id == base.id, APU.empresa_id == empresa_id)
                .order_by(APU.codigo.asc(), APU.id.asc())
                .all()
            )
        else:
            scope = classic_asset_portability_service.collect_base_dependency_scope(
                db,
                empresa_id=empresa_id,
                base_id=base.id,
                root_apu_ids=apu_scope_ids,
            )
            categorias = (
                db.query(CategoriaRecurso)
                .filter(CategoriaRecurso.id.in_(scope.category_ids))
                .order_by(CategoriaRecurso.id.asc())
                .all()
                if scope.category_ids
                else []
            )
            subcategorias = (
                db.query(SubcategoriaItem)
                .filter(
                    SubcategoriaItem.id.in_(scope.subcategory_ids),
                    SubcategoriaItem.base_trabajo_id == base.id,
                    SubcategoriaItem.empresa_id == empresa_id,
                )
                .order_by(SubcategoriaItem.subcategoria_codigo.asc(), SubcategoriaItem.orden.asc(), SubcategoriaItem.id.asc())
                .all()
                if scope.subcategory_ids
                else []
            )
            recursos = (
                db.query(Recurso)
                .filter(Recurso.id.in_(scope.resource_ids), Recurso.base_trabajo_id == base.id, Recurso.empresa_id == empresa_id)
                .order_by(Recurso.codigo.asc(), Recurso.id.asc())
                .all()
                if scope.resource_ids
                else []
            )
            apus = (
                db.query(APU)
                .filter(APU.id.in_(scope.apu_ids), APU.base_trabajo_id == base.id, APU.empresa_id == empresa_id)
                .order_by(APU.codigo.asc(), APU.id.asc())
                .all()
                if scope.apu_ids
                else []
            )
        apu_ids = [apu.id for apu in apus]
        apu_lineas = (
            db.query(APULinea)
            .filter(APULinea.apu_id.in_(apu_ids))
            .order_by(APULinea.apu_id.asc(), APULinea.orden.asc(), APULinea.id.asc())
            .all()
            if apu_ids
            else []
        )
        unit_ids = {int(item.unidad_id) for item in recursos if item.unidad_id}
        unidades = (
            db.query(Unidad)
            .filter(Unidad.id.in_(unit_ids))
            .order_by(Unidad.id.asc())
            .all()
            if unit_ids
            else []
        )
        lineas_by_apu: dict[int, list[APULinea]] = {}
        for line in apu_lineas:
            lineas_by_apu.setdefault(int(line.apu_id), []).append(line)

        payload = {
            "contract_version": "transfer-v1",
            "asset_type": "base_trabajo",
            "base_trabajo": {
                "id": base.id,
                "codigo_unico": base.codigo_unico,
                "nombre": base.nombre,
                "tipo": base.tipo,
                "descripcion": base.descripcion,
                "porcentaje_indirectos": _json_safe(base.porcentaje_indirectos),
                "activa": base.activa,
                "tipo_rendimiento": base.tipo_rendimiento,
                "unidad_tiempo": base.unidad_tiempo,
                "pais_id": base.pais_id,
                "moneda": base.moneda,
                "observaciones": base.observaciones,
                "sync_mode": base.sync_mode,
            },
            "categorias": [
                {
                    "id": item.id,
                    "nombre": item.nombre,
                    "descripcion": item.descripcion,
                    "base_trabajo_id": item.base_trabajo_id,
                }
                for item in categorias
            ],
            "subcategorias": [
                {
                    "id": item.id,
                    "codigo": item.codigo,
                    "descripcion": item.descripcion,
                    "observaciones": item.observaciones,
                    "subcategoria_codigo": item.subcategoria_codigo,
                    "orden": item.orden,
                    "revisado": item.revisado,
                    "omniclass_codigo": item.omniclass_codigo,
                    "omniclass_titulo": item.omniclass_titulo,
                }
                for item in subcategorias
            ],
            "unidades": [
                {
                    "id": item.id,
                    "descripcion": item.descripcion,
                    "descripcion_completa": item.descripcion_completa,
                    "subcategoria_codigo": item.subcategoria_codigo,
                    "es_global": item.es_global,
                    "empresa_id": item.empresa_id,
                    "base_trabajo_id": item.base_trabajo_id,
                }
                for item in unidades
            ],
            "recursos": [
                {
                    "id": item.id,
                    "codigo": item.codigo,
                    "descripcion": item.descripcion,
                    "descripcion_normalizada": item.descripcion_normalizada,
                    "precio": _json_safe(item.precio),
                    "equipment_ownership_kind": item.equipment_ownership_kind,
                    "governing_resource_kind": item.governing_resource_kind,
                    "unidad_id": item.unidad_id,
                    "cod_cpc_id": item.cod_cpc_id,
                    "especificaciones": item.especificaciones,
                    "subcategoria_item_id": item.subcategoria_item_id,
                    "content_origin": item.content_origin,
                    "sync_status": item.sync_status,
                    "revisado": item.revisado,
                    "revision": item.revision,
                    "omniclass_codigo": item.omniclass_codigo,
                    "omniclass_titulo": item.omniclass_titulo,
                }
                for item in recursos
            ],
            "apus": [
                {
                    "id": item.id,
                    "codigo": item.codigo,
                    "descripcion": item.descripcion,
                    "descripcion_normalizada": item.descripcion_normalizada,
                    "unidad": item.unidad,
                    "rendimiento_estandar": _json_safe(item.rendimiento_estandar),
                    "costo_directo": _json_safe(item.costo_directo),
                    "costo_indirecto": _json_safe(item.costo_indirecto),
                    "precio_unitario_total": _json_safe(item.precio_unitario_total),
                    "moneda": item.moneda,
                    "estado_revision": item.estado_revision,
                    "revision": item.revision,
                    "categoria_id": item.categoria_id,
                    "subcategoria_item_id": item.subcategoria_item_id,
                    "content_origin": item.content_origin,
                    "sync_status": item.sync_status,
                    "omniclass_codigo": item.omniclass_codigo,
                    "omniclass_titulo": item.omniclass_titulo,
                    "lineas": [
                        {
                            "id": line.id,
                            "recurso_id": line.recurso_id,
                            "apu_hijo_id": line.apu_hijo_id,
                            "cantidad": _json_safe(line.cantidad),
                            "rendimiento": _json_safe(line.rendimiento),
                            "orden": line.orden,
                            "precio_congelado": _json_safe(line.precio_congelado),
                            "subtotal": _json_safe(line.subtotal),
                        }
                        for line in lineas_by_apu.get(int(item.id), [])
                    ],
                }
                for item in apus
            ],
        }
        return {
            "contract_version": "transfer-v1",
            "asset_name": base.nombre,
            "payload": payload,
            "blockers": [],
            "warnings": [],
            "content_summary": {
                "base_trabajo": 1,
                "categorias": len(categorias),
                "subcategorias": len(subcategorias),
                "unidades": len(unidades),
                "recursos": len(recursos),
                "apus": len(apus),
                "apu_lineas": len(apu_lineas),
                "excluded_sections": list(TRANSFER_EXCLUDED_SECTIONS),
            },
        }

    def _detect_marketplace_requirements(
        self,
        db: Session,
        *,
        empresa_id: int,
        asset_type: str,
        asset_id: int,
        payload: dict,
    ) -> list[dict]:
        requirements: list[dict] = []
        origin = (
            db.query(MarketplaceAssetOrigin)
            .filter(
                MarketplaceAssetOrigin.empresa_id == empresa_id,
                MarketplaceAssetOrigin.entity_type == asset_type,
                MarketplaceAssetOrigin.entity_id == asset_id,
                MarketplaceAssetOrigin.ownership_kind == "acquired",
            )
            .order_by(MarketplaceAssetOrigin.id.desc())
            .first()
        )
        if origin:
            product = None
            if origin.marketplace_product_id:
                product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == origin.marketplace_product_id).first()
            requirements.append(self._marketplace_requirement_from_product(product, fallback_title=origin.origin_label or "Producto Marketplace requerido"))

        if asset_type == "proyecto":
            project_config = ((payload.get("project") or {}).get("plantillas_config") or {})
            flags = project_config.get("marketplace_flags") if isinstance(project_config, dict) else None
            if isinstance(flags, dict) and (flags.get("acquired") or flags.get("purchase_bound")) and not requirements:
                requirements.append(self._marketplace_requirement_from_product(None, fallback_title="Producto Marketplace requerido"))

        seen = set()
        deduped = []
        for item in requirements:
            key = (item.get("product_id"), item.get("product_title"))
            if key in seen:
                continue
            seen.add(key)
            deduped.append(item)
        return deduped

    @staticmethod
    def _marketplace_requirement_from_product(product: MarketplaceProduct | None, *, fallback_title: str) -> dict:
        return {
            "product_id": product.id if product else None,
            "product_title": product.titulo if product else fallback_title,
            "status": "pending_purchase",
            "required": True,
            "currency": product.moneda if product else "USD",
            "price": _json_safe(product.precio) if product else None,
        }

    @staticmethod
    def _hash_payload(payload: dict) -> str:
        canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=_json_safe, separators=(",", ":"))
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def _get_current_license_assignment(self, db: Session, empresa_id: int) -> EmpresaLicencia | None:
        today = date.today()
        assignment = (
            db.query(EmpresaLicencia)
            .options(joinedload(EmpresaLicencia.licencia))
            .filter(
                EmpresaLicencia.empresa_id == empresa_id,
                EmpresaLicencia.activa == True,
                EmpresaLicencia.status == "active",
                EmpresaLicencia.starts_at <= today,
            )
            .filter((EmpresaLicencia.ends_at == None) | (EmpresaLicencia.ends_at >= today))
            .order_by(EmpresaLicencia.starts_at.desc(), EmpresaLicencia.id.desc())
            .first()
        )
        if assignment and assignment.licencia:
            return assignment
        if assignment:
            assignment.licencia = db.query(Licencia).filter(Licencia.id == assignment.licencia_id).first()
        return assignment

    def _next_available_extra_pack(self, db: Session, empresa_id: int) -> TransferExtraRecipientPack | None:
        now = _utcnow()
        return (
            db.query(TransferExtraRecipientPack)
            .filter(
                TransferExtraRecipientPack.empresa_id == empresa_id,
                TransferExtraRecipientPack.status == "active",
                TransferExtraRecipientPack.expires_at > now,
                TransferExtraRecipientPack.slots_used < TransferExtraRecipientPack.slots_total,
            )
            .order_by(TransferExtraRecipientPack.expires_at.asc(), TransferExtraRecipientPack.id.asc())
            .first()
        )

    def _get_guard(self, db: Session, empresa_id: int) -> TransferCodeAttemptGuard:
        guard = (
            db.query(TransferCodeAttemptGuard)
            .filter(TransferCodeAttemptGuard.empresa_id == empresa_id)
            .order_by(TransferCodeAttemptGuard.id.desc())
            .first()
        )
        if guard:
            return guard
        guard = TransferCodeAttemptGuard(empresa_id=empresa_id, consecutive_failures=0, window_failures=0)
        db.add(guard)
        db.flush()
        return guard

    def _assert_code_attempt_allowed(self, db: Session, empresa_id: int) -> None:
        guard = self._get_guard(db, empresa_id)
        now = _utcnow()
        paused_until = _as_aware(guard.paused_until)
        banned_until = _as_aware(guard.banned_until)
        if banned_until and banned_until > now:
            raise TransferPolicyError("transfer_code_banned", "La empresa esta bloqueada temporalmente para validar codigos.")
        if paused_until and paused_until > now:
            raise TransferPolicyError("transfer_code_paused", "Debe esperar antes de intentar validar otro codigo.")

    def _record_code_failure(self, db: Session, empresa_id: int, *, attempted_code: str, actor_user_id: int | None) -> None:
        guard = self._get_guard(db, empresa_id)
        now = _utcnow()
        window_started_at = _as_aware(guard.window_started_at)
        if window_started_at is None or now - window_started_at > timedelta(hours=CODE_FAILURE_WINDOW_HOURS):
            guard.window_started_at = now
            guard.window_failures = 0
        guard.consecutive_failures = int(guard.consecutive_failures or 0) + 1
        guard.window_failures = int(guard.window_failures or 0) + 1
        guard.last_attempt_at = now
        guard.attempted_code = attempted_code[:9]

        event_type = "transfer_code_validation_failed"
        if guard.consecutive_failures >= CODE_FAILURES_BEFORE_PAUSE:
            guard.paused_until = now + timedelta(minutes=CODE_FAILURE_PAUSE_MINUTES)
            event_type = "transfer_code_validation_paused"
        if guard.window_failures >= CODE_FAILURES_BEFORE_BAN:
            guard.banned_until = now + timedelta(days=CODE_FAILURE_BAN_DAYS)
            event_type = "transfer_code_validation_banned"

        db.add(guard)
        self._log_audit(
            db,
            empresa_id=empresa_id,
            user_id=actor_user_id,
            event_type=event_type,
            payload={
                "attempted_code": attempted_code[:9],
                "consecutive_failures": guard.consecutive_failures,
                "window_failures": guard.window_failures,
                "paused_until": guard.paused_until.isoformat() if guard.paused_until else None,
                "banned_until": guard.banned_until.isoformat() if guard.banned_until else None,
            },
        )
        db.flush()

    def _record_code_success(self, db: Session, empresa_id: int, *, attempted_code: str, actor_user_id: int | None) -> None:
        guard = self._get_guard(db, empresa_id)
        guard.consecutive_failures = 0
        guard.last_attempt_at = _utcnow()
        guard.attempted_code = attempted_code[:9]
        db.add(guard)
        self._log_audit(
            db,
            empresa_id=empresa_id,
            user_id=actor_user_id,
            event_type="transfer_code_validation_resolved",
            payload={"attempted_code": attempted_code[:9]},
        )
        db.flush()

    @staticmethod
    def _log_audit(
        db: Session,
        *,
        shipment_id: int | None = None,
        empresa_id: int,
        user_id: int | None,
        event_type: str,
        payload: dict,
    ) -> None:
        db.add(
            TransferAuditEvent(
                shipment_id=shipment_id,
                empresa_id=empresa_id,
                user_id=user_id,
                event_type=event_type,
                actor_scope="company_admin",
                payload_json=payload,
            )
        )


transferencias_service = TransferenciasService()
