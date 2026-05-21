from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.empresa import Empresa

db = SessionLocal()
try:
    user = db.query(Usuario).filter(Usuario.email == "benito.segura@gmail.com").first()
    if user:
        print(f"Usuario: {user.email}")
        print(f"Activo: {user.activo}")
        print(f"Rol: {user.rol}")
        print(f"ID Empresa: {user.empresa_id}")
        if user.empresa:
            print(f"Empresa: {user.empresa.nombre}")
            print(f"Empresa Activa: {user.empresa.activa}")
        else:
            print("ERROR: El usuario NO tiene empresa vinculada.")
    else:
        print("ERROR: Usuario no encontrado en la DB.")
finally:
    db.close()
