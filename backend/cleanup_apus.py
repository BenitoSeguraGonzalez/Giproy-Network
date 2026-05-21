import psycopg2
import sys

def cleanup():
    try:
        print("Connecting to database...")
        conn = psycopg2.connect(
            dbname="giproy_erp",
            user="postgres",
            password="CEE9846B4CFDA0E7E14E3722BE702C88",
            host="localhost",
            port="5432"
        )
        cur = conn.cursor()
        
        # 1. Find the groups of duplicates
        print("Identifying duplicate groups...")
        cur.execute("""
            SELECT codigo, base_trabajo_id, empresa_id, COUNT(*)
            FROM apus
            WHERE empresa_id = 1
            GROUP BY codigo, base_trabajo_id, empresa_id
            HAVING COUNT(*) > 1;
        """)
        groups = cur.fetchall()
        print(f"Found {len(groups)} groups of duplicates.")
        
        total_deleted = 0
        
        for code, base_id, emp_id, count in groups:
            # For each group, we need to decide which one to keep
            # Criteria: 
            # 1. Version with more entries in apu_lineas
            # 2. Version with latest fecha_creacion
            
            cur.execute("""
                SELECT a.id, COUNT(l.id) as line_count, a.fecha_creacion
                FROM apus a
                LEFT JOIN apu_lineas l ON a.id = l.apu_id
                WHERE a.codigo = %s AND a.base_trabajo_id = %s AND a.empresa_id = %s
                GROUP BY a.id, a.fecha_creacion
                ORDER BY line_count DESC, a.fecha_creacion DESC;
            """, (code, base_id, emp_id))
            
            versions = cur.fetchall()
            keep_id = versions[0][0]
            redundant_ids = [v[0] for v in versions[1:]]
            
            print(f"Code: {code} | Group Size: {count} | Keeping ID: {keep_id} | Deleting {len(redundant_ids)} redundant copies.")
            
            # Update references in apu_lineas (if any other APU uses a redundant one as child)
            for old_id in redundant_ids:
                cur.execute("UPDATE apu_lineas SET apu_hijo_id = %s WHERE apu_hijo_id = %s", (keep_id, old_id))
            
            # Delete redundant APUs
            if redundant_ids:
                cur.execute("DELETE FROM apus WHERE id IN %s", (tuple(redundant_ids),))
                total_deleted += len(redundant_ids)
                
        conn.commit()
        print(f"\nSUCCESS: Cleanup finished. Deleted {total_deleted} redundant APU records.")
        conn.close()
        
    except Exception as e:
        print(f"ERROR during cleanup: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    cleanup()
