import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from app.models.edo import EdoNode

def create_tables():
    print("Creando tabla para EDO Nodes...")
    EdoNode.metadata.create_all(bind=engine)
    print("Tabla creada exitosamente.")

if __name__ == "__main__":
    create_tables()
