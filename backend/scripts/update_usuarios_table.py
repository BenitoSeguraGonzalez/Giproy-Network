"""
Script para agregar los nuevos campos a la tabla de usuarios
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from sqlalchemy import text

def update_usuarios_table():
    """Agregar nuevos campos a la tabla usuarios"""
    print("Actualizando tabla de usuarios...")
    
    # Lista de columnas a agregar
    columnas = [
        ("ruc", "VARCHAR(20)"),
        ("nombres", "VARCHAR(255)"),
        ("apellidos", "VARCHAR(255)"),
        ("alias", "VARCHAR(100)"),
        ("nacionalidad", "VARCHAR(100)"),
        ("profesion", "VARCHAR(255)"),
        ("ciudad", "VARCHAR(255)"),
        ("provincia", "VARCHAR(255)"),
        ("pais", "VARCHAR(100)"),
        ("movil", "VARCHAR(20)"),
        ("acepta_politica_privacidad", "BOOLEAN DEFAULT FALSE"),
        ("acepta_politicas_comunicacion", "BOOLEAN DEFAULT FALSE"),
        ("autoriza_publicidad", "BOOLEAN DEFAULT FALSE"),
        ("ruc_verificado", "BOOLEAN DEFAULT FALSE"),
        ("razon_social_ruc", "VARCHAR(500)"),
        ("estado_contribuyente", "VARCHAR(100)"),
        ("clase_contribuyente", "VARCHAR(100)"),
        ("fecha_inicio_actividades", "VARCHAR(50)"),
        ("actividad_economica", "TEXT"),
        # Nuevas columnas de fecha
        ("fecha_aceptacion_politica_privacidad", "TIMESTAMP WITH TIME ZONE"),
        ("fecha_aceptacion_politicas_comunicacion", "TIMESTAMP WITH TIME ZONE"),
        ("fecha_autorizacion_publicidad", "TIMESTAMP WITH TIME ZONE"),
    ]
    
    with engine.connect() as conn:
        for columna, tipo in columnas:
            try:
                # Intentar agregar la columna
                query = f'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS {columna} {tipo}'
                conn.execute(text(query))
                print(f"  - Columna '{columna}' verificada/creada")
            except Exception as e:
                print(f"  - Error en '{columna}': {e}")
        
        conn.commit()
    
    print("[OK] Tabla de usuarios actualizada correctamente")


if __name__ == "__main__":
    update_usuarios_table()
    print("\nProceso completado.")
