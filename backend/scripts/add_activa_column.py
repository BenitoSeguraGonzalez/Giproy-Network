"""
Script para agregar la columna 'activa' a la tabla bases_trabajo
Ejecutar: python add_activa_column.py
"""
from sqlalchemy import create_engine, text
import os

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/giproy_erp"

def add_activa_column():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar si la columna ya existe
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'bases_trabajo' AND column_name = 'activa'
        """))
        
        if result.fetchone():
            print("OK - La columna 'activa' ya existe en la tabla bases_trabajo")
            return
        
        # Agregar la columna
        conn.execute(text("""
            ALTER TABLE bases_trabajo 
            ADD COLUMN activa BOOLEAN DEFAULT FALSE NOT NULL
        """))
        conn.commit()
        print("OK - Columna 'activa' agregada exitosamente a la tabla bases_trabajo")

if __name__ == "__main__":
    add_activa_column()
