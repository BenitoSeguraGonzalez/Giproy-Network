
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def repair_data():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("🚀 INICIANDO ALINEACIÓN GLOBAL DE DATOS...")
        
        # 1. Alinear APUs con su Subcategoría Item padre
        query_align_apus = text("""
            UPDATE apus a
            SET base_trabajo_id = s.base_trabajo_id,
                empresa_id = s.empresa_id
            FROM subcategorias_items s
            WHERE a.subcategoria_item_id = s.id
            AND (a.base_trabajo_id != s.base_trabajo_id OR a.empresa_id != s.empresa_id)
            RETURNING a.id, a.codigo, a.base_trabajo_id as old_base, s.base_trabajo_id as new_base
        """)
        updated_apus = db.execute(query_align_apus).fetchall()
        print(f"APUs alineados: {len(updated_apus)}")
        for r in updated_apus:
            print(f"  Fixed APU {r.id} ({r.codigo}): Base {r.old_base} -> {r.new_base}")

        # 2. Alinear Recursos con su Subcategoría Item padre
        query_align_recursos = text("""
            UPDATE recursos r
            SET base_trabajo_id = s.base_trabajo_id,
                empresa_id = s.empresa_id
            FROM subcategorias_items s
            WHERE r.subcategoria_item_id = s.id
            AND (r.base_trabajo_id != s.base_trabajo_id OR r.empresa_id != s.empresa_id)
            RETURNING r.id, r.codigo, r.base_trabajo_id as old_base, s.base_trabajo_id as new_base
        """)
        updated_recursos = db.execute(query_align_recursos).fetchall()
        print(f"Recursos alineados: {len(updated_recursos)}")
        for r in updated_recursos:
             print(f"  Fixed Recurso {r.id} ({r.codigo}): Base {r.old_base} -> {r.new_base}")

        # 3. Intentar recuperar APUs huérfanos del usuario (Base 16)
        # El usuario dice que perdió datos en "General". 
        # Buscamos la subcategoría "General" de la Base 16 (SubcategoriaItem ID 1949 según mi diagnóstico previo)
        # Y le asignamos los APUs que el usuario "no ve".
        # Buscamos APUs de Base 16 sin subcategoría.
        
        print("\n🔎 Buscando APUs huérfanos en Base 16...")
        query_orphans_16 = text("""
            UPDATE apus
            SET subcategoria_item_id = 1949
            WHERE base_trabajo_id = 16 AND subcategoria_item_id IS NULL
            RETURNING id, codigo, descripcion
        """)
        restored_16 = db.execute(query_orphans_16).fetchall()
        print(f"APUs restaurados en Base 16 (General): {len(restored_16)}")
        for r in restored_16:
            print(f"  Restored {r.id} ({r.codigo}): {r.descripcion}")

        db.commit()
        print("\n✅ Reparación de datos completada satisfactoriamente.")

    except Exception as e:
        print(f"❌ Error durante la reparación: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    repair_data()
