
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="e:/Repositorios/GiProy Network/backend/.env")

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    session = SessionLocal()
    try:
        print("Starting APU Code Migration to format 5-SSS-NNNN...")
        
        # 1. Get all bases
        bases = session.execute(text("SELECT id, nombre FROM bases_trabajo")).fetchall()
        
        for base in bases:
            print(f"\nProcessing Base: {base.nombre} (ID: {base.id})")
            
            # 2. Get all subcategories with items in this base
            subcats = session.execute(text("""
                SELECT DISTINCT s.id, s.codigo 
                FROM subcategorias_items s
                INNER JOIN apus a ON a.subcategoria_item_id = s.id
                WHERE a.base_trabajo_id = :base_id
            """), {"base_id": base.id}).fetchall()
            
            for subcat in subcats:
                prefix = subcat.codigo # e.g., "5-001"
                print(f"  Subcategory: {prefix}")
                
                # 3. Get all APUs for this subcategory and base, ordered by creation or original code
                apus = session.execute(text("""
                    SELECT id, codigo, descripcion 
                    FROM apus 
                    WHERE base_trabajo_id = :base_id AND subcategoria_item_id = :sub_id
                    ORDER BY id ASC
                """), {"base_id": base.id, "sub_id": subcat.id}).fetchall()
                
                for i, apu in enumerate(apus, 1):
                    sequence = str(i).zfill(4)
                    new_code = f"{prefix}-{sequence}"
                    old_code = apu.codigo
                    
                    if old_code != new_code:
                        print(f"    Updating: {old_code} -> {new_code} | {apu.descripcion[:30]}...")
                        
                        # Update APU table
                        session.execute(text("""
                            UPDATE apus SET codigo = :new_code WHERE id = :id
                        """), {"new_code": new_code, "id": apu.id})
                        
                        # Update PresupuestoDetalle table (codigo_item often contains APU code)
                        # The format in PresupuestoDetalle is usually "EDT_CODE - APU_CODE" or similar
                        # We only update if it matches exactly or is part of the string
                        session.execute(text("""
                            UPDATE presupuesto_detalles 
                            SET codigo_item = REPLACE(codigo_item, :old_code, :new_code)
                            WHERE apu_id = :id
                        """), {"old_code": old_code, "new_code": new_code, "id": apu.id})
            
        session.commit()
        print("\nMigration completed successfully.")
        
    except Exception as e:
        session.rollback()
        print(f"\nError during migration: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    migrate()
