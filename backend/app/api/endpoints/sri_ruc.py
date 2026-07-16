import hashlib
import ipaddress
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.database import get_db
from app.models.sri_ruc import RucManualVerification, SriRucLookupAttempt, SriRucDatasetVersion
from app.models.usuario import Usuario
from app.schemas.sri_ruc import RucManualDecisionIn, RucManualRequestIn, SriRucQualityActivationIn
from app.services.ruc_manual import create_or_resume_request, decide_request, decrypt_certificate_code, get_status
from app.services.sri_ruc import activate_version, canonical_ruc_is_valid, catalog_status, lookup_ruc, sync_province
from app.services.audit_event import record_audit_event


router = APIRouter()


def _lookup_client_address(request: Request) -> str:
    forwarded = [item.strip() for item in (request.headers.get("x-forwarded-for") or "").split(",") if item.strip()]
    for candidate in reversed(forwarded):
        try:
            address = ipaddress.ip_address(candidate)
        except ValueError:
            continue
        if address.is_global:
            return str(address)

    for candidate in (request.headers.get("x-real-ip"), request.client.host if request.client else None):
        if not candidate:
            continue
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            continue
    return "unknown"


def _require_superadmin(user: Usuario) -> None:
    if (user.rol or "").strip().lower() != "superadministrador":
        raise HTTPException(status_code=403, detail="Solo superadministrador.")


def _rate_limit_lookup(db: Session, request: Request) -> None:
    address = _lookup_client_address(request)
    ip_hash = hashlib.sha256(f"{settings.SECRET_KEY}:{address}".encode("utf-8")).hexdigest()
    since = datetime.now(timezone.utc) - timedelta(hours=1)
    count = db.query(func.count(SriRucLookupAttempt.id)).filter(
        SriRucLookupAttempt.ip_hash == ip_hash,
        SriRucLookupAttempt.created_at >= since,
    ).scalar() or 0
    if count >= settings.SRI_RUC_LOOKUPS_PER_IP_HOUR:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Límite temporal de consultas alcanzado.")
    db.add(SriRucLookupAttempt(ip_hash=ip_hash))
    db.commit()


@router.get("/public/lookup/{ruc}")
def public_lookup_ruc(ruc: str, request: Request, db: Session = Depends(get_db)) -> dict:
    _rate_limit_lookup(db, request)
    if not canonical_ruc_is_valid(ruc):
        return {"valid": False, "verification_status": "invalid_format", "message": "El RUC debe contener exactamente 13 dígitos."}
    result = lookup_ruc(db, ruc)
    if not result:
        return {
            "valid": False,
            "verification_status": "manual_review_available",
            "message": "El RUC no consta en la importación vigente. Puede solicitar verificación; el estado será En revisión manual.",
            "requires_manual_review": True,
        }
    return {
        "valid": True,
        "verification_status": "verified",
        "message": "RUC verificado con la fuente fiscal disponible.",
        "requires_manual_review": False,
        "ruc": result["ruc"],
        "business_name": result["business_name"],
        "taxpayer_status": result.get("status"),
        "taxpayer_type": result.get("taxpayer_type"),
        "start_date": result.get("start_date"),
        "economic_activity": result.get("economic_activity"),
        "source": result.get("source"),
        "source_date": result.get("source_date"),
    }


@router.post("/public/manual-review")
def request_manual_review(payload: RucManualRequestIn, db: Session = Depends(get_db)) -> dict:
    if not canonical_ruc_is_valid(payload.ruc):
        raise HTTPException(status_code=400, detail="El RUC debe contener exactamente 13 dígitos.")
    if lookup_ruc(db, payload.ruc):
        return {"status": "already_verified", "message": "El RUC ya está disponible para registro."}
    return create_or_resume_request(
        db,
        ruc=payload.ruc,
        email=str(payload.email),
        certificate_code=payload.certificate_code,
    )


@router.get("/public/manual-review/status")
def manual_review_status(token: str = Query(..., min_length=16), db: Session = Depends(get_db)) -> dict:
    item = get_status(db, token)
    messages = {
        "pending": "En revisión manual.",
        "approved": "RUC aprobado. Revisa tu correo para continuar el registro.",
        "rejected": "La solicitud fue rechazada; puede presentar una nueva solicitud.",
        "expired": "La solicitud expiró; puede presentar una nueva solicitud.",
    }
    return {"status": item.status, "message": messages.get(item.status, item.status), "approval_expires_at": item.approval_expires_at}


@router.get("/admin/status")
def admin_catalog_status(
    db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)
) -> dict:
    _require_superadmin(current_user)
    result = catalog_status(db)
    result["pending_manual_reviews"] = db.query(func.count(RucManualVerification.id)).filter_by(status="pending").scalar() or 0
    return result


@router.get("/admin/manual-reviews")
def list_manual_reviews(
    review_status: str = Query("pending", alias="status"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> list[dict]:
    _require_superadmin(current_user)
    items = db.query(RucManualVerification).filter_by(status=review_status).order_by(RucManualVerification.created_at.asc()).all()
    return [
        {
            "id": item.id,
            "ruc": item.ruc,
            "email": item.email,
            "status": item.status,
            "created_at": item.created_at,
            "expires_at": item.expires_at,
            "certificate_hash": item.certificate_hash,
            "certificate_code": decrypt_certificate_code(item),
        }
        for item in items
    ]


@router.post("/admin/manual-reviews/{review_id}/decision")
def review_manual_request(
    review_id: int,
    payload: RucManualDecisionIn,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> dict:
    _require_superadmin(current_user)
    item = db.query(RucManualVerification).filter_by(id=review_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada.")
    result = decide_request(
        db,
        item=item,
        approved=payload.approved,
        reviewer_id=current_user.id,
        data=payload.model_dump(),
    )
    record_audit_event(
        db,
        module="sri_ruc",
        event_type="manual_ruc_review_decided",
        severity="warning",
        actor=current_user,
        entity_type="ruc_manual_verification",
        entity_id=item.id,
        message=f"Revisión fiscal manual resuelta: {result['status']}",
        payload={"review_id": item.id, "decision": result["status"]},
    )
    return result


@router.post("/admin/sync/{province_code}")
def sync_catalog_province(
    province_code: str,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> dict:
    _require_superadmin(current_user)
    return sync_province(db, province_code, force=force)


@router.post("/admin/versions/{version_id}/activate-quality-review")
def force_quality_activation(
    version_id: int,
    payload: SriRucQualityActivationIn,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> dict:
    _require_superadmin(current_user)
    version = db.query(SriRucDatasetVersion).filter_by(id=version_id).first()
    if not version or version.status != "quality_review" or version.error_code != "quality_gate":
        raise HTTPException(status_code=409, detail="Solo puede forzarse una revisión de calidad no estructural.")
    version.error_message = f"Activación forzada por usuario {current_user.id}: {payload.justification}"
    db.commit()
    activated = activate_version(db, version_id, force_quality=True)
    record_audit_event(
        db,
        module="sri_ruc",
        event_type="sri_quality_gate_forced",
        severity="warning",
        actor=current_user,
        entity_type="sri_ruc_dataset_version",
        entity_id=version_id,
        message=f"Activación fiscal forzada para provincia {activated.province_code}",
        payload={"version_id": version_id, "justification": payload.justification},
    )
    return {"status": activated.status, "version_id": activated.id}
