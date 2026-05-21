
from app.core.database import engine
from sqlalchemy import text

def repair_schema():
    print("🚀 Iniciando reparación de esquema (Añadiendo revision)...")
    
    queries = [
        "ALTER TABLE recursos ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0",
        "ALTER TABLE apus ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0",
        
        # Opcional: Asegurar que los registros existentes tengan revision 0 (ya es default, pero por si acaso)
        "UPDATE recursos SET revision = 0 WHERE revision IS NULL",
        "UPDATE apus SET revision = 0 WHERE revision IS NULL"
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"Ejecutando: {query}")
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"Error en {query}: {e}")
                conn.rollback()

    print("✅ Reparación de esquema completada.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.getcwd())
    repair_schema()
