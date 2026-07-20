import base64
import hashlib
import hmac
import ipaddress
import json
import secrets
import socket
from datetime import datetime, timedelta, timezone
from typing import Callable
from urllib.parse import urlsplit

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.bim_integration_gateway import BimIntegrationDelivery, BimIntegrationSubscription
from app.schemas.bim_integration_gateway import (
    BimIntegrationDeliveryResponse,
    BimIntegrationSubscriptionCreate,
    BimIntegrationSubscriptionResponse,
    BimIntegrationSubscriptionTransition,
)

SUPPORTED_EVENTS = {"erp.package.published"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _canonical(payload: dict) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def _fernet() -> Fernet:
    material = hashlib.sha256(f"giproy-bim-integration:{settings.SECRET_KEY}".encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(material))


def _resolve_target_addresses(hostname: str) -> set[str]:
    return {item[4][0] for item in socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)}


def _validate_target_url(value: str) -> str:
    normalized = value.strip()
    parsed = urlsplit(normalized)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise HTTPException(status_code=422, detail="El webhook BIM requiere URL HTTPS publica sin credenciales ni fragmento.")
    try:
        addresses = _resolve_target_addresses(parsed.hostname)
    except OSError as exc:
        raise HTTPException(status_code=422, detail="El destino webhook BIM no resuelve a una direccion publica.") from exc
    if not addresses:
        raise HTTPException(status_code=422, detail="El destino webhook BIM no resuelve a una direccion publica.")
    for address in addresses:
        ip = ipaddress.ip_address(address.split("%", 1)[0])
        if not ip.is_global:
            raise HTTPException(status_code=422, detail="El destino webhook BIM no puede usar redes privadas o reservadas.")
    return normalized


def _subscription_response(value: BimIntegrationSubscription, secret_once: str | None = None) -> BimIntegrationSubscriptionResponse:
    return BimIntegrationSubscriptionResponse(
        id=value.id,
        project_id=value.proyecto_id,
        company_id=value.empresa_id,
        label=value.label,
        target_url=value.target_url,
        event_types=list(value.event_types_json or []),
        status=value.status,
        secret_hint=value.secret_hint,
        secret_once=secret_once,
        lock_version=value.lock_version,
        created_by=value.created_by,
        created_at=value.created_at,
        updated_at=value.updated_at,
    )


def _delivery_response(value: BimIntegrationDelivery) -> BimIntegrationDeliveryResponse:
    return BimIntegrationDeliveryResponse(
        id=value.id,
        project_id=value.proyecto_id,
        company_id=value.empresa_id,
        subscription_id=value.subscription_id,
        event_id=value.event_id,
        event_type=value.event_type,
        payload_checksum_sha256=value.payload_checksum_sha256,
        status=value.status,
        attempt_count=value.attempt_count,
        max_attempts=value.max_attempts,
        next_attempt_at=value.next_attempt_at,
        last_http_status=value.last_http_status,
        last_error_code=value.last_error_code,
        created_at=value.created_at,
        delivered_at=value.delivered_at,
    )


def list_integration_subscriptions(db: Session, *, project_id: int, company_id: int) -> list[BimIntegrationSubscriptionResponse]:
    values = db.query(BimIntegrationSubscription).filter(
        BimIntegrationSubscription.proyecto_id == project_id,
        BimIntegrationSubscription.empresa_id == company_id,
    ).order_by(BimIntegrationSubscription.id.desc()).all()
    return [_subscription_response(value) for value in values]


def create_integration_subscription(db: Session, *, project_id: int, company_id: int, user_id: int, payload: BimIntegrationSubscriptionCreate) -> BimIntegrationSubscriptionResponse:
    target_url = _validate_target_url(payload.target_url)
    event_types = sorted(set(payload.event_types))
    if not event_types or not set(event_types).issubset(SUPPORTED_EVENTS):
        raise HTTPException(status_code=422, detail="La suscripcion contiene eventos BIM no soportados.")
    raw_secret = secrets.token_urlsafe(32)
    value = BimIntegrationSubscription(
        empresa_id=company_id,
        proyecto_id=project_id,
        label=payload.label.strip(),
        target_url=target_url,
        event_types_json=event_types,
        encrypted_secret=_fernet().encrypt(raw_secret.encode("utf-8")).decode("ascii"),
        secret_hint=raw_secret[-8:],
        status="active",
        lock_version=1,
        created_by=user_id,
    )
    db.add(value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una suscripcion BIM para este destino.") from exc
    db.refresh(value)
    return _subscription_response(value, secret_once=raw_secret)


def transition_integration_subscription(db: Session, *, subscription_id: int, project_id: int, company_id: int, payload: BimIntegrationSubscriptionTransition) -> BimIntegrationSubscriptionResponse:
    value = db.query(BimIntegrationSubscription).filter(
        BimIntegrationSubscription.id == subscription_id,
        BimIntegrationSubscription.proyecto_id == project_id,
        BimIntegrationSubscription.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Suscripcion de integracion BIM no encontrada.")
    if value.lock_version != payload.expected_lock_version:
        raise HTTPException(status_code=409, detail="La suscripcion BIM fue modificada por otro usuario.")
    value.status = payload.status
    value.lock_version += 1
    value.updated_at = _now()
    db.commit()
    db.refresh(value)
    return _subscription_response(value)


def enqueue_integration_event(db: Session, *, project_id: int, company_id: int, event_type: str, event_key: str, data: dict) -> list[int]:
    if event_type not in SUPPORTED_EVENTS:
        raise ValueError(f"Unsupported BIM integration event: {event_type}")
    occurred_at = _now()
    event_id = hashlib.sha256(f"{company_id}:{project_id}:{event_key}".encode("utf-8")).hexdigest()
    envelope = {
        "contract_version": "giproy_bim_integration_event_v1",
        "event_id": event_id,
        "event_type": event_type,
        "occurred_at": occurred_at.isoformat(),
        "project_id": project_id,
        "company_id": company_id,
        "data": data,
    }
    checksum = hashlib.sha256(_canonical(envelope)).hexdigest()
    subscriptions = db.query(BimIntegrationSubscription).filter(
        BimIntegrationSubscription.proyecto_id == project_id,
        BimIntegrationSubscription.empresa_id == company_id,
        BimIntegrationSubscription.status == "active",
    ).all()
    ids = []
    for subscription in subscriptions:
        if event_type not in (subscription.event_types_json or []):
            continue
        existing = db.query(BimIntegrationDelivery.id).filter(
            BimIntegrationDelivery.subscription_id == subscription.id,
            BimIntegrationDelivery.event_key == event_key,
        ).scalar()
        if existing:
            ids.append(existing)
            continue
        delivery = BimIntegrationDelivery(
            empresa_id=company_id,
            proyecto_id=project_id,
            subscription_id=subscription.id,
            event_id=event_id,
            event_type=event_type,
            event_key=event_key,
            payload_json=envelope,
            payload_checksum_sha256=checksum,
            status="pending",
            attempt_count=0,
            max_attempts=8,
            next_attempt_at=occurred_at,
        )
        db.add(delivery)
        db.flush()
        ids.append(delivery.id)
    return ids


def list_integration_deliveries(db: Session, *, project_id: int, company_id: int) -> list[BimIntegrationDeliveryResponse]:
    values = db.query(BimIntegrationDelivery).filter(
        BimIntegrationDelivery.proyecto_id == project_id,
        BimIntegrationDelivery.empresa_id == company_id,
    ).order_by(BimIntegrationDelivery.id.desc()).limit(200).all()
    return [_delivery_response(value) for value in values]


def _http_post(url: str, body: bytes, headers: dict[str, str]) -> int:
    with httpx.Client(timeout=10.0, follow_redirects=False) as client:
        return client.post(url, content=body, headers=headers).status_code


def dispatch_integration_delivery(db: Session, *, delivery_id: int, project_id: int, company_id: int, force: bool = False, sender: Callable[[str, bytes, dict[str, str]], int] | None = None) -> BimIntegrationDeliveryResponse:
    value = db.query(BimIntegrationDelivery).filter(
        BimIntegrationDelivery.id == delivery_id,
        BimIntegrationDelivery.proyecto_id == project_id,
        BimIntegrationDelivery.empresa_id == company_id,
    ).with_for_update().first()
    if not value:
        raise HTTPException(status_code=404, detail="Entrega de integracion BIM no encontrada.")
    if value.status == "delivered":
        return _delivery_response(value)
    if value.status == "delivering":
        raise HTTPException(status_code=409, detail="La entrega BIM ya esta siendo procesada.")
    now = _now()
    next_attempt = value.next_attempt_at
    if next_attempt.tzinfo is None:
        next_attempt = next_attempt.replace(tzinfo=timezone.utc)
    if not force and next_attempt > now:
        raise HTTPException(status_code=409, detail="La entrega BIM aun no alcanza su siguiente reintento.")
    subscription = db.query(BimIntegrationSubscription).filter(
        BimIntegrationSubscription.id == value.subscription_id,
        BimIntegrationSubscription.empresa_id == company_id,
        BimIntegrationSubscription.proyecto_id == project_id,
        BimIntegrationSubscription.status == "active",
    ).first()
    if not subscription:
        value.status = "dead"
        value.last_error_code = "subscription_inactive"
        db.commit()
        db.refresh(value)
        return _delivery_response(value)
    value.status = "delivering"
    value.attempt_count += 1
    db.commit()
    try:
        target_url = _validate_target_url(subscription.target_url)
        try:
            secret = _fernet().decrypt(subscription.encrypted_secret.encode("ascii")).decode("utf-8")
        except InvalidToken as exc:
            raise RuntimeError("secret_unreadable") from exc
        body = _canonical(value.payload_json)
        if hashlib.sha256(body).hexdigest() != value.payload_checksum_sha256:
            raise RuntimeError("payload_checksum_mismatch")
        signature = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "GiProy-BIM-Gateway/1.0",
            "X-GiProy-Event": value.event_type,
            "X-GiProy-Delivery": value.event_id,
            "X-GiProy-Signature": f"sha256={signature}",
        }
        http_status = (sender or _http_post)(target_url, body, headers)
        value.last_http_status = int(http_status)
        if 200 <= value.last_http_status < 300:
            value.status = "delivered"
            value.delivered_at = _now()
            value.last_error_code = None
        else:
            value.last_error_code = f"http_{value.last_http_status}"
            value.status = "dead" if value.attempt_count >= value.max_attempts else "retry"
    except HTTPException:
        value.last_error_code = "target_rejected"
        value.status = "dead" if value.attempt_count >= value.max_attempts else "retry"
    except RuntimeError as exc:
        value.last_error_code = str(exc) if str(exc) in {"secret_unreadable", "payload_checksum_mismatch"} else "transport_error"
        value.status = "dead" if value.attempt_count >= value.max_attempts else "retry"
    except (httpx.HTTPError, OSError, ValueError):
        value.last_error_code = "transport_error"
        value.status = "dead" if value.attempt_count >= value.max_attempts else "retry"
    except Exception:
        value.last_error_code = "transport_error"
        value.status = "dead" if value.attempt_count >= value.max_attempts else "retry"
    if value.status == "retry":
        value.next_attempt_at = _now() + timedelta(minutes=min(2 ** value.attempt_count, 60))
    db.commit()
    db.refresh(value)
    return _delivery_response(value)


def dispatch_due_integration_deliveries(*, project_id: int, company_id: int, limit: int = 20) -> None:
    db = SessionLocal()
    try:
        now = _now()
        ids = [row[0] for row in db.query(BimIntegrationDelivery.id).filter(
            BimIntegrationDelivery.proyecto_id == project_id,
            BimIntegrationDelivery.empresa_id == company_id,
            BimIntegrationDelivery.status.in_(["pending", "retry"]),
            BimIntegrationDelivery.next_attempt_at <= now,
        ).order_by(BimIntegrationDelivery.id).limit(limit).all()]
        for delivery_id in ids:
            try:
                dispatch_integration_delivery(db, delivery_id=delivery_id, project_id=project_id, company_id=company_id)
            except HTTPException:
                db.rollback()
    finally:
        db.close()
