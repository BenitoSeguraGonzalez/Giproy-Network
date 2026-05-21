import json
from app.core.database import SessionLocal
from app.models.codcpc import CodCPC
from sqlalchemy import select

def check_cpc():
    session = SessionLocal()
    try:
        # Codigos del excel
        codes = ["444271014", "833930112", "4292100117"]
        results = {}
        for code in codes:
            stmt = select(CodCPC).where(CodCPC.codCPC == code)
            cpc = session.execute(stmt).scalars().first()
            if cpc:
                results[code] = {
                    "descripcion": cpc.descripcion,
                    "vae": cpc.porcentaje
                }
            else:
                results[code] = "Not found"
        
        print(json.dumps(results, indent=2, ensure_ascii=False))
    finally:
        session.close()

if __name__ == "__main__":
    check_cpc()
