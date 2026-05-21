"""Verificar las bases de trabajo en la base de datos"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import create_engine, text

DATABASE_URL = 'postgresql://postgres:admin123@localhost:5432/giproy_erp'
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Contar registros
    result = conn.execute(text('SELECT COUNT(*) FROM bases_trabajo'))
    count = result.scalar()
    print(f'Total de bases de trabajo: {count}')
    
    if count > 0:
        # Verificar estructura de la tabla
        print('\n--- Bases de Trabajo ---')
        result = conn.execute(text('SELECT id, nombre, empresa_id, activa FROM bases_trabajo ORDER BY id'))
        rows = result.fetchall()
        for r in rows:
            print(f'  ID: {r[0]}, Nombre: [{r[1]}], Empresa ID: {r[2]}, Activa: {r[3]}')
    else:
        print('No hay bases de trabajo registradas')
