"""
Migración: cambiar codigo_unico de UNIQUE global a UNIQUE por empresa.
Ejecutar desde la raíz del proyecto: python migrate_codigo_unico.py
"""
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="giproy_erp",
    user="postgres",
    password="CEE9846B4CFDA0E7E14E3722BE702C88"
)
conn.autocommit = False
cur = conn.cursor()

try:
    # 1. Verificar índices actuales
    cur.execute("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'bases_trabajo' AND indexdef LIKE '%codigo_unico%'
    """)
    rows = cur.fetchall()
    print("Índices actuales de codigo_unico:")
    for r in rows:
        print(f"  - {r[0]}: {r[1]}")

    # 2. Eliminar el índice UNIQUE global (ix_bases_trabajo_codigo_unico)
    cur.execute("DROP INDEX IF EXISTS ix_bases_trabajo_codigo_unico")
    print("✓ Índice global eliminado")

    # 3. Recrear como índice simple (no único) para búsquedas rápidas
    cur.execute("CREATE INDEX IF NOT EXISTS ix_bases_trabajo_codigo_unico ON bases_trabajo (codigo_unico)")
    print("✓ Índice simple recreado")

    # 4. Verificar si ya existe el constraint compuesto
    cur.execute("""
        SELECT constraint_name FROM information_schema.table_constraints
        WHERE table_name = 'bases_trabajo' 
        AND constraint_name = 'uq_base_trabajo_codigo_empresa'
    """)
    existing = cur.fetchone()

    if not existing:
        cur.execute("""
            ALTER TABLE bases_trabajo 
            ADD CONSTRAINT uq_base_trabajo_codigo_empresa 
            UNIQUE (codigo_unico, empresa_id)
        """)
        print("✓ Constraint UNIQUE(codigo_unico, empresa_id) creado")
    else:
        print("✓ El constraint ya existía, sin cambios")

    conn.commit()
    print("\n✅ Migración completada exitosamente")

    # Verificar resultado final
    cur.execute("""
        SELECT constraint_name, constraint_type 
        FROM information_schema.table_constraints
        WHERE table_name = 'bases_trabajo'
        ORDER BY constraint_name
    """)
    print("\nConstraints finales en bases_trabajo:")
    for c in cur.fetchall():
        print(f"  - {c[0]} ({c[1]})")

except Exception as e:
    conn.rollback()
    print(f"\n❌ Error durante la migración: {e}")
    import traceback
    traceback.print_exc()
finally:
    cur.close()
    conn.close()
