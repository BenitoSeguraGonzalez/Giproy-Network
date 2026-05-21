
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.usuario import Usuario
from app.core.security import get_password_hash, verify_password

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    email = "benito.segura@gmail.com"
    pwd = "Kathiana96!a!"
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if user:
        print(f"Updating password for {email}...")
        new_hash = get_password_hash(pwd)
        user.hashed_password = new_hash
        db.commit()
        print(f"New Hash: {new_hash}")
        
        # Verify again
        match = verify_password(pwd, user.hashed_password)
        print(f"Verification after update: {match}")
    else:
        print("User not found")
finally:
    db.close()
