
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def verify_final():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("--- VERIFICACIÓN FINAL DE INTEGRIDAD ---")
        
        # 1. Verificar huérfanos
        query_orphans = text("SELECT count(*) FROM apus WHERE subcategoria_item_id IS NULL OR base_trabajo_id IS NULL")
        orphans = db.execute(query_orphans).scalar()
        print(f"APUs huérfanos remanentes: {orphans}")
        
        # 2. Verificar desalineación
        query_mismatch = text("""
            SELECT count(*) 
            FROM apus a
            JOIN subcategorias_items s ON a.subcategoria_item_id = s.id
            WHERE a.base_trabajo_id != s.base_trabajo_id OR a.empresa_id != s.empresa_id
        """)
        mismatches = db.execute(query_mismatch).scalar()
        print(f"APUs desalineados remanentes: {mismatches}")

        # 3. Conteos específicos en Base 16 (General ID 1949)
        query_count_16 = text("SELECT count(*) FROM apus WHERE subcategoria_item_id = 1949")
        count_16 = db.execute(query_count_16).scalar()
        print(f"APUs en Base 16 - General: {count_16}")

        if orphans == 0 and mismatches == 0:
            print("\n✅ INTEGRIDAD DE DATOS AL 100%.")
        else:
            print("\n⚠️ Aún persisten problemas de integridad.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_final()
