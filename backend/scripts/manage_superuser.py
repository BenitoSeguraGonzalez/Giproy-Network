from app.core.database import SessionLocal, engine, Base
import app.models # Importante para registrar todos los modelos en Base
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate
from app.repositories.usuario import usuario_repo
from app.core.security import get_password_hash

# Forzar la creación de tablas
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def manage_superuser():
    try:
        # 1. Asegurar la existencia de una Empresa
        empresa = db.query(Empresa).first()
        if not empresa:
            empresa = Empresa(nombre="Administradores Generales", codigo="ADMIN-01", ruc="99999999999")
            db.add(empresa)
            db.commit()
            db.refresh(empresa)
            print(f"Empresa creada con ID: {empresa.id}")

        # 2. Definir nuevo Superusuario
        new_email = "benito.segura@gmail.com"
        new_pass = "Kathiana96!a!"
        new_role = "superadministrador"
        
        # Eliminar el usuario antiguo 'dreams2k' si existe
        old_user = db.query(Usuario).filter(Usuario.email == "dreams2k").first()
        if old_user:
            db.delete(old_user)
            db.commit()
            print("Antiguo usuario 'dreams2k' eliminado.")

        # Crear o actualizar 'benito.segura@gmail.com'
        user = db.query(Usuario).filter(Usuario.email == new_email).first()
        
        if not user:
            user_in = UsuarioCreate(
                email=new_email,
                password=new_pass,
                nombre_completo="Benito Segura",
                rol=new_role,
                empresa_id=empresa.id
            )
            user = usuario_repo.create(db, obj_in=user_in)
            print(f"Superusuario {user.email} CREADO con rol {user.rol}.")
        else:
            user.hashed_password = get_password_hash(new_pass)
            user.rol = new_role
            user.nombre_completo = "Benito Segura"
            db.add(user)
            db.commit()
            print(f"Superusuario {user.email} ACTUALIZADO con rol {user.rol}.")

    except Exception as e:
        print(f"Error gestionando superusuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    manage_superuser()
