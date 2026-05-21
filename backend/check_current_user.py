import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.usuario import Usuario

def check_current():
    db = SessionLocal()
    # Looking for both possible active users
    emails = ["benito.segura@gmail.com", "dreams2k@hotmail.com"]
    for email in emails:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user:
            print(f"User: {user.email}")
            print(f"Role in DB: '{user.rol}'")
            print(f"Empresa ID: {user.empresa_id}")
            print("-" * 20)
    db.close()

if __name__ == "__main__":
    check_current()
