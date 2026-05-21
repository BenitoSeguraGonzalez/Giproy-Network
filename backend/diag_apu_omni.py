import psycopg2

DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

def diag():
    try:
        conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
        cur = conn.cursor()
        
        # 1. Check APUs with 0 lines
        cur.execute("""
            SELECT a.id, a.descripcion, COUNT(l.id) as line_count
            FROM apus a
            LEFT JOIN apu_lineas l ON a.id = l.apu_id
            GROUP BY a.id, a.descripcion
            HAVING COUNT(l.id) = 0
            LIMIT 10
        """)
        empty_apus = cur.fetchall()
        print("Empty APUs (0 lines):")
        for apu in empty_apus:
            print(f"ID: {apu[0]}, Desc: {apu[1]}")
            
        # 2. Check a specific APU if possible (e.g. searching for 'Prueba')
        cur.execute("SELECT id, descripcion FROM apus WHERE descripcion ILIKE '%Prueba%' LIMIT 5")
        prueba_apus = cur.fetchall()
        print("\n'Prueba' APUs found:")
        for apu in prueba_apus:
            cur.execute("SELECT id, recurso_id, apu_hijo_id FROM apu_lineas WHERE apu_id = %s", (apu[0],))
            lines = cur.fetchall()
            print(f"ID: {apu[0]}, Desc: {apu[1]}, Lines found: {len(lines)}")
            for line in lines:
                print(f"  Line ID: {line[0]}, Rec: {line[1]}, Hijo: {line[2]}")

        # 3. Check OmniClass API logic (simulating maestros.py query)
        # Assuming search for '23'
        q = '23'
        tabla = 23
        cur.execute("""
            SELECT codigo, titulo 
            FROM omniclass_maestro 
            WHERE tabla = %s 
            AND (codigo ILIKE %s OR titulo ILIKE %s)
            LIMIT 5
        """, (tabla, f'%{q}%', f'%{q}%'))
        res = cur.fetchall()
        print(f"\nOmniClass search results for '{q}' in Tabla {tabla}:")
        for row in res:
            print(f"  Code: {row[0]}, Title: {row[1]}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diag()
