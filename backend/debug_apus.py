
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def diagnose_deep():
    engine = create_engine(settings.sync_database_url)
    db = sessionmaker(bind=engine)()
    
    try:
        print("--- DIAGNÓSTICO PROFUNDO DE APUS ---")
        
        # 1. Ver bases activas
        bases = db.execute(text("SELECT id, nombre FROM bases_trabajo WHERE activa = True")).fetchall()
        print(f"Bases activas ID: {[b[0] for b in bases]}")
        
        for base in bases:
            base_id = base[0]
            print(f"\nAnalizando Base: {base.nombre} (ID: {base_id})")
            
            # Subcategorías (Cat 5) de esta base
            subs = db.execute(text("""
                SELECT id, codigo, descripcion 
                FROM subcategorias_items 
                WHERE base_trabajo_id = :base_id AND subcategoria_codigo = 5
            """), {"base_id": base_id}).fetchall()
            
            print(f"Subcategorías de APU encontradas: {len(subs)}")
            for sub in subs:
                # Contar APUs en esta subcat (cualquier revision)
                apus = db.execute(text("""
                    SELECT id, codigo, descripcion, revision, base_trabajo_id 
                    FROM apus 
                    WHERE subcategoria_item_id = :sub_id
                """), {"sub_id": sub.id}).fetchall()
                
                print(f"  Item Subcat: {sub.descripcion} (ID: {sub.id}) -> {len(apus)} APUs")
                for apu in apus:
                    print(f"    - APU: {apu.codigo} | Rev: {apu.revision} | Base: {apu.base_trabajo_id}")

        # 2. Buscar APUs "huérfanos" (sin subcat o base coherente)
        huerfanos = db.execute(text("""
            SELECT a.id, a.codigo, a.descripcion, a.subcategoria_item_id, a.base_trabajo_id
            FROM apus a
            LEFT JOIN subcategorias_items s ON a.subcategoria_item_id = s.id
            WHERE s.id IS NULL OR s.base_trabajo_id != a.base_trabajo_id
        """)).fetchall()
        
        if huerfanos:
            print(f"\n¡ALERTA! APUs con inconsistencia de tabla subcategoria_item: {len(huerfanos)}")
            for h in huerfanos:
                print(f"  ID: {h.id} | Cod: {h.codigo} | Subcat_ID: {h.subcategoria_item_id} | Base_ID: {h.base_trabajo_id}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose_deep()
