
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings
from app.models.subcategoria_item import SubcategoriaItem

def scan_all_orm():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        print("--- SCANNING ALL SubcategoriaItem (ORM) ---")
        items = db.query(SubcategoriaItem).all()
        print(f"Total items in DB (ORM): {len(items)}")
        
        # Filtrar manualmente para ver qué pasa
        found = [i for i in items if i.base_trabajo_id == 32]
        print(f"Items in Base 32 (Manual Filter): {len(found)}")
        for i in found:
            print(f"  ID {i.id} | Desc: {i.descripcion} | Empresa: {i.empresa_id} | Base: {i.base_trabajo_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    scan_all_orm()
