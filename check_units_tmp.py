
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.unidad import Unidad

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    unidades = db.query(Unidad).filter(Unidad.subcategoria_codigo == 5).all()
    print(f"Found {len(unidades)} units for subcategory 5")
    for u in unidades:
        print(f"ID: {u.id}, Desc: {u.descripcion}, Global: {u.es_global}, Empresa: {u.empresa_id}")
finally:
    db.close()
