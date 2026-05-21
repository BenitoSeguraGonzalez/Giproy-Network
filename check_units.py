import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from sqlalchemy import create_engine, text
from app.core.config import settings

def check_units():
    db_url = settings.sync_database_url
    engine = create_engine(db_url)
    try:
        with engine.connect() as conn:
            units = conn.execute(text("SELECT id, descripcion, subcategoria_codigo FROM unidades")).fetchall()
            print("Unidades in DB:")
            for u in units:
                print(u)
    except Exception as e:
        print(f"Error: {e}")
        
    print("\nCheck Recursos:")
    try:
         with engine.connect() as conn:
            recs = conn.execute(text("SELECT id, descripcion, unidad_id FROM recursos LIMIT 5")).fetchall()
            for r in recs:
                print(r)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_units()
