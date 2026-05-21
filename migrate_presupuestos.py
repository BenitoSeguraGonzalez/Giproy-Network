
import sys
import os
from sqlalchemy import create_engine, text

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings

engine = create_engine(settings.sync_database_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE presupuestos ADD COLUMN iva_aplicado NUMERIC(5, 2) DEFAULT 15.00;"))
        print("Agregada columna iva_aplicado")
    except Exception as e:
        print(f"Skipping iva_aplicado: {e}")

    try:
        conn.execute(text("ALTER TABLE presupuestos ADD COLUMN dec_moneda INTEGER DEFAULT 2;"))
        print("Agregada columna dec_moneda")
    except Exception as e:
        print(f"Skipping dec_moneda: {e}")

    try:
        conn.execute(text("ALTER TABLE presupuestos ADD COLUMN dec_calculos INTEGER DEFAULT 4;"))
        print("Agregada columna dec_calculos")
    except Exception as e:
        print(f"Skipping dec_calculos: {e}")
        
    conn.commit()
    print("Migracion completada exitosamente.")
