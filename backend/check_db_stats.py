import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.proyecto import Proyecto
from app.models.empresa import Empresa

def check_db_stats():
    db = SessionLocal()
    
    proy_count = db.query(Proyecto).count()
    print(f"Total Proyectos in DB: {proy_count}")
    
    emp_count = db.query(Empresa).count()
    print(f"Total Empresas in DB: {emp_count}")
    
    proys_by_emp = db.query(Proyecto.empresa_id, Proyecto.codigo).all()
    print("\nProyectos by Empresa ID:")
    for eid, code in proys_by_emp:
        print(f"Empresa {eid}: {code}")
        
    db.close()

if __name__ == "__main__":
    check_db_stats()
