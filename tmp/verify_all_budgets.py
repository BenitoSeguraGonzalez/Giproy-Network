from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.services.formula_polinomica import formula_polinomica_service

def verify_all_budgets():
    db = SessionLocal()
    try:
        budgets = db.query(Presupuesto).all()
        for b in budgets:
            details = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == b.id).all()
            if not details: continue
            
            try:
                resources = formula_polinomica_service.get_formula_resources(db, b.id)
                print(f"Budget ID {b.id}: {len(details)} details, {len(resources)} resources.")
                if len(details) > 0 and len(resources) == 0:
                    print(f"  WARNING: Budget {b.id} has details but 0 resources!")
                    # Inspect why
                    for d in details:
                        if d.apu_id:
                            print(f"    Detail {d.id} has apu_id {d.apu_id} but no resources found?")
            except Exception as e:
                print(f"Budget ID {b.id}: Error - {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_all_budgets()
