import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath("e:/Repositorios/GiProy Network/backend"))

from app.core.database import SessionLocal
from app.services.reporting import ReportingService
from app.models.apu import APU
import traceback

def verify():
    db = SessionLocal()
    try:
        # Get first APU
        apu = db.query(APU).first()
        if not apu:
            print("No APUs found to test.")
            return
            
        print(f"Testing report for APU ID: {apu.id}, Desc: {apu.descripcion}, Empresa: {apu.empresa_id}")
        
        try:
            reporter = ReportingService()
            # The method requires (db, apu_id, empresa_id)
            reporter.generate_apu_report(db, apu.id, apu.empresa_id)
            print("SUCCESS: Report generated without errors.")
        except Exception as e:
            print(f"FAILURE: Report generation crashed: {e}")
            traceback.print_exc()
            
    except Exception as e:
        print(f"GENERAL ERROR: {e}")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    verify()
