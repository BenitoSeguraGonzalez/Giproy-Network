from app.core.database import SessionLocal
from app.models.proyecto import Proyecto
from app.models.presupuesto import Presupuesto

db = SessionLocal()
proyectos = db.query(Proyecto).all()
for p in proyectos:
    presu = db.query(Presupuesto).filter(Presupuesto.proyecto_id == p.id, Presupuesto.revision == p.revision).first()
    status = "OK" if presu else "MISSING"
    print(f"Proyecto {p.id} ({p.codigo}) - Revision {p.revision} - Presupuesto: {status}")
db.close()
