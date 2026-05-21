
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def diagnose_mismatches():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("--- BUSCANDO INCONSISTENCIAS DE VINCULACIÓN ---")
        
        # 1. APUs con base/empresa que no coincide con su subcategoría item
        query_apus = text("""
            SELECT a.id, a.codigo, a.descripcion, a.base_trabajo_id as apu_base, s.base_trabajo_id as sub_base,
                   a.empresa_id as apu_emp, s.empresa_id as sub_emp
            FROM apus a
            JOIN subcategorias_items s ON a.subcategoria_item_id = s.id
            WHERE a.base_trabajo_id != s.base_trabajo_id OR a.empresa_id != s.empresa_id
        """)
        mismatched_apus = db.execute(query_apus).fetchall()
        print(f"APUs con Base/Empresa inconsistente: {len(mismatched_apus)}")
        for a in mismatched_apus:
            print(f"  ID: {a.id} | Cod: {a.codigo} | Base: {a.apu_base} vs {a.sub_base} | Emp: {a.apu_emp} vs {a.sub_emp}")

        # 2. Recursos con base/empresa inconsistente
        query_recursos = text("""
            SELECT r.id, r.codigo, r.descripcion, r.base_trabajo_id as res_base, s.base_trabajo_id as sub_base,
                   r.empresa_id as res_emp, s.empresa_id as sub_emp
            FROM recursos r
            JOIN subcategorias_items s ON r.subcategoria_item_id = s.id
            WHERE r.base_trabajo_id != s.base_trabajo_id OR r.empresa_id != s.empresa_id
        """)
        mismatched_recursos = db.execute(query_recursos).fetchall()
        print(f"Recursos con Base/Empresa inconsistente: {len(mismatched_recursos)}")
        for r in mismatched_recursos:
             print(f"  ID: {r.id} | Cod: {r.codigo} | Base: {r.res_base} vs {r.sub_base} | Emp: {r.res_emp} vs {r.sub_emp}")

        # 3. Buscar APUs que el usuario dice que "le faltan" (quizás no tienen subcategoria_item_id)
        # Buscar APUs cuya descripción mencione "General" o similar o que pertenezcan a las bases que el usuario usa
        query_missing = text("""
            SELECT id, codigo, descripcion, base_trabajo_id, subcategoria_item_id, revision
            FROM apus
            WHERE subcategoria_item_id IS NULL OR subcategoria_item_id NOT IN (SELECT id FROM subcategorias_items)
        """)
        orphan_apus = db.execute(query_missing).fetchall()
        print(f"APUs huérfanos (sin subcategoría válida): {len(orphan_apus)}")
        for o in orphan_apus:
            print(f"  ID: {o.id} | Cod: {o.codigo} | Desc: {o.descripcion} | Base: {o.base_trabajo_id} | Subcat: {o.subcategoria_item_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_mismatches()
