import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.usuario import Usuario

def fix_user():
    db = SessionLocal()
    email = "dreams2k@hotmail.com"
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if user:
        if user.rol == "usuario":
            user.rol = "administrador"
            db.commit()
            print("Usuario actualizado exitosamente a 'administrador'.")
        else:
            print(f"El usuario ya es {user.rol}")
    else:
        print("Usuario no encontrado.")
        
    db.close()

if __name__ == "__main__":
    fix_user()
