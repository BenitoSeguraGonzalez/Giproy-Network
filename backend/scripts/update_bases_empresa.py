"""Actualizar bases de trabajo a empresa de prueba 001"""
from sqlalchemy import create_engine, text

DATABASE_URL = 'postgresql://postgres:admin123@localhost:5432/giproy_erp'
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Primero ver estado actual
    result = conn.execute(text('SELECT id, nombre, empresa_id FROM bases_trabajo'))
    print("Antes de actualizar:")
    for r in result:
        print(f"  ID: {r[0]}, Nombre: {r[1]}, Empresa ID: {r[2]}")
    
    # Actualizar
    result = conn.execute(text("UPDATE bases_trabajo SET empresa_id = 2 WHERE empresa_id = 1"))
    conn.commit()
    print(f"\nRegistros actualizados: {result.rowcount}")
    
    # Verificar después
    result = conn.execute(text('SELECT id, nombre, empresa_id FROM bases_trabajo'))
    print("\nDespués de actualizar:")
    for r in result:
        print(f"  ID: {r[0]}, Nombre: {r[1]}, Empresa ID: {r[2]}")
