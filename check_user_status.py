
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.usuario import Usuario

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    user = db.query(Usuario).filter(Usuario.email == "benito.segura@gmail.com").first()
    if user:
        print(f"User found: {user.email}")
        print(f"Role: {user.rol}")
        print(f"Is Active: {user.activo}")
        print(f"Empresa ID: {user.empresa_id}")
        # Check if password matches (we can't check easily but we can see if hashed_password exists)
        print(f"Has Hashed Password: {bool(user.hashed_password)}")
    else:
        print("User NOT found")
finally:
    db.close()
