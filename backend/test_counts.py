
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings
from app.repositories.subcategoria_item import subcategoria_item_repo

def test_api_counts():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        base_id = 32
        empresa_id = 1
        print(f"--- TESTING REPO COUNTS FOR BASE {base_id} ---")
        
        items = subcategoria_item_repo.get_all_by_base(db, base_id, empresa_id)
        for item in items:
            if "General" in item["descripcion"] or "Prueba" in item["descripcion"]:
                print(f"Subcat: {item['descripcion']} (ID: {item['id']}) | Count: {item['items_count']}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_api_counts()
