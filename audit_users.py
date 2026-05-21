
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.usuario import Usuario
from app.core.security import verify_password, get_password_hash

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("--- User Audit ---")
    users = db.query(Usuario).all()
    for u in users:
        print(f"ID: {u.id}, Email: '{u.email}' (len: {len(u.email)}), Rol: {u.rol}, Active: {u.activo}")
        if u.email.lower() == "benito.segura@gmail.com":
            print(f"  Hash len: {len(u.hashed_password)}")
            # Test verification
            pwd = "Kathiana96!a!"
            match = verify_password(pwd, u.hashed_password)
            print(f"  Verification with '{pwd}': {match}")
            
            # Generate a fresh hash for comparison
            fresh_hash = get_password_hash(pwd)
            print(f"  Fresh Hash: {fresh_hash}")
            print(f"  DB Hash   : {u.hashed_password}")

    # Check for any users with trailing spaces
    duplicates = db.query(Usuario).filter(Usuario.email.ilike("%benito.segura@gmail.com%")).all()
    if len(duplicates) > 1:
        print(f"\nWARNING: Found {len(duplicates)} potential duplicate users!")

finally:
    db.close()
