
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def repair_links():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("🚀 Iniciando reparación de coherencia de Base ID...")
        
        # 1. Reparar APUs
        query_apus = text("""
            UPDATE apus a
            SET base_trabajo_id = s.base_trabajo_id
            FROM subcategorias_items s
            WHERE a.subcategoria_item_id = s.id
            AND a.base_trabajo_id != s.base_trabajo_id
            RETURNING a.id, a.codigo, a.base_trabajo_id, s.base_trabajo_id as new_base
        """)
        
        res_apus = db.execute(query_apus).fetchall()
        print(f"APUs corregidos: {len(res_apus)}")
        for r in res_apus:
            print(f"  Fixed APU {r.codigo} (ID {r.id}): {r.base_trabajo_id} -> {r.new_base}")
        
        # 2. Reparar Recursos
        query_recursos = text("""
            UPDATE recursos r
            SET base_trabajo_id = s.base_trabajo_id
            FROM subcategorias_items s
            WHERE r.subcategoria_item_id = s.id
            AND r.base_trabajo_id != s.base_trabajo_id
            RETURNING r.id, r.codigo, r.base_trabajo_id, s.base_trabajo_id as new_base
        """)
        
        res_recursos = db.execute(query_recursos).fetchall()
        print(f"Recursos corregidos: {len(res_recursos)}")
        for r in res_recursos:
             print(f"  Fixed Recurso {r.codigo} (ID {r.id}): {r.base_trabajo_id} -> {r.new_base}")

        db.commit()
        print("✅ Reparación completada.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    repair_links()
