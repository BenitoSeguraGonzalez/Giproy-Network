
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.edt import EdtNode, TipoNodoEdt

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    project_id = 5
    nodes = db.query(EdtNode).filter(EdtNode.proyecto_id == project_id).all()
    print(f"{'ID':<5} | {'Parent':<6} | {'Tipo':<15} | {'Empresa':<7} | {'Nombre':<20}")
    print("-" * 65)
    for n in nodes:
        print(f"{n.id:<5} | {str(n.parent_id):<6} | {n.tipo_nodo:<15} | {n.empresa_id:<7} | {n.nombre[:20] if n.nombre else '--'}")
finally:
    db.close()
