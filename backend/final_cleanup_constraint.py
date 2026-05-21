import psycopg2
import sys

def final_cleanup_and_constraint():
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
        
        # 1. Find the groups of duplicates across ALL companies
        print("Identifying duplicate groups for ALL companies...")
        cur.execute("""
            SELECT codigo, base_trabajo_id, empresa_id, COUNT(*)
            FROM apus
            GROUP BY codigo, base_trabajo_id, empresa_id
            HAVING COUNT(*) > 1;
        """)
        groups = cur.fetchall()
        print(f"Found {len(groups)} groups of duplicates globally.")
        
        total_deleted = 0
        
        for code, base_id, emp_id, count in groups:
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
            
            # Update references in apu_lineas
            for old_id in redundant_ids:
                cur.execute("UPDATE apu_lineas SET apu_hijo_id = %s WHERE apu_hijo_id = %s", (keep_id, old_id))
            
            # Delete redundant APUs
            if redundant_ids:
                cur.execute("DELETE FROM apus WHERE id IN %s", (tuple(redundant_ids),))
                total_deleted += len(redundant_ids)
        
        print(f"Deleted {total_deleted} redundant records. Applying UniqueConstraint...")
        
        # 2. Apply the ALTER TABLE constraint
        cur.execute("""
            ALTER TABLE apus 
            DROP CONSTRAINT IF EXISTS uq_apu_codigo_base_empresa;
        """)
        cur.execute("""
            ALTER TABLE apus 
            ADD CONSTRAINT uq_apu_codigo_base_empresa UNIQUE (codigo, base_trabajo_id, empresa_id);
        """)
        
        conn.commit()
        print("SUCCESS: Duplicates cleaned and UniqueConstraint applied to database.")
        conn.close()
        
    except Exception as e:
        print(f"ERROR: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    final_cleanup_and_constraint()
