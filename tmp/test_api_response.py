from app.db.session import SessionLocal
from app.services.formula_polinomica import formula_polinomica_service
from app.models.polinomica import FormulaPolinomica
from decimal import Decimal

def test_regenerate_api_logic():
    db = SessionLocal()
    try:
        presupuesto_id = 2  # Usando el de las pruebas anteriores
        
        print("\n--- Testing SIN_DESGLOSE ---")
        formula_sin = formula_polinomica_service.regenerate_formula(db, presupuesto_id, "SIN_DESGLOSE")
        print(f"Tipo devuelto: {formula_sin.tipo}")
        for m in formula_sin.monomios:
            print(f"  {m.simbolo}: {m.coeficiente} - {m.descripcion}")
            
        print("\n--- Testing CON_DESGLOSE ---")
        formula_con = formula_polinomica_service.regenerate_formula(db, presupuesto_id, "CON_DESGLOSE")
        print(f"Tipo devuelto: {formula_con.tipo}")
        for m in formula_con.monomios:
            print(f"  {m.simbolo}: {m.coeficiente} - {m.descripcion}")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_regenerate_api_logic()
