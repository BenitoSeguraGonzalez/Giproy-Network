from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.transferencia import TransferAllowedCompanyRecipient
from app.models.usuario import Usuario
from app.schemas.transferencia import (
    TRANSFER_SHIPMENT_STATES,
    TransferCancelRequest,
    TransferImportResponse,
    TransferMarketplaceRequirementsResponse,
    TransferPreflightRequest,
    TransferPreflightResponse,
    TransferPublicCodeResponse,
    TransferContractResponse,
    TransferRecipientCompanyPreview,
    TransferRecipientCreateRequest,
    TransferRecipientResponse,
    TransferRecipientsListResponse,
    TransferRejectRequest,
    TransferResolveCodeRequest,
    TransferSanitizeCodesResponse,
    TransferCompanySanitizeCodesResponse,
    TransferShipmentCreateRequest,
    TransferShipmentResponse,
    TransferStateContract,
    TransferTimelineResponse,
    TransferTrayResponse,
)
from app.services.transferencias import TransferPolicyError, transferencias_service


router = APIRouter()


def _policy_error_to_http(exc: TransferPolicyError) -> HTTPException:
    forbidden_codes = {
        "transfer_role_forbidden",
        "transfer_license_blocked",
        "transfer_code_paused",
        "transfer_code_banned",
        "transfer_company_scope_forbidden",
        "transfer_recipient_slots_exhausted",
        "transfer_shipment_scope_forbidden",
        "transfer_marketplace_required",
        "transfer_cancel_after_import_forbidden",
    }
    not_found_codes = {"transfer_code_not_found"}
    if exc.code in forbidden_codes:
        status_code = status.HTTP_403_FORBIDDEN
    elif exc.code in not_found_codes:
        status_code = status.HTTP_404_NOT_FOUND
    else:
        status_code = status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=status_code, detail={"code": exc.code, "message": exc.message})


def _serialize_recipient(recipient: TransferAllowedCompanyRecipient) -> TransferRecipientResponse:
    empresa = recipient.recipient_empresa
    return TransferRecipientResponse(
        id=recipient.id,
        recipient_kind=recipient.recipient_kind,
        status=recipient.status,
        company_display_name=transferencias_service.company_display_name(empresa),
        company_name=empresa.nombre,
        company_alias=empresa.alias,
        expires_at=recipient.expires_at.isoformat() if recipient.expires_at else None,
    )


def _serialize_shipment(shipment) -> TransferShipmentResponse:
    receiver = shipment.receiver_empresa
    return TransferShipmentResponse(
        id=shipment.id,
        status=shipment.status,
        asset_type=shipment.asset_type,
        asset_id=shipment.asset_id,
        description=shipment.description,
        contract_version=shipment.contract_version,
        snapshot_hash=shipment.snapshot_hash,
        marketplace_blocked=bool(shipment.marketplace_blocked),
        recipient_company_display_name=transferencias_service.company_display_name(receiver),
        created_at=shipment.created_at.isoformat() if shipment.created_at else None,
        sent_at=shipment.sent_at.isoformat() if shipment.sent_at else None,
    )


@router.get("/contract", response_model=TransferContractResponse)
def get_transfer_contract():
    return TransferContractResponse(
        states=[
            TransferStateContract(
                code=state,
                recoverable=state == "fallo_importacion",
            )
            for state in TRANSFER_SHIPMENT_STATES
        ]
    )


@router.get("/my-code", response_model=TransferPublicCodeResponse)
def get_my_transfer_code(
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        code = transferencias_service.get_my_public_code(db, current_user, empresa_id=empresa_id)
        db.commit()
        db.refresh(code)
        return TransferPublicCodeResponse(public_code=code.public_code, status=code.status, empresa_id=code.empresa_id)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/recipient-code/resolve", response_model=TransferRecipientCompanyPreview)
def resolve_transfer_recipient_code(
    payload: TransferResolveCodeRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        company = transferencias_service.resolve_recipient_company(
            db,
            sender_empresa_id=effective_empresa_id,
            public_code=payload.public_code,
            actor_user_id=current_user.id,
        )
        db.commit()
        return TransferRecipientCompanyPreview(**transferencias_service.serialize_company_preview(company))
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/recipients", response_model=TransferRecipientsListResponse)
def list_transfer_recipients(
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        recipients = transferencias_service.list_recipients(db, effective_empresa_id)
        capacity = transferencias_service.summarize_recipient_capacity(db, effective_empresa_id)
        return TransferRecipientsListResponse(
            fixed_limit=capacity["fixed_limit"],
            fixed_used=capacity["fixed_used"],
            fixed_available=capacity["fixed_available"],
            additional_limit=capacity["additional_limit"],
            additional_used=capacity["additional_used"],
            additional_available=capacity["additional_available"],
            additional_active=capacity["additional_active"],
            items=[_serialize_recipient(item) for item in recipients],
        )
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.post("/recipients", response_model=TransferRecipientResponse)
def create_transfer_recipient(
    payload: TransferRecipientCreateRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        recipient = transferencias_service.create_recipient_from_code(
            db,
            sender_empresa_id=effective_empresa_id,
            public_code=payload.public_code,
            actor_user_id=current_user.id,
            confirm=payload.confirm,
            confirmed_display_name=payload.confirmed_display_name,
        )
        db.commit()
        db.refresh(recipient)
        return _serialize_recipient(recipient)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/preflight", response_model=TransferPreflightResponse)
def preflight_transfer_shipment(
    payload: TransferPreflightRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        preflight = transferencias_service.build_preflight(
            db,
            sender_empresa_id=effective_empresa_id,
            recipient_id=payload.recipient_id,
            asset_type=payload.asset_type,
            asset_id=payload.asset_id,
            actor_user_id=current_user.id,
            description=payload.description,
            dry_run=True,
            marketplace_confirmed=payload.marketplace_confirmed,
        )
        response = {key: value for key, value in preflight.items() if key not in {"payload", "recipient"}}
        return TransferPreflightResponse(**response)
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.get("/tray", response_model=TransferTrayResponse)
def read_transfer_tray(
    direction: str = Query("todos", description="todos, entrada o salida"),
    status_filter: str | None = Query(None, alias="status"),
    q: str | None = Query(None, max_length=120),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    empresa_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        result = transferencias_service.list_tray(
            db,
            empresa_id=effective_empresa_id,
            direction=direction,
            status_filter=status_filter,
            q=q,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
            offset=offset,
        )
        return TransferTrayResponse(**result)
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.get("/tray-summary", response_model=TransferTrayResponse)
def read_transfer_tray_summary(
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        return TransferTrayResponse(**transferencias_service.get_tray_summary(db, empresa_id=effective_empresa_id))
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.post("/shipments", response_model=TransferShipmentResponse)
def create_transfer_shipment(
    payload: TransferShipmentCreateRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        shipment = transferencias_service.create_shipment(
            db,
            sender_empresa_id=effective_empresa_id,
            recipient_id=payload.recipient_id,
            asset_type=payload.asset_type,
            asset_id=payload.asset_id,
            actor_user_id=current_user.id,
            description=payload.description,
            marketplace_confirmed=payload.marketplace_confirmed,
        )
        db.commit()
        db.refresh(shipment)
        return _serialize_shipment(shipment)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/shipments/{shipment_id}/timeline", response_model=TransferTimelineResponse)
def read_transfer_shipment_timeline(
    shipment_id: int,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        return TransferTimelineResponse(**transferencias_service.get_shipment_timeline(db, shipment_id=shipment_id, empresa_id=effective_empresa_id))
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.post("/shipments/{shipment_id}/reject", response_model=TransferShipmentResponse)
def reject_transfer_shipment(
    shipment_id: int,
    payload: TransferRejectRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        shipment = transferencias_service.reject_shipment(
            db,
            shipment_id=shipment_id,
            empresa_id=effective_empresa_id,
            actor_user_id=current_user.id,
            reason=payload.reason,
        )
        db.commit()
        db.refresh(shipment)
        return _serialize_shipment(shipment)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/shipments/{shipment_id}/import", response_model=TransferImportResponse)
def import_transfer_shipment(
    shipment_id: int,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        transferencias_service.ensure_license_enabled(db, effective_empresa_id)
        result = transferencias_service.import_shipment(
            db,
            shipment_id=shipment_id,
            empresa_id=effective_empresa_id,
            actor_user_id=current_user.id,
        )
        db.commit()
        return TransferImportResponse(**result)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/shipments/{shipment_id}/cancel", response_model=TransferShipmentResponse)
def cancel_transfer_shipment(
    shipment_id: int,
    payload: TransferCancelRequest,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        shipment = transferencias_service.cancel_shipment(
            db,
            shipment_id=shipment_id,
            sender_empresa_id=effective_empresa_id,
            actor_user_id=current_user.id,
            reason=payload.reason,
        )
        db.commit()
        db.refresh(shipment)
        return _serialize_shipment(shipment)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.get("/shipments/{shipment_id}/marketplace-requirements", response_model=TransferMarketplaceRequirementsResponse)
def read_transfer_marketplace_requirements(
    shipment_id: int,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        result = transferencias_service.evaluate_marketplace_requirements(
            db,
            shipment_id=shipment_id,
            empresa_id=effective_empresa_id,
            actor_user_id=current_user.id,
            revalidate=False,
        )
        return TransferMarketplaceRequirementsResponse(**result)
    except TransferPolicyError as exc:
        raise _policy_error_to_http(exc) from exc


@router.post("/shipments/{shipment_id}/marketplace-requirements/revalidate", response_model=TransferMarketplaceRequirementsResponse)
def revalidate_transfer_marketplace_requirements(
    shipment_id: int,
    empresa_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    try:
        effective_empresa_id = transferencias_service.resolve_effective_empresa_id(db, current_user, empresa_id=empresa_id)
        result = transferencias_service.evaluate_marketplace_requirements(
            db,
            shipment_id=shipment_id,
            empresa_id=effective_empresa_id,
            actor_user_id=current_user.id,
            revalidate=True,
        )
        db.commit()
        return TransferMarketplaceRequirementsResponse(**result)
    except TransferPolicyError as exc:
        db.rollback()
        raise _policy_error_to_http(exc) from exc


@router.post("/admin/sanitize-codes", response_model=TransferSanitizeCodesResponse)
def sanitize_transfer_admin_codes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if transferencias_service.role_key(current_user.rol) != "superadministrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")
    result = transferencias_service.sanitize_admin_public_codes(db)
    db.commit()
    return TransferSanitizeCodesResponse(**result)


@router.post("/admin/sanitize-company-codes", response_model=TransferCompanySanitizeCodesResponse)
def sanitize_transfer_company_codes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if transferencias_service.role_key(current_user.rol) != "superadministrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")
    result = transferencias_service.sanitize_company_public_codes(db)
    db.commit()
    return TransferCompanySanitizeCodesResponse(**result)
