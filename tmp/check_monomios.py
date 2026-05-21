from app.core.database import SessionLocal
from app.models.polinomica import FormulaPolinomica, FormulaPolinomicaMonomio

db = SessionLocal()
presupuesto_id = 2

formula = db.query(FormulaPolinomica).filter(FormulaPolinomica.presupuesto_id == presupuesto_id).first()
if formula:
    print(f"DATABASE | id={formula.id} | tipo={formula.tipo}")
    monomios = db.query(FormulaPolinomicaMonomio).filter(FormulaPolinomicaMonomio.formula_id == formula.id).all()
    for m in monomios:
        print(f"  {m.simbolo}: {m.coeficiente} - {m.descripcion}")
else:
    print(f"DATABASE | NOT FOUND")

db.close()
