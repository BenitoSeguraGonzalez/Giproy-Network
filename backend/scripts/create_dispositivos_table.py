"""
Script para crear la tabla de dispositivos en la base de datos
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.dispositivo import Dispositivo
from app.models.empresa import Empresa
from app.models.usuario import Usuario


def create_tables():
    """Crea las tablas de dispositivos"""
    print("Creando tabla de dispositivos...")
    
    # Importar todos los modelos para que SQLAlchemy los registre
    from app.models import usuario, empresa, proyecto, presupuesto, apu, recurso, base_trabajo, subcategoria_item, pais
    
    # Crear solo la tabla de dispositivos (las demás ya deberían existir)
    Dispositivo.__table__.create(engine, checkfirst=True)
    
    print("[OK] Tabla 'dispositivos' creada correctamente")


if __name__ == "__main__":
    create_tables()
    print("\nProceso completado.")
