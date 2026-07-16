from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.sri_ruc import RucManualVerification, SriRucVerifiedOverride
from app.utils.email_utils import send_transactional_email


ACTIVE_STATUSES = {"pending", "approved"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _secret() -> str:
    value = (settings.RUC_REVIEW_ENCRYPTION_KEY or "").strip()
    if not value:
        raise RuntimeError("RUC_REVIEW_ENCRYPTION_KEY no está configurada.")
    return value


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(_secret().encode("utf-8")).digest())
    return Fernet(key)


def token_hash(token: str) -> str:
    return hashlib.sha256(f"{_secret()}:{token}".encode("utf-8")).hexdigest()


def certificate_hash(code: str) -> str:
    return hashlib.sha256(code.strip().encode("utf-8")).hexdigest()


def decrypt_certificate_code(item: RucManualVerification) -> str | None:
    if not item.encrypted_certificate_code:
        return None
    return _fernet().decrypt(item.encrypted_certificate_code.encode("ascii")).decode("utf-8")


def _send_status_email(email: str, raw_token: str) -> bool:
    base_url = settings.FRONTEND_PUBLIC_URL.rstrip("/")
    try:
        result = send_transactional_email(
            to_email=email,
            subject="Estado de revisión de RUC - GiProy",
            body=(
                "Tu solicitud de verificación de RUC está En revisión manual.\n\n"
                f"Consulta su estado de forma segura en: {base_url}/ruc-review?token={raw_token}\n\n"
                "El plazo objetivo de respuesta es de un día laborable."
            ),
        )
        return bool(result.get("success"))
    except Exception:
        return False


def _send_registration_email(email: str, raw_token: str) -> bool:
    try:
        result = send_transactional_email(
            to_email=email,
            subject="RUC aprobado para registro - GiProy",
            body=(
                "El RUC fue aprobado. El enlace es de un solo uso y caduca en 72 horas:\n\n"
                f"{settings.FRONTEND_PUBLIC_URL.rstrip('/')}/login?register=1&ruc_verification_token={raw_token}"
            ),
        )
        return bool(result.get("success"))
    except Exception:
        return False


def create_or_resume_request(db: Session, *, ruc: str, email: str, certificate_code: str) -> dict:
    now = _now()
    normalized_email = email.strip().lower()
    existing = (
        db.query(RucManualVerification)
        .filter(RucManualVerification.ruc == ruc, RucManualVerification.status.in_(ACTIVE_STATUSES))
        .order_by(RucManualVerification.id.desc())
        .first()
    )
    if existing:
        if existing.email != normalized_email:
            return {"status": "received", "message": "Si la solicitud puede procesarse, enviaremos instrucciones al correo indicado."}
        status_token = secrets.token_urlsafe(32)
        existing.status_token_hash = token_hash(status_token)
        existing.updated_at = now
        registration_token = None
        approval_expiry = _as_utc(existing.approval_expires_at)
        if existing.status == "approved" and approval_expiry and approval_expiry > now:
            registration_token = secrets.token_urlsafe(32)
            existing.registration_token_hash = token_hash(registration_token)
            existing.registration_token_expires_at = now + timedelta(hours=72)
            existing.registration_token_used_at = None
        db.commit()
        sent = _send_registration_email(normalized_email, registration_token) if registration_token else _send_status_email(normalized_email, status_token)
        existing.email_delivery_status = "sent" if sent else "failed"
        db.commit()
        return {"status": existing.status, "message": "La solicitud existente continúa En revisión manual."}

    since = now - timedelta(hours=24)
    recent_count = db.query(func.count(RucManualVerification.id)).filter(
        RucManualVerification.created_at >= since,
        (RucManualVerification.ruc == ruc) | (func.lower(RucManualVerification.email) == normalized_email),
    ).scalar() or 0
    if recent_count >= 3:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Se alcanzó el límite temporal de solicitudes.")

    status_token = secrets.token_urlsafe(32)
    item = RucManualVerification(
        ruc=ruc,
        email=normalized_email,
        status="pending",
        encrypted_certificate_code=_fernet().encrypt(certificate_code.strip().encode("utf-8")).decode("ascii"),
        certificate_hash=certificate_hash(certificate_code),
        status_token_hash=token_hash(status_token),
        expires_at=now + timedelta(days=30),
    )
    db.add(item)
    db.commit()
    item.email_delivery_status = "sent" if _send_status_email(normalized_email, status_token) else "failed"
    db.commit()
    return {"status": "pending", "message": "Solicitud recibida. Estado: En revisión manual."}


def get_status(db: Session, raw_token: str) -> RucManualVerification:
    item = db.query(RucManualVerification).filter(
        RucManualVerification.status_token_hash == token_hash(raw_token)
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada.")
    now = _now()
    if item.status == "pending" and _as_utc(item.expires_at) <= now:
        item.status = "expired"
        item.encrypted_certificate_code = None
        db.commit()
    return item


def consume_registration_token(db: Session, *, raw_token: str, ruc: str, email: str) -> RucManualVerification | None:
    item = db.query(RucManualVerification).filter(
        RucManualVerification.registration_token_hash == token_hash(raw_token),
        RucManualVerification.ruc == ruc,
        func.lower(RucManualVerification.email) == email.lower(),
        RucManualVerification.status == "approved",
        RucManualVerification.registration_token_used_at.is_(None),
    ).first()
    now = _now()
    if not item or not item.registration_token_expires_at or _as_utc(item.registration_token_expires_at) <= now:
        return None
    if not item.approval_expires_at or _as_utc(item.approval_expires_at) <= now:
        return None
    return item


def mark_registration_token_used(db: Session, item: RucManualVerification) -> None:
    item.registration_token_used_at = _now()
    db.commit()


def decide_request(db: Session, *, item: RucManualVerification, approved: bool, reviewer_id: int, data: dict) -> dict:
    if item.status != "pending" or _as_utc(item.expires_at) <= _now():
        raise HTTPException(status_code=409, detail="La solicitud ya no está pendiente.")
    now = _now()
    item.reviewed_by_user_id = reviewer_id
    item.reviewed_at = now
    item.encrypted_certificate_code = None
    if not approved:
        if not data.get("rejection_reason"):
            raise HTTPException(status_code=400, detail="El motivo estructurado de rechazo es obligatorio.")
        item.status = "rejected"
        item.rejection_reason = data["rejection_reason"]
        item.rejection_note = data.get("rejection_note")
        db.commit()
        try:
            send_transactional_email(
                to_email=item.email,
                subject="Resultado de revisión de RUC - GiProy",
                body=f"La solicitud fue rechazada. Motivo: {item.rejection_reason}. Puede presentar una nueva solicitud.",
            )
        except Exception:
            item.email_delivery_status = "failed"
            db.commit()
        return {"status": "rejected"}

    business_name = (data.get("business_name") or "").strip()
    if not business_name:
        raise HTTPException(status_code=400, detail="La razón social verificada es obligatoria.")
    raw_registration_token = secrets.token_urlsafe(32)
    item.status = "approved"
    item.business_name = business_name
    item.taxpayer_status = data.get("taxpayer_status")
    item.taxpayer_type = data.get("taxpayer_type")
    item.start_date = data.get("start_date")
    item.economic_activity = data.get("economic_activity")
    item.approval_expires_at = now + timedelta(days=30)
    item.registration_token_hash = token_hash(raw_registration_token)
    item.registration_token_expires_at = now + timedelta(hours=72)
    override = db.query(SriRucVerifiedOverride).filter_by(ruc=item.ruc).first()
    if override is None:
        override = SriRucVerifiedOverride(ruc=item.ruc, certificate_hash=item.certificate_hash)
        db.add(override)
    override.business_name = business_name
    override.taxpayer_status = item.taxpayer_status
    override.taxpayer_type = item.taxpayer_type
    override.start_date = item.start_date
    override.economic_activity = item.economic_activity
    override.certificate_hash = item.certificate_hash
    override.verified_by_user_id = reviewer_id
    override.verified_at = now
    override.reconciled_at = None
    db.commit()
    item.email_delivery_status = "sent" if _send_registration_email(item.email, raw_registration_token) else "failed"
    db.commit()
    return {"status": "approved", "email_delivery_status": item.email_delivery_status}
