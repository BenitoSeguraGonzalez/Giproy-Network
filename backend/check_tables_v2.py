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
    
    # Check for tables
    tables_to_check = ['licencias', 'empresa_licencias']
    for t in tables_to_check:
        cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = %s)", (t,))
        exists = cur.fetchone()[0]
        print(f"Table '{t}' exists: {exists}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
