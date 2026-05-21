import sqlite3
import os

def migrate():
    db_path = "giproy.db" # Usando el nombre común de la DB en el proyecto
    if not os.path.exists(db_path):
        # Intentar con otros nombres vistos en el list_dir
        for alt in ["giproy_dev.db", "giproy_erp_local.db", "database.db", "proyectos.db"]:
            if os.path.exists(alt):
                db_path = alt
                break
    
    print(f"Usando base de datos: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Añadir columna edt_id
        cursor.execute("ALTER TABLE proyectos_asignaciones ADD COLUMN edt_id INTEGER REFERENCES edt_nodes(id) ON DELETE CASCADE")
        print("Columna edt_id añadida correctamente a proyectos_asignaciones.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("La columna edt_id ya existe.")
        else:
            print(f"Error operando SQLite: {e}")
    except Exception as e:
        print(f"Error inesperado: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
