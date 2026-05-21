from sqlalchemy import text
from app.core.database import SessionLocal
import sys
import os

# Añadir el directorio raíz al path para poder importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def migrate_base_names():
    db = SessionLocal()
    try:
        print("Iniciando migración de nombres de bases...")
        
        # 1. Actualizar registros existentes en la base de datos
        result = db.execute(
            text("UPDATE bases_trabajo SET tipo = 'Base Maestra' WHERE tipo = 'Base Padre'")
        )
        db.commit()
        
        print(f"Se actualizaron {result.rowcount} registros de 'Base Padre' a 'Base Maestra'.")
        print("Migración completada con éxito.")
        
    except Exception as e:
        db.rollback()
        print(f"Error durante la migración: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_base_names()
