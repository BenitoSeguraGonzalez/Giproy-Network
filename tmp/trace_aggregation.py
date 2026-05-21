from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.apu import APU
from decimal import Decimal

def trace_aggregation(budget_id):
    db = SessionLocal()
    try:
        b = db.query(Presupuesto).filter(Presupuesto.id == budget_id).first()
        if not b:
            print("Budget not found")
            return
            
        print(f"Tracing Budget {b.id} ({b.descripcion})")
        details = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == b.id).all()
        print(f"Found {len(details)} details")
        
        totals = {}
        for d in details:
            print(f"  Line: {d.descripcion} (APU ID: {d.apu_id}, Cant: {d.cantidad})")
            if not d.apu_id:
                print("    SKIP: No APU ID")
                continue
            
            apu = db.query(APU).filter(APU.id == d.apu_id).first()
            if not apu:
                print(f"    ERROR: APU {d.apu_id} not found in database!")
                continue
            
            print(f"    Expanding APU: {apu.descripcion} (Lines: {len(apu.lineas)})")
            for al in apu.lineas:
                print(f"      - APU Line: RecId={al.recurso_id}, HijoId={al.apu_hijo_id}, Cant={al.cantidad}")

    finally:
        db.close()

if __name__ == "__main__":
    trace_aggregation(2)
