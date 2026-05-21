import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto
from app.api.endpoints.presupuestos import read_presupuesto
from app.models.usuario import Usuario

def test_read_presupuesto():
    db = SessionLocal()
    try:
        # Get an existing budget
        pres = db.query(Presupuesto).first()
        if not pres:
            print("No budgets found in database")
            return

        print(f"Testing budget ID: {pres.id}")
        
        # Mocking dependencies for the endpoint
        class MockUser:
            def __init__(self, id, empresa_id, rol, nombre_completo):
                self.id = id
                self.empresa_id = empresa_id
                self.rol = rol
                self.nombre_completo = nombre_completo

        mock_user = MockUser(id=1, empresa_id=pres.empresa_id, rol="Superadministrador", nombre_completo="Test User")
        
        # Call the endpoint function directly
        result = read_presupuesto(id=pres.id, db=db, current_user=mock_user, empresa_id=pres.empresa_id)
        
        print(f"Successfully read budget: {result.id}")
        print(f"Subtotal: {result.subtotal}")
        print(f"Total: {result.total}")
        print(f"Number of lines: {len(result.detalle)}")
        
        # Test Pareto endpoint function
        from app.api.endpoints.presupuestos import read_presupuesto_pareto
        pareto_result = read_presupuesto_pareto(id=pres.id, db=db, current_user=mock_user, empresa_id=pres.empresa_id)
        print(f"Pareto analysis successful. Items: {len(pareto_result.items)}")

        # Test Notas summary
        from app.api.endpoints.presupuestos import read_presupuesto_notas_summary
        notas_result = read_presupuesto_notas_summary(id=pres.id, db=db, current_user=mock_user, empresa_id=pres.empresa_id)
        print(f"Notas summary successful. General total: {notas_result.general_total}")

    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_read_presupuesto()
