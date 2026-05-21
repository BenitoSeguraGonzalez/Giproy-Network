
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend to path to import app
sys.path.append(os.getcwd())

from app.core.config import settings

def diagnose():
    engine = create_engine(settings.sync_database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("--- DIAGNÓSTICO DE REVISIONES (Empresa 1) ---")
        
        for table in ['recursos', 'subcategorias_items', 'apus']:
            print(f"\nTabla: {table}")
            # Distribución de bases para Empresa 1
            rows = db.execute(text(f"SELECT base_trabajo_id, COUNT(*) FROM {table} WHERE empresa_id = 1 GROUP BY base_trabajo_id")).fetchall()
            print(f"  Distribución por base (E1): {dict(rows)}")
            
            # Distribución de revisiones para Empresa 1
            revs = db.execute(text(f"SELECT revision, COUNT(*) FROM {table} WHERE empresa_id = 1 GROUP BY revision")).fetchall()
            print(f"  Distribución por revisión (E1): {dict(revs)}")

        # Verificar bases de la Empresa 1
        bases = db.execute(text("SELECT id, nombre, activa FROM bases_trabajo WHERE empresa_id = 1")).fetchall()
        print("\nBases Trabajo Empresa 1:")
        for b in bases:
            print(f" - ID: {b[0]}, Nombre: {b[1]}, Activa: {b[2]}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
