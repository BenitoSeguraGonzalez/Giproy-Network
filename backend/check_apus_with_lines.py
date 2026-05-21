import psycopg2

DB_NAME = "giproy_erp"
DB_USER = "postgres"
DB_PASS = "CEE9846B4CFDA0E7E14E3722BE702C88"
DB_HOST = "localhost"
DB_PORT = "5432"

try:
    conn = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    cur = conn.cursor()
    cur.execute("""
        SELECT a.id, a.descripcion, COUNT(l.id) 
        FROM apus a 
        JOIN apu_lineas l ON a.id = l.apu_id 
        GROUP BY a.id, a.descripcion 
        ORDER BY COUNT(l.id) DESC 
        LIMIT 10
    """)
    results = cur.fetchall()
    print("Top 10 APUs with lines:")
    for row in results:
        print(f"  ID: {row[0]}, Desc: {row[1]}, Lines: {row[2]}")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
