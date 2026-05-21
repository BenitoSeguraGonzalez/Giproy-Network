import sys
import os
import json

# Añadir el directorio root al path para poder importar app
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioResponse

def test_serialization():
    db = SessionLocal()
    try:
        # Buscar el usuario Santiago Bermeo (usuario)
        user = db.query(Usuario).filter(Usuario.nombre_completo == "Santiago Bermeo", Usuario.rol == "usuario").first()
        if not user:
            print("ERROR: Usuario no encontrado.")
            return

        print(f"Probando serialización de Usuario ID {user.id} ({user.nombre_completo})...")
        
        # Probar model_validate (equivalente a lo que hace FastAPI)
        try:
            # Forzar carga de empresa para probar serialización anidada
            if user.empresa:
                print(f"Empresa vinculada: {user.empresa.nombre}")
            
            validated = UsuarioResponse.model_validate(user)
            print("VALIDACIÓN EXITOSA.")
            
            # Probar model_dump_json (lo que hace FastAPI al final)
            dumped = validated.model_dump_json()
            print("SERIALIZACIÓN EXITOSA.")
            # print(dumped[:200] + "...")
            
        except Exception as e:
            print(f"ERROR EN SERIALIZACIÓN: {str(e)}")
            import traceback
            traceback.print_exc()

    finally:
        db.close()

if __name__ == "__main__":
    test_serialization()
