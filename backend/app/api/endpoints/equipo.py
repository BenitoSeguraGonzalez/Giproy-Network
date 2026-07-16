from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.empresa import Empresa
from app.models.edt import EdtNode
from app.models.license_event import LicenseEvent
from app.models.proyecto import Proyecto
from app.models.saas_equipo import SaasEquipoChangeProposal, SaasEquipoEdtAssignment, SaasEquipoLock, SaasEquipoSeat
from app.models.usuario import Usuario
from app.schemas.saas_equipo import (
    SaasEquipoAdminSummaryResponse,
    SaasEquipoAssignmentRevoke,
    SaasEquipoContextResponse,
    SaasEquipoEdtAssignmentCreate,
    SaasEquipoEdtAssignmentResponse,
    SaasEquipoLimitsResponse,
    SaasEquipoListResponse,
    SaasEquipoLockCreate,
    SaasEquipoLockRelease,
    SaasEquipoLockResponse,
    SaasEquipoOperationsResponse,
    SaasEquipoProposalCreate,
    SaasEquipoProposalResponse,
    SaasEquipoProposalReview,
    SaasEquipoSeatCreate,
    SaasEquipoSeatRelease,
    SaasEquipoSeatResponse,
)
from app.services.saas_equipo import EquipoPolicyError, saas_equipo_service


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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No existe empresa activa para Equipo.")
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa no encontrada.")
    if not _is_superadmin(current_user) and int(current_user.empresa_id or 0) != empresa_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puede operar Equipo fuera de su empresa activa.")
    return empresa_id


def _require_company_admin(current_user: Usuario) -> None:
    if not _is_company_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para administradores.")


def _policy_error_to_http(exc: EquipoPolicyError) -> HTTPException:
    forbidden_codes = {
        "no_equipo_slots",
        "equipo_slots_exhausted",
        "equipo_owner_not_found",
        "equipo_collaborator_not_found",
        "equipo_project_not_found",
        "equipo_edt_not_found",
        "equipo_edt_scope_denied",
        "equipo_lock_conflict",
        "equipo_lock_release_denied",
    }
    status_code = status.HTTP_403_FORBIDDEN if exc.code in forbidden_codes else status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})


def _serialize_seat(seat: SaasEquipoSeat) -> SaasEquipoSeatResponse:
    return SaasEquipoSeatResponse(
        id=seat.id,
        empresa_id=seat.empresa_id,
        owner_user_id=seat.owner_user_id,
        owner_name=seat.owner_user.nombre_completo if seat.owner_user else None,
        collaborator_user_id=seat.collaborator_user_id,
        collaborator_name=seat.collaborator_user.nombre_completo if seat.collaborator_user else None,
        invited_email=seat.invited_email,
        status=seat.status,
        source_right_code=seat.source_right_code,
        assigned_at=seat.assigned_at,
        released_at=seat.released_at,
        forced_by_user_id=seat.forced_by_user_id,
        audit_reason=seat.audit_reason,
        metadata_json=seat.metadata_json,
    )


def _serialize_assignment(assignment: SaasEquipoEdtAssignment) -> SaasEquipoEdtAssignmentResponse:
    return SaasEquipoEdtAssignmentResponse(
        id=assignment.id,
        seat_id=assignment.seat_id,
        empresa_id=assignment.empresa_id,
        proyecto_id=assignment.proyecto_id,
        edt_id=assignment.edt_id,
        usuario_id=assignment.usuario_id,
        proyecto_asignacion_id=assignment.proyecto_asignacion_id,
        modulo=assignment.modulo,
        status=assignment.status,
        assigned_by_user_id=assignment.assigned_by_user_id,
        revoked_by_user_id=assignment.revoked_by_user_id,
        assigned_at=assignment.assigned_at,
        revoked_at=assignment.revoked_at,
        metadata_json=assignment.metadata_json,
    )


def _serialize_lock(lock: SaasEquipoLock) -> SaasEquipoLockResponse:
    return SaasEquipoLockResponse(
        id=lock.id,
        empresa_id=lock.empresa_id,
        proyecto_id=lock.proyecto_id,
        edt_id=lock.edt_id,
        presupuesto_linea_id=lock.presupuesto_linea_id,
        locked_by_user_id=lock.locked_by_user_id,
        status=lock.status,
        reason=lock.reason,
        locked_at=lock.locked_at,
        released_at=lock.released_at,
        expires_at=lock.expires_at,
        metadata_json=lock.metadata_json,
    )


def _serialize_proposal(proposal: SaasEquipoChangeProposal) -> SaasEquipoProposalResponse:
    return SaasEquipoProposalResponse(
        id=proposal.id,
        empresa_id=proposal.empresa_id,
        proyecto_id=proposal.proyecto_id,
        edt_id=proposal.edt_id,
        presupuesto_id=proposal.presupuesto_id,
        presupuesto_linea_id=proposal.presupuesto_linea_id,
        submitted_by_user_id=proposal.submitted_by_user_id,
        reviewed_by_user_id=proposal.reviewed_by_user_id,
        status=proposal.status,
        title=proposal.title,
        description=proposal.description,
        proposed_changes=proposal.proposed_changes,
        review_notes=proposal.review_notes,
        submitted_at=proposal.submitted_at,
        reviewed_at=proposal.reviewed_at,
        applied_at=proposal.applied_at,
        metadata_json=proposal.metadata_json,
    )


def _query_seats(db: Session, empresa_id: int) -> list[SaasEquipoSeat]:
    return (
        db.query(SaasEquipoSeat)
        .options(joinedload(SaasEquipoSeat.owner_user), joinedload(SaasEquipoSeat.collaborator_user))
        .filter(SaasEquipoSeat.empresa_id == empresa_id)
        .order_by(SaasEquipoSeat.assigned_at.desc(), SaasEquipoSeat.id.desc())
        .all()
    )


@router.get("/limits", response_model=SaasEquipoLimitsResponse)
def read_equipo_limits(
    empresa_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    return saas_equipo_service.resolve_company_equipo_limits(db, target_empresa_id)


@router.get("/seats", response_model=SaasEquipoListResponse)
def read_equipo_seats(
    empresa_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    limits = saas_equipo_service.resolve_company_equipo_limits(db, target_empresa_id)
    seats = _query_seats(db, target_empresa_id)
    return {"empresa_id": target_empresa_id, "limits": limits, "items": [_serialize_seat(seat) for seat in seats]}


@router.get("/operations", response_model=SaasEquipoOperationsResponse)
def read_equipo_operations(
    empresa_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    limits = saas_equipo_service.resolve_company_equipo_limits(db, target_empresa_id)
    assignments = (
        db.query(SaasEquipoEdtAssignment)
        .filter(SaasEquipoEdtAssignment.empresa_id == target_empresa_id)
        .order_by(SaasEquipoEdtAssignment.assigned_at.desc(), SaasEquipoEdtAssignment.id.desc())
        .all()
    )
    locks = (
        db.query(SaasEquipoLock)
        .filter(SaasEquipoLock.empresa_id == target_empresa_id)
        .order_by(SaasEquipoLock.locked_at.desc(), SaasEquipoLock.id.desc())
        .all()
    )
    proposals = (
        db.query(SaasEquipoChangeProposal)
        .filter(SaasEquipoChangeProposal.empresa_id == target_empresa_id)
        .order_by(SaasEquipoChangeProposal.submitted_at.desc(), SaasEquipoChangeProposal.id.desc())
        .all()
    )
    return {
        "empresa_id": target_empresa_id,
        "limits": limits,
        "seats": [_serialize_seat(seat) for seat in _query_seats(db, target_empresa_id)],
        "assignments": [_serialize_assignment(assignment) for assignment in assignments],
        "locks": [_serialize_lock(lock) for lock in locks],
        "proposals": [_serialize_proposal(proposal) for proposal in proposals],
    }


@router.get("/context", response_model=SaasEquipoContextResponse)
def read_equipo_context(
    empresa_id: int | None = Query(default=None),
    proyecto_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, empresa_id)
    users = (
        db.query(Usuario)
        .filter(Usuario.empresa_id == target_empresa_id, Usuario.activo.is_(True))
        .order_by(Usuario.nombre_completo.asc(), Usuario.id.asc())
        .all()
    )
    projects = (
        db.query(Proyecto)
        .filter(Proyecto.empresa_id == target_empresa_id)
        .order_by(Proyecto.nombre.asc(), Proyecto.id.asc())
        .all()
    )
    edt_nodes = []
    if proyecto_id is not None:
        project_exists = any(int(project.id) == int(proyecto_id) for project in projects)
        if not project_exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado para la empresa indicada.")
        edt_nodes = (
            db.query(EdtNode)
            .filter(EdtNode.empresa_id == target_empresa_id, EdtNode.proyecto_id == int(proyecto_id))
            .order_by(EdtNode.codigo.asc(), EdtNode.orden.asc(), EdtNode.id.asc())
            .all()
        )
    return {
        "empresa_id": target_empresa_id,
        "proyecto_id": proyecto_id,
        "users": [
            {
                "id": user.id,
                "nombre_completo": user.nombre_completo,
                "email": user.email,
                "rol": user.rol,
                "activo": bool(user.activo),
            }
            for user in users
        ],
        "projects": [
            {
                "id": project.id,
                "nombre": project.nombre,
                "codigo": project.codigo,
                "estado": project.estado,
            }
            for project in projects
        ],
        "edt_nodes": [
            {
                "id": node.id,
                "proyecto_id": node.proyecto_id,
                "parent_id": node.parent_id,
                "codigo": node.codigo,
                "nombre": node.nombre,
                "tipo_nodo": str(node.tipo_nodo.value if hasattr(node.tipo_nodo, "value") else node.tipo_nodo),
            }
            for node in edt_nodes
        ],
    }


@router.post("/seats", response_model=SaasEquipoSeatResponse)
def create_equipo_seat(
    payload: SaasEquipoSeatCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    owner_user_id = int(payload.owner_user_id or current_user.id)
    try:
        seat = saas_equipo_service.assign_seat(
            db,
            empresa_id=target_empresa_id,
            owner_user_id=owner_user_id,
            collaborator_user_id=payload.collaborator_user_id,
            invited_email=payload.invited_email,
            actor_user_id=current_user.id,
            source_right_code=payload.source_right_code,
            metadata=payload.metadata,
        )
        db.commit()
        db.refresh(seat)
        return _serialize_seat(seat)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/seats/{seat_id}/release", response_model=SaasEquipoSeatResponse)
def release_equipo_seat(
    seat_id: int,
    payload: SaasEquipoSeatRelease,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        seat = saas_equipo_service.release_seat(
            db,
            seat_id=seat_id,
            empresa_id=target_empresa_id,
            actor_user_id=current_user.id,
            reason=payload.reason,
            force=payload.force,
        )
        db.commit()
        db.refresh(seat)
        return _serialize_seat(seat)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/assignments", response_model=SaasEquipoEdtAssignmentResponse)
def create_equipo_assignment(
    payload: SaasEquipoEdtAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        assignment = saas_equipo_service.assign_edt_scope(
            db,
            seat_id=payload.seat_id,
            empresa_id=target_empresa_id,
            proyecto_id=payload.proyecto_id,
            edt_id=payload.edt_id,
            actor_user_id=current_user.id,
            modulo=payload.modulo,
            metadata=payload.metadata,
        )
        db.commit()
        db.refresh(assignment)
        return _serialize_assignment(assignment)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/assignments/{assignment_id}/revoke", response_model=SaasEquipoEdtAssignmentResponse)
def revoke_equipo_assignment(
    assignment_id: int,
    payload: SaasEquipoAssignmentRevoke,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        assignment = saas_equipo_service.revoke_edt_assignment(
            db,
            assignment_id=assignment_id,
            empresa_id=target_empresa_id,
            actor_user_id=current_user.id,
            reason=payload.reason,
        )
        db.commit()
        db.refresh(assignment)
        return _serialize_assignment(assignment)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/locks", response_model=SaasEquipoLockResponse)
def create_equipo_lock(
    payload: SaasEquipoLockCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        lock = saas_equipo_service.acquire_lock(
            db,
            empresa_id=target_empresa_id,
            proyecto_id=payload.proyecto_id,
            edt_id=payload.edt_id,
            user_id=current_user.id,
            presupuesto_linea_id=payload.presupuesto_linea_id,
            reason=payload.reason,
            metadata=payload.metadata,
        )
        db.commit()
        db.refresh(lock)
        return _serialize_lock(lock)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/locks/{lock_id}/release", response_model=SaasEquipoLockResponse)
def release_equipo_lock(
    lock_id: int,
    payload: SaasEquipoLockRelease,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        lock = saas_equipo_service.release_lock(
            db,
            lock_id=lock_id,
            empresa_id=target_empresa_id,
            actor_user_id=current_user.id,
            actor_is_admin=_is_company_admin(current_user),
        )
        db.commit()
        db.refresh(lock)
        return _serialize_lock(lock)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/proposals", response_model=SaasEquipoProposalResponse)
def create_equipo_proposal(
    payload: SaasEquipoProposalCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        proposal = saas_equipo_service.submit_change_proposal(
            db,
            empresa_id=target_empresa_id,
            proyecto_id=payload.proyecto_id,
            edt_id=payload.edt_id,
            user_id=current_user.id,
            title=payload.title,
            description=payload.description,
            presupuesto_linea_id=payload.presupuesto_linea_id,
            proposed_changes=payload.proposed_changes,
            metadata=payload.metadata,
        )
        db.commit()
        db.refresh(proposal)
        return _serialize_proposal(proposal)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/proposals/{proposal_id}/review", response_model=SaasEquipoProposalResponse)
def review_equipo_proposal(
    proposal_id: int,
    payload: SaasEquipoProposalReview,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    _require_company_admin(current_user)
    target_empresa_id = _resolve_empresa_id(db, current_user, payload.empresa_id)
    try:
        proposal = saas_equipo_service.review_change_proposal(
            db,
            proposal_id=proposal_id,
            empresa_id=target_empresa_id,
            reviewer_user_id=current_user.id,
            approve=payload.approve,
            notes=payload.notes,
        )
        db.commit()
        db.refresh(proposal)
        return _serialize_proposal(proposal)
    except EquipoPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/admin/summary", response_model=SaasEquipoAdminSummaryResponse)
def read_equipo_admin_summary(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")

    empresas = db.query(Empresa).order_by(Empresa.nombre.asc()).all()
    event_rows = (
        db.query(LicenseEvent.event_type, func.count(LicenseEvent.id))
        .filter(
            LicenseEvent.event_type.in_(
                [
                    "saas_equipo_seat_assigned",
                    "saas_equipo_seat_released",
                    "saas_equipo_edt_assigned",
                    "saas_equipo_proposal_submitted",
                    "saas_equipo_proposal_reviewed",
                ]
            )
        )
        .group_by(LicenseEvent.event_type)
        .all()
    )
    event_counts = {event_type: int(count or 0) for event_type, count in event_rows}

    totals = {
        "companies": len(empresas),
        "enabled_companies": 0,
        "total_slots": 0,
        "used_slots": 0,
        "available_slots": 0,
        "active_seats": 0,
        "active_assignments": 0,
        "active_locks": 0,
        "pending_proposals": 0,
    }
    companies = []
    for empresa in empresas:
        limits = saas_equipo_service.resolve_company_equipo_limits(db, empresa.id)
        active_seats = db.query(SaasEquipoSeat).filter(SaasEquipoSeat.empresa_id == empresa.id, SaasEquipoSeat.status.in_(["active", "pending"])).count()
        active_assignments = db.query(SaasEquipoEdtAssignment).filter(SaasEquipoEdtAssignment.empresa_id == empresa.id, SaasEquipoEdtAssignment.status == "active").count()
        active_locks = db.query(SaasEquipoLock).filter(SaasEquipoLock.empresa_id == empresa.id, SaasEquipoLock.status == "active").count()
        pending_proposals = db.query(SaasEquipoChangeProposal).filter(SaasEquipoChangeProposal.empresa_id == empresa.id, SaasEquipoChangeProposal.status == "pending").count()
        row = {
            "empresa_id": empresa.id,
            "empresa_nombre": empresa.nombre,
            "enabled": bool(limits["enabled"]),
            "total_slots": int(limits["total_slots"]),
            "used_slots": int(limits["used_slots"]),
            "available_slots": int(limits["available_slots"]),
            "active_seats": int(active_seats or 0),
            "active_assignments": int(active_assignments or 0),
            "active_locks": int(active_locks or 0),
            "pending_proposals": int(pending_proposals or 0),
        }
        companies.append(row)
        if row["enabled"]:
            totals["enabled_companies"] += 1
        for key in ["total_slots", "used_slots", "available_slots", "active_seats", "active_assignments", "active_locks", "pending_proposals"]:
            totals[key] += row[key]

    return {
        "totals": totals,
        "events": event_counts,
        "companies": companies,
    }
