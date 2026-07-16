from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.license_notification import (
    LicenseNotificationDispatchResponse,
    LicenseNotificationHousekeepingResponse,
    LicenseNotificationListResponse,
    LicenseNotificationResponse,
)
from app.services.license_notifications import license_notification_service


router = APIRouter()


def _is_superadmin(user: Usuario) -> bool:
    return (user.rol or "").strip().lower() == "superadministrador"


def _serialize(event) -> LicenseNotificationResponse:
    return LicenseNotificationResponse(**license_notification_service.serialize_event(event))


@router.get("/me", response_model=LicenseNotificationListResponse)
def read_my_pending_license_notifications(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    events = license_notification_service.list_pending_in_app_for_user(db, current_user)
    return LicenseNotificationListResponse(items=[_serialize(event) for event in events])


@router.post("/{event_id}/ack", response_model=LicenseNotificationResponse)
def acknowledge_my_license_notification(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    event = license_notification_service.acknowledge_in_app_event(db, event_id=event_id, user=current_user)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aviso no encontrado.")
    db.commit()
    db.refresh(event)
    return _serialize(event)


@router.post("/dispatch-email", response_model=LicenseNotificationDispatchResponse)
def dispatch_pending_license_notification_emails(
    limit: int = Query(default=50, ge=1, le=200),
    notification_type: str | None = Query(default=None),
    retry_failed: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")
    events = license_notification_service.dispatch_pending_email_events(
        db,
        limit=limit,
        notification_type=notification_type,
        retry_failed=retry_failed,
    )
    db.commit()
    for event in events:
        db.refresh(event)
    return LicenseNotificationDispatchResponse(
        dispatched_count=len(events),
        items=[_serialize(event) for event in events],
    )


@router.post("/housekeeping/purchase-lifecycle", response_model=LicenseNotificationHousekeepingResponse)
def run_purchase_lifecycle_notification_housekeeping(
    empresa_id: int | None = Query(default=None),
    dispatch_email: bool = Query(default=False),
    dispatch_limit: int = Query(default=50, ge=1, le=200),
    retry_failed: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")
    result = license_notification_service.run_purchase_lifecycle_housekeeping(
        db,
        empresa_id=empresa_id,
        dispatch_email=dispatch_email,
        dispatch_limit=dispatch_limit,
        retry_failed=retry_failed,
    )
    db.commit()
    queued_events = result["queued_events"]
    dispatched_events = result["dispatched_events"]
    for event in queued_events + dispatched_events:
        db.refresh(event)
    return LicenseNotificationHousekeepingResponse(
        queued_count=len(queued_events),
        dispatched_count=len(dispatched_events),
        queued_purchase_count=len(queued_events),
        queued_license_count=0,
        queued_items=[_serialize(event) for event in queued_events],
        queued_purchase_items=[_serialize(event) for event in queued_events],
        queued_license_items=[],
        dispatched_items=[_serialize(event) for event in dispatched_events],
    )


@router.post("/housekeeping/run", response_model=LicenseNotificationHousekeepingResponse)
def run_license_notification_housekeeping(
    empresa_id: int | None = Query(default=None),
    dispatch_email: bool = Query(default=False),
    dispatch_limit: int = Query(default=50, ge=1, le=200),
    notification_type: str | None = Query(default=None),
    retry_failed: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
):
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operacion permitida solo para Superadministradores.")
    result = license_notification_service.run_notification_housekeeping(
        db,
        empresa_id=empresa_id,
        dispatch_email=dispatch_email,
        dispatch_limit=dispatch_limit,
        notification_type=notification_type,
        retry_failed=retry_failed,
    )
    db.commit()
    queued_purchase_events = result["queued_purchase_events"]
    queued_license_events = result["queued_license_events"]
    dispatched_events = result["dispatched_events"]
    all_queued = queued_purchase_events + queued_license_events
    for event in all_queued + dispatched_events:
        db.refresh(event)
    return LicenseNotificationHousekeepingResponse(
        queued_count=len(all_queued),
        dispatched_count=len(dispatched_events),
        queued_purchase_count=len(queued_purchase_events),
        queued_license_count=len(queued_license_events),
        queued_items=[_serialize(event) for event in all_queued],
        queued_purchase_items=[_serialize(event) for event in queued_purchase_events],
        queued_license_items=[_serialize(event) for event in queued_license_events],
        dispatched_items=[_serialize(event) for event in dispatched_events],
    )
