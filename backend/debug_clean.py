
import sys
import os
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

sys.path.append(os.getcwd())
from app.core.config import settings

def diagnose():
    engine = create_engine(settings.sync_database_url)
    inspector = inspect(engine)
    
    print("--- RECURSOS COLUMNS ---")
    cols = [c['name'] for c in inspector.get_columns('recursos')]
    for c in cols:
        print(f" - {c}")
    
    print("\n--- CATEGORIAS_RECURSOS COLUMNS ---")
    cols = [c['name'] for c in inspector.get_columns('categorias_recursos')]
    for c in cols:
        print(f" - {c}")

    db = sessionmaker(bind=engine)()
    try:
        res = db.execute(text("SELECT id, descripcion FROM categorias_recursos LIMIT 5")).fetchall()
        print("\n--- CATEGORIAS_RECURSOS DATA ---")
        for r in res:
            print(f" - {r}")
    finally:
        db.close()

if __name__ == "__main__":
    diagnose()
