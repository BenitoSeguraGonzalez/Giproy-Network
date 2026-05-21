import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.licencia import Licencia

def list_licenses():
    db = SessionLocal()
    try:
        lics = db.query(Licencia).all()
        for l in lics:
            print(f"ID: {l.id} | Código: {l.codigo} | Nombre: {l.nombre}")
    finally:
        db.close()

if __name__ == "__main__":
    list_licenses()
