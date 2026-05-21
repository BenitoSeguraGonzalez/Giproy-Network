from app.core.database import SessionLocal, engine, Base
import app.models # Importante para registrar todos los modelos en Base
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.repositories.usuario import usuario_repo
import sys

# Forzar la creación de tablas por si el backend no ha iniciado
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # 1. Asegurar la existencia de una Empresa
    empresa = db.query(Empresa).first()
    if not empresa:
        empresa = Empresa(nombre="Administradores Generales", codigo="ADMIN-01", ruc="99999999999")
        db.add(empresa)
        db.commit()
        db.refresh(empresa)
        print(f"Empresa creada con ID: {empresa.id}")

    # 2. Crear el Usuario 'dreams2k'
    user_email = "dreams2k"
    user_pass = "Cocoliso.1"
    
    existing_user = usuario_repo.get_by_email(db, email=user_email)
    if not existing_user:
        user_in = UsuarioCreate(
            email=user_email,
            password=user_pass,
            nombre_completo="Administrador de Sistema Dreams",
            rol="admin",
            empresa_id=empresa.id
        )
        new_user = usuario_repo.create(db, obj_in=user_in)
        print(f"Usuario {new_user.email} con rol {new_user.rol} ENCRIPTADO Y CREADO con éxito.")
    else:
        print(f"El usuario {user_email} ya estaba registrado en la base de datos.")

except Exception as e:
    print(f"Error durante el seeding: {e}")
finally:
    db.close()
