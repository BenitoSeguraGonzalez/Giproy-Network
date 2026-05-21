import sys
import os
from sqlalchemy import text

# Añadir el directorio raíz al path para importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine

def migrate():
    print("🚀 Añadiendo columna 'canton' a la tabla 'usuarios'...")
    
    query = "ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS canton VARCHAR(255)"
    
    with engine.connect() as conn:
        try:
            print(f"Ejecutando: {query}")
            conn.execute(text(query))
            conn.commit()
            print("✅ Columna 'canton' añadida correctamente.")
        except Exception as e:
            print(f"❌ Error al añadir columna: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
