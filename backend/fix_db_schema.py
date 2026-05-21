import psycopg2
import os

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
    
    # Check columns of empresas table
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'empresas'
    """)
    columns = [row[0] for row in cur.fetchall()]
    print(f"Columns in 'empresas': {columns}")
    
    # Check for missing columns
    required = ['session_timeout_minutes', 'decimales_moneda', 'decimales_calculos', 'plantillas_config']
    missing = [c for c in required if c not in columns]
    print(f"Missing columns: {missing}")
    
    if missing:
        print("Adding missing columns...")
        for col in missing:
            if col == 'plantillas_config':
                cur.execute(f"ALTER TABLE empresas ADD COLUMN {col} JSONB")
            else:
                cur.execute(f"ALTER TABLE empresas ADD COLUMN {col} INTEGER DEFAULT {30 if col == 'session_timeout_minutes' else (2 if col == 'decimales_moneda' else 4)}")
        conn.commit()
        print("Columns added successfully.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
