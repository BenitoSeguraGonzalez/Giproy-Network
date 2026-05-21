from app.core.database import SessionLocal
from app.models.polinomica import FormulaPolinomica

db = SessionLocal()
presupuesto_id = 2

formula = db.query(FormulaPolinomica).filter(FormulaPolinomica.presupuesto_id == presupuesto_id).first()
if formula:
    print(f"DATABASE | presupuesto_id={presupuesto_id} | tipo={formula.tipo} | config={formula.config_desglose}")
else:
    print(f"DATABASE | NOT FOUND for presupuesto_id={presupuesto_id}")

db.close()
