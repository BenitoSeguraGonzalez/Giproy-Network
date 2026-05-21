import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse
from pydantic import ValidationError
import traceback

def diagnostic():
    db = SessionLocal()
    try:
        # Get first user
        user = db.query(Usuario).first()
        if not user:
            print("No users found in database.")
            return
            
        print(f"Testing diagnostic for User ID: {user.id}, Email: {user.email}")
        print(f"Empresa ID: {user.empresa_id}")
        
        # Test Empresa relation
        if user.empresa:
            print(f"Empresa loaded: {user.empresa.nombre}")
            print(f"Empresa fields: license_start_date={user.empresa.license_start_date}, license_end_date={user.empresa.license_end_date}")
        else:
            print("WARNING: User has NO associated empresa in DB.")
            
        # Try to validate with Pydantic
        try:
            resp = UsuarioResponse.model_validate(user)
            print("SUCCESS: Pydantic validation passed.")
        except ValidationError as ve:
            print("PYDANTIC VALIDATION FAILED:")
            print(ve)
        except Exception as e:
            print("OTHER ERROR DURING VALIDATION:")
            traceback.print_exc()
            
    except Exception as e:
        print("GENERAL ERROR:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    diagnostic()
