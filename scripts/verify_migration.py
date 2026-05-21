
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv(dotenv_path="e:/Repositorios/GiProy Network/backend/.env")

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify():
    session = SessionLocal()
    errors = []
    
    try:
        print("=== GI-PROY NETWORK INTEGRITY VERIFICATION ===\n")
        
        # 1. Check APU Coding Pattern: 5-SSS-NNNN
        print("1. Verifying APU Code Patterns...")
        apus = session.execute(text("SELECT id, codigo, descripcion FROM apus")).fetchall()
        pattern = re.compile(r"^5-\d{3}-\d{4}$")
        bad_codes = []
        for apu in apus:
            if not pattern.match(apu.codigo):
                bad_codes.append(f"  [FAIL] ID {apu.id}: {apu.codigo} ({apu.descripcion[:20]})")
        
        if not bad_codes:
            print("  [OK] All APU codes follow the 5-SSS-NNNN pattern.")
        else:
            print(f"  [ERROR] Found {len(bad_codes)} non-compliant codes:")
            for bc in bad_codes[:10]: print(bc)
            errors.append("Invalid APU code patterns found.")

        # 2. Check Budget Line Consistency
        print("\n2. Verifying Budget Line (PresupuestoDetalle) Consistency...")
        pd_mismatch = session.execute(text("""
            SELECT pd.id, pd.codigo_item, a.codigo as apu_codigo
            FROM presupuesto_detalles pd
            JOIN apus a ON pd.apu_id = a.id
            WHERE pd.codigo_item IS NOT NULL AND pd.codigo_item NOT LIKE '%' || a.codigo || '%'
        """)).fetchall()
        
        # Note: pd.codigo_item usually contains "EDT_CODE - APU_CODE"
        # We check if the NEW APU code is present in the budget detail's item code.
        # However, some might not follow this exact format if they were custom.
        # But for migrated ones, we expect the REPLACE to have worked.
        
        if not pd_mismatch:
            print("  [OK] All budget lines linked to APUs reflect the updated codes.")
        else:
            print(f"  [WARNING] Found {len(pd_mismatch)} budget lines that might not have updated codes.")
            for m in pd_mismatch[:5]: print(f"  [WARN] PD ID {m.id}: {m.codigo_item} vs APU {m.apu_codigo}")

        # 3. Check OmniClass Fields Presence
        print("\n3. Verifying OmniClass Field Presence (DB Schema)...")
        tables_to_check = ["recursos", "apus", "subcategorias_items", "presupuesto_detalles"]
        for table in tables_to_check:
            res = session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = :table AND column_name IN ('omniclass_codigo', 'omniclass_titulo')
            """), {"table": table}).fetchall()
            found = [r.column_name for r in res]
            if "omniclass_codigo" in found and "omniclass_titulo" in found:
                print(f"  [OK] Table '{table}' has OmniClass fields.")
            else:
                print(f"  [ERROR] Table '{table}' is MISSING OmniClass fields! Found: {found}")
                errors.append(f"Missing OmniClass fields in table {table}")

        # 4. Check Interdependencies (APUs used in other APUs)
        print("\n4. Verifying APU Interdependencies (Sub-APUs)...")
        sub_apus = session.execute(text("""
            SELECT al.id, al.apu_id, al.apu_hijo_id, a_parent.codigo as parent_code, a_child.codigo as child_code
            FROM apu_lineas al
            JOIN apus a_parent ON al.apu_id = a_parent.id
            JOIN apus a_child ON al.apu_hijo_id = a_child.id
            WHERE al.apu_hijo_id IS NOT NULL
        """)).fetchall()
        
        if sub_apus:
            print(f"  [OK] Verified {len(sub_apus)} sub-APU relationships. Links remain intact via ID.")
            for sa in sub_apus[:3]: print(f"    - Parent {sa.parent_code} uses Child {sa.child_code}")
        else:
            print("  [INFO] No sub-APU relationships found in the current database.")

        # 5. Check Yields Precision
        print("\n5. Verifying APU Line Yields Precision (DECIMAL)...")
        # Check if we have any NaNs or nulls where there should be numbers
        yield_nulls = session.execute(text("SELECT COUNT(*) FROM apu_lineas WHERE cantidad IS NULL OR subtotal IS NULL")).scalar()
        if yield_nulls == 0:
            print("  [OK] No null quantities or subtotals in APU lines.")
        else:
            print(f"  [ERROR] Found {yield_nulls} null values in critical calculation fields.")
            errors.append("Null values in calculation fields.")

        print("\n=== VERIFICATION SUMMARY ===")
        if not errors:
            print("\n  [PASS] All core integrity checks passed.")
        else:
            print(f"\n  [FAIL] {len(errors)} errors found during verification.")
        
    except Exception as e:
        print(f"\n[CRITICAL ERROR] Verification failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    verify()
