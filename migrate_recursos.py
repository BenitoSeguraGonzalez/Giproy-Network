import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate_recursos():
    db_url = settings.sync_database_url
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url, echo=True)

    try:
        with engine.begin() as conn:
            print("Adding tanteo_activo...")
            try:
                conn.execute(text("ALTER TABLE recursos ADD COLUMN tanteo_activo BOOLEAN DEFAULT FALSE NOT NULL;"))
                print("Column tanteo_activo added successfully.")
            except Exception as e:
                print(f"Could not add tanteo_activo (might already exist): {e}")

            print("Adding precio_original...")
            try:
                conn.execute(text("ALTER TABLE recursos ADD COLUMN precio_original DOUBLE PRECISION;"))
                print("Column precio_original added successfully.")
            except Exception as e:
                print(f"Could not add precio_original: {e}")

            print("Adding precio_tanteo...")
            try:
                conn.execute(text("ALTER TABLE recursos ADD COLUMN precio_tanteo DOUBLE PRECISION;"))
                print("Column precio_tanteo added successfully.")
            except Exception as e:
                print(f"Could not add precio_tanteo: {e}")

    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        engine.dispose()
        print("Migration script finished.")

if __name__ == "__main__":
    migrate_recursos()
