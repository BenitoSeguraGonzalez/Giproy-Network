
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def final_diagnosis():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("--- DIAGNÓSTICO FINALES ---")
        
        # 1. Buscar subcategorías "General" y sus conteos vs realidad
        query_subcat = text("""
            SELECT s.id, s.descripcion, s.base_trabajo_id, s.empresa_id,
                   (SELECT count(*) FROM apus a WHERE a.subcategoria_item_id = s.id) as count_by_link
            FROM subcategorias_items s
            WHERE s.descripcion ILIKE '%General%'
        """)
        results = db.execute(query_subcat).fetchall()
        for r in results:
            # Buscar APUs que tienen ese subcategoria_item_id pero diferente base o empresa
            query_mismatch = text("""
                SELECT count(*) FROM apus 
                WHERE subcategoria_item_id = :sid 
                AND (base_trabajo_id != :bid OR empresa_id != :eid)
            """)
            mismatches = db.execute(query_mismatch, {"sid": r.id, "bid": r.base_trabajo_id, "eid": r.empresa_id}).scalar()
            
            if r.count_by_link > 0:
                print(f"Subcat ID {r.id} ('{r.descripcion}'): LinkCount={r.count_by_link}, Mismatches={mismatches}, Base={r.base_trabajo_id}, Emp={r.empresa_id}")

        # 2. Buscar APUs con descripción "General" o similar que no coincidan
        print("\n--- APUs sospechosos ---")
        query_apus = text("""
            SELECT id, codigo, descripcion, subcategoria_item_id, base_trabajo_id, empresa_id
            FROM apus
            WHERE descripcion ILIKE '%General%' OR (subcategoria_item_id IS NULL AND base_trabajo_id IS NOT NULL)
        """)
        apus = db.execute(query_apus).fetchall()
        for a in apus:
            print(f"APU ID {a.id} | Cod: {a.codigo} | Desc: {a.descripcion} | SubID: {a.subcategoria_item_id} | Base: {a.base_trabajo_id} | Emp: {a.empresa_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    final_diagnosis()
