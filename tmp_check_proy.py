
from app.core.database import SessionLocal
from app.models.proyecto import Proyecto

def check_proyectos():
    db = SessionLocal()
    try:
        proyectos = db.query(Proyecto).all()
        print(f"Total proyectos found: {len(proyectos)}")
        for p in proyectos:
            print(f"ID: {p.id}, Nombre: {p.nombre}, Codigo: '{p.codigo}', CodigoRoot: '{p.codigo_root}', Rev: {p.revision}")
            
            # Simulate get_revisions_by_codigo_root
            revisions = db.query(Proyecto).filter(Proyecto.codigo_root == p.codigo_root).all()
            print(f"  Revisions found for root '{p.codigo_root}': {len(revisions)}")
    finally:
        db.close()

if __name__ == "__main__":
    check_proyectos()
