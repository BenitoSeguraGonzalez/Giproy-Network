
import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Add backend to path to import app
sys.path.append(os.getcwd())

from app.core.config import settings

def diagnose():
    engine = create_engine(settings.sync_database_url)
    db = SessionLocal = sessionmaker(bind=engine)()

    try:
        inspector = inspect(engine)
        print("--- SCHEMA INSPECTION ---")
        for table in ['categorias_recursos', 'recursos', 'subcategorias_items', 'apus']:
            cols = [c['name'] for c in inspector.get_columns(table)]
            print(f"Table '{table}': {', '.join(cols)}")
            
            # Count
            count = db.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            print(f"  Total rows: {count}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
