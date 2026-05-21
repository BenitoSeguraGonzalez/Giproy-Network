import os
import sys
from dotenv import load_dotenv

# Añadir el path del backend para poder importar los módulos
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv("backend/.env")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.usuario import Usuario
from app.models.empresa import Empresa
from app.services.usuario import usuario_service
from app.schemas.usuario import UsuarioCreate
from fastapi import HTTPException

# Configuración de base de datos real
user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
server = os.getenv("POSTGRES_SERVER")
port = os.getenv("POSTGRES_PORT")
db_name = os.getenv("POSTGRES_DB")

DATABASE_URL = f"postgresql://{user}:{password}@{server}:{port}/{db_name}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_real_fix():
    db = SessionLocal()
    email = "test_multi@proy.com"
    
    # 1. Encontrar o crear dos empresas de prueba si no existen
    emp1 = db.query(Empresa).first()
    emp2 = db.query(Empresa).offset(1).first()
    
    if not emp1 or not emp2:
        print("Need at least 2 companies in the DB to test.")
        return

    # Superadmin para el contexto
    superadmin = db.query(Usuario).filter(Usuario.rol == "Superadministrador").first()
    if not superadmin:
        print("Superadmin not found in DB.")
        return

    print(f"Testing with Email: {email}")
    print(f"Empresa 1: {emp1.nombre} (ID: {emp1.id})")
    print(f"Empresa 2: {emp2.nombre} (ID: {emp2.id})")

    # Limpiar si existe (solo para el test)
    db.query(Usuario).filter(Usuario.email == email).delete()
    db.commit()

    try:
        print("\nStep 1: Creating in Empresa 1 as 'usuario'...")
        u1_in = UsuarioCreate(
            email=email, nombre_completo="Test User", password="password123", rol="usuario", 
            empresa_id=emp1.id, acepta_politica_privacidad=True
        )
        u1 = usuario_service.create_usuario(db, u1_in, superadmin)
        print(f"Successfully created in {emp1.nombre}")

        print("\nStep 2: Creating in Empresa 2 as 'usuario' (THE FIX)...")
        u2_in = UsuarioCreate(
            email=email, nombre_completo="Test User", password="password123", rol="usuario", 
            empresa_id=emp2.id, acepta_politica_privacidad=True
        )
        u2 = usuario_service.create_usuario(db, u2_in, superadmin)
        print(f"Successfully created in {emp2.nombre}")

        print("\nSUCCESS: Multi-company user creation works on real DB!")
        
    except HTTPException as e:
        print(f"FAIL (HTTPException): {e.detail}")
    except Exception as e:
        print(f"FAIL (Unexpected): {str(e)}")
    finally:
        # Cleanup
        db.query(Usuario).filter(Usuario.email == email).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    verify_real_fix()
