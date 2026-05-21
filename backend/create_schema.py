import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Añadir path para configuración
sys.path.append(os.getcwd())
from app.core.config import settings
from app.core.database import Base
import app.models  # Importar todos los modelos para que Base los conozca

def create_schema():
    print(f"Conectando a {settings.sync_database_url}...")
    engine = create_engine(settings.sync_database_url)
    
    print("Creando todas las tablas definidas en los modelos...")
    Base.metadata.create_all(bind=engine)
    
    print("Esquema creado con éxito.")

if __name__ == "__main__":
    create_schema()
