"""
Script para crear la tabla de subcategorias_items
"""
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:admin123@localhost:5432/giproy_erp"

def create_table():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Verificar si la tabla ya existe
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'subcategorias_items'
        """))
        
        if result.fetchone():
            print("OK - La tabla 'subcategorias_items' ya existe")
            return
        
        # Crear la tabla
        conn.execute(text("""
            CREATE TABLE subcategorias_items (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(50) NOT NULL,
                descripcion VARCHAR(500) NOT NULL,
                observaciones TEXT,
                subcategoria_codigo INTEGER NOT NULL,
                base_trabajo_id INTEGER NOT NULL REFERENCES bases_trabajo(id),
                empresa_id INTEGER NOT NULL REFERENCES empresas(id),
                fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                ultima_modificacion TIMESTAMP WITH TIME ZONE,
                CONSTRAINT uq_subcategoria_item_descripcion UNIQUE (subcategoria_codigo, descripcion, empresa_id, base_trabajo_id),
                CONSTRAINT uq_subcategoria_item_codigo UNIQUE (subcategoria_codigo, codigo, empresa_id, base_trabajo_id)
            )
        """))
        
        # Crear índices
        conn.execute(text("CREATE INDEX idx_subcategorias_items_codigo ON subcategorias_items(codigo)"))
        conn.execute(text("CREATE INDEX idx_subcategorias_items_base ON subcategorias_items(base_trabajo_id)"))
        conn.execute(text("CREATE INDEX idx_subcategorias_items_empresa ON subcategorias_items(empresa_id)"))
        conn.execute(text("CREATE INDEX idx_subcategorias_items_subcat ON subcategorias_items(subcategoria_codigo)"))
        
        conn.commit()
        print("OK - Tabla 'subcategorias_items' creada exitosamente")

if __name__ == "__main__":
    create_table()
