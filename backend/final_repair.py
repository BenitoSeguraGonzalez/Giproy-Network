
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings

def final_repair():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        print("🚀 REPARACIÓN FINAL: Alineación Multi-tenant y Re-vinculación")
        
        # 1. Alinear empresa_id en subcategorias_items (según su base_trabajo_id)
        print("Alineando subcategorías...")
        db.execute(text("""
            UPDATE subcategorias_items s
            SET empresa_id = b.empresa_id
            FROM bases_trabajo b
            WHERE s.base_trabajo_id = b.id
            AND s.empresa_id != b.empresa_id
        """))
        
        # 2. Alinear empresa_id en APUs (según su base_trabajo_id)
        print("Alineando APUs...")
        db.execute(text("""
            UPDATE apus a
            SET empresa_id = b.empresa_id
            FROM bases_trabajo b
            WHERE a.base_trabajo_id = b.id
            AND a.empresa_id != b.empresa_id
        """))
        
        # 3. Alinear empresa_id en Recursos (según su base_trabajo_id)
        print("Alineando Recursos...")
        db.execute(text("""
            UPDATE recursos r
            SET empresa_id = b.empresa_id
            FROM bases_trabajo b
            WHERE r.base_trabajo_id = b.id
            AND r.empresa_id != b.empresa_id
        """))

        # 4. Restaurar el link de los APUs de PRUEBA (IDs 29 y 30) a la Subcat 2321 (Categoría Prueba 1, Base 32)
        print("Restaurando APU PRUEBA 1 (IDs 29, 30)...")
        # Primero nos aseguramos de que APU 29 y 30 pertenezcan a la Base 32 (Empresa 3)
        db.execute(text("""
            UPDATE apus
            SET base_trabajo_id = 32, empresa_id = 3, subcategoria_item_id = 2321
            WHERE id IN (29, 30)
        """))

        # 5. Intentar re-vincular otros huérfanos de Base 16 que deberían ser de Base 32 o 33? 
        # No toco más para no arriesgar, a menos que sepa el link exacto.
        # Pero los MOCK de Conjunto de APUs (607489) deberían ir a la subcat 2322 (Base 33)
        print("Restaurando MOCK APUs a Subcat 2322...")
        db.execute(text("""
            UPDATE apus
            SET base_trabajo_id = 33, empresa_id = 3, subcategoria_item_id = 2322
            WHERE codigo LIKE '5-MOCK-607489%'
        """))

        db.commit()
        print("✅ Reparación final completada.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    final_repair()
