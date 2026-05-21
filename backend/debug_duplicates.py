import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Set up DB connection
DB_URL = "postgresql://postgres:CEE9846B4CFDA0E7E14E3722BE702C88@localhost:5432/giproy_erp"
engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

try:
    print("Checking for duplicate APUs (Same code, base, subcat, revision) for Empresa 1...")
    
    # Grouping by code, base, subcat, revision (not description to avoid encoding issues and pick up desc changes)
    query = text("""
        SELECT a.codigo, a.base_trabajo_id, a.subcategoria_item_id, a.revision, COUNT(*) as count
        FROM apus a
        WHERE a.empresa_id = 1
        GROUP BY a.codigo, a.base_trabajo_id, a.subcategoria_item_id, a.revision
        HAVING COUNT(*) > 1
        ORDER BY count DESC
    """)
    
    results = session.execute(query).fetchall()
    
    if not results:
        print("No duplicates found using (codigo, base, subcat, revision) grouping.")
    else:
        print(f"Found {len(results)} groups of duplicates.")
        for row in results:
            print(f"Code: {row.codigo} | Base: {row.base_trabajo_id} | Subcat: {row.subcategoria_item_id} | Rev: {row.revision} | Count: {row.count}")

    print("\n--- Listing details for a specific duplicate code S-001-001 ---")
    query_details = text("""
        SELECT id, codigo, descripcion, base_trabajo_id, subcategoria_item_id, revision, fecha_creacion
        FROM apus
        WHERE codigo = 'S-001-001' AND empresa_id = 1
        ORDER BY fecha_creacion DESC
    """)
    details = session.execute(query_details).fetchall()
    for d in details:
        desc_safe = d.descripcion.encode('ascii', 'replace').decode() if d.descripcion else "None"
        print(f"ID: {d.id} | Code: {d.codigo} | Desc: {desc_safe} | Base: {d.base_trabajo_id} | Subcat: {d.subcategoria_item_id} | Rev: {d.revision} | Created: {d.fecha_creacion}")

except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    session.close()
