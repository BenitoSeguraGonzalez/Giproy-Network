
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings
from app.repositories.recurso import recurso_repo
from app.repositories.subcategoria import subcategoria_repo
from app.repositories.subcategoria_item import subcategoria_item_repo
from app.repositories.apu import apu_repo

def verify():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("--- VERIFICACIÓN DE REPOSITORIOS (Empresa 1) ---")
        
        # 1. Subcategorias Globales
        subcats = subcategoria_repo.get_multi_by_base(db, base_id=1, empresa_id=1)
        print(f"Subcategorias encontradas: {len(subcats)}")

        # 2. Items de Subcategoria (conteo)
        items = subcategoria_item_repo.get_all_by_base(db, base_trabajo_id=1, empresa_id=1)
        print(f"Items de Subcategoria vinculados a Base 1: {len(items)}")
        if items:
            print(f" - Ejemplo: {items[0]['descripcion']} (Items count: {items[0]['items_count']})")

        # 3. Recursos (Base 1)
        recursos = recurso_repo.get_all(db, base_trabajo_id=1, empresa_id=1)
        print(f"Recursos encontrados en Base 1: {len(recursos)}")

        # 4. APUs (Base 1)
        apus = apu_repo.get_all(db, empresa_id=1, base_trabajo_id=1)
        print(f"APUs encontrados en Base 1: {len(apus)}")

        print("\n¡ÉXITO! Las consultas ya no fallan.")

    except Exception as e:
        print(f"\nERROR durante la verificación: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
