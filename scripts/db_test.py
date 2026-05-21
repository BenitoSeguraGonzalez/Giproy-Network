import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path='e:/Repositorios/GiProy Network/backend/.env')
url = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM omniclass_maestro")).scalar()
        print(f"COUNT: {result}")
except Exception as e:
    print(f"ERROR: {e}")
