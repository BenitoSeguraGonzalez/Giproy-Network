
import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

engine = create_engine(settings.sync_database_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE presupuesto_detalles ADD COLUMN edt_id INTEGER REFERENCES edt_nodes(id) ON DELETE CASCADE;"))
        print("Agregada columna edt_id a presupuesto_detalles")
    except Exception as e:
        print(f"Skipping edt_id: {e}")
        
    conn.commit()
    print("Migracion de detalles completada exitosamente.")
