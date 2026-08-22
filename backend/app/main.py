from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
import os
import jwt
import uuid

from app.core.database import engine, Base, SessionLocal
import app.models
from app.api.api import api_router
from app.models.usuario import Usuario
from app.schemas.token import TokenPayload
from app.models.system_config import SystemConfig
from app.services.system_maintenance import get_or_create_system_maintenance, is_system_maintenance_active

if settings.CREATE_TABLES_ON_STARTUP:
    Base.metadata.create_all(bind=engine)

# Asegurar que system_config exista para la configuración operativa administrable.
try:
    SystemConfig.__table__.create(bind=engine, checkfirst=True)
except Exception:
    pass

# Seed defaults in SystemConfig if missing
_DEFAULT_SYSTEM_CONFIGS = {
    "FRONTEND_PUBLIC_URL": (
        "https://giproy-network.excompc.dpdns.org",
        "URL pública usada para enlaces de activación y validación de registro.",
    ),
    "EMAIL_BACKEND": (
        "mock",
        "Backend de email transaccional: smtp o mock.",
    ),
}
try:
    db = None
    db = SessionLocal()
    for clave, (valor, descripcion) in _DEFAULT_SYSTEM_CONFIGS.items():
        existing = db.query(SystemConfig).filter(SystemConfig.clave == clave).first()
        if not existing:
            db.add(SystemConfig(clave=clave, valor=valor, descripcion=descripcion))
    db.commit()
except Exception:
    pass
finally:
    if db is not None:
        db.close()

app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Sistema ERP GiProy Network - Suite de servicios para gestión de presupuestos, proyectos y recursos.",
    version="1.0.1",
    contact={
        "name": "GiProy Network Support",
        "email": "soporte@giproy.com",
    },
)

from app.middleware.license_middleware import LicenseMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1024)

app.add_middleware(LicenseMiddleware)


@app.middleware("http")
async def request_trace_middleware(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response

MAINTENANCE_EXACT_PATHS = {
    "/",
    "/api/v1/login/access-token",
    "/api/v1/login/logout",
    "/api/v1/register",
    "/api/v1/legal/manifest",
    "/api/v1/usuarios/me",
    "/api/v1/admin-maintenance/active",
    "/api/v1/system-announcements/active",
}

MAINTENANCE_PREFIX_PATHS = (
    "/api/v1/register/",
    "/api/v1/password-recovery/",
    "/api/v1/reset-password/",
)


def _is_maintenance_exempt(path: str) -> bool:
    if path in MAINTENANCE_EXACT_PATHS:
        return True
    return any(path.startswith(prefix) for prefix in MAINTENANCE_PREFIX_PATHS)


def _resolve_request_user(request: Request, db):
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


@app.middleware("http")
async def maintenance_mode_middleware(request: Request, call_next):
    path = request.url.path or ""
    if request.method == "OPTIONS" or _is_maintenance_exempt(path):
        return await call_next(request)

    should_continue = False
    db = SessionLocal()
    try:
        config = get_or_create_system_maintenance(db)
        if not is_system_maintenance_active(config):
            should_continue = True
        else:
            user = _resolve_request_user(request, db)
            if user and hasattr(user, 'rol') and user.rol:
                user_role = user.rol.lower()
                if user_role == "superadministrador":
                    should_continue = True

            if not should_continue:
                payload = {
                    "detail": config.mensaje or "El sistema se encuentra en mantenimiento.",
                    "maintenance": {
                        "active": True,
                        "mode": config.mode,
                        "titulo": config.titulo,
                        "mensaje": config.mensaje,
                        "starts_at": config.starts_at.isoformat() if config.starts_at else None,
                        "ends_at": config.ends_at.isoformat() if config.ends_at else None,
                    },
                }

                if config.mode == "readonly":
                    if request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}:
                        return JSONResponse(status_code=503, content=payload)
                    should_continue = True
                else:
                    return JSONResponse(status_code=503, content=payload)
    finally:
        db.close()
    if should_continue:
        return await call_next(request)
    return JSONResponse(status_code=500, content={"detail": "No se pudo resolver el estado de mantenimiento."})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    try:
        with open("fatal_errors.log", "a") as f:
            f.write(f"--- ERROR en {request.url} ---\n")
            f.write(traceback.format_exc() + "\n")
    except:
        pass
    return JSONResponse(status_code=500, content={"message": "Error interno del servidor", "details": str(exc)})

app.include_router(api_router, prefix=settings.API_V1_STR)

# Configuración de archivos estáticos para logotipos
UPLOAD_DIR = "uploads/logos"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def health_check():
    return {
        "sistema": settings.PROJECT_NAME, 
        "estado": "Operativo",
        "version": "1.0.0"
    }

# reload
