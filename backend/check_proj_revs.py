import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.models.proyecto import Proyecto

def check_project_revisions():
    db = SessionLocal()
    try:
        for pid in [5, 6, 7, 8]:
            p = db.query(Proyecto).get(pid)
            if p:
                print(f"Project {pid}: {p.nombre}, Revision: {p.revision}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_project_revisions()
