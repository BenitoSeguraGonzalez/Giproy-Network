from app.core.database import SessionLocal
from app.services.formula_polinomica import formula_polinomica_service
from app.schemas.polinomica import FormulaPolinomicaResponse
import json

def test_serialization():
    db = SessionLocal()
    try:
        presupuesto_id = 2
        
        # Test CON_DESGLOSE
        print("\n--- Testing CON_DESGLOSE Serialization ---")
        formula = formula_polinomica_service.regenerate_formula(db, presupuesto_id, "CON_DESGLOSE")
        
        # Simular lo que hace FastAPI (Pydantic serialization)
        schema_obj = FormulaPolinomicaResponse.from_orm(formula)
        json_data = schema_obj.dict()
        
        print(f"Tipo en el Objeto SQLAlchemy: {formula.tipo}")
        print(f"Tipo en el Esquema Pydantic: {schema_obj.tipo}")
        print(f"Tipo en el JSON resultante: {json_data.get('tipo')}")
        
    finally:
        db.close()

if __name__ == "__main__":
    test_serialization()
