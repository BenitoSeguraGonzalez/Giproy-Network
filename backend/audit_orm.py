
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.core.config import settings
from app.models.apu import APU

def audit_sqlalchemy():
    engine = create_engine(settings.sync_database_url)
    db = Session(bind=engine)
    
    try:
        print("--- AUDITORÍA SQLALCHEMY APUS ---")
        total = db.query(APU).count()
        print(f"Total APUs (ORM): {total}")
        
        # Todas las subcategorías con APUs
        from sqlalchemy import func
        counts = db.query(APU.subcategoria_item_id, func.count('*')).group_by(APU.subcategoria_item_id).all()
        print("APUs por Subcategoria (ORM):")
        for sub_id, count in counts:
            print(f"  Subcat_ID {sub_id} -> {count} APUs")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    audit_sqlalchemy()
