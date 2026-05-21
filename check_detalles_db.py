
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.config import settings
from app.models.presupuesto import PresupuestoDetalle

engine = create_engine(settings.sync_database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    detalles = db.query(PresupuestoDetalle).limit(1).all()
    print("Success! Table exists and matches schema.")
except Exception as e:
    print(f"Error querying PresupuestoDetalle:\n{e}")
finally:
    db.close()
