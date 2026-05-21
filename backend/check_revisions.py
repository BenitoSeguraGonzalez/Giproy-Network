import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto

def check_revisions():
    db = SessionLocal()
    try:
        for pid in [5, 6]:
            print(f"\nProject {pid} Budgets:")
            budgets = db.query(Presupuesto).filter(Presupuesto.proyecto_id == pid).all()
            for b in budgets:
                print(f"  ID: {b.id}, Revision: {b.revision}, Desc: {b.descripcion}, Status: {b.estado}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_revisions()
