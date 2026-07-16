from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.license_event import LicenseEvent
from app.models.saas_conecta import SaasConectaSlot
from app.models.usuario import Usuario
from app.services.commercial_capabilities import commercial_capabilities_service


ACTIVE_CONECTA_STATUSES = ("active", "pending")
PACK_CONECTA_INCLUDED_SLOTS = 1
REASSIGNMENT_LOCK_DAYS = 30


@dataclass
class ConectaPolicyError(ValueError):
    code: str
    message: str

    def __str__(self) -> str:
        return self.message


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SaasConectaService:
    def resolve_company_conecta_limits(self, db: Session, empresa_id: int) -> dict:
        state = commercial_capabilities_service.resolve_company_capabilities(db, empresa_id)
        limits = dict(state.get("limits") or {})
        effective_right_codes = set(state.get("effective_right_codes") or [])
        included_right_codes = set(state.get("included_right_codes") or [])
        purchased_right_codes = set(state.get("purchased_right_codes") or [])

        base_slots = int(limits.get("conecta_base_slots") or 0)
        pack_slots = PACK_CONECTA_INCLUDED_SLOTS if "PACK_CONECTA" in purchased_right_codes else 0
        included_pack_unlock = bool("PACK_CONECTA" in included_right_codes and base_slots <= 0)
        total_slots = base_slots + pack_slots + (PACK_CONECTA_INCLUDED_SLOTS if included_pack_unlock else 0)

        used_slots = (
            db.query(SaasConectaSlot)
            .filter(
                SaasConectaSlot.empresa_id == empresa_id,
                SaasConectaSlot.status.in_(ACTIVE_CONECTA_STATUSES),
            )
            .count()
        )

        return {
            "empresa_id": empresa_id,
            "enabled": total_slots > 0 or "PACK_CONECTA" in effective_right_codes,
            "base_slots": base_slots,
            "pack_slots": pack_slots,
            "total_slots": total_slots,
            "used_slots": int(used_slots or 0),
            "available_slots": max(0, int(total_slots or 0) - int(used_slots or 0)),
            "effective_right_codes": sorted(effective_right_codes),
            "source": "commercial_capabilities",
        }

    def list_company_slots(self, db: Session, empresa_id: int) -> list[SaasConectaSlot]:
        return (
            db.query(SaasConectaSlot)
            .filter(SaasConectaSlot.empresa_id == empresa_id)
            .order_by(SaasConectaSlot.assigned_at.desc(), SaasConectaSlot.id.desc())
            .all()
        )

    def assign_slot(
        self,
        db: Session,
        *,
        empresa_id: int,
        owner_user_id: int,
        connected_user_id: int | None = None,
        invited_email: str | None = None,
        actor_user_id: int | None = None,
        source_right_code: str | None = None,
        assigned_at: datetime | None = None,
        metadata: dict | None = None,
    ) -> SaasConectaSlot:
        assigned_at = assigned_at or _utcnow()
        invited_email = (invited_email or "").strip().lower() or None
        if connected_user_id is None and not invited_email:
            raise ConectaPolicyError("conecta_target_required", "Debe indicar un usuario conectado o un email de invitacion.")
        if connected_user_id is not None and int(connected_user_id) == int(owner_user_id):
            raise ConectaPolicyError("conecta_self_assignment", "No se puede asignar un cupo Conecta al mismo usuario titular.")

        owner = self._get_owner_user(db, empresa_id=empresa_id, owner_user_id=owner_user_id)
        connected_user = self._get_connected_user(db, connected_user_id) if connected_user_id is not None else None
        limits = self.resolve_company_conecta_limits(db, empresa_id)
        if limits["total_slots"] <= 0:
            raise ConectaPolicyError("no_conecta_slots", "La empresa no tiene cupos Conecta disponibles en su licencia o productos SaaS.")
        if limits["available_slots"] <= 0:
            raise ConectaPolicyError("conecta_slots_exhausted", "La empresa ya consumio todos sus cupos Conecta activos.")

        slot = SaasConectaSlot(
            empresa_id=empresa_id,
            owner_user_id=owner.id,
            connected_user_id=connected_user.id if connected_user else None,
            invited_email=invited_email,
            status="active",
            source_right_code=source_right_code or self._resolve_default_source_right_code(limits),
            assigned_at=assigned_at,
            last_reassignment_at=assigned_at,
            metadata_json=metadata or None,
        )
        db.add(slot)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_conecta_slot_assigned",
            payload={
                "slot_id": slot.id,
                "owner_user_id": owner.id,
                "connected_user_id": connected_user.id if connected_user else None,
                "invited_email": invited_email,
                "source_right_code": slot.source_right_code,
                "total_slots": limits["total_slots"],
            },
        )
        db.flush()
        return slot

    def release_slot(
        self,
        db: Session,
        *,
        slot_id: int,
        empresa_id: int,
        actor_user_id: int | None = None,
        actor_is_superadmin: bool = False,
        force: bool = False,
        reason: str | None = None,
        released_at: datetime | None = None,
    ) -> SaasConectaSlot:
        released_at = released_at or _utcnow()
        slot = self._get_company_slot(db, empresa_id=empresa_id, slot_id=slot_id)
        if force and not actor_is_superadmin:
            raise ConectaPolicyError("conecta_force_requires_superadmin", "Solo un superadministrador puede forzar cambios Conecta anticipados.")
        if slot.status not in ACTIVE_CONECTA_STATUSES:
            raise ConectaPolicyError("conecta_slot_not_active", "El cupo Conecta no esta activo.")

        lock_base = slot.last_reassignment_at or slot.assigned_at
        if lock_base is not None and not force:
            lock_until = self._normalize_datetime(lock_base) + timedelta(days=REASSIGNMENT_LOCK_DAYS)
            if released_at < lock_until:
                raise ConectaPolicyError(
                    "conecta_reassignment_locked",
                    "El cupo Conecta no puede reasignarse antes de completar 30 dias.",
                )

        slot.status = "released"
        slot.released_at = released_at
        slot.updated_at = released_at
        slot.forced_by_user_id = actor_user_id if force else None
        slot.audit_reason = (reason or "").strip() or None
        db.add(slot)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_conecta_slot_released",
            payload={
                "slot_id": slot.id,
                "owner_user_id": slot.owner_user_id,
                "connected_user_id": slot.connected_user_id,
                "invited_email": slot.invited_email,
                "forced": bool(force),
                "reason": slot.audit_reason,
            },
        )
        db.flush()
        return slot

    @staticmethod
    def _normalize_datetime(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    @staticmethod
    def _resolve_default_source_right_code(limits: dict) -> str:
        if limits.get("pack_slots", 0) > 0:
            return "PACK_CONECTA"
        return "LICENSE_CONECTA_BASE"

    @staticmethod
    def _log_event(
        db: Session,
        *,
        empresa_id: int,
        actor_user_id: int | None,
        event_type: str,
        payload: dict,
    ) -> None:
        db.add(
            LicenseEvent(
                empresa_id=empresa_id,
                actor_usuario_id=actor_user_id,
                event_type=event_type,
                payload=payload,
            )
        )

    @staticmethod
    def _get_owner_user(db: Session, *, empresa_id: int, owner_user_id: int) -> Usuario:
        owner = (
            db.query(Usuario)
            .filter(
                Usuario.id == owner_user_id,
                Usuario.empresa_id == empresa_id,
                Usuario.activo == True,
            )
            .first()
        )
        if not owner:
            raise ConectaPolicyError("conecta_owner_not_found", "El usuario titular no pertenece a la empresa activa.")
        return owner

    @staticmethod
    def _get_connected_user(db: Session, connected_user_id: int) -> Usuario:
        user = db.query(Usuario).filter(Usuario.id == connected_user_id, Usuario.activo == True).first()
        if not user:
            raise ConectaPolicyError("conecta_connected_user_not_found", "El usuario conectado no existe o no esta activo.")
        return user

    @staticmethod
    def _get_company_slot(db: Session, *, empresa_id: int, slot_id: int) -> SaasConectaSlot:
        slot = (
            db.query(SaasConectaSlot)
            .filter(SaasConectaSlot.id == slot_id, SaasConectaSlot.empresa_id == empresa_id)
            .first()
        )
        if not slot:
            raise ConectaPolicyError("conecta_slot_not_found", "El cupo Conecta no existe para la empresa indicada.")
        return slot


saas_conecta_service = SaasConectaService()
