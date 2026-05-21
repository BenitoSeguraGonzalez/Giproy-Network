import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.proyecto import Proyecto
from app.models.usuario import Usuario

def inspect_projects():
    db = SessionLocal()
    try:
        user = db.query(Usuario).filter(Usuario.email == "benito.segura@gmail.com").first()
        if not user:
            print("User not found!")
            return
        print(f"User: {user.email}, Rol: {user.rol}, Home Empresa ID: {user.empresa_id}")
        
        projects = db.query(Proyecto).filter(Proyecto.nombre.ilike("%PROYECTO DE PRUEBA 001%")).all()
        print(f"\nFound {len(projects)} projects matches for 'PROYECTO DE PRUEBA 001':")
        for p in projects:
            print(f"ID: {p.id} | Código: {p.codigo} | Root: {p.codigo_root} | Rev: {p.revision} | Empresa ID: {p.empresa_id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    inspect_projects()
