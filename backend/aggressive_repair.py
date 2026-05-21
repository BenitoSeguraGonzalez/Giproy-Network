
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings

def aggressive_repair():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        print("🚀 AGGRESSIVE REPAIR - Aligning Base IDs")
        
        # 1. Audit APUs before
        audit_query = text("""
            SELECT a.id, a.codigo, a.base_trabajo_id as apu_base, s.base_trabajo_id as sub_base
            FROM apus a
            JOIN subcategorias_items s ON a.subcategoria_item_id = s.id
            WHERE a.base_trabajo_id != s.base_trabajo_id
        """)
        bad_links = db.execute(audit_query).fetchall()
        print(f"Inconsistencias detectadas en APUs: {len(bad_links)}")
        for b in bad_links:
            print(f"  ID {b.id} ({b.codigo}): Base {b.apu_base} != SubBase {b.sub_base}")

        # 2. Update APUs
        if bad_links:
            update_query = text("""
                UPDATE apus a
                SET base_trabajo_id = s.base_trabajo_id
                FROM subcategorias_items s
                WHERE a.subcategoria_item_id = s.id
                AND a.base_trabajo_id != s.base_trabajo_id
            """)
            db.execute(update_query)
            print("APUs actualizados.")

        # 3. Audit Resources
        audit_res_query = text("""
            SELECT r.id, r.codigo, r.base_trabajo_id as res_base, s.base_trabajo_id as sub_base
            FROM recursos r
            JOIN subcategorias_items s ON r.subcategoria_item_id = s.id
            WHERE r.base_trabajo_id != s.base_trabajo_id
        """)
        bad_res = db.execute(audit_res_query).fetchall()
        print(f"Inconsistencias detectadas en Recursos: {len(bad_res)}")
        for b in bad_res:
             print(f"  ID {b.id} ({b.codigo}): Base {b.res_base} != SubBase {b.sub_base}")

        # 4. Update Resources
        if bad_res:
            update_res_query = text("""
                UPDATE recursos r
                SET base_trabajo_id = s.base_trabajo_id
                FROM subcategorias_items s
                WHERE r.subcategoria_item_id = s.id
                AND r.base_trabajo_id != s.base_trabajo_id
            """)
            db.execute(update_res_query)
            print("Recursos actualizados.")

        db.commit()
        print("✅ Reparación agresiva completada.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    aggressive_repair()
