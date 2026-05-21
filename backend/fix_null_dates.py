import psycopg2
from datetime import date, timedelta

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
    
    # Check for null license dates
    cur.execute("SELECT id, nombre, license_start_date, license_end_date FROM empresas")
    rows = cur.fetchall()
    
    today = date.today()
    one_year_later = today + timedelta(days=365)
    
    for row in rows:
        emp_id, nombre, start, end = row
        updates = []
        if start is None:
            print(f"Empresa '{nombre}' (ID {emp_id}) has NULL license_start_date. Setting to {today}.")
            cur.execute("UPDATE empresas SET license_start_date = %s WHERE id = %s", (today, emp_id))
        if end is None:
            print(f"Empresa '{nombre}' (ID {emp_id}) has NULL license_end_date. Setting to {one_year_later}.")
            cur.execute("UPDATE empresas SET license_end_date = %s WHERE id = %s", (one_year_later, emp_id))
            
    conn.commit()
    print("Database check complete.")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
