from app.core.database import engine
from sqlalchemy import text

def migrate():
    print("🚀 Iniciando migración manual de columnas...")
    
    queries = [
        # Empresa
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS decimales_moneda INTEGER DEFAULT 2",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS decimales_calculos INTEGER DEFAULT 4",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS proy_prefijo VARCHAR(50)",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS proy_periodo VARCHAR(10)",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS proy_secuencial INTEGER DEFAULT 1",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS proy_secuencial_size INTEGER DEFAULT 9",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS plantillas_config JSONB",
        "ALTER TABLE empresas ADD COLUMN IF NOT EXISTS session_timeout_minutes INTEGER DEFAULT 30",
        
        # Proyecto
        "ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS codigo_root VARCHAR(50)",
        "ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS revision INTEGER DEFAULT 0",
        "ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS plantillas_config JSONB",
        "ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS base_trabajo_id INTEGER REFERENCES bases_trabajo(id)",
    ]
    
    with engine.connect() as conn:
        for query in queries:
            try:
                print(f"Ejecutando: {query}")
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"Error en {query}: {e}")
                conn.rollback()

    print("✅ Migración completada.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    migrate()
