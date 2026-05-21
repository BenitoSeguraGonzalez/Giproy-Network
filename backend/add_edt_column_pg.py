from sqlalchemy import text
from app.core.database import engine

def migrate():
    print(f"Connecting to database to add edt_id column...")
    with engine.connect() as conn:
        try:
            # PostgreSQL syntax
            conn.execute(text("ALTER TABLE proyectos_asignaciones ADD COLUMN IF NOT EXISTS edt_id INTEGER REFERENCES edt_nodes(id) ON DELETE CASCADE"))
            conn.commit()
            print("Migration successful: edt_id column added (or already existed).")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
