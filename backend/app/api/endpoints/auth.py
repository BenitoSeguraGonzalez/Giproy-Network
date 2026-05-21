from typing import Any, Optional, List, Literal
from datetime import timedelta, datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Request, status, Body, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import logging
import secrets
import uuid
import jwt

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.config import settings
from app.repositories.usuario import usuario_repo
from app.repositories.dispositivo import DispositivoRepository
from app.schemas.token import Token
from app.schemas.token import TokenPayload
from app.schemas.usuario import UsuarioRegister
from app.models.password_reset import PasswordResetToken
from app.utils.email_utils import send_reset_password_email
from app.models.usuario import Usuario
from app.core.debug_logger import log_debug as log_auth
from app.services.audit_event import record_audit_event
from app.services.license_policy import get_license_login_notice, get_license_status
from app.services.empresa import empresa_service
from app.core.phone_normalization import is_valid_phone, normalize_phone
from app.core.session_trace import log_session_trace
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)


class SessionTraceIn(BaseModel):
    event_type: Literal[
        "frontend_session_expired_event",
        "frontend_retry_after_refresh",
        "frontend_retry_with_newer_token",
        "frontend_refresh_started",
        "frontend_refresh_succeeded",
        "frontend_refresh_failed",
        "frontend_forced_logout",
        "frontend_check_auth_failed",
        "frontend_401_intercepted",
    ]
    reason: Optional[str] = None
    request_path: Optional[str] = None
    request_method: Optional[str] = None
    request_id: Optional[str] = None
    token_session_id: Optional[str] = None
    token_exp: Optional[int] = None
    response_status: Optional[int] = None
    payload: dict[str, Any] = Field(default_factory=dict)


def _resolve_trace_user(request: Request, db: Session) -> Optional[Usuario]:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
    except jwt.PyJWTError:
        return None

    if not token_data.sub:
        return None
    return db.query(Usuario).filter(Usuario.id == token_data.sub).first()


def _is_superadmin(user: Usuario) -> bool:
    return bool(user and user.rol and user.rol.lower() == "superadministrador")


def _resolve_session_timeout_minutes(user: Optional[Usuario]) -> int:
    if user and user.empresa and user.empresa.session_timeout_minutes:
        return user.empresa.session_timeout_minutes
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES

@router.get("/auth/accounts-by-email")
def get_accounts_by_email(
    email: str = Query(..., description="Email del usuario"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Retorna la lista de empresas asociadas a un email para la selección en login.
    """
    users = db.query(Usuario).options(joinedload(Usuario.empresa)).filter(func.lower(Usuario.email) == func.lower(email)).all()
    
    accounts = []
    for u in users:
        try:
            is_superadmin = _is_superadmin(u)
            empresa = getattr(u, "empresa", None)
            empresa_nombre = "Sin empresa"
            empresa_logo = None
            empresa_activa = False

            if empresa is not None:
                empresa_nombre = getattr(empresa, "nombre", None) or "Sin empresa"
                empresa_logo = empresa_service._resolve_logo_url(getattr(empresa, "logo_url", None))
                empresa_activa = bool(getattr(empresa, "activa", False))

            accounts.append({
                "empresa_id": u.empresa_id,
                "empresa_nombre": empresa_nombre,
                "empresa_logo": empresa_logo,
                "activo": bool(u.activo and (is_superadmin or empresa_activa))
            })
        except Exception:
            accounts.append({
                "empresa_id": u.empresa_id,
                "empresa_nombre": "Cuenta disponible",
                "empresa_logo": None,
                "activo": bool(u.activo),
            })
    
    return accounts

@router.post("/login/access-token", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends(),
    device_id: str = Query(None, description="Identificador del dispositivo"),
    empresa_id: Optional[int] = Query(None, description="ID de la empresa seleccionada")
) -> dict:
    """
    Login tradicional - compatible con clientes existentes
    """
    logger.info("Login attempt received; empresa_selected=%s", bool(empresa_id))
    log_auth(f"AUTH DEBUG: Login attempt received - empresa_selected={bool(empresa_id)}")
    
    query = db.query(Usuario).options(joinedload(Usuario.empresa)).filter(func.lower(Usuario.email) == func.lower(form_data.username))
    
    if empresa_id:
        query = query.filter(Usuario.empresa_id == empresa_id)
    
    users = query.all()
    
    if not users:
        log_auth("LOGIN FAILED: User not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrecta"
        )
    
    if len(users) > 1:
        # Si hay más de un usuario con el mismo email y no se especificó empresa_id
        # Esto no debería pasar en el login normal si el frontend hace el paso previo de selección
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiples cuentas encontradas. Por favor, especifique la empresa."
        )
    
    user = users[0]
    
    is_match = verify_password(form_data.password, user.hashed_password)
    if not is_match:
        log_auth("LOGIN FAILED: Password mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrecta"
        )
        
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario Inactivo")
    
    # Validar vigencia de cuenta
    if user.fecha_expiracion and user.rol.lower() != "superadministrador":
        if datetime.now(user.fecha_expiracion.tzinfo) > user.fecha_expiracion:
            raise HTTPException(status_code=403, detail="Su cuenta ha expirado. Contacte a soporte.")
    
    is_superadmin = _is_superadmin(user)

    if not is_superadmin and (not user.empresa or not user.empresa.activa):
        raise HTTPException(status_code=400, detail="Empresa suspendida. Contacte al administrador.")

    if not is_superadmin:
        license_status = get_license_status(user.empresa, date.today())
        if license_status == "pending":
            raise HTTPException(status_code=403, detail="La licencia de esta empresa todavía no está vigente.")
        if license_status == "expired":
            raise HTTPException(status_code=403, detail="La licencia de esta empresa ha vencido. Contacte a soporte.")
    
    # Validar dispositivo si se proporciona
    if device_id:
        repo = DispositivoRepository(db)
        dispositivo = repo.find_or_create(
            device_id=device_id,
            empresa_id=user.empresa_id,
            usuario_id=user.id
        )
        
        if dispositivo.bloqueado:
            raise HTTPException(
                status_code=403, 
                detail="Dispositivo bloqueado. Contacte al administrador."
            )
        
        if not dispositivo.activo:
            raise HTTPException(
                status_code=403, 
                detail="Dispositivo inactivo. Contacte al administrador."
            )
    
    timeout_minutes = _resolve_session_timeout_minutes(user)
    access_token_expires = timedelta(minutes=timeout_minutes)
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    user.current_session_id = session_id
    user.current_session_started_at = now
    user.current_session_expires_at = now + access_token_expires
    user.last_active_at = now
    user.current_session_device_id = device_id
    db.add(user)
    db.commit()

    token = create_access_token(
        subject=user.id, 
        session_id=session_id,
        expires_delta=access_token_expires
    )
    login_notice = get_license_login_notice(user.empresa, date.today())

    record_audit_event(
        db,
        module="auth",
        event_type="login",
        severity="info",
        actor=user,
        empresa_id=user.empresa_id,
        entity_type="usuario",
        entity_id=user.id,
        message=f"Inicio de sesión de {user.email}",
        payload={"device_id": device_id, "session_id": session_id},
    )
    log_session_trace(
        "login_success",
        request=request,
        user=user,
        session_id=session_id,
        db_session_id=user.current_session_id,
        reason="login_success",
        payload={"device_id": device_id},
    )
    
    return {"access_token": token, "token_type": "bearer", "login_notice": login_notice}


@router.post("/login/refresh", response_model=Token)
def refresh_access_token(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user),
) -> dict:
    if not current_user.current_session_id:
        log_session_trace(
            "token_refresh_failed",
            request=request,
            user=current_user,
            session_id=None,
            db_session_id=current_user.current_session_id,
            reason="missing_db_session_id",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No existe una sesión activa para renovar.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    timeout_minutes = _resolve_session_timeout_minutes(current_user)
    access_token_expires = timedelta(minutes=timeout_minutes)
    now = datetime.now(timezone.utc)

    current_user.current_session_expires_at = now + access_token_expires
    current_user.last_active_at = now
    db.add(current_user)
    db.commit()

    token = create_access_token(
        subject=current_user.id,
        session_id=current_user.current_session_id,
        expires_delta=access_token_expires,
    )
    log_session_trace(
        "token_refresh_succeeded",
        request=request,
        user=current_user,
        session_id=current_user.current_session_id,
        db_session_id=current_user.current_session_id,
        reason="refresh_success",
        payload={"timeout_minutes": timeout_minutes},
    )
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register_user(*, db: Session = Depends(get_db), user_in: UsuarioRegister) -> dict:
    from app.models.empresa import Empresa
    user = db.query(Usuario).filter(func.lower(Usuario.email) == func.lower(user_in.email)).first()
    if user:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo electrónico.")
    if user_in.movil:
        if not is_valid_phone(user_in.movil):
            raise HTTPException(status_code=400, detail="El móvil debe tener un formato válido.")
        user_in.movil = normalize_phone(user_in.movil, user_in.pais)
    
    new_empresa = Empresa(
        nombre=user_in.nombre_completo,
        activa=True,
        limite_administradores=1,
        limite_usuarios=0,
        license_start_date=date.today(),
        license_end_date=date.today() + timedelta(days=365),
    )
    db.add(new_empresa)
    db.flush()

    from app.services.license import license_service
    license_service.ensure_company_express_assignment(db, new_empresa.id)
    
    fecha_exp = datetime.now(timezone.utc) + timedelta(days=365)
    now = datetime.now(timezone.utc)
    
    new_user = Usuario(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        nombre_completo=user_in.nombre_completo,
        rol="administrador",
        empresa_id=new_empresa.id,
        activo=True,
        fecha_expiracion=fecha_exp,
        ruc=user_in.ruc,
        nombres=user_in.nombres,
        apellidos=user_in.apellidos,
        alias=user_in.alias,
        nacionalidad=user_in.nacionalidad,
        profesion=user_in.profesion,
        ciudad=user_in.ciudad,
        provincia=user_in.provincia,
        canton=user_in.canton,
        pais=user_in.pais,
        movil=user_in.movil,
        acepta_politica_privacidad=user_in.acepta_politica_privacidad,
        fecha_aceptacion_politica_privacidad=now if user_in.acepta_politica_privacidad else None,
        acepta_politicas_comunicacion=user_in.acepta_politicas_comunicacion,
        fecha_aceptacion_politicas_comunicacion=now if user_in.acepta_politicas_comunicacion else None,
        autoriza_publicidad=user_in.autoriza_publicidad,
        fecha_autorizacion_publicidad=now if user_in.autoriza_publicidad else None
    )
    db.add(new_user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error de base de datos al registrar")
    
    db.refresh(new_user)
    timeout_minutes = _resolve_session_timeout_minutes(new_user)
    access_token_expires = timedelta(minutes=timeout_minutes)
    session_id = str(uuid.uuid4())
    now_utc = datetime.now(timezone.utc)
    new_user.current_session_id = session_id
    new_user.current_session_started_at = now_utc
    new_user.current_session_expires_at = now_utc + access_token_expires
    new_user.last_active_at = now_utc
    db.add(new_user)
    db.commit()

    token = create_access_token(subject=new_user.id, session_id=session_id, expires_delta=access_token_expires)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login/logout")
def logout_access_token(request: Request, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    previous_session_id = current_user.current_session_id
    current_user.current_session_id = None
    current_user.current_session_started_at = None
    current_user.current_session_expires_at = None
    current_user.last_active_at = None
    current_user.current_session_device_id = None
    db.add(current_user)
    db.commit()
    log_session_trace(
        "frontend_forced_logout",
        request=request,
        user=current_user,
        session_id=previous_session_id,
        db_session_id=None,
        reason="logout_endpoint",
    )
    return {"message": "Sesión cerrada"}


@router.post("/login/session-trace")
def write_frontend_session_trace(
    payload: SessionTraceIn,
    request: Request,
    db: Session = Depends(get_db),
) -> Any:
    current_user = _resolve_trace_user(request, db)
    log_session_trace(
        payload.event_type,
        request=request,
        user=current_user,
        session_id=payload.token_session_id,
        db_session_id=getattr(current_user, "current_session_id", None),
        reason=payload.reason,
        status_code=payload.response_status,
        payload={
            "request_path": payload.request_path,
            "request_method": payload.request_method,
            "client_request_id": payload.request_id,
            "token_exp": payload.token_exp,
            **(payload.payload or {}),
        },
    )
    return {"status": "logged"}

@router.post("/password-recovery/{email}")
def recover_password(email: str, db: Session = Depends(get_db)):
    user = usuario_repo.get_by_email(db, email=email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    token = secrets.token_urlsafe(32)
    db_token = PasswordResetToken(token=token, email=email, expires_at=datetime.now() + timedelta(hours=24))
    db.add(db_token)
    db.commit()
    send_reset_password_email(email, token)
    return {"msg": "Correo de recuperación enviado"}

@router.post("/reset-password/")
def reset_password(token: str = Body(...), new_password: str = Body(...), db: Session = Depends(get_db)):
    db_token = db.query(PasswordResetToken).filter(PasswordResetToken.token == token).first()
    if not db_token or not db_token.is_valid():
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    user = usuario_repo.get_by_email(db, email=db_token.email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    user.hashed_password = get_password_hash(new_password)
    db_token.used = datetime.now()
    db.add(user)
    db.add(db_token)
    db.commit()
    return {"msg": "Contraseña actualizada satisfactoriamente"}
