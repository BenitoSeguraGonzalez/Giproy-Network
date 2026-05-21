from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from app.models.proyecto import Proyecto
from app.services.formula_polinomica import formula_polinomica_service
import json

def inspect_budgets():
    db = SessionLocal()
    try:
        # Ver todos los proyectos y sus presupuestos
        proyectos = db.query(Proyecto).all()
        print(f"Total Proyectos: {len(proyectos)}")
        
        for p in proyectos:
            print(f"\nProyecto: {p.nombre} (ID: {p.id})")
            budgets = db.query(Presupuesto).filter(Presupuesto.proyecto_id == p.id).all()
            print(f"  Presupuestos: {len(budgets)}")
            for b in budgets:
                lineas = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == b.id).all()
                lineas_con_apu = [l for l in lineas if l.apu_id]
                print(f"    - ID: {b.id}, Rev: {b.revision}, Desc: {b.descripcion}")
                print(f"      Líneas totales: {len(lineas)}, Líneas con APU: {len(lineas_con_apu)}")
                
                # Intentar agregar recursos
                try:
                    res = formula_polinomica_service.get_formula_resources(db, b.id)
                    print(f"      Recursos Polinómica: {len(res)}")
                except Exception as e:
                    print(f"      Error Polinómica: {e}")
                    
    finally:
        db.close()

if __name__ == "__main__":
    inspect_budgets()
