from app.core.database import SessionLocal
from app.models.recurso import Recurso
from app.models.apu import APU
from sqlalchemy import or_

def heal_dates():
    db = SessionLocal()
    try:
        # 1. Healing Recursos
        recursos_null = db.query(Recurso).filter(Recurso.ultima_modificacion.is_(None)).all()
        print(f"Encontrados {len(recursos_null)} Recursos con fecha de modificación nula.")
        
        for r in recursos_null:
            r.ultima_modificacion = r.fecha_creacion
            db.add(r)
        
        # 2. Healing APUs
        apus_null = db.query(APU).filter(APU.ultima_modificacion.is_(None)).all()
        print(f"Encontrados {len(apus_null)} APUs con fecha de modificación nula.")
        
        for a in apus_null:
            a.ultima_modificacion = a.fecha_creacion
            db.add(a)
            
        if recursos_null or apus_null:
            db.commit()
            print("Curación completada con éxito.")
        else:
            print("No se encontraron registros que requieran curación.")
            
    except Exception as e:
        db.rollback()
        print(f"Error durante la curación: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    heal_dates()
