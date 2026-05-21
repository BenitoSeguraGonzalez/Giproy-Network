import psycopg2

# Database configuration from .env
DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()
    
    # Identify corrupted lines
    cur.execute("""
        SELECT COUNT(*) 
        FROM apu_lineas 
        WHERE recurso_id IS NULL AND apu_hijo_id IS NULL
    """)
    count = cur.fetchone()[0]
    print(f"Found {count} corrupted APU lines (orphans).")
    
    if count > 0:
        print("Cleaning up corrupted lines...")
        cur.execute("""
            DELETE FROM apu_lineas 
            WHERE recurso_id IS NULL AND apu_hijo_id IS NULL
        """)
        conn.commit()
        print(f"Successfully deleted {count} lines.")
    else:
        print("No corrupted lines found in DB.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
