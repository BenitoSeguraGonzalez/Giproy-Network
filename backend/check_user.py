import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.empresa import Empresa

def check_user():
    db = SessionLocal()
    email = "dreams2k@hotmail.com"
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if user:
        print(f"Usuario {email} ENCONTRADO:")
        print(f"ID: {user.id}")
        print(f"Roles: '{user.rol}'")
        print(f"Empresa ID: {user.empresa_id}")
        
        empresa = db.query(Empresa).filter(Empresa.id == user.empresa_id).first()
        if empresa:
            print(f"Empresa: {empresa.nombre} (ID: {empresa.id})")
        else:
            print("Empresa no encontrada")
            
        print("\n--- Todos los usuarios de esta empresa ---")
        users = db.query(Usuario).filter(Usuario.empresa_id == user.empresa_id).all()
        for u in users:
            print(f"[{u.id}] {u.email} - Rol: '{u.rol}'")
            
        print("\n--- Todos los usuarios devueltos por la consulta del servicio ---")
        filtered_users = db.query(Usuario).filter(Usuario.empresa_id == user.empresa_id, Usuario.rol != "Superadministrador").all()
        for fu in filtered_users:
            print(f"[{fu.id}] {fu.email} - Rol: '{fu.rol}'")
    else:
        print(f"Usuario {email} NO encontrado")
        
    db.close()

if __name__ == "__main__":
    check_user()
