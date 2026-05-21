import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.models.proyecto import Proyecto

def find_project_by_code():
    db = SessionLocal()
    try:
        p = db.query(Proyecto).filter(Proyecto.codigo == "GIPROY-2024-000000012").first()
        if p:
            print(f"FOUND PROJECT: ID={p.id}, Nombre={p.nombre}, Revision={p.revision}")
        else:
            print("Project with code GIPROY-2024-000000012 not found.")
            # List all project codes to be sure
            all_p = db.query(Proyecto).all()
            for x in all_p:
                print(f"  ID={x.id}, Code={x.codigo}, Name={x.nombre}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    find_project_by_code()
