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
    
    # Check count
    cur.execute("SELECT COUNT(*) FROM omniclass_maestro")
    count = cur.fetchone()[0]
    print(f"Total OmniClass records: {count}")
    
    # Test search for '23'
    cur.execute("SELECT id, codigo, titulo FROM omniclass_maestro WHERE codigo ILIKE '%23%' OR titulo ILIKE '%23%' LIMIT 5")
    results = cur.fetchall()
    print(f"Sample search results for '23': {results}")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
