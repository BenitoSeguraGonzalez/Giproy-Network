
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings
from app.repositories.subcategoria_item import subcategoria_item_repo

def dump_all_items():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        base_id = 32
        empresa_id = 1
        print(f"--- DUMPING ALL ITEMS FOR BASE {base_id} ---")
        
        items = subcategoria_item_repo.get_all_by_base(db, base_id, empresa_id)
        print(f"Total items found: {len(items)}")
        for item in items:
            print(f"[{item['codigo']}] {item['descripcion']} (ID: {item['id']}) | Count: {item['items_count']} | Code: {item['subcategoria_codigo']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    dump_all_items()
