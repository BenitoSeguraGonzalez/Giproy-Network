import mysql.connector
import sys

def check_mysql():
    passwords = ["", "admin123", "root", "password"]
    for pwd in passwords:
        try:
            print(f"Probando conexión MySQL con password: '{pwd}'...")
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password=pwd
            )
            print("¡Conectado a MySQL con éxito!")
            cursor = conn.cursor()
            cursor.execute("SHOW DATABASES")
            dbs = [db[0] for db in cursor.fetchall()]
            print("Bases de datos MySQL:", dbs)
            
            if 'giproynet' in dbs:
                print("Inspeccionando 'giproynet'...")
                cursor.execute("USE giproynet")
                cursor.execute("SHOW TABLES")
                tables = [t[0] for t in cursor.fetchall()]
                print("Tablas en giproynet:", tables)
                if 'paises' in [t.lower() for t in tables]:
                    cursor.execute("SELECT COUNT(*) FROM paises")
                    count = cursor.fetchone()[0]
                    print(f"Tabla 'paises' encontrada con {count} registros.")
                    if count > 0:
                        cursor.execute("SELECT * FROM paises LIMIT 5")
                        print("Primeros 5 registros:", cursor.fetchall())
            
            conn.close()
            return
        except Exception as e:
            print(f"Error con password '{pwd}': {e}")

if __name__ == "__main__":
    check_mysql()
