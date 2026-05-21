
import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

engine = create_engine(settings.sync_database_url)

with engine.connect() as conn:
    cols_to_add = [
        "ALTER TABLE presupuesto_detalles ADD COLUMN codigo_item VARCHAR(100);",
        "ALTER TABLE presupuesto_detalles ADD COLUMN unidad VARCHAR(20);",
        "ALTER TABLE presupuesto_detalles ADD COLUMN cantidad NUMERIC(15, 6) DEFAULT 1.0;",
        "ALTER TABLE presupuesto_detalles ADD COLUMN precio_unitario NUMERIC(15, 6) DEFAULT 0.0;",
        "ALTER TABLE presupuesto_detalles ADD COLUMN precio_total NUMERIC(15, 6) DEFAULT 0.0;",
        "ALTER TABLE presupuesto_detalles ADD COLUMN notas TEXT;"
    ]
    
    for cmd in cols_to_add:
        try:
            conn.execute(text(cmd))
            print(f"Success: {cmd}")
        except Exception as e:
            print(f"Skipping: {cmd.split('ADD COLUMN ')[1].split(' ')[0]} - ya existe")
            
    conn.commit()
    print("Migracion comprehensiva completada exitosamente.")
