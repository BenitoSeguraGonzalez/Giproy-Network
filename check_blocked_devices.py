
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.dispositivo import Dispositivo

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    blocked_devices = db.query(Dispositivo).filter(Dispositivo.bloqueado == True).all()
    print(f"Found {len(blocked_devices)} blocked devices")
    for d in blocked_devices:
        print(f"ID: {d.id}, DeviceID: {d.device_id}, Usuario: {d.usuario_id}, Intentos: {d.intentos_fallidos}")
    
    # Check for the specific user's devices
    from app.models.usuario import Usuario
    user = db.query(Usuario).filter(Usuario.email == "benito.segura@gmail.com").first()
    if user:
        user_devices = db.query(Dispositivo).filter(Dispositivo.usuario_id == user.id).all()
        print(f"\nDevices for {user.email}:")
        for d in user_devices:
            print(f"ID: {d.id}, DeviceID: {d.device_id}, Bloqueado: {d.bloqueado}, Activo: {d.activo}")
finally:
    db.close()
