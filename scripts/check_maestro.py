
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(dotenv_path="e:/Repositorios/GiProy Network/backend/.env")
DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_SERVER')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def check_maestro():
    session = SessionLocal()
    try:
        count = session.execute(text("SELECT COUNT(*) FROM omniclass_maestro")).scalar()
        print(f"OmniClass Maestro Count: {count}")
        if count > 0:
            samples = session.execute(text("SELECT * FROM omniclass_maestro LIMIT 5")).fetchall()
            for s in samples:
                print(s)
    finally:
        session.close()

if __name__ == "__main__":
    check_maestro()
