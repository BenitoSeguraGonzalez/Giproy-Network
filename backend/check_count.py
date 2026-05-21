import psycopg2

DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM apu_lineas")
    print(f"Total lines in apu_lineas: {cur.fetchone()[0]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
