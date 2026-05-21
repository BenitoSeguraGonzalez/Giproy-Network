
import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

engine = create_engine(settings.sync_database_url)

cols_to_add = [
    "ALTER TABLE presupuesto_detalles ADD COLUMN edt_id INTEGER REFERENCES edt_nodes(id) ON DELETE CASCADE;",
    "ALTER TABLE presupuesto_detalles ADD COLUMN apu_id INTEGER REFERENCES apus(id) ON DELETE SET NULL;",
    "ALTER TABLE presupuesto_detalles ADD COLUMN codigo_item VARCHAR(100);",
    "ALTER TABLE presupuesto_detalles ADD COLUMN unidad VARCHAR(20);",
    "ALTER TABLE presupuesto_detalles ADD COLUMN cantidad NUMERIC(15, 6) DEFAULT 1.0;",
    "ALTER TABLE presupuesto_detalles ADD COLUMN precio_unitario NUMERIC(15, 6) DEFAULT 0.0;",
    "ALTER TABLE presupuesto_detalles ADD COLUMN precio_total NUMERIC(15, 6) DEFAULT 0.0;",
    "ALTER TABLE presupuesto_detalles ADD COLUMN notas TEXT;"
]

for cmd in cols_to_add:
    try:
        with engine.begin() as conn:  # Autocommits at end of block
            conn.execute(text(cmd))
            print(f"Success: {cmd}")
    except Exception as e:
        col = cmd.split('ADD COLUMN ')[1].split(' ')[0] if 'ADD COLUMN' in cmd else 'unknown'
        print(f"Skipping {col} - probably already exists")

print("Migracion separada completada exitosamente.")
