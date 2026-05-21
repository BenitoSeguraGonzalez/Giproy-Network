import sys
import os

sys.path.append(os.path.join(os.getcwd(), "backend"))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.apu import APU
from app.services.apu import apu_service
from app.repositories.apu import apu_repo

def verify_apus():
    db = SessionLocal()
    try:
        # Test 1: Fetch APUs
        sample_apu = db.query(APU).first()
        if not sample_apu:
            print("No APUs found for testing.")
            return

        empresa_id = sample_apu.empresa_id
        print(f"Testing with empresa_id: {empresa_id}")

        apus = apu_repo.get_all(db, empresa_id=empresa_id)
        print(f"Successfully fetched {len(apus)} APUs via repository.")

        # Test 2: Get single APU via service
        apu = apu_service.get_apu(db, sample_apu.id, empresa_id)
        if apu and apu.id == sample_apu.id:
            print(f"Fetched APU '{apu.descripcion}' OK via service.")

        # Test 3: Duplication logic check (dry run style or just internal sequence)
        next_code = apu_service._generate_next_code_for_base(db, sample_apu.base_trabajo_id, empresa_id)
        print(f"Next generated code: {next_code}")
        if next_code.startswith("APU-"):
            print("Code generation format OK.")

    except Exception as e:
        print(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify_apus()
