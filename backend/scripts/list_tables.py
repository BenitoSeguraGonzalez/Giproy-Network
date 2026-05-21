from sqlalchemy import create_engine, inspect
from app.core.config import settings

def list_tables():
    engine = create_engine(settings.sync_database_url)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tablas encontradas:")
    for table in tables:
        print(f"- {table}")

if __name__ == "__main__":
    list_tables()
