from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def find_paises_everywhere():
    dbs = ["giproy_erp", "nuria", "postgres"]
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "admin123")
    server = os.getenv("POSTGRES_SERVER", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    
    for db in dbs:
        try:
            url = f"postgresql://{user}:{password}@{server}:{port}/{db}"
            engine = create_engine(url)
            print(f"\n--- Buscando en DB: {db} ---")
            with engine.connect() as conn:
                # Buscar en todos los esquemas
                query = text("""
                    SELECT table_schema, table_name 
                    FROM information_schema.tables 
                    WHERE table_name ILIKE '%pais%' OR table_name ILIKE '%countr%'
                """)
                result = conn.execute(query)
                matches = result.fetchall()
                if matches:
                    print(f"¡ENCONTRADO en {db}!")
                    for schema, table in matches:
                        print(f" - Esquema: {schema}, Tabla: {table}")
                        row_count = conn.execute(text(f"SELECT COUNT(*) FROM {schema}.{table}")).scalar()
                        print(f"   Filas: {row_count}")
                else:
                    print(f"No se encontraron tablas relacionadas en {db}.")
        except Exception as e:
            print(f"Error accediendo a {db}: {e}")

if __name__ == "__main__":
    find_paises_everywhere()
