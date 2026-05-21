from app.core.database import SessionLocal
from app.models.recurso import Recurso
from app.models.apu import APU

def verify_healing():
    db = SessionLocal()
    try:
        recursos_null = db.query(Recurso).filter(Recurso.ultima_modificacion.is_(None)).count()
        apus_null = db.query(APU).filter(APU.ultima_modificacion.is_(None)).count()
        
        print(f"VERIFICACIÓN:")
        print(f"Recursos con fecha nula: {recursos_null}")
        print(f"APUs con fecha nula: {apus_null}")
        
        if recursos_null == 0 and apus_null == 0:
            print("TODO EN ORDEN. No hay fechas nulas.")
        else:
            print("ERROR: Aún existen registros con fechas nulas.")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify_healing()
