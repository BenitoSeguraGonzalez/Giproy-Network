from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.license_event import LicenseEvent
from app.models.saas_conecta import SaasConectaSlot
from app.models.usuario import Usuario
from app.schemas.saas_conecta import (
    SaasConectaAdminSummaryResponse,
    SaasConectaLimitsResponse,
    SaasConectaListResponse,
    SaasConectaSlotCreate,
    SaasConectaSlotRelease,
    SaasConectaSlotResponse,
)
from app.services.saas_conecta import ConectaPolicyError, saas_conecta_service


router = APIRouter()


def _role_key(user: Usuario) -> str:
    return (user.rol or "").strip().lower()


def _is_superadmin(user: Usuario) -> bool:
    return _role_key(user) == "superadministrador"


def _is_company_admin(user: Usuario) -> bool:
    return _role_key(user) in {"administrador", "superadministrador"}


def _resolve_empresa_id(db: Session, current_user: Usuario, requested_empresa_id: int | None = None) -> int:
    if _is_superadmin(current_user) and requested_empresa_id:
        empresa_id = int(requested_empresa_id)
    else:
        empresa_id = int(current_user.empresa_id or 0)

    if not empresa_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No existe empresa activa para Conecta.")

    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada.")

    if not _is_superadmin(current_user) and int(current_user.empresa_id or 0) != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede operar Conecta fuera de su empresa activa.")

    return empresa_id


def _policy_error_to_http(exc: ConectaPolicyError) -> HTTPException:
    forbidden_codes = {
        "no_conecta_slots",
        "conecta_slots_exhausted",
        "conecta_reassignment_locked",
        "conecta_force_requires_superadmin",
        "conecta_owner_not_found",
        "conecta_connected_user_not_found",
    }
    status_code = status.HTTP_403_FORBIDDEN if exc.code in forbidden_codes else status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})


def _serialize_slot(slot: SaasConectaSlot) -> SaasConectaSlotResponse:
    return SaasConectaSlotResponse(
        id=slot.id,
        empresa_id=slot.empresa_id,
        owner_user_id=slot.owner_user_id,
        owner_name=slot.owner_user.nombre_completo if slot.owner_user else None,
        connected_user_id=slot.connected_user_id,
        connected_user_name=slot.connected_user.nombre_completo if slot.connected_user else None,
        invited_email=slot.invited_email,
        status=slot.status,
        source_right_code=slot.source_right_code,
        assigned_at=slot.assigned_at,
        released_at=slot.released_at,
        last_reassignment_at=slot.last_reassignment_at,
        forced_by_user_id=slot.forced_by_user_id,
        audit_reason=slot.audit_reason,
        metadata_json=slot.metadata_json,
    )


def _as_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


@router.get("/limits", response_model=SaasConectaLimitsResponse)
def read_conecta_limits(
    empresa_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    return saas_conecta_service.resolve_company_conecta_limits(db, target_empresa_id)


@router.get("/slots", response_model=SaasConectaListResponse)
def read_conecta_slots(
    empresa_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    limits = saas_conecta_service.resolve_company_conecta_limits(db, target_empresa_id)
    slots = (
        db.query(SaasConectaSlot)
        .options(
            joinedload(SaasConectaSlot.owner_user),
            joinedload(SaasConectaSlot.connected_user),
        )
        .filter(SaasConectaSlot.empresa_id == target_empresa_id)
        .order_by(SaasConectaSlot.assigned_at.desc(), SaasConectaSlot.id.desc())
        .all()
    )
    return {
        "empresa_id": target_empresa_id,
        "limits": limits,
        "items": [_serialize_slot(slot) for slot in slots],
    }


@router.get("/admin/summary", response_model=SaasConectaAdminSummaryResponse)
def read_conecta_admin_summary(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")

    empresas = db.query(Empresa).order_by(Empresa.nombre.asc()).all()
    slots = (
        db.query(SaasConectaSlot)
        .options(joinedload(SaasConectaSlot.empresa))
        .order_by(SaasConectaSlot.empresa_id.asc(), SaasConectaSlot.id.asc())
        .all()
    )
    slots_by_empresa: dict[int, list[SaasConectaSlot]] = {}
    for slot in slots:
        slots_by_empresa.setdefault(int(slot.empresa_id), []).append(slot)

    event_rows = (
        db.query(LicenseEvent.event_type, func.count(LicenseEvent.id))
        .filter(LicenseEvent.event_type.in_(["saas_conecta_slot_assigned", "saas_conecta_slot_released"]))
        .group_by(LicenseEvent.event_type)
        .all()
    )
    event_counts = {event_type: int(count or 0) for event_type, count in event_rows}
    lock_threshold = datetime.now(timezone.utc) - timedelta(days=30)

    companies = []
    totals = {
        "companies": len(empresas),
        "enabled_companies": 0,
        "total_slots": 0,
        "used_slots": 0,
        "available_slots": 0,
        "active_slots": 0,
        "released_slots": 0,
        "locked_active_slots": 0,
        "forced_releases": 0,
    }

    for empresa in empresas:
        limits = saas_conecta_service.resolve_company_conecta_limits(db, empresa.id)
        company_slots = slots_by_empresa.get(int(empresa.id), [])
        active_slots = [slot for slot in company_slots if slot.status in {"active", "pending"}]
        released_slots = [slot for slot in company_slots if slot.status == "released"]
        locked_active_slots = [
            slot
            for slot in active_slots
            if (_as_aware(slot.last_reassignment_at) or _as_aware(slot.assigned_at)) >= lock_threshold
        ]
        forced_releases = [slot for slot in released_slots if slot.forced_by_user_id is not None]

        company_summary = {
            "empresa_id": empresa.id,
            "empresa_nombre": empresa.nombre,
            "enabled": bool(limits["enabled"]),
            "total_slots": int(limits["total_slots"]),
            "used_slots": int(limits["used_slots"]),
            "available_slots": int(limits["available_slots"]),
            "active_slots": len(active_slots),
            "released_slots": len(released_slots),
            "locked_active_slots": len(locked_active_slots),
            "forced_releases": len(forced_releases),
        }
        companies.append(company_summary)

        if company_summary["enabled"]:
            totals["enabled_companies"] += 1
        for key in [
            "total_slots",
            "used_slots",
            "available_slots",
            "active_slots",
            "released_slots",
            "locked_active_slots",
            "forced_releases",
        ]:
            totals[key] += company_summary[key]

    return {
        "totals": totals,
        "events": {
            "assigned": event_counts.get("saas_conecta_slot_assigned", 0),
            "released": event_counts.get("saas_conecta_slot_released", 0),
        },
        "companies": companies,
    }


@router.post("/slots", response_model=SaasConectaSlotResponse)
def create_conecta_slot(
    payload: SaasConectaSlotCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    owner_user_id = int(payload.owner_user_id or current_user.id)

    if owner_user_id != int(current_user.id) and not _is_company_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo administradores pueden asignar cupos Conecta a otro usuario.")

    try:
        slot = saas_conecta_service.assign_slot(
            db,
            empresa_id=target_empresa_id,
            owner_user_id=owner_user_id,
            connected_user_id=payload.connected_user_id,
            invited_email=payload.invited_email,
            actor_user_id=current_user.id,
            source_right_code=payload.source_right_code,
            metadata=payload.metadata,
        )
        db.commit()
        db.refresh(slot)
        return _serialize_slot(slot)
    except ConectaPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/slots/{slot_id}/release", response_model=SaasConectaSlotResponse)
def release_conecta_slot(
    slot_id: int,
    payload: SaasConectaSlotRelease,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    slot = (
        db.query(SaasConectaSlot)
        .filter(SaasConectaSlot.id == slot_id, SaasConectaSlot.empresa_id == target_empresa_id)
        .first()
    )
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cupo Conecta no encontrado.")
    if slot.owner_user_id != int(current_user.id) and not _is_company_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede liberar cupos Conecta de otro usuario.")

    try:
        released = saas_conecta_service.release_slot(
            db,
            slot_id=slot_id,
            empresa_id=target_empresa_id,
            actor_user_id=current_user.id,
            actor_is_superadmin=_is_superadmin(current_user),
            force=payload.force,
            reason=payload.reason,
        )
        db.commit()
        db.refresh(released)
        return _serialize_slot(released)
    except ConectaPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc
