import json
import os
import sys
from sqlalchemy import create_engine, text, inspect

# Añadir path para configuración
sys.path.append(os.getcwd())
from app.core.config import settings

def import_db():
    print("\n--- INICIANDO IMPORTACION TOTAL (MODO TIERRA QUEMADA) ---")
    engine = create_engine(settings.sync_database_url)
    
    # Buscar el backup en el directorio actual o en el padre
    backup_path = "db_backup.json"
    if not os.path.exists(backup_path):
        backup_path = "../db_backup.json"
        
    if not os.path.exists(backup_path):
        print(f"Error: No se encuentra db_backup.json")
        return

    print(f"Leyendo backup: {backup_path}")
    with open(backup_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Orden de prioridad para evitar fallos de claves foráneas
    priority = [
        "empresas", 
        "paises", 
        "unidades", 
        "roles", 
        "system_roles", 
        "usuarios", 
        "licencias", 
        "empresa_licencias",
        "licencias_empresa" # por si acaso el nombre varió
    ]
    
    # Resto de tablas
    all_tables = list(data.keys())
    import_order = [t for t in priority if t in all_tables]
    import_order += [t for t in all_tables if t not in import_order and t != "alembic_version"]

    with engine.begin() as conn:
        print("Desactivando restricciones y triggers...")
        conn.execute(text("SET session_replication_role = 'replica';"))
        
        # 1. LIMPIEZA TOTAL
        print("Borrando todos los datos existentes en la base de datos...")
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # Borramos en orden inverso para ser más limpios
        for table in reversed(import_order):
            if table in existing_tables:
                conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE;'))

        # 2. INSERCIÓN MASIVA
        for table_name in import_order:
            rows = data[table_name]
            if not rows:
                continue
            
            print(f"Importando: {table_name.ljust(30)} ({len(rows)} filas)")
            
            for row in rows:
                columns = row.keys()
                # Serializar diccionarios/listas a JSON para Postgres
                for col in columns:
                    if isinstance(row[col], (dict, list)):
                        row[col] = json.dumps(row[col])
                
                placeholders = [f":{col}" for col in columns]
                quoted_columns = [f'"{col}"' for col in columns]
                sql = text(f'INSERT INTO "{table_name}" ({", ".join(quoted_columns)}) VALUES ({", ".join(placeholders)})')
                conn.execute(sql, row)

        # 3. REACTIVAR SEGURIDAD
        print("Reactivando restricciones...")
        conn.execute(text("SET session_replication_role = 'origin';"))
        
        # 4. REPARAR SECUENCIAS (Crucial para que el sistema siga funcionando)
        print("Ajustando secuencias de IDs de PostgreSQL...")
        for table_name in data.keys():
            try:
                # Busca si la tabla tiene una secuencia en la columna 'id'
                res = conn.execute(text(f"SELECT pg_get_serial_sequence('\"{table_name}\"', 'id')"))
                seq = res.scalar()
                if seq:
                    conn.execute(text(f"SELECT setval('{seq}', COALESCE((SELECT MAX(id) FROM \"{table_name}\"), 0) + 1, false)"))
            except:
                continue

    print("\nMIGRACION COMPLETADA CON EXITO.")
    print("La base de datos de produccion es ahora un clon exacto de tu local.\n")

if __name__ == "__main__":
    import_db()
