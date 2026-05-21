from app.core.database import SessionLocal
from app.models.presupuesto import Presupuesto, PresupuestoDetalle
from sqlalchemy import desc

def find_recent_budgets():
    db = SessionLocal()
    try:
        budgets = db.query(Presupuesto).order_by(desc(Presupuesto.fecha_creacion)).limit(10).all()
        for b in budgets:
            print(f"ID: {b.id}, ProyectoID: {b.proyecto_id}, Rev: {b.revision}, Desc: {b.descripcion}, Fecha: {b.fecha_creacion}")
            count = db.query(PresupuestoDetalle).filter(PresupuestoDetalle.presupuesto_id == b.id).count()
            print(f"  Detalles: {count}")
    finally:
        db.close()

if __name__ == "__main__":
    find_recent_budgets()
