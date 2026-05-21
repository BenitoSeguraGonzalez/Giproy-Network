
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.core.security import verify_password

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    user = db.query(Usuario).filter(Usuario.email == "benito.segura@gmail.com").first()
    if user:
        print(f"User: {user.email}")
        print(f"User Active: {user.activo}")
        
        empresa = db.query(Empresa).filter(Empresa.id == user.empresa_id).first()
        if empresa:
            print(f"Empresa: {empresa.nombre}")
            print(f"Empresa Active: {empresa.activa}")
        else:
            print("Empresa NOT found")
            
        password_to_check = "Kathiana96!a!"
        matches = verify_password(password_to_check, user.hashed_password)
        print(f"Password '{password_to_check}' matches: {matches}")
        
    else:
        print("User NOT found")
finally:
    db.close()
