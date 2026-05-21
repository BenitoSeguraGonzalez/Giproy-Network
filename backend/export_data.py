import sys
import os
import json
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date

# Path para modelos
sys.path.append(os.getcwd())
from app.core.config import settings

def custom_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, bytes):
        return obj.decode('utf-8')
    raise TypeError(f"Type {type(obj)} not serializable")

def export_db():
    print("\n--- INICIANDO EXPORTACION TOTAL (MODO LIMPIO) ---")
    
    # Usar la URL de la base de datos configurada en .env
    engine = create_engine(settings.sync_database_url)
    inspector = inspect(engine)
    
    data = {}
    tables = inspector.get_table_names()
    
    with engine.connect() as conn:
        for table in tables:
            print(f"Exportando tabla: {table.ljust(30)}", end=" ")
            try:
                # Usar comillas dobles para nombres de tablas en Postgres
                result = conn.execute(text(f'SELECT * FROM "{table}"'))
                rows = [dict(row._mapping) for row in result]
                data[table] = rows
                print(f"OK ({len(rows)} filas)")
            except Exception as e:
                print(f"ERROR: {e}")

    # El backup se guarda en la raíz del proyecto para facilitar la subida
    output_file = "../db_backup.json"
    if not os.path.exists("../"): # Si se ejecuta desde un sitio raro
         output_file = "db_backup.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(data, f, default=custom_serializer, indent=2)
    
    print(f"\nExportacion finalizada con exito!")
    print(f"Archivo generado: {os.path.abspath(output_file)}")
    print(f"Total tablas exportadas: {len(data.keys())}\n")

if __name__ == "__main__":
    export_db()
