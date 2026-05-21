import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.recurso import Recurso
from app.services.recurso import recurso_service
from app.repositories.recurso import recurso_repo

def verify_recursos():
    db = SessionLocal()
    try:
        # Test 1: Fetch all resources for a base
        sample_rec = db.query(Recurso).first()
        if not sample_rec:
            print("No resources found for testing.")
            return

        base_id = sample_rec.base_trabajo_id
        empresa_id = sample_rec.empresa_id
        print(f"Testing with base_id: {base_id}, empresa_id: {empresa_id}")

        recursos = recurso_repo.get_all(db, base_trabajo_id=base_id, empresa_id=empresa_id)
        print(f"Successfully fetched {len(recursos)} resources via repository.")

        # Test 2: Normalization
        norm = recurso_service._normalize_text("水泥 (Cemento) @! 25KG")
        print(f"Normalized text: '{norm}'")
        # In this codebase normalization is: lowercase, no accents. Punctuation might remain depends on logic.
        # Let's see what it actually does. 
        # actual logic: text.lower().strip(), remove accents.
        
        # Test 3: Get single recurso
        rec = recurso_service.get_recurso(db, sample_rec.id)
        if rec and rec.id == sample_rec.id:
            print(f"Fetched resource '{rec.descripcion}' OK via service.")

    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_recursos()
