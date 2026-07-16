import smtplib
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.usuario import Usuario
from app.models.system_config import SystemConfig
from app.utils.email_utils import SMTP_CONFIG_KEYS, get_effective_email_config, send_transactional_email

router = APIRouter()

SECRET_CONFIG_KEYS = {"SMTP_PASSWORD"}
SMTP_DESCRIPTIONS = {
    "EMAIL_BACKEND": "Backend de email transaccional: smtp o mock.",
    "EMAIL_FROM_EMAIL": "Remitente corporativo para emails transaccionales.",
    "EMAIL_FROM_NAME": "Nombre visible del remitente corporativo.",
    "FRONTEND_PUBLIC_URL": "URL pública del frontend usada en enlaces de validación.",
    "SMTP_HOST": "Servidor SMTP corporativo.",
    "SMTP_PORT": "Puerto SMTP corporativo.",
    "SMTP_USERNAME": "Usuario SMTP corporativo.",
    "SMTP_PASSWORD": "Password SMTP corporativo.",
    "SMTP_USE_TLS": "Usar STARTTLS para SMTP.",
    "SMTP_USE_SSL": "Usar SMTP SSL directo.",
    "GMAIL_2SV_CONFIRMED": "Confirmacion operativa de verificacion en 2 pasos activa para Gmail.",
    "GMAIL_APP_PASSWORD_CONFIRMED": "Confirmacion operativa de contrasena de aplicacion Gmail generada.",
}


def _is_superadmin(user: Usuario) -> bool:
    return bool(user and user.rol and user.rol.lower() == "superadministrador")


def _is_gmail_smtp_config(config: dict) -> bool:
    host = str(config.get("SMTP_HOST") or "").strip().lower()
    username = str(config.get("SMTP_USERNAME") or "").strip().lower()
    from_email = str(config.get("EMAIL_FROM_EMAIL") or "").strip().lower()
    return (
        host == "smtp.gmail.com"
        or username.endswith("@gmail.com")
        or username.endswith("@googlemail.com")
        or from_email.endswith("@gmail.com")
        or from_email.endswith("@googlemail.com")
    )


def _smtp_test_error_message(exc: Exception, config: dict) -> str:
    if isinstance(exc, smtplib.SMTPAuthenticationError):
        if _is_gmail_smtp_config(config):
            return (
                "No se pudo autenticar con Gmail. Verifica que SMTP Usuario sea el email Gmail completo, "
                "que la cuenta tenga verificacion en 2 pasos activa y que SMTP Password sea una contrasena "
                "de aplicacion de Google, no la contrasena normal de Gmail."
            )
        return "No se pudo autenticar con el servidor SMTP. Verifica usuario, password y permisos de la cuenta."

    return f"No se pudo enviar el email de prueba: {exc}"


def _normalize_email_config_value(key: str, value: Any, values: dict) -> str:
    normalized = "" if value is None else str(value)
    if key == "SMTP_PASSWORD" and _is_gmail_smtp_config(values):
        return "".join(normalized.split())
    return normalized


@router.get("/admin-config")
def list_admin_config(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadministrador")

    configs = db.query(SystemConfig).all()
    return {c.clave: {"valor": c.valor, "descripcion": c.descripcion} for c in configs}


@router.get("")
def list_admin_config_short(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return list_admin_config(db=db, current_user=current_user)


@router.put("/admin-config/{clave}")
def update_admin_config(
    clave: str,
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadministrador")

    config = db.query(SystemConfig).filter(SystemConfig.clave == clave).first()
    if not config:
        config = SystemConfig(clave=clave)
        db.add(config)

    if "valor" in body:
        config.valor = body["valor"]
    if "descripcion" in body:
        config.descripcion = body["descripcion"]

    db.commit()
    db.refresh(config)
    return {"clave": config.clave, "valor": config.valor, "descripcion": config.descripcion}


def _public_email_config_payload(db: Session) -> dict:
    rows = db.query(SystemConfig).filter(SystemConfig.clave.in_(SMTP_CONFIG_KEYS)).all()
    raw = {row.clave: row.valor for row in rows}
    effective = get_effective_email_config()
    payload = {}
    for key in sorted(SMTP_CONFIG_KEYS):
        value = raw.get(key, effective.get(key))
        if key in SECRET_CONFIG_KEYS:
            masked = bool(value)
            value = "" if not value else f"{str(value)[:2]}****{str(value)[-2:]}" if len(str(value)) > 4 else "****"
            payload[key] = {
                "valor": value,
                "configured": masked,
                "descripcion": SMTP_DESCRIPTIONS.get(key, ""),
            }
        else:
            payload[key] = {
                "valor": "" if value is None else str(value),
                "configured": bool(value),
                "descripcion": SMTP_DESCRIPTIONS.get(key, ""),
            }
    return payload


@router.get("/email-settings")
def get_email_settings(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadministrador")
    return _public_email_config_payload(db)


@router.put("/email-settings")
def update_email_settings(
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadministrador")

    values = body.get("values") if isinstance(body.get("values"), dict) else body
    for key, value in values.items():
        if key not in SMTP_CONFIG_KEYS:
            continue
        if key == "SMTP_PASSWORD" and value in (None, ""):
            continue
        config = db.query(SystemConfig).filter(SystemConfig.clave == key).first()
        if not config:
            config = SystemConfig(clave=key)
            db.add(config)
        config.valor = _normalize_email_config_value(key, value, values)
        config.descripcion = SMTP_DESCRIPTIONS.get(key, "")

    db.commit()
    return _public_email_config_payload(db)


@router.post("/email-settings/test")
def test_email_settings(
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    if not _is_superadmin(current_user):
        raise HTTPException(status_code=403, detail="Solo superadministrador")

    to_email = str(body.get("to_email") or current_user.email or "").strip()
    if not to_email:
        raise HTTPException(status_code=400, detail="Debe indicar un email destino para la prueba.")

    config = get_effective_email_config()
    if config["EMAIL_BACKEND"] != "smtp":
        raise HTTPException(status_code=400, detail="EMAIL_BACKEND debe ser smtp para enviar una prueba real.")
    if not config["SMTP_HOST"]:
        raise HTTPException(status_code=400, detail="SMTP_HOST no está configurado.")

    try:
        result = send_transactional_email(
            to_email=to_email,
            subject="Prueba de email corporativo GiProy",
            body=(
                "Este es un email de prueba enviado desde Ajuste SaaS.\n\n"
                "Si recibiste este mensaje, la configuración SMTP corporativa está operativa."
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=_smtp_test_error_message(exc, config)) from exc

    return {"success": True, "backend": result.get("backend"), "to_email": to_email}


@router.put("/{clave}")
def update_admin_config_short(
    clave: str,
    body: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> Any:
    return update_admin_config(clave=clave, body=body, db=db, current_user=current_user)
