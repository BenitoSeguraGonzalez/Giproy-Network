from sqlalchemy import create_engine, inspect
import os
from dotenv import load_dotenv

# Cargar .env desde el directorio backend
dotenv_path = os.path.join(os.getcwd(), "backend", ".env")
load_dotenv(dotenv_path)

user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
server = os.getenv("POSTGRES_SERVER")
port = os.getenv("POSTGRES_PORT")
db_name = os.getenv("POSTGRES_DB")

DATABASE_URL = f"postgresql://{user}:{password}@{server}:{port}/{db_name}"

engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

def check_usuarios_indices():
    print(f"Checking indices for table 'usuarios'...")
    try:
        indices = inspector.get_indexes("usuarios")
        for idx in indices:
            print(f"Index: {idx['name']}, Columns: {idx['column_names']}, Unique: {idx['unique']}")
        
        print("\nChecking unique constraints...")
        constraints = inspector.get_unique_constraints("usuarios")
        for const in constraints:
            print(f"Constraint: {const['name']}, Columns: {const['column_names']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_usuarios_indices()
