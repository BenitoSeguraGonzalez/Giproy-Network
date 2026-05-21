import os
import sys

# Añadir el directorio raíz al path para importar app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database import SessionLocal

def find_fk_dependencies():
    db = SessionLocal()
    try:
        print("🔍 Investigando dependencias de llave foránea para 'subcategorias_items'...")
        
        query = text("""
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='subcategorias_items';
        """)
        
        results = db.execute(query).all()
        
        if not results:
            print("❓ No se encontraron deependencias registradas en information_schema (esto es extraño).")
        else:
            for row in results:
                print(f"📌 Tabla: {row[0]}, Columna: {row[1]} -> REFERENCIA: {row[2]}({row[3]})")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    find_fk_dependencies()
