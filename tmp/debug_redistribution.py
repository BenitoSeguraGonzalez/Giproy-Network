from app.core.database import SessionLocal
from app.services.formula_polinomica import formula_polinomica_service
from app.models.polinomica import FormulaPolinomica, FormulaPolinomicaMonomio
from decimal import Decimal

db = SessionLocal()
presupuesto_id = 2

print("--- Testing SIN_DESGLOSE ---")
formula_sin = formula_polinomica_service.regenerate_formula(db, presupuesto_id, tipo="SIN_DESGLOSE")
print(f"Tipo: {formula_sin.tipo}")
for m in formula_sin.monomios:
    print(f"  {m.simbolo}: {m.coeficiente} - {m.descripcion}")

print("\n--- Testing CON_DESGLOSE ---")
formula_con = formula_polinomica_service.regenerate_formula(db, presupuesto_id, tipo="CON_DESGLOSE")
print(f"Tipo: {formula_con.tipo}")
print(f"Config Desglose: {formula_con.config_desglose}")
for m in formula_con.monomios:
    print(f"  {m.simbolo}: {m.coeficiente} - {m.descripcion}")

db.close()
