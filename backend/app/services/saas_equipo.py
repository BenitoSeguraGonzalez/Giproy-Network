from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from app.models.edt import EdtNode
from app.models.license_event import LicenseEvent
from app.models.presupuesto import PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.models.proyecto_asignacion import ProyectoAsignacion
from app.models.saas_equipo import (
    SaasEquipoChangeProposal,
    SaasEquipoEdtAssignment,
    SaasEquipoLock,
    SaasEquipoSeat,
)
from app.models.usuario import Usuario
from app.services.commercial_capabilities import commercial_capabilities_service


ACTIVE_EQUIPO_STATUSES = ("active", "pending")
PACK_EQUIPO_SLOT_RIGHT = "PACK_EQUIPO"
ALLOWED_PROPOSAL_FIELDS = {"descripcion", "unidad", "cantidad", "precio_unitario", "notas"}


@dataclass
class EquipoPolicyError(ValueError):
    code: str
    message: str

    def __str__(self) -> str:
        return self.message


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SaasEquipoService:
    def resolve_company_equipo_limits(self, db: Session, empresa_id: int) -> dict:
        state = commercial_capabilities_service.resolve_company_capabilities(db, empresa_id)
        limits = dict(state.get("limits") or {})
        saas_products = list(state.get("saas_products") or [])
        purchased_right_codes = set(state.get("purchased_right_codes") or [])
        included_right_codes = set(state.get("included_right_codes") or [])
        effective_right_codes = set(state.get("effective_right_codes") or [])

        base_slots = int(limits.get("equipo_base_slots") or 0)
        pack_slots = sum(1 for product in saas_products if product.get("right_code") == PACK_EQUIPO_SLOT_RIGHT)
        included_slots = 1 if PACK_EQUIPO_SLOT_RIGHT in included_right_codes and base_slots <= 0 else 0
        total_slots = base_slots + pack_slots + included_slots
        used_slots = (
            db.query(SaasEquipoSeat)
            .filter(SaasEquipoSeat.empresa_id == empresa_id, SaasEquipoSeat.status.in_(ACTIVE_EQUIPO_STATUSES))
            .count()
        )

        return {
            "empresa_id": empresa_id,
            "enabled": total_slots > 0 or PACK_EQUIPO_SLOT_RIGHT in effective_right_codes,
            "base_slots": base_slots,
            "pack_slots": pack_slots,
            "included_slots": included_slots,
            "total_slots": total_slots,
            "used_slots": int(used_slots or 0),
            "available_slots": max(0, int(total_slots or 0) - int(used_slots or 0)),
            "effective_right_codes": sorted(effective_right_codes),
            "purchased_right_codes": sorted(purchased_right_codes),
            "source": "commercial_capabilities",
        }

    def assign_seat(
        self,
        db: Session,
        *,
        empresa_id: int,
        owner_user_id: int,
        collaborator_user_id: int | None = None,
        invited_email: str | None = None,
        actor_user_id: int | None = None,
        source_right_code: str | None = None,
        metadata: dict | None = None,
    ) -> SaasEquipoSeat:
        invited_email = (invited_email or "").strip().lower() or None
        if collaborator_user_id is None and not invited_email:
            raise EquipoPolicyError("equipo_target_required", "Debe indicar un colaborador o un email de invitacion.")

        owner = self._get_company_user(db, empresa_id=empresa_id, user_id=owner_user_id, code="equipo_owner_not_found")
        collaborator = None
        if collaborator_user_id is not None:
            collaborator = self._get_company_user(
                db,
                empresa_id=empresa_id,
                user_id=collaborator_user_id,
                code="equipo_collaborator_not_found",
            )
            if collaborator.id == owner.id:
                raise EquipoPolicyError("equipo_self_assignment", "No se puede asignar Equipo al mismo usuario titular.")

        limits = self.resolve_company_equipo_limits(db, empresa_id)
        if limits["total_slots"] <= 0:
            raise EquipoPolicyError("no_equipo_slots", "La empresa no tiene cupos Equipo disponibles.")
        if limits["available_slots"] <= 0:
            raise EquipoPolicyError("equipo_slots_exhausted", "La empresa ya consumio todos sus cupos Equipo activos.")

        seat = SaasEquipoSeat(
            empresa_id=empresa_id,
            owner_user_id=owner.id,
            collaborator_user_id=collaborator.id if collaborator else None,
            invited_email=invited_email,
            status="active",
            source_right_code=source_right_code or PACK_EQUIPO_SLOT_RIGHT,
            assigned_at=_utcnow(),
            metadata_json=metadata or None,
        )
        db.add(seat)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_equipo_seat_assigned",
            payload={
                "seat_id": seat.id,
                "owner_user_id": owner.id,
                "collaborator_user_id": collaborator.id if collaborator else None,
                "invited_email": invited_email,
                "source_right_code": seat.source_right_code,
                "total_slots": limits["total_slots"],
            },
        )
        return seat

    def release_seat(
        self,
        db: Session,
        *,
        seat_id: int,
        empresa_id: int,
        actor_user_id: int | None = None,
        reason: str | None = None,
        force: bool = False,
    ) -> SaasEquipoSeat:
        seat = self._get_company_seat(db, empresa_id=empresa_id, seat_id=seat_id)
        if seat.status not in ACTIVE_EQUIPO_STATUSES:
            raise EquipoPolicyError("equipo_seat_not_active", "El cupo Equipo no esta activo.")

        now = _utcnow()
        active_assignments = (
            db.query(SaasEquipoEdtAssignment)
            .filter(SaasEquipoEdtAssignment.seat_id == seat.id, SaasEquipoEdtAssignment.status == "active")
            .all()
        )
        for assignment in active_assignments:
            self.revoke_edt_assignment(
                db,
                assignment_id=assignment.id,
                empresa_id=empresa_id,
                actor_user_id=actor_user_id,
                reason="Liberacion de cupo Equipo.",
            )

        seat.status = "released"
        seat.released_at = now
        seat.forced_by_user_id = actor_user_id if force else None
        seat.audit_reason = (reason or "").strip() or None
        db.add(seat)
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_equipo_seat_released",
            payload={"seat_id": seat.id, "forced": bool(force), "reason": seat.audit_reason},
        )
        return seat

    def assign_edt_scope(
        self,
        db: Session,
        *,
        seat_id: int,
        empresa_id: int,
        proyecto_id: int,
        edt_id: int,
        actor_user_id: int | None,
        modulo: str = "presupuestos",
        metadata: dict | None = None,
    ) -> SaasEquipoEdtAssignment:
        seat = self._get_company_seat(db, empresa_id=empresa_id, seat_id=seat_id)
        if seat.status not in ACTIVE_EQUIPO_STATUSES:
            raise EquipoPolicyError("equipo_seat_not_active", "El cupo Equipo no esta activo.")
        if not seat.collaborator_user_id:
            raise EquipoPolicyError("equipo_collaborator_required", "El cupo Equipo debe estar asociado a un usuario antes de asignar EDT.")

        proyecto = self._get_project(db, empresa_id=empresa_id, proyecto_id=proyecto_id)
        edt_node = self._get_edt_node(db, empresa_id=empresa_id, proyecto_id=proyecto.id, edt_id=edt_id)
        collaborator = self._get_company_user(
            db,
            empresa_id=empresa_id,
            user_id=seat.collaborator_user_id,
            code="equipo_collaborator_not_found",
        )

        existing = (
            db.query(SaasEquipoEdtAssignment)
            .filter(
                SaasEquipoEdtAssignment.seat_id == seat.id,
                SaasEquipoEdtAssignment.proyecto_id == proyecto.id,
                SaasEquipoEdtAssignment.edt_id == edt_node.id,
                SaasEquipoEdtAssignment.modulo == modulo,
                SaasEquipoEdtAssignment.status == "active",
            )
            .first()
        )
        if existing:
            return existing

        proyecto_asignacion = ProyectoAsignacion(
            proyecto_id=proyecto.id,
            usuario_id=collaborator.id,
            edt_id=edt_node.id,
            modulo=modulo,
            es_global=False,
            asignado_por_id=actor_user_id,
        )
        db.add(proyecto_asignacion)
        db.flush()

        assignment = SaasEquipoEdtAssignment(
            seat_id=seat.id,
            empresa_id=empresa_id,
            proyecto_id=proyecto.id,
            edt_id=edt_node.id,
            usuario_id=collaborator.id,
            proyecto_asignacion_id=proyecto_asignacion.id,
            modulo=modulo,
            status="active",
            assigned_by_user_id=actor_user_id,
            metadata_json=metadata or None,
        )
        db.add(assignment)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_equipo_edt_assigned",
            payload={
                "seat_id": seat.id,
                "assignment_id": assignment.id,
                "proyecto_id": proyecto.id,
                "edt_id": edt_node.id,
                "usuario_id": collaborator.id,
                "modulo": modulo,
            },
        )
        return assignment

    def revoke_edt_assignment(
        self,
        db: Session,
        *,
        assignment_id: int,
        empresa_id: int,
        actor_user_id: int | None,
        reason: str | None = None,
    ) -> SaasEquipoEdtAssignment:
        assignment = (
            db.query(SaasEquipoEdtAssignment)
            .filter(SaasEquipoEdtAssignment.id == assignment_id, SaasEquipoEdtAssignment.empresa_id == empresa_id)
            .first()
        )
        if not assignment:
            raise EquipoPolicyError("equipo_assignment_not_found", "La asignacion Equipo no existe.")
        if assignment.status != "active":
            return assignment

        if assignment.proyecto_asignacion_id:
            db.query(ProyectoAsignacion).filter(ProyectoAsignacion.id == assignment.proyecto_asignacion_id).delete()

        assignment.status = "revoked"
        assignment.revoked_by_user_id = actor_user_id
        assignment.revoked_at = _utcnow()
        db.add(assignment)
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_equipo_edt_revoked",
            payload={
                "assignment_id": assignment.id,
                "seat_id": assignment.seat_id,
                "proyecto_id": assignment.proyecto_id,
                "edt_id": assignment.edt_id,
                "usuario_id": assignment.usuario_id,
                "reason": reason,
            },
        )
        return assignment

    def acquire_lock(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        edt_id: int,
        user_id: int,
        presupuesto_linea_id: int | None = None,
        reason: str | None = None,
        metadata: dict | None = None,
    ) -> SaasEquipoLock:
        self._ensure_user_can_operate_edt(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, user_id=user_id)
        if presupuesto_linea_id is not None:
            self._get_budget_line(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, linea_id=presupuesto_linea_id)

        existing = self._get_active_lock(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, presupuesto_linea_id=presupuesto_linea_id)
        if existing and existing.locked_by_user_id != user_id:
            raise EquipoPolicyError("equipo_lock_conflict", "La partida ya esta bloqueada por otro usuario.")
        if existing:
            return existing

        lock = SaasEquipoLock(
            empresa_id=empresa_id,
            proyecto_id=proyecto_id,
            edt_id=edt_id,
            presupuesto_linea_id=presupuesto_linea_id,
            locked_by_user_id=user_id,
            status="active",
            reason=(reason or "").strip() or None,
            metadata_json=metadata or None,
        )
        db.add(lock)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=user_id,
            event_type="saas_equipo_lock_acquired",
            payload={"lock_id": lock.id, "proyecto_id": proyecto_id, "edt_id": edt_id, "presupuesto_linea_id": presupuesto_linea_id},
        )
        return lock

    def release_lock(self, db: Session, *, lock_id: int, empresa_id: int, actor_user_id: int, actor_is_admin: bool = False) -> SaasEquipoLock:
        lock = db.query(SaasEquipoLock).filter(SaasEquipoLock.id == lock_id, SaasEquipoLock.empresa_id == empresa_id).first()
        if not lock:
            raise EquipoPolicyError("equipo_lock_not_found", "El bloqueo Equipo no existe.")
        if lock.locked_by_user_id != actor_user_id and not actor_is_admin:
            raise EquipoPolicyError("equipo_lock_release_denied", "No puede liberar un bloqueo de otro usuario.")
        if lock.status != "active":
            return lock
        lock.status = "released"
        lock.released_at = _utcnow()
        db.add(lock)
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=actor_user_id,
            event_type="saas_equipo_lock_released",
            payload={"lock_id": lock.id, "forced": bool(actor_is_admin and lock.locked_by_user_id != actor_user_id)},
        )
        return lock

    def submit_change_proposal(
        self,
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        edt_id: int,
        user_id: int,
        title: str,
        description: str | None = None,
        presupuesto_linea_id: int | None = None,
        proposed_changes: dict[str, Any] | None = None,
        metadata: dict | None = None,
    ) -> SaasEquipoChangeProposal:
        self._ensure_user_can_operate_edt(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, user_id=user_id)
        proposed_changes = self._sanitize_proposed_changes(proposed_changes or {})
        line = None
        if presupuesto_linea_id is not None:
            line = self._get_budget_line(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, linea_id=presupuesto_linea_id)
            lock = self._get_active_lock(db, empresa_id=empresa_id, proyecto_id=proyecto_id, edt_id=edt_id, presupuesto_linea_id=presupuesto_linea_id)
            if lock and lock.locked_by_user_id != user_id:
                raise EquipoPolicyError("equipo_lock_conflict", "La partida esta bloqueada por otro usuario.")

        proposal = SaasEquipoChangeProposal(
            empresa_id=empresa_id,
            proyecto_id=proyecto_id,
            edt_id=edt_id,
            presupuesto_id=line.presupuesto_id if line else None,
            presupuesto_linea_id=line.id if line else None,
            submitted_by_user_id=user_id,
            status="pending",
            title=title.strip(),
            description=(description or "").strip() or None,
            proposed_changes=proposed_changes,
            metadata_json=metadata or None,
        )
        db.add(proposal)
        db.flush()
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=user_id,
            event_type="saas_equipo_proposal_submitted",
            payload={"proposal_id": proposal.id, "proyecto_id": proyecto_id, "edt_id": edt_id, "presupuesto_linea_id": presupuesto_linea_id},
        )
        return proposal

    def review_change_proposal(
        self,
        db: Session,
        *,
        proposal_id: int,
        empresa_id: int,
        reviewer_user_id: int,
        approve: bool,
        notes: str | None = None,
    ) -> SaasEquipoChangeProposal:
        proposal = (
            db.query(SaasEquipoChangeProposal)
            .filter(SaasEquipoChangeProposal.id == proposal_id, SaasEquipoChangeProposal.empresa_id == empresa_id)
            .first()
        )
        if not proposal:
            raise EquipoPolicyError("equipo_proposal_not_found", "La propuesta Equipo no existe.")
        if proposal.status != "pending":
            raise EquipoPolicyError("equipo_proposal_not_pending", "La propuesta ya fue revisada.")

        proposal.reviewed_by_user_id = reviewer_user_id
        proposal.review_notes = (notes or "").strip() or None
        proposal.reviewed_at = _utcnow()
        if approve:
            self._apply_proposal(db, proposal)
            proposal.status = "approved"
            proposal.applied_at = _utcnow()
        else:
            proposal.status = "rejected"
        db.add(proposal)
        self._log_event(
            db,
            empresa_id=empresa_id,
            actor_user_id=reviewer_user_id,
            event_type="saas_equipo_proposal_reviewed",
            payload={"proposal_id": proposal.id, "approved": bool(approve), "status": proposal.status},
        )
        return proposal

    @staticmethod
    def _sanitize_proposed_changes(changes: dict[str, Any]) -> dict[str, Any]:
        sanitized = {key: value for key, value in changes.items() if key in ALLOWED_PROPOSAL_FIELDS}
        if not sanitized:
            raise EquipoPolicyError("equipo_empty_proposal", "La propuesta no contiene cambios permitidos.")
        return sanitized

    @staticmethod
    def _apply_proposal(db: Session, proposal: SaasEquipoChangeProposal) -> None:
        if proposal.presupuesto_linea_id is None:
            return
        line = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.id == proposal.presupuesto_linea_id).first()
        if not line:
            raise EquipoPolicyError("equipo_line_not_found", "La linea de presupuesto de la propuesta no existe.")
        for field, value in (proposal.proposed_changes or {}).items():
            if field in {"cantidad", "precio_unitario"}:
                value = Decimal(str(value))
            setattr(line, field, value)
        if "cantidad" in proposal.proposed_changes or "precio_unitario" in proposal.proposed_changes:
            line.precio_total = Decimal(str(line.cantidad or 0)) * Decimal(str(line.precio_unitario or 0))
        db.add(line)

    @staticmethod
    def _log_event(db: Session, *, empresa_id: int, actor_user_id: int | None, event_type: str, payload: dict) -> None:
        db.add(LicenseEvent(empresa_id=empresa_id, actor_usuario_id=actor_user_id, event_type=event_type, payload=payload))

    @staticmethod
    def _get_company_user(db: Session, *, empresa_id: int, user_id: int, code: str) -> Usuario:
        user = db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == empresa_id, Usuario.activo == True).first()
        if not user:
            raise EquipoPolicyError(code, "El usuario no pertenece a la empresa activa.")
        return user

    @staticmethod
    def _get_project(db: Session, *, empresa_id: int, proyecto_id: int) -> Proyecto:
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id, Proyecto.empresa_id == empresa_id).first()
        if not proyecto:
            raise EquipoPolicyError("equipo_project_not_found", "El proyecto no pertenece a la empresa activa.")
        return proyecto

    @staticmethod
    def _get_edt_node(db: Session, *, empresa_id: int, proyecto_id: int, edt_id: int) -> EdtNode:
        edt = db.query(EdtNode).filter(EdtNode.id == edt_id, EdtNode.proyecto_id == proyecto_id, EdtNode.empresa_id == empresa_id).first()
        if not edt:
            raise EquipoPolicyError("equipo_edt_not_found", "El nodo EDT no pertenece al proyecto indicado.")
        return edt

    @staticmethod
    def _get_company_seat(db: Session, *, empresa_id: int, seat_id: int) -> SaasEquipoSeat:
        seat = db.query(SaasEquipoSeat).filter(SaasEquipoSeat.id == seat_id, SaasEquipoSeat.empresa_id == empresa_id).first()
        if not seat:
            raise EquipoPolicyError("equipo_seat_not_found", "El cupo Equipo no existe para la empresa indicada.")
        return seat

    @staticmethod
    def _get_active_lock(
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        edt_id: int,
        presupuesto_linea_id: int | None,
    ) -> SaasEquipoLock | None:
        query = db.query(SaasEquipoLock).filter(
            SaasEquipoLock.empresa_id == empresa_id,
            SaasEquipoLock.proyecto_id == proyecto_id,
            SaasEquipoLock.edt_id == edt_id,
            SaasEquipoLock.status == "active",
        )
        if presupuesto_linea_id is None:
            query = query.filter(SaasEquipoLock.presupuesto_linea_id.is_(None))
        else:
            query = query.filter(SaasEquipoLock.presupuesto_linea_id == presupuesto_linea_id)
        return query.first()

    @staticmethod
    def _get_budget_line(
        db: Session,
        *,
        empresa_id: int,
        proyecto_id: int,
        edt_id: int,
        linea_id: int,
    ) -> PresupuestoDetalle:
        line = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.id == linea_id, PresupuestoDetalle.edt_id == edt_id).first()
        if not line or not line.presupuesto or line.presupuesto.empresa_id != empresa_id or line.presupuesto.proyecto_id != proyecto_id:
            raise EquipoPolicyError("equipo_line_not_found", "La linea de presupuesto no pertenece al alcance EDT indicado.")
        return line

    @staticmethod
    def _ensure_user_can_operate_edt(db: Session, *, empresa_id: int, proyecto_id: int, edt_id: int, user_id: int) -> None:
        user = db.query(Usuario).filter(Usuario.id == user_id, Usuario.empresa_id == empresa_id, Usuario.activo == True).first()
        if not user:
            raise EquipoPolicyError("equipo_user_not_found", "El usuario no pertenece a la empresa activa.")
        role = (user.rol or "").lower()
        if role in {"administrador", "superadministrador"}:
            return
        assignment = (
            db.query(ProyectoAsignacion)
            .filter(
                ProyectoAsignacion.proyecto_id == proyecto_id,
                ProyectoAsignacion.usuario_id == user_id,
                ProyectoAsignacion.edt_id == edt_id,
            )
            .first()
        )
        if not assignment:
            raise EquipoPolicyError("equipo_edt_scope_denied", "El usuario no tiene asignacion Equipo para esta EDT.")


saas_equipo_service = SaasEquipoService()
