import psycopg2

try:
    conn = psycopg2.connect(dbname='giproy_erp', user='postgres', password='CEE9846B4CFDA0E7E14E3722BE702C88', host='localhost', port='5432')
    c = conn.cursor()
    c.execute("UPDATE usuarios SET rol = TRIM(rol)")
    conn.commit()
    print("Roles actualizados y limpios.")
    
    c.execute("SELECT email, rol FROM usuarios WHERE email='benito.segura@gmail.com'")
    row = c.fetchone()
    print(f"Benito: '{row[1]}'")
except Exception as e:
    print("Error:", e)
