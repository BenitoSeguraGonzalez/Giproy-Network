import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path='e:/Repositorios/GiProy Network/backend/.env')
url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(url)

with engine.connect() as conn:
    print("--- Auditoría de Datos OmniClass ---")
    res = conn.execute(text('SELECT tabla, count(*) FROM omniclass_maestro GROUP BY tabla ORDER BY tabla')).fetchall()
    for r in res:
        print(f"Tabla {r[0]}: {r[1]} items")
    
    print("\n--- Muestra de Traducción (Hormigón) ---")
    res2 = conn.execute(text("SELECT codigo, titulo FROM omniclass_maestro WHERE titulo ILIKE '%Hormigón%' LIMIT 5")).fetchall()
    for r in res2:
        print(f"  {r[0]}: {r[1]}")

    print("\n--- Muestra de Tabla 22 (Work Results) ---")
    res3 = conn.execute(text("SELECT codigo, titulo FROM omniclass_maestro WHERE tabla = '22' LIMIT 5")).fetchall()
    for r in res3:
        print(f"  {r[0]}: {r[1]}")
