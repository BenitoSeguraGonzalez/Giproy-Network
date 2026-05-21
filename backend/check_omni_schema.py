import psycopg2

DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'omniclass_maestro'")
    cols = cur.fetchall()
    print("Columns for omniclass_maestro:")
    for col in cols:
        print(f"  {col[0]}: {col[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
