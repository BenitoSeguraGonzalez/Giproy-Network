import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.repositories.recurso import RecursoRepository
from app.schemas.recurso import RecursoCreate
from app.models.recurso import Recurso
import time

def test_repo_create():
    db_url = settings.sync_database_url
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url, echo=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        repo = RecursoRepository(db)
        recurso_in = RecursoCreate(
            descripcion=f"[MOCK] Recurso A (Equipos y Herramientas) {time.time()}",
            precio=100.5,
            cod_cpc_id=None,
            unidad_id=1,  # Must provide a valid uniti ID. I will use 1 assuming it exists.
            especificaciones="Recurso de prueba generado automáticamente.",
            subcategoria_item_id=1945
        )
        
        print("Attempting to create recurso via repository...")
        recurso = repo.create(recurso_in, base_trabajo_id=16, empresa_id=1)
        print(f"Success! Created recurso ID: {recurso.id}")

    except Exception as e:
        print(f"Exception caught during creation: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        engine.dispose()

if __name__ == "__main__":
    test_repo_create()
