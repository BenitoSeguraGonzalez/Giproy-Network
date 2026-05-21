from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.services.license import license_service
from app.models.empresa_uso import EmpresaUso

ROLE_TO_LIMIT_FIELD = {
    "administrador": "limite_administradores",
    "usuario": "limite_usuarios",
    "usuario_comunidad": "limite_usuarios",
}

ROLE_TO_LABEL = {
    "administrador": "administradores",
    "usuario": "usuarios",
    "usuario_comunidad": "usuarios",
}

def get_license_status(empresa: Empresa, today: date | None = None) -> str:
    """Verifica si la empresa tiene una licencia activa."""
    reference = today or date.today()
    
    # 1. Intentar con el nuevo sistema
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        licencia = license_service.get_company_license(db, empresa.id)
        if licencia:
            return "active"
    except (ProgrammingError, OperationalError):
        db.rollback()
    finally:
        db.close()

    # 2. Fallback al sistema antiguo
    if empresa.license_start_date and reference < empresa.license_start_date:
        return "pending"
    if empresa.license_end_date and reference > empresa.license_end_date:
        return "expired"
    return "active"


def get_license_login_notice(empresa: Empresa, today: date | None = None) -> dict[str, Any] | None:
    reference = today or date.today()
    license_status = get_license_status(empresa, reference)
    
    # Si está activa en el nuevo sistema pero no tenemos fecha de fin explícita en Empresa,
    # el aviso de vencimiento se complica sin el objeto EmpresaLicencia.
    # Por ahora mantenemos compatibilidad con los campos de Empresa si existen.
    
    if license_status != "active" or not empresa.license_end_date:
        return None

    days_remaining = (empresa.license_end_date - reference).days
    if days_remaining < 0 or days_remaining > 7:
        return None

    return {
        "level": "warning",
        "title": "Licencia próxima a vencer",
        "message": f"La licencia de su empresa caduca el {empresa.license_end_date.strftime('%d/%m/%Y')}.",
        "end_date": empresa.license_end_date.isoformat(),
        "days_remaining": days_remaining,
    }


def get_usage_status(used: int, limit: int) -> str:
    if limit == -1: # Ilimitado
        return "ok"
    if limit <= 0:
        return "disabled"
    if used > limit:
        return "exceeded"
    if used == limit:
        return "warning"
    return "ok"


def validate_license_window(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="La fecha de fin de licencia no puede ser anterior a la fecha de inicio.",
        )


def validate_company_limits_against_usage(empresa: Empresa, update_data: dict) -> None:
    # Esta función se usa en el sistema tradicional de edición de Empresa.
    # Ahora que usamos EmpresaUso, deberíamos validar contra esos campos.
    pass


def validate_role_quota(
    db: Session,
    empresa: Empresa,
    target_role: str | None,
    *,
    exclude_user_id: int | None = None,
) -> None:
    """Valida la cuota del rol solicitado sin mezclar administradores y usuarios."""
    normalized_role = (target_role or "").strip().lower()
    if normalized_role not in ROLE_TO_LIMIT_FIELD:
        return

    limites = {}
    try:
        limites = license_service.get_company_license_limits(db, empresa.id)
    except Exception:
        limites = {}

    if normalized_role == "administrador":
        limit = int(limites.get("administradores", empresa.limite_administradores or 1))
        used = db.query(Usuario).filter(
            Usuario.empresa_id == empresa.id,
            Usuario.rol.ilike("administrador"),
        ).count()
        role_label = ROLE_TO_LABEL[normalized_role]
    else:
        raw_limit = limites.get("usuarios_normales", limites.get("usuarios", empresa.limite_usuarios or 0))
        limit = int(raw_limit)
        used = db.query(Usuario).filter(
            Usuario.empresa_id == empresa.id,
            func.lower(Usuario.rol).in_(["usuario", "usuario_comunidad"]),
        ).count()
        role_label = ROLE_TO_LABEL[normalized_role]

    if limit == -1: # Ilimitado
        return

    if exclude_user_id:
        current_user = db.query(Usuario).filter(Usuario.id == exclude_user_id).first()
        current_role = (current_user.rol or "").strip().lower() if current_user else ""
        if normalized_role == "administrador" and current_role == "administrador":
            used -= 1
        elif normalized_role in {"usuario", "usuario_comunidad"} and current_role in {"usuario", "usuario_comunidad"}:
            used -= 1

    if used >= limit:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede asignar este rol: la cuota de {role_label} ({limit}) ya está completa.",
        )
