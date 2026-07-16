import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base
from app.models.empresa import Empresa

SQLALCHEMY_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "sqlite://")
database_url = make_url(SQLALCHEMY_DATABASE_URL)
is_sqlite = database_url.get_backend_name() == "sqlite"
if not is_sqlite and not (database_url.database or "").endswith("_test"):
    raise RuntimeError("TEST_DATABASE_URL debe apuntar a una base dedicada terminada en _test.")

engine_options = {}
if is_sqlite:
    engine_options = {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    }
engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def sample_empresa(db):
    empresa = Empresa(
        nombre="Empresa de Prueba",
        ruc="1234567890001",
        proy_prefijo="TEST",
        proy_periodo="2026",
        proy_secuencial=1,
        proy_secuencial_size=3
    )
    db.add(empresa)
    db.commit()
    db.refresh(empresa)
    return empresa
