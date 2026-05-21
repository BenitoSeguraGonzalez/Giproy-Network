
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.proyecto import Proyecto
from app.models.edt import EdtNode, TipoNodoEdt

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    proyectos = db.query(Proyecto).all()
    print(f"{'ID':<5} | {'Nombre':<30} | {'EDT Nodes':<10}")
    print("-" * 50)
    for p in proyectos:
        edt_count = db.query(EdtNode).filter(EdtNode.proyecto_id == p.id, EdtNode.tipo_nodo == TipoNodoEdt.CUENTA_PAQUETE).count()
        print(f"{p.id:<5} | {p.nombre[:30]:<30} | {edt_count:<10}")
finally:
    db.close()
