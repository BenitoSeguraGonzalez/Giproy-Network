
from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.proyecto import Proyecto

def check_user_and_proj():
    db = SessionLocal()
    try:
        users = db.query(Usuario).all()
        print("--- USERS ---")
        for u in users:
            print(f"ID: {u.id}, Nombre: {u.nombre_completo}, Rol: {u.rol}, EmpresaID: {u.empresa_id}")
        
        proys = db.query(Proyecto).all()
        print("\n--- PROJECTS ---")
        for p in proys:
            print(f"ID: {p.id}, Nombre: {p.nombre}, EmpresaID: {p.empresa_id}, Root: {p.codigo_root}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_user_and_proj()
