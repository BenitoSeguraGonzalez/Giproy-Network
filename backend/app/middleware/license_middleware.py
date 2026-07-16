from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.database import SessionLocal
from app.services.license import license_service
from app.models.usuario import Usuario
import jwt
from app.core.config import settings
from app.schemas.token import TokenPayload

class LicenseMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if not path.startswith("/api/v1/"):
            return await call_next(request)
            
        # Rutas exentas de validación de licencia
        exempt_paths = [
            "/api/v1/login/",
            "/api/v1/auth/",
            "/api/v1/register",
            "/api/v1/admin-maintenance/",
            "/api/v1/system-announcements/",
            "/api/v1/password-recovery/",
            "/api/v1/reset-password/",
            "/api/v1/admin-licenses/seed" # Para inicializar el sistema
        ]
        
        if any(path.startswith(p) for p in exempt_paths) or request.method == "OPTIONS":
            return await call_next(request)

        db = SessionLocal()
        try:
            # 1. Resolver usuario desde el token (copiamos lógica de main.py pero adaptada)
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1].strip()
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                    token_data = TokenPayload(**payload)
                    user = db.query(Usuario).filter(Usuario.id == token_data.sub).first()
                    if user and hasattr(user, 'rol') and user.rol and user.rol.lower() != "superadministrador":
                        # 2. Validar vigencia de licencia para la empresa del usuario
                        snapshot = license_service.get_company_license_snapshot(db, user.empresa_id)
                        licencia = snapshot["current_assignment"].licencia if snapshot["current_assignment"] else None
                        if not licencia:
                            return JSONResponse(
                                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                                content={"detail": "Su empresa no tiene una licencia activa. Contacte a soporte."}
                            )

                        request.state.license_snapshot = {
                            "license_status": snapshot["license_status"],
                            "access_mode": snapshot["access_mode"],
                            "grace_days_remaining": snapshot["grace_days_remaining"],
                        }
                        request.state.license_flags = license_service.get_company_special_flags(db, user.empresa_id)
                        request.state.experimental_features_enabled = license_service.can_use_experimental_features(db, user.empresa_id)

                        if snapshot["access_mode"] == "readonly" and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
                            return JSONResponse(
                                status_code=status.HTTP_403_FORBIDDEN,
                                content={
                                    "detail": "La licencia actual de su empresa permite solo lectura. Renueve o active una nueva licencia para volver a editar."
                                },
                            )
                        
                        # 3. Validar límites para acciones específicas
                        # Si es POST a proyectos, validar cuota
                        if request.method == "POST" and "/api/v1/proyectos/" in path:
                            license_service.check_limit(db, user.empresa_id, "proyectos")
                        
                        # Si es POST a usuarios, validar cuota
                        if request.method == "POST" and "/api/v1/usuarios/" in path:
                            license_service.check_limit(db, user.empresa_id, "usuarios")
                            
                except Exception:
                    pass # Dejar que el middleware de auth maneje errores de token
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail": e.detail})
        finally:
            db.close()
        return await call_next(request)
