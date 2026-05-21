from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.codcpc import CodCPC
from app.repositories.codcpc import CodCPCRepository


def make_session():
    engine = create_engine("sqlite:///:memory:")
    CodCPC.__table__.create(engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def test_cpc_search_returns_partial_word_matches_beyond_legacy_limit():
    db = make_session()
    try:
        db.add_all([
            CodCPC(codCPC=f"4100{i:04d}", descripcion=f"Producto de hierro generico {i}")
            for i in range(60)
        ])
        db.add(CodCPC(codCPC="421500001", descripcion="Varillas de hierro para la construccion"))
        db.commit()

        results = CodCPCRepository(db).search("hierro")

        assert any(item.descripcion == "Varillas de hierro para la construccion" for item in results)
        assert len(results) == 61
    finally:
        db.close()


def test_cpc_search_matches_prefix_inside_description_word():
    db = make_session()
    try:
        db.add(CodCPC(codCPC="429100001", descripcion="Acero estructural para edificaciones"))
        db.add(CodCPC(codCPC="429100002", descripcion="Servicio de limpieza general"))
        db.commit()

        results = CodCPCRepository(db).search("estruct")

        assert [item.codCPC for item in results] == ["429100001"]
    finally:
        db.close()


def test_cpc_search_matches_all_terms_without_requiring_exact_phrase():
    db = make_session()
    try:
        db.add(CodCPC(codCPC="421500001", descripcion="Varillas corrugadas de hierro para obra civil"))
        db.add(CodCPC(codCPC="421500002", descripcion="Lingotes de hierro"))
        db.commit()

        results = CodCPCRepository(db).search("varillas hierro")

        assert [item.codCPC for item in results] == ["421500001"]
    finally:
        db.close()
