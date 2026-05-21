from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

def get_engine(db_name):
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "admin123")
    server = os.getenv("POSTGRES_SERVER", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    return create_engine(f"postgresql://{user}:{password}@{server}:{port}/{db_name}")

def list_tables(db_name):
    engine = get_engine(db_name)
    print(f"\n--- Tablas en {db_name} ---")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')"))
        tables = [(row[0], row[1]) for row in result]
        for schema, name in tables:
            try:
                count_res = conn.execute(text(f"SELECT COUNT(*) FROM {schema}.{name}"))
                count = count_res.scalar()
                print(f" - {schema}.{name} ({count} filas)")
                if 'pais' in name.lower() or 'countr' in name.lower():
                    print(f"   >>> ENCONTRADO: {schema}.{name}")
            except:
                print(f" - {schema}.{name} (Error al contar)")

if __name__ == "__main__":
    list_tables("giproy_erp")
    list_tables("nuria")
    list_tables("postgres")
