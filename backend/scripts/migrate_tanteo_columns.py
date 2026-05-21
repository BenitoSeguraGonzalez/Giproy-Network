import os
import sys

# Agregar el directorio backend al sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, backend_path)

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    print(f"Migrando base de datos en: {settings.SQLALCHEMY_DATABASE_URI}")
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE recursos ADD COLUMN tanteo_activo BOOLEAN DEFAULT 0;"))
            print("Columna tanteo_activo añadida.")
        except Exception as e:
            print(f"Columna tanteo_activo ya existe o error: {e}")

        try:
            conn.execute(text("ALTER TABLE recursos ADD COLUMN precio_original FLOAT DEFAULT NULL;"))
            print("Columna precio_original añadida.")
        except Exception as e:
            print(f"Columna precio_original ya existe o error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE recursos ADD COLUMN precio_tanteo FLOAT DEFAULT NULL;"))
            print("Columna precio_tanteo añadida.")
        except Exception as e:
            print(f"Columna precio_tanteo ya existe o error: {e}")
            
        conn.commit()

if __name__ == "__main__":
    migrate()
