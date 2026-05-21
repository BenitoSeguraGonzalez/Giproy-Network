import psycopg2

def verify():
    try:
        conn = psycopg2.connect(
            dbname="giproy_erp",
            user="postgres",
            password="CEE9846B4CFDA0E7E14E3722BE702C88",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()
        
        print("Checking if UniqueConstraint exists...")
        cur.execute("""
            SELECT conname 
            FROM pg_constraint 
            WHERE conname = 'uq_apu_codigo_base_empresa';
        """)
        if cur.fetchone():
            print("Constraint 'uq_apu_codigo_base_empresa' FOUND.")
        else:
            print("Constraint NOT FOUND.")
            
        print("\nChecking for any remaining duplicates...")
        cur.execute("""
            SELECT codigo, base_trabajo_id, empresa_id, COUNT(*)
            FROM apus
            GROUP BY codigo, base_trabajo_id, empresa_id
            HAVING COUNT(*) > 1;
        """)
        dupes = cur.fetchall()
        if not dupes:
            print("NO duplicates found.")
        else:
            print(f"FAILED: Found {len(dupes)} groups of duplicates.")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
