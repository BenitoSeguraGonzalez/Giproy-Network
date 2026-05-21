import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.usuario import Usuario

def check_user_fields():
    db = SessionLocal()
    email = "dreams2k@hotmail.com"
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if user:
        print(f"Usuario {email} ENCONTRADO:")
        print(f"RUC: '{user.ruc}'")
        print(f"Nombres: '{user.nombres}'")
        print(f"Apellidos: '{user.apellidos}'")
        print(f"Nacionalidad: '{user.nacionalidad}'")
        print(f"Profesion: '{user.profesion}'")
        print(f"Ciudad: '{user.ciudad}'")
        print(f"Provincia: '{user.provincia}'")
        print(f"Pais: '{user.pais}'")
        print(f"Movil: '{user.movil}'")
    else:
        print(f"Usuario {email} NO encontrado")
        
    db.close()

if __name__ == "__main__":
    check_user_fields()
