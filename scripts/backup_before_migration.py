
import os
import json
import decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from datetime import datetime

# Custom JSON encoder for decimals and dates
class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(CustomEncoder, self).default(obj)

# Load environment variables
load_dotenv(dotenv_path="e:/Repositorios/GiProy Network/backend/.env")

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def backup():
    session = SessionLocal()
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = f"e:/Repositorios/GiProy Network/backups/migration_{timestamp}"
        os.makedirs(backup_dir, exist_ok=True)
        
        print(f"Starting Logical Backup to {backup_dir}...")
        
        tables = ["apus", "presupuesto_detalles", "recursos", "subcategorias_items"]
        
        for table in tables:
            print(f"  Backing up table: {table}")
            result = session.execute(text(f"SELECT * FROM {table}"))
            rows = [dict(row._mapping) for row in result]
            
            with open(f"{backup_dir}/{table}.json", "w", encoding="utf-8") as f:
                json.dump(rows, f, indent=4, cls=CustomEncoder)
        
        print("\nBackup completed successfully.")
        return backup_dir
        
    except Exception as e:
        print(f"\nError during backup: {e}")
        return None
    finally:
        session.close()

if __name__ == "__main__":
    backup()
