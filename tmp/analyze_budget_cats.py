from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto
from app.models.recurso import Recurso
from app.services.formula_polinomica import formula_polinomica_service
from decimal import Decimal

db = SessionLocal()
presupuesto_id = 2

presupuesto = db.query(Presupuesto).filter(Presupuesto.id == presupuesto_id).first()
recursos = formula_polinomica_service._aggregate_resources(db, presupuesto)

print(f"Total Recursos agregados: {len(recursos)}")

for r_id, cost in recursos.items():
    recurso = db.query(Recurso).filter(Recurso.id == r_id).first()
    subcat = recurso.subcategoria_item
    sc_code = getattr(subcat, 'subcategoria_codigo', "N/A")
    print(f"ID: {r_id} | Cost: {cost:.2f} | Code: {sc_code} | Desc: {recurso.descripcion}")

db.close()
