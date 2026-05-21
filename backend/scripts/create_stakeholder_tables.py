import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base, engine
from app.models.stakeholder import Stakeholder, Rol, ProyectoStakeholder

def create_tables():
    print("Creando tablas para Stakeholders y Roles...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")

if __name__ == "__main__":
    create_tables()
