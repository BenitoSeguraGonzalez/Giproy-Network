from app.core.database import engine
from sqlalchemy import text

def update_db_schema():
    print("Expandiendo columnas de la tabla 'empresas'...")
    columns = [
        ("localidad", "VARCHAR(255)"),
        ("provincia", "VARCHAR(255)"),
        ("telefono", "VARCHAR(50)"),
        ("email", "VARCHAR(255)"),
        ("contacto_nombre", "VARCHAR(255)"),
        ("contacto_email", "VARCHAR(255)"),
        ("contacto_telefono", "VARCHAR(50)")
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE empresas ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                print(f"Columna '{col_name}' verificada/añadida.")
            except Exception as e:
                print(f"Error con '{col_name}': {e}")
        conn.commit()
    print("Actualización de esquema finalizada.")

if __name__ == "__main__":
    update_db_schema()
