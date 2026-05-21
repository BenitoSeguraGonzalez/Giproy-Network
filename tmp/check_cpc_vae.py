import asyncio
import json
from app.core.database import SessionLocal
from app.models.codcpc import CodCPC
from sqlalchemy import select

async def check_cpc():
    async with SessionLocal() as session:
        # Codigos del excel
        codes = ["444271014", "833930112", "4292100117"]
        results = {}
        for code in codes:
            # Note: handle both exact and padded/trimmed codes if necessary
            q = await session.execute(select(CodCPC).where(CodCPC.codCPC == code))
            cpc = q.scalars().first()
            if cpc:
                results[code] = {
                    "descripcion": cpc.descripcion,
                    "vae": cpc.porcentaje
                }
            else:
                results[code] = "Not found"
        
        print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(check_cpc())
