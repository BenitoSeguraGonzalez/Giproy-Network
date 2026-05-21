import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from sqlalchemy import text

def search_corruption():
    db = SessionLocal()
    try:
        print("Checking presupuesto_detalles for NULL apu_id...")
        res = db.execute(text("SELECT id, descripcion, apu_id, edt_id FROM presupuesto_detalles WHERE apu_id IS NULL")).fetchall()
        if res:
            print(f"FOUND {len(res)} lines with no apu_id:")
            for r in res: print(f"  Line: {r}")
        else:
            print("No lines found with NULL apu_id.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    search_corruption()
