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
    tables_to_check = ['licencias', 'empresa_licencias', 'empresa_uso', 'dispositivos']
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    existing_tables = [row[0] for row in cur.fetchall()]
    print(f"Existing tables: {existing_tables}")
    
    missing = [t for t in tables_to_check if t not in existing_tables]
    print(f"Missing tables: {missing}")
    
    if missing:
        print("ALERT: Some license tables are missing. This WILL cause 500 errors.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
