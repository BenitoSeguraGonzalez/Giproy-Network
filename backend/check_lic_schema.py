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
    
    # Check columns of empresa_licencias table
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'empresa_licencias'
    """)
    columns = [row[0] for row in cur.fetchall()]
    print(f"Columns in 'empresa_licencias': {columns}")
    
    # Check for missing columns
    required = ['activa', 'starts_at', 'ends_at']
    missing = [c for c in required if c not in columns]
    print(f"Missing columns in 'empresa_licencias': {missing}")
    
    if missing:
        print(f"ALERT: Missing columns {missing} in empresa_licencias!")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
