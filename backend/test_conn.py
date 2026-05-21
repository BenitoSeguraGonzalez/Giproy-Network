import psycopg2

try:
    print("Testing minimal psycopg2 connection...")
    conn = psycopg2.connect(
        dbname="giproy_erp",
        user="postgres",
        password="CEE9846B4CFDA0E7E14E3722BE702C88",
        host="localhost",
        port="5432"
    )
    print("Connection successful!")
    cur = conn.cursor()
    cur.execute("SELECT codigo, COUNT(*) FROM apus GROUP BY codigo HAVING COUNT(*) > 1 ORDER BY count DESC LIMIT 10;")
    rows = cur.fetchall()
    print(f"Total duplicate groups found: {len(rows)}")
    for row in rows:
        print(f"Code: {row[0]} | Count: {row[1]}")
    conn.close()
except Exception as e:
    import traceback
    traceback.print_exc()
