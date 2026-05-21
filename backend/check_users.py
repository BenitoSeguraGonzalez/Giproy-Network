from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.empresa import Empresa

db = SessionLocal()
try:
    print("--- USUARIOS ---")
    users = db.query(Usuario).all()
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Activo: {u.activo}, EmpresaID: {u.empresa_id}, Expiracion: {u.fecha_expiracion}")
    
    print("\n--- EMPRESAS ---")
    empresas = db.query(Empresa).all()
    for e in empresas:
        print(f"ID: {e.id}, Nombre: {e.nombre}, Activa: {e.activa}")
finally:
    db.close()
