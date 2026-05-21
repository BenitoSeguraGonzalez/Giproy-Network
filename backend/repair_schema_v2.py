
from app.core.database import engine
from sqlalchemy import text

def repair_schema_v2():
    print("🚀 Iniciando reparación de esquema Parte 2 (Categorias)...")
    
    queries = [
        # Categorias de Recursos
        "ALTER TABLE categorias_recursos ADD COLUMN IF NOT EXISTS base_trabajo_id INTEGER REFERENCES bases_trabajo(id)",
        "ALTER TABLE categorias_recursos ADD COLUMN IF NOT EXISTS empresa_id INTEGER REFERENCES empresas(id)",
        
        # Eliminar constraint de unicidad global en nombre si existe, para permitir el mismo nombre en diferentes bases
        "ALTER TABLE categorias_recursos DROP CONSTRAINT IF EXISTS categorias_recursos_nombre_key",
        
        # Opcional: Si queremos que las categorias existentes se vinculen a la base activa (o algo así)
        # Pero mejor dejarlas nulas o asignarlas manualmente si el usuario lo requiere.
        # Por ahora, solo nos aseguramos de que las columnas existan para que el código no CRASHee.
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

    print("✅ Reparación de esquema Parte 2 completada.")

if __name__ == "__main__":
    import sys
    import os
    sys.path.append(os.getcwd())
    repair_schema_v2()
