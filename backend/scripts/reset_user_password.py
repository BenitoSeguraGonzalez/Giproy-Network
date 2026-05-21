import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# Añadir el directorio raíz al path para importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.usuario import Usuario

def reset_password(email, new_password):
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user:
            user.hashed_password = get_password_hash(new_password)
            db.add(user)
            db.commit()
            print(f"✅ Contraseña para {email} reseteada correctamente.")
        else:
            print(f"❌ Usuario {email} no encontrado.")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_password("dreams2k@hotmail.com", "123456")
