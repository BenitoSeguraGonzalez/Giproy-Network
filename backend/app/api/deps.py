from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt import ExpiredSignatureError
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db
from app.models.usuario import Usuario
from app.schemas.token import TokenPayload
from app.core.debug_logger import log_debug
from app.core.session_trace import log_session_trace

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

def get_current_user(
    request: Request, db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> Usuario:
    log_debug(f"REQUEST RECEIVED: Token prefix: {token[:10] if token else 'NONE'}... (Total len: {len(token) if token else 0})")
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except ExpiredSignatureError as e:
        log_debug(f"JWT EXPIRED: {str(e)}")
        log_session_trace(
            "auth_401_jwt_expired",
            request=request,
            session_id=None,
            reason="jwt_expired",
            status_code=status.HTTP_401_UNAUTHORIZED,
            payload={"error": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Su sesión ha expirado. Vuelva a iniciarla.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        log_debug(f"JWT VALIDATION FAILED: {str(e)}")
        log_session_trace(
            "auth_401_invalid_token",
            request=request,
            session_id=None,
            reason="invalid_token",
            status_code=status.HTTP_401_UNAUTHORIZED,
            payload={"error": str(e)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(Usuario).options(joinedload(Usuario.empresa)).filter(Usuario.id == token_data.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    
    # Validar ID de sesión para política de sesión única
    # DEBUG: Log every SID check
    log_debug(f"AUTH CHECK: User={user.email}, TokenSID={token_data.sid}, DBSID={user.current_session_id}")
    
    if token_data.sid != user.current_session_id:
        log_debug(f"SESSION INVALIDATED: User {user.email} session mismatch. Token SID: {token_data.sid}, DB SID: {user.current_session_id}")
        detail = "Su sesión ha expirado porque se inició sesión en otro dispositivo."
        if token_data.sid and not user.current_session_id:
            detail = "Un administrador le ha cerrado la sesión. Vuelva a iniciarla."
        log_session_trace(
            "auth_401_sid_mismatch",
            request=request,
            user=user,
            session_id=token_data.sid,
            db_session_id=user.current_session_id,
            reason="sid_mismatch",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Validar inactividad
    now = datetime.now(timezone.utc)
    
    # Usar el timeout configurado para la empresa o el global por defecto
    timeout_minutes = settings.SESSION_INACTIVITY_TIMEOUT_MINUTES
    if user.empresa and user.empresa.session_timeout_minutes:
        timeout_minutes = user.empresa.session_timeout_minutes
        
    if user.last_active_at:
        inactivity_delta = now - user.last_active_at
        if inactivity_delta.total_seconds() > timeout_minutes * 60:
            log_debug(f"SESSION EXPIRED BY INACTIVITY: User {user.email}. Delta: {inactivity_delta.total_seconds()/60:.2f}min, Timeout: {timeout_minutes}min")
            # Limpiar sesión en DB para que no aparezca como activa
            previous_db_session_id = user.current_session_id
            user.current_session_id = None
            user.current_session_started_at = None
            db.add(user)
            db.commit()
            log_session_trace(
                "auth_401_inactivity",
                request=request,
                user=user,
                session_id=token_data.sid,
                db_session_id=previous_db_session_id,
                reason="inactivity_timeout",
                status_code=status.HTTP_401_UNAUTHORIZED,
                payload={
                    "timeout_minutes": timeout_minutes,
                    "inactive_seconds": inactivity_delta.total_seconds(),
                },
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Su sesión ha expirado por inactividad. Vuelva a iniciarla.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Actualizar última actividad
    user.last_active_at = now
    db.add(user)
    db.commit()
    log_session_trace(
        "auth_check_ok",
        request=request,
        user=user,
        session_id=token_data.sid,
        db_session_id=user.current_session_id,
        reason="auth_ok",
    )
        
    return user

def get_current_active_user(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    return current_user
