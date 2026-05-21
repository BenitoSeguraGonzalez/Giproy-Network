import sqlite3
import os

# Determinar la ruta a la base de datos (se usa "erp.db" usualmente por defecto)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "giproy_erp_local.db")

def migrate():
    print(f"Conectando a SQLite en: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("La base de datos no existe en esta ruta. Saliendo.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Comprobar columnas existentes
        cursor.execute("PRAGMA table_info(apu_lineas)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "apu_hijo_id" not in columns:
            print("Migrando: Agregando la columna 'apu_hijo_id' a la tabla 'apu_lineas'...")
            cursor.execute("ALTER TABLE apu_lineas ADD COLUMN apu_hijo_id INTEGER REFERENCES apus(id);")
            print("Columna añadida con éxito.")
        else:
            print("La tabla 'apu_lineas' ya contiene la columna 'apu_hijo_id'.")
            
        print("Migración completada.")
    except Exception as e:
        print(f"Error durante la migración: {e}")
    finally:
        conn.commit()
        conn.close()

if __name__ == "__main__":
    migrate()
