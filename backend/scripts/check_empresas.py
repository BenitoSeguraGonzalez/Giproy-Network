"""Verificar empresas en la base de datos"""
from sqlalchemy import create_engine, text

DATABASE_URL = 'postgresql://postgres:admin123@localhost:5432/giproy_erp'
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("=== EMPRESAS ===")
    result = conn.execute(text('SELECT id, nombre, codigo FROM empresas ORDER BY id'))
    rows = result.fetchall()
    if rows:
        for r in rows:
            print(f"  ID: {r[0]}, Nombre: {r[1]}, Codigo: {r[2]}")
    else:
        print("  No hay empresas")
    
    print("\n=== BASES DE TRABAJO ===")
    result = conn.execute(text('SELECT id, nombre, empresa_id, activa FROM bases_trabajo ORDER BY id'))
    rows = result.fetchall()
    for r in rows:
        print(f"  ID: {r[0]}, Nombre: {r[1]}, Empresa ID: {r[2]}, Activa: {r[3]}")
