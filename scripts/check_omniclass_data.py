
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(dotenv_path="e:/Repositorios/GiProy Network/backend/.env")
DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_omniclass():
    session = SessionLocal()
    try:
        print("--- APU OmniClass Metadata ---")
        apus = session.execute(text("SELECT id, codigo, descripcion, omniclass_codigo, omniclass_titulo FROM apus LIMIT 10")).fetchall()
        for a in apus:
            print(f"ID: {a.id} | Code: {a.codigo} | OmniClass: {a.omniclass_codigo} - {a.omniclass_titulo}")
            
        print("\n--- Subcategories (APU) OmniClass Metadata ---")
        subcats = session.execute(text("SELECT id, codigo, descripcion, omniclass_codigo FROM subcategorias_items WHERE subcategoria_codigo = 5 LIMIT 10")).fetchall()
        for s in subcats:
            print(f"ID: {s.id} | Code: {s.codigo} | OmniClass: {s.omniclass_codigo}")
            
        print("\n--- Resources OmniClass Metadata ---")
        recs = session.execute(text("SELECT id, descripcion, omniclass_codigo FROM recursos LIMIT 10")).fetchall()
        for r in recs:
            print(f"ID: {r.id} | Desc: {r.descripcion[:20]} | OmniClass: {r.omniclass_codigo}")
            
    finally:
        session.close()

if __name__ == "__main__":
    check_omniclass()
