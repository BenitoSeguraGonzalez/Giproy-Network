from app.core.database import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    
    print("--- Tabla: empresas ---")
    columns = inspector.get_columns('empresas')
    for column in columns:
        print(f"Columna: {column['name']} - Tipo: {column['type']}")

    # print("\n--- Tabla: usuarios ---")
    # ...
    
    print("\n--- Restricciones: usuarios ---")
    constraints = inspector.get_unique_constraints('usuarios')
    for constraint in constraints:
        print(f"Constraint: {constraint['name']} - Columns: {constraint['column_names']}")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    check_schema()
