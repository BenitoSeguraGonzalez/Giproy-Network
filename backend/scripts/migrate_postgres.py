from sqlalchemy import text
from app.core.database import SessionLocal
import sys

def run_migration():
    db = SessionLocal()
    try:
        # 1. Agregar apu_hijo_id a apu_lineas
        try:
            db.execute(text("ALTER TABLE apu_lineas ADD COLUMN apu_hijo_id INTEGER REFERENCES apus(id)"))
            print("Columna apu_hijo_id añadida.")
        except Exception as e:
            print(f"La columna apu_hijo_id podría ya existir: {e}")
            db.rollback()

        # 2. Hacer recurso_id nullable en apu_lineas
        try:
            db.execute(text("ALTER TABLE apu_lineas ALTER COLUMN recurso_id DROP NOT NULL"))
            print("recurso_id hecho nullable.")
        except Exception as e:
            print(f"Error al hacer nullable recurso_id: {e}")
            db.rollback()

        # 3. Añadir descripcion_normalizada a apus
        try:
            db.execute(text("ALTER TABLE apus ADD COLUMN descripcion_normalizada VARCHAR(500)"))
            print("Columna descripcion_normalizada añadida a apus.")
        except Exception as e:
            print(f"La columna descripcion_normalizada podría ya existir: {e}")
            db.rollback()

        db.commit()
        print("Migraciones PostgreSQL aplicadas con éxito.")
    except Exception as e:
        print(f"Error general de migración: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
