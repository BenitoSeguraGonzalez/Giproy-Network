import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path='e:/Repositorios/GiProy Network/backend/.env')
url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(url)

with engine.connect() as conn:
    print("Aplicando restricción única a omniclass_maestro...")
    try:
        conn.execute(text('ALTER TABLE omniclass_maestro ADD CONSTRAINT uq_omniclass_tabla_codigo UNIQUE (tabla, codigo)'))
        conn.commit()
        print("Restricción aplicada.")
    except Exception as e:
        print(f"Nota: La restricción ya existe o hubo un error: {e}")
