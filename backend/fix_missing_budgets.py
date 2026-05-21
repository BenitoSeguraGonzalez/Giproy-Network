import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.models.proyecto import Proyecto
from app.models.presupuesto import Presupuesto
from app.services.presupuesto import initialize_presupuesto_from_edt

def fix_budgets():
    db = SessionLocal()
    try:
        projects = db.query(Proyecto).all()
        for p in projects:
            print(f"Checking Project {p.id} (Rev {p.revision}): {p.nombre}")
            # Check if budget for CURRENT revision exists
            existing = db.query(Presupuesto).filter(
                Presupuesto.proyecto_id == p.id,
                Presupuesto.revision == p.revision
            ).first()
            
            if not existing:
                print(f"  -> Initializing budget for revision {p.revision}...")
                initialize_presupuesto_from_edt(db, p.id, p.empresa_id, p.revision)
                print("  -> Done.")
            else:
                print(f"  -> Budget for revision {p.revision} already exists (ID {existing.id}).")
        
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_budgets()
