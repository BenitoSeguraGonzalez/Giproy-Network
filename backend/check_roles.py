from app.core.database import SessionLocal
from app.models.usuario import Usuario

db = SessionLocal()
try:
    print("--- ROLES DE USUARIOS ---")
    users = db.query(Usuario).all()
    for u in users:
        print(f"Email: {u.email}, Rol: {u.rol}")
finally:
    db.close()
