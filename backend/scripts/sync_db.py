import sys
import os

# Añadir el directorio raíz al path para poder importar app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.recurso import Recurso, CategoriaRecurso
from app.models.unidad import Unidad
from app.models.codcpc import CodCPC
from sqlalchemy import text

def sync_db():
    print("🔄 Sincronizando base de datos de Recursos...")
    
    with engine.connect() as conn:
        print("🗑️ Eliminando tablas existentes para recreación limpia...")
        # Desactivar constraints temporalmente si es necesario, o eliminar en orden
        conn.execute(text("DROP TABLE IF EXISTS recursos CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS unidades CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS codcpc CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS categorias_recursos CASCADE"))
        conn.commit()

    print("🏗️ Creando tablas con el nuevo esquema...")
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas creadas exitosamente.")
    
    # Ejecutar el seeder automáticamente
    print("🌱 Iniciando sembrado de datos (Unidades y CPC)...")
    from scripts.seed_resources import seed_all
    seed_all()
    
    print("🚀 Proceso de sincronización completado.")

if __name__ == "__main__":
    sync_db()
