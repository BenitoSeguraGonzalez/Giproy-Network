from __future__ import annotations

import smtplib
from email.message import EmailMessage

from app.core.config import settings


SMTP_CONFIG_KEYS = {
    "EMAIL_BACKEND",
    "EMAIL_FROM_EMAIL",
    "EMAIL_FROM_NAME",
    "FRONTEND_PUBLIC_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_USE_TLS",
    "SMTP_USE_SSL",
    "GMAIL_2SV_CONFIRMED",
    "GMAIL_APP_PASSWORD_CONFIRMED",
}


def _parse_bool(value, fallback=False) -> bool:
    if value is None:
        return fallback
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def _load_persisted_email_config() -> dict:
    try:
        from app.core.database import SessionLocal
        from app.models.system_config import SystemConfig
    except Exception:
        return {}

    db = SessionLocal()
    try:
        rows = db.query(SystemConfig).filter(SystemConfig.clave.in_(SMTP_CONFIG_KEYS)).all()
        return {row.clave: row.valor for row in rows if row.valor is not None}
    except Exception:
        return {}
    finally:
        db.close()


def get_effective_email_config(overrides: dict | None = None) -> dict:
    persisted = _load_persisted_email_config()
    merged = {
        "EMAIL_BACKEND": settings.EMAIL_BACKEND,
        "EMAIL_FROM_EMAIL": settings.EMAIL_FROM_EMAIL,
        "EMAIL_FROM_NAME": settings.EMAIL_FROM_NAME,
        "FRONTEND_PUBLIC_URL": settings.FRONTEND_PUBLIC_URL,
        "SMTP_HOST": settings.SMTP_HOST,
        "SMTP_PORT": settings.SMTP_PORT,
        "SMTP_USERNAME": settings.SMTP_USERNAME,
        "SMTP_PASSWORD": settings.SMTP_PASSWORD,
        "SMTP_USE_TLS": settings.SMTP_USE_TLS,
        "SMTP_USE_SSL": settings.SMTP_USE_SSL,
    }
    merged.update({key: value for key, value in persisted.items() if key in merged})
    if overrides:
        merged.update({key: value for key, value in overrides.items() if key in merged})

    merged["EMAIL_BACKEND"] = str(merged.get("EMAIL_BACKEND") or "mock").strip().lower()
    merged["SMTP_PORT"] = int(merged.get("SMTP_PORT") or 587)
    merged["SMTP_USE_TLS"] = _parse_bool(merged.get("SMTP_USE_TLS"), True)
    merged["SMTP_USE_SSL"] = _parse_bool(merged.get("SMTP_USE_SSL"), False)
    return merged


def send_transactional_email(
    *,
    to_email: str,
    subject: str,
    body: str,
    from_email: str | None = None,
    from_name: str | None = None,
) -> dict:
    config = get_effective_email_config()
    backend = config["EMAIL_BACKEND"]
    sender_email = from_email or config["EMAIL_FROM_EMAIL"]
    sender_name = from_name or config["EMAIL_FROM_NAME"]
    sender = f"{sender_name} <{sender_email}>" if sender_name else sender_email

    if backend != "smtp":
        return {
            "success": True,
            "backend": "mock",
            "to_email": to_email,
            "subject": subject,
            "body": body,
        }

    if not config["SMTP_HOST"]:
        raise RuntimeError("SMTP_HOST no configurado para EMAIL_BACKEND=smtp.")

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    smtp_class = smtplib.SMTP_SSL if config["SMTP_USE_SSL"] else smtplib.SMTP
    with smtp_class(config["SMTP_HOST"], config["SMTP_PORT"], timeout=20) as smtp:
        if config["SMTP_USE_TLS"] and not config["SMTP_USE_SSL"]:
            smtp.starttls()
        if config["SMTP_USERNAME"]:
            smtp.login(config["SMTP_USERNAME"], config["SMTP_PASSWORD"] or "")
        smtp.send_message(message)

    return {
        "success": True,
        "backend": "smtp",
        "to_email": to_email,
        "subject": subject,
    }


def send_reset_password_email(email: str, token: str):
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    result = send_transactional_email(
        to_email=email,
        subject="Restablecer contrasena - GiProy",
        body=f"Para restablecer su contrasena, use el siguiente enlace:\n\n{reset_link}",
    )
    return bool(result.get("success"))


def send_registration_verification_email(
    *,
    email: str,
    token: str,
    empresa_nombre: str,
    valid_hours: int = 48,
) -> bool:
    email_config = get_effective_email_config()
    frontend_url = (email_config.get("FRONTEND_PUBLIC_URL") or "http://localhost:3010").rstrip("/")
    verification_link = f"{frontend_url}/verify-registration?token={token}"
    result = send_transactional_email(
        to_email=email,
        subject="Valida tu empresa en GiProy",
        body=(
            "Bienvenido a GiProy.\n\n"
            f"Se ha solicitado crear la empresa {empresa_nombre} con este correo como administrador.\n"
            "Para activar la empresa y permitir el acceso, valida el email desde este enlace:\n\n"
            f"{verification_link}\n\n"
            f"El enlace caduca en {valid_hours} horas. Si no solicitaste este registro, ignora este mensaje."
        ),
    )
    return bool(result.get("success")) and result.get("backend") == "smtp"
