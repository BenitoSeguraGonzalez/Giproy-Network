import sys
import os

# Agrega la ruta base del proyecto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

def add_limits():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE empresas ADD COLUMN limite_administradores INTEGER DEFAULT 1 NOT NULL;"))
        db.execute(text("ALTER TABLE empresas ADD COLUMN limite_supervisores INTEGER DEFAULT 0 NOT NULL;"))
        db.commit()
        print("Columns added successfully")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_limits()
